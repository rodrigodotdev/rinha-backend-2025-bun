import { Elysia, status, t } from "elysia";
import paymentsHandler from "@/application/handlers/payments.handler";
import summaryHandler from "@/application/handlers/summary.handler";

export const routes = new Elysia()
	.get("/", () => "Hello, Rinha de Backend 2025! 🚀")
	.post(
		"/payments",
		async ({ body }) => {
			const { correlationId, amount } = body;

			await paymentsHandler({ correlationId, amount });

			return status(202, {
				message: "Payment received successfully",
				correlationId,
			});
		},
		{
			body: t.Object({
				correlationId: t.String(),
				amount: t.Number(),
			}),
		},
	)
	.get(
		"/payments-summary",
		async ({ query }) => {
			const { from, to } = query;

			return await summaryHandler(from, to);
		},
		{
			query: t.Object({
				from: t.Optional(t.String()),
				to: t.Optional(t.String()),
			}),
		},
	)
	.get("/health", () => ({ status: "ok" }));
