import { Elysia } from "elysia";
import healthCheckService from "@/application/services/health-check.service";
import processPaymentService from "@/application/services/process-payment.service";
import { env } from "@/config/env";
import { routes } from "@/infrastructure/http/routes";

healthCheckService.start();
processPaymentService.start();

const _app = new Elysia().use(routes).listen(env.PORT, () => {
	console.log(`Server is running on http://localhost:${env.PORT}`);
});
