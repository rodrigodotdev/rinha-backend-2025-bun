import type { Summary } from "@/domain/summary";
import paymentRepository from "@/infrastructure/redis/payment.repository";

const summaryService = {
	async resolveSummary(from?: string, to?: string): Promise<Summary> {
		const fromDate = from ? new Date(from) : null;
		const toDate = to ? new Date(to) : null;

		const payments = await paymentRepository.fetchAllPayments();

		const initialSummary: Summary = {
			default: { totalRequests: 0, totalAmount: 0 },
			fallback: { totalRequests: 0, totalAmount: 0 },
		};

		const finalSummary = payments.reduce((summary, payment) => {
			const paymentDate = new Date(payment.requestedAt);

			if (fromDate && paymentDate < fromDate) {
				return summary;
			}
			if (toDate && paymentDate > toDate) {
				return summary;
			}

			if (payment.processor === "default") {
				summary.default.totalRequests++;
				summary.default.totalAmount += payment.amount;
			} else if (payment.processor === "fallback") {
				summary.fallback.totalRequests++;
				summary.fallback.totalAmount += payment.amount;
			}

			return summary;
		}, initialSummary);

		finalSummary.default.totalAmount = parseFloat(
			finalSummary.default.totalAmount.toFixed(2),
		);
		finalSummary.fallback.totalAmount = parseFloat(
			finalSummary.fallback.totalAmount.toFixed(2),
		);

		return finalSummary;
	},
};

export default summaryService;
