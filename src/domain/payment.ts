export type ProcessorProvider = "default" | "fallback";

export type ReceivePaymentDTO = {
	correlationId: string;
	amount: number;
};

export type EnqueuePaymentDTO = {
	correlationId: string;
	amount: number;
	requestedAt: string;
};

export type ProcessPaymentDTO = {
	correlationId: string;
	amount: number;
	requestedAt: string;
};

export type Payment = {
	correlationId: string;
	amount: number;
	requestedAt: string;
	processor: ProcessorProvider;
};
