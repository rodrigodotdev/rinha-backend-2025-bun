import { env } from "@/config/env";
import type { ProcessorProvider } from "@/domain/payment";
import redis from "@/infrastructure/redis/client";

export type ProcessorEndpoint = {
	processorUrl: string;
	provider: ProcessorProvider;
};

const DEFAULT_URL = env.PROCESSOR_DEFAULT_URL;
const FALLBACK_URL = env.PROCESSOR_FALLBACK_URL;

const PROCESSOR_ENDPOINTS: Record<ProcessorProvider, ProcessorEndpoint> = {
	default: { processorUrl: `${DEFAULT_URL}/payments`, provider: "default" },
	fallback: { processorUrl: `${FALLBACK_URL}/payments`, provider: "fallback" },
};

const LOCK_KEY = "health_check_lock";
const HEALTHY_KEY = "healthy_processor_endpoint";

const healthCheckService = {
	healthyProcessor: PROCESSOR_ENDPOINTS.default,

	async tryAcquireLock(): Promise<boolean> {
		const result = await redis.set(LOCK_KEY, "locked", "EX", 10, "NX");
		return result === "OK";
	},

	async releaseLock(): Promise<void> {
		await redis.del(LOCK_KEY);
	},

	async isHealthy(processorUrl: string): Promise<boolean> {
		try {
			const response = await fetch(processorUrl, {
				signal: AbortSignal.timeout(5000),
			});

			if (!response.ok) return false;

			const result: { failing: boolean } = await response.json();

			return !result.failing;
		} catch (error) {
			console.error(`Health check failed for ${processorUrl}:`, error);
			return false;
		}
	},

	async saveHealthyToRedis(provider: ProcessorProvider): Promise<void> {
		await redis.set(HEALTHY_KEY, provider);
	},

	async loadHealthyFromRedis(): Promise<void> {
		const provider = await redis.get(HEALTHY_KEY);

		if (provider === "default") {
			this.healthyProcessor = PROCESSOR_ENDPOINTS.default;
			return;
		}

		if (provider === "fallback") {
			this.healthyProcessor = PROCESSOR_ENDPOINTS.fallback;
			return;
		}
	},

	async updateHealthyProcessor(): Promise<void> {
		if (await this.isHealthy(`${DEFAULT_URL}/service-health`)) {
			this.healthyProcessor = {
				processorUrl: `${DEFAULT_URL}/payments`,
				provider: "default",
			};
			await this.saveHealthyToRedis("default");
			return;
		}

		if (await this.isHealthy(`${FALLBACK_URL}/service-health`)) {
			this.healthyProcessor = {
				processorUrl: `${FALLBACK_URL}/payments`,
				provider: "fallback",
			};
			await this.saveHealthyToRedis("fallback");
			return;
		}
	},

	async start(): Promise<void> {
		const runHealthCheckCycle = async (): Promise<void> => {
			try {
				const hasLock = await this.tryAcquireLock();
				if (hasLock) {
					try {
						await this.updateHealthyProcessor();
					} finally {
						await this.releaseLock();
					}
				} else {
					await this.loadHealthyFromRedis();
				}
			} catch (error) {
				console.error("Health check cycle failed:", error);
			} finally {
				setTimeout(runHealthCheckCycle, 5 * 1000);
			}
		};
		runHealthCheckCycle();
	},

	getHealthyProcessor(): ProcessorEndpoint {
		return this.healthyProcessor;
	},
};

export default healthCheckService;
