import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import {
  InitializePaymentInput,
  PaymentProvider,
  PaymentVerification,
} from "./types";

type MockPayment = { amount: number; status: PaymentVerification["status"] };

// Remembered in memory only, so a server restart forgets pending payments. Fine for development.
const payments = new Map<string, MockPayment>();

export const mockProvider: PaymentProvider = {
  name: "mock",

  async initialize({ amount, reference }: InitializePaymentInput) {
    payments.set(reference, { amount, status: "pending" });

    return {
      authorizationUrl: `${env.frontendUrl}/payment/callback?reference=${encodeURIComponent(reference)}&mock=1`,
    };
  },

  async verify(reference: string): Promise<PaymentVerification> {
    const payment = payments.get(reference);

    if (!payment) {
      return { status: "pending", amount: 0, currency: "NGN", reference };
    }

    return {
      status: payment.status,
      amount: payment.amount,
      currency: "NGN",
      reference,
    };
  },
};

// Development only: pretend the customer paid (or that the payment failed).
export function setMockPaymentStatus(reference: string, status: "success" | "failed") {
  const payment = payments.get(reference);

  if (!payment) {
    throw new AppError(404, "No mock payment was started with that reference");
  }

  payment.status = status;
}