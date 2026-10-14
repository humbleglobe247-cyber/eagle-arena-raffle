export type InitializePaymentInput = {
  email: string;
  amount: number; // kobo
  reference: string;
  metadata: Record<string, unknown>;
};

export type PaymentVerification = {
  status: "success" | "failed" | "pending";
  amount: number; // kobo
  currency: string;
  reference: string;
};

export interface PaymentProvider {
  readonly name: "paystack";
  // Starts a payment and returns the page the customer should be sent to.
  initialize(input: InitializePaymentInput): Promise<{ authorizationUrl: string }>;
  // Asks the provider what really happened with a payment.
  verify(reference: string): Promise<PaymentVerification>;
}