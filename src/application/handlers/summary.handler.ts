import summaryService from "@/application/services/summary.service";
import type { Summary } from "@/domain/summary";

export default async function summaryHandler(
	from?: string,
	to?: string,
): Promise<Summary> {
	return await summaryService.resolveSummary(from, to);
}
