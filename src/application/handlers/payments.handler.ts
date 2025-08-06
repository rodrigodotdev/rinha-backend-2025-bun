import type { ReceivePaymentDTO } from "@/domain/payment";
import paymentRepository from "@/infrastructure/redis/payment.repository";

export default async function paymentsHandler(
	payment: ReceivePaymentDTO,
): Promise<void> {
	const requestedAt = new Date().toISOString();

	await paymentRepository.enqueuePayment({ ...payment, requestedAt });
}
