export const env = {
	PORT: parseInt(process.env.PORT || "3000"),
	REDIS_URL: process.env.REDIS_URL || "redis://redis:6379",
	PROCESSOR_DEFAULT_URL:
		process.env.PROCESSOR_DEFAULT_URL ||
		"http://payment-processor-default:8080",
	PROCESSOR_FALLBACK_URL:
		process.env.PROCESSOR_FALLBACK_URL ||
		"http://payment-processor-fallback:8080",
	WORKERS_COUNT: parseInt(process.env.WORKERS_COUNT || "2"),
};
