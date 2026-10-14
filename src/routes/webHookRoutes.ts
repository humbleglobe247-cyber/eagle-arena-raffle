import express, { Router } from "express";
import { paystackWebhook } from "../contollers/paystackwebhookController";

const router = Router();

/**
 * @openapi
 * /api/payments/paystack/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Paystack payment notification (for Paystack, not the website)
 *     description: >
 *       Called by Paystack, never by the frontend. Paystack signs each call
 *       with the x-paystack-signature header, and calls with a wrong
 *       signature are refused. A successful payment issues the tickets
 *       exactly once, the same way the order status check does. Register this
 *       address in the Paystack dashboard, separately for test and live mode.
 *     security: []
 *     responses:
 *       200:
 *         description: The notification was received
 *       401:
 *         description: The signature is missing or wrong
 *       500:
 *         description: Not processed yet. Paystack will try again.
 */
router.post(
  "/paystack/webhook",
  // The exact raw bytes are needed to check the signature, so this route does not use express.json.
  express.raw({ type: "application/json", limit: "100kb" }),
  paystackWebhook
);

export default router;