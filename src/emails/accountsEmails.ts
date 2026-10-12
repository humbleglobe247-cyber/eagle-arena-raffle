import { RESET_TOKEN_TTL_MINUTES, SITE_NAME } from "../config/constants";
import { escapeHtml } from "../utils/escapeHtml";

function wrap(body: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">
      <h2 style="margin:0 0 16px">${SITE_NAME}</h2>
      ${body}
    </div>`;
}

export function passwordResetEmail(link: string) {
  return {
    subject: `Reset your ${SITE_NAME} admin password`,
    text: [
      "We received a request to reset the admin password.",
      "",
      `Open this link to choose a new password (valid for ${RESET_TOKEN_TTL_MINUTES} minutes, and it works once):`,
      link,
      "",
      "If you did not ask for this, you can ignore this email. Your password stays the same.",
    ].join("\n"),
    html: wrap(`
      <p>We received a request to reset the admin password.</p>
      <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;border-radius:6px;text-decoration:none">Choose a new password</a></p>
      <p style="color:#555">The link is valid for ${RESET_TOKEN_TTL_MINUTES} minutes and works once. If you did not ask for this, you can ignore this email. Your password stays the same.</p>`),
  };
}

export function passwordChangedEmail() {
  return {
    subject: `Your ${SITE_NAME} admin password was changed`,
    text: "The admin password was just changed. If this was not you, reset it straight away using the forgot password link on the login page.",
    html: wrap(`
      <p>The admin password was just changed.</p>
      <p style="color:#555">If this was not you, reset it straight away using the forgot password link on the login page.</p>`),
  };
}

export function emailChangedEmail(newEmail: string) {
  return {
    subject: `Your ${SITE_NAME} admin email was changed`,
    text: `The admin email was changed to ${newEmail}. If this was not you, contact your developer straight away.`,
    html: wrap(`
      <p>The admin email was changed to <strong>${escapeHtml(newEmail)}</strong>.</p>
      <p style="color:#555">If this was not you, contact your developer straight away.</p>`),
  };
}