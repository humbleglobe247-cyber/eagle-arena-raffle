import { Request, Response } from "express";
import { z } from "zod";
import { setMockPaymentStatus } from "../payment/mockProvider";
import { parseBody } from "../utils/validate";

const bodySchema = z.object({ status: z.enum(["success", "failed"]) });

export function completePayment(req: Request, res: Response) {
  const { status } = parseBody(bodySchema, req.body ?? {});
  const raw = req.params.reference;
  const reference = Array.isArray(raw) ? raw[0] : raw;

  setMockPaymentStatus(reference, status);
  res.json({ reference, status });
}