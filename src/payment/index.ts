import { env } from "../config/env";
import { mockProvider } from "./mockProvider";
import { PaymentProvider } from "./types";

function chooseProvider(): PaymentProvider {
  if (env.paymentProvider === "mock") {
    if (env.nodeEnv === "production") {
      throw new Error(
        "The mock payment provider cannot be used in production. Set PAYMENT_PROVIDER=paystack."
      );
    }
    return mockProvider;
  }

  if (env.paymentProvider === "paystack") {
    // Added when the client's Paystack account is ready.
    throw new Error(
  `PAYMENT_PROVIDER must be "mock" or "paystack" (got ${JSON.stringify(env.paymentProvider)})`
);
  }

  throw new Error('PAYMENT_PROVIDER must be "mock" or "paystack"');
}

export const paymentProvider = chooseProvider();