import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import {
  InitializePaymentInput,
  PaymentProvider,
  PaymentVerification,
} from "./types";

const BASE_URL = "https://api.paystack.co";

async function request(path: string, init: RequestInit = {}) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${env.paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.json().catch(() => null);
    return { httpStatus: response.status, body };
  } catch (error) {
    console.error("Could not reach Paystack:", error);
    throw new AppError(502, "We could not reach the payment provider. Please try again.");
  }
}

function fail(httpStatus: number, body: unknown): never {
  console.error("Paystack rejected the request:", httpStatus, body);
  throw new AppError(502, "The payment provider could not process the request. Please try again.");
}

export const paystackProvider: PaymentProvider = {
  name: "paystack",

  async initialize({ email, amount, reference, metadata }: InitializePaymentInput) {
    const { httpStatus, body } = await request("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email,
        amount: String(amount), // kobo, which is what our orders already use
        currency: "NGN",
        reference,
        callback_url: `${env.frontendUrl}/payment/callback`,
        metadata: JSON.stringify(metadata),
      }),
    });

    if (httpStatus >= 400 || !body?.status || !body.data?.authorization_url) {
      fail(httpStatus, body);
    }

    return { authorizationUrl: body.data.authorization_url as string };
  },

  async verify(reference: string): Promise<PaymentVerification> {
    const { httpStatus, body } = await request(
      `/transaction/verify/${encodeURIComponent(reference)}`
    );

    // Paystack has no record yet: the customer has not started paying.
    if (httpStatus === 404) {
      return { status: "pending", amount: 0, currency: "NGN", reference };
    }
    if (httpStatus >= 400 || !body?.status || !body.data) {
      fail(httpStatus, body);
    }

    const data = body.data as { status: string; amount: number; currency: string; reference?: string };

    const status =
      data.status === "success"
        ? "success"
        : data.status === "failed" || data.status === "reversed"
          ? "failed"
          : "pending"; // includes "abandoned": the customer may still come back and pay

    return {
      status,
      amount: data.amount,
      currency: data.currency,
      reference: data.reference ?? reference,
    };
  },
};