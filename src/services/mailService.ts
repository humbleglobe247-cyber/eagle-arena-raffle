import { Resend } from "resend";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

const resend = new Resend(env.resendApiKey);

export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string; // plain-text version; emails without one are more likely to land in spam
};

export async function sendMail({ to, subject, html, text }: Mail) {
  const { error } = await resend.emails.send({
    from: env.mailFrom,
    to: [to],
    subject,
    html,
    text,
  });

  if (error) {
    console.error("Resend failed to send:", error);
    throw new AppError(502, "We could not send the email. Please try again.");
  }
}