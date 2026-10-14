import { createHmac, timingSafeEqual } from "node:crypto";
import { Request, Response } from "express";
import { env } from "../config/env";
import { settleOrder } from "../services/fufillmentService";
import { AppError } from "../utils/AppError";

function signatureMatches(rawBody: Buffer, header: unknown) {
  if (typeof header !== "string") return false;

  const expected = createHmac("sha512", env.paystackSecretKey).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);

  return a.length === b.length && timingSafeEqual(a, b);
}

export async function paystackWebhook(req: Request, res: Response) {
  const rawBody = req.body;

  if (
    !Buffer.isBuffer(rawBody) ||
    !signatureMatches(rawBody, req.headers["x-paystack-signature"])
  ) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ message: "Invalid body" });
  }

  // We only care about successful payments. Acknowledge everything else.
  if (event.event !== "charge.success" || typeof event.data?.reference !== "string") {
    return res.sendStatus(200);
  }

  try {
    const order = await settleOrder(event.data.reference);

    // Paystack says paid but we could not confirm it yet: ask Paystack to call again later.
    if (order.status !== "PAID") return res.sendStatus(500);
  } catch (error) {
    if (error instanceof AppError && (error.statusCode === 404 || error.statusCode === 409)) {
      // 404: not one of our orders. 409: amount mismatch, already logged. Retrying won't help.
      return res.sendStatus(200);
    }

    console.error("Webhook processing failed:", error);
    return res.sendStatus(500); // Paystack will try again
  }

  res.sendStatus(200);
}