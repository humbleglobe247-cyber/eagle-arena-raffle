import { Request, Response } from "express";
import { z } from "zod";
import * as verificationService from "../services/verificationService";
import { parseBody } from "../utils/validate";

const emailSchema = z
  .string("Email is required")
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254, "Email address is too long");

const requestSchema = z.object({ email: emailSchema });

const verifySchema = z.object({
  email: emailSchema,
  code: z
    .string("Code is required")
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export async function request(req: Request, res: Response) {
  const { email } = parseBody(requestSchema, req.body ?? {});
  await verificationService.requestCode(email);
  res.json({ message: "Verification code sent" });
}

export async function verify(req: Request, res: Response) {
  const { email, code } = parseBody(verifySchema, req.body ?? {});
  const purchaseToken = await verificationService.verifyCode(email, code);
  res.json({ purchaseToken });
}