import type { EnqueuePaymentDTO, Payment } from "@/domain/payment";
import type { PaymentRepository } from "@/domain/payment.repository.port";
import redis from "./client";

const paymentRepository: PaymentRepository = {
	async enqueuePayment(payment: EnqueuePaymentDTO): Promise<void> {
		await redis.lpush("payments:queue", JSON.stringify(payment));
	},
	async recordPayment(payment): Promise<void> {
		await redis.hset(
			"payments",
			payment.correlationId,
			JSON.stringify(payment),
		);
	},
	async fetchAllPayments(): Promise<Payment[]> {
		const payments = await redis.hgetall("payments");
		return Object.values(payments).map((payment) => JSON.parse(payment));
	},
};

export default paymentRepository;
