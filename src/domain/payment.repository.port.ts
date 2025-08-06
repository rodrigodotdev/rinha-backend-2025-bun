import type { EnqueuePaymentDTO, Payment } from "./payment";

export interface PaymentRepository {
	enqueuePayment(payment: EnqueuePaymentDTO): Promise<void>;
	recordPayment(payment: Payment): Promise<void>;
	fetchAllPayments(): Promise<Payment[]>;
}
