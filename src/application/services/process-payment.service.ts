import { env } from "@/config/env";
import type { ProcessPaymentDTO } from "@/domain/payment";
import redis from "@/infrastructure/redis/client";
import paymentRepository from "@/infrastructure/redis/payment.repository";
import healthCheckService, {
	type ProcessorEndpoint,
} from "./health-check.service";

const WORKERS_COUNT = env.WORKERS_COUNT;

const processPaymentService = {
	async processPayment(
		payment: ProcessPaymentDTO,
		processor: ProcessorEndpoint,
	): Promise<boolean> {
		try {
			const response = await fetch(processor.processorUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payment),
				signal: AbortSignal.timeout(5000),
			});

			if (!response.ok) {
				console.error(`Failed to process payment: ${response.statusText}`);
				return false;
			}

			await paymentRepository.recordPayment({
				correlationId: payment.correlationId,
				amount: payment.amount,
				requestedAt: payment.requestedAt,
				processor: processor.provider,
			});
			return true;
		} catch (error) {
			console.error("Error processing payment:", error);
			return false;
		}
	},

	async createWorker(workerId: number): Promise<void> {
		const processingQueue = `payments:processing:${workerId}`;

		while (true) {
			try {
				const raw = await redis.rpoplpush("payments:queue", processingQueue);
				if (!raw) {
					await new Promise((resolve) => setTimeout(resolve, 1000));
					continue;
				}

				const payment = JSON.parse(raw);
				const processor = healthCheckService.getHealthyProcessor();

				const result = this.processPayment(payment, processor);
				if (!result) {
					await redis.lpush("payments:queue", raw);
					await redis.lrem(processingQueue, 1, raw);
				}

				await redis.lrem(processingQueue, 1, raw);
			} catch (error) {
				console.error(`Worker ${workerId}: Error processing payment`, error);
			}
		}
	},

	async start(): Promise<void> {
		const workers = Array.from({ length: WORKERS_COUNT }, (_, index) => {
			return this.createWorker(index + 1);
		});

		await Promise.all(workers);
	},
};

export default processPaymentService;
