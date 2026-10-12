import { Request, Response } from "express";
import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "../config/constants";
import * as accountService from "../services/accountService";
import { parseBody } from "../utils/validate";

const emailField = z
  .string("Email is required")
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254, "Email address is too long");

// bcrypt only uses the first 72 bytes of a password, so longer ones are refused.
const newPasswordField = z
  .string("New password is required")
  .min(MIN_PASSWORD_LENGTH, `New password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(72, "New password must be 72 characters or fewer");

const forgotSchema = z.object({ email: emailField });

const resetSchema = z.object({
  token: z
    .string("The reset link is missing its token")
    .regex(/^[a-f0-9]{64}$/, "This reset link is invalid"),
  newPassword: newPasswordField,
});

const changeEmailSchema = z.object({
  currentPassword: z
    .string("Current password is required")
    .min(1, "Current password is required"),
  newEmail: emailField,
});

export async function forgotPassword(req: Request, res: Response) {
  const { email } = parseBody(forgotSchema, req.body ?? {});
  await accountService.requestPasswordReset(email);
  res.json({ message: "If that email belongs to the admin, a reset link has been sent." });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = parseBody(resetSchema, req.body ?? {});
  await accountService.resetPassword(token, newPassword);
  res.json({ message: "Password updated. You can now log in." });
}

export async function changeEmail(req: Request, res: Response) {
  const { currentPassword, newEmail } = parseBody(changeEmailSchema, req.body ?? {});
  await accountService.changeAdminEmail(res.locals.adminId, currentPassword, newEmail);
  res.json({ message: "Email updated", email: newEmail });
}