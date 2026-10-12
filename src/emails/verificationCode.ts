import { CODE_TTL_MINUTES, SITE_NAME } from "../config/constants";

export function verificationCodeEmail(code: string) {
  return {
    subject: `${code} is your ${SITE_NAME} verification code`,
    text: [
      `Your ${SITE_NAME} verification code is ${code}.`,
      "",
      `It expires in ${CODE_TTL_MINUTES} minutes. If you did not ask for it, you can ignore this email.`,
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
        <h2 style="margin:0 0 16px">${SITE_NAME}</h2>
        <p>Use this code to verify your email:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:16px 0">${code}</p>
        <p style="color:#555">It expires in ${CODE_TTL_MINUTES} minutes. If you did not ask for it, you can ignore this email.</p>
      </div>`,
  };
}