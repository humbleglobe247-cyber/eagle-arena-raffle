import { SITE_NAME } from "../config/constants";
import { escapeHtml } from "../utils/escapeHtml";

export function winnerEmail(ticketNumber: number, note?: string | null) {
  const message = note?.trim();

  const text = [
    "Congratulations!",
    "",
    `Your ticket number ${ticketNumber} has been announced as a winner in the ${SITE_NAME} raffle.`,
    ...(message ? ["", "A message from the organisers:", message] : []),
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">
      <h2 style="margin:0 0 16px">${SITE_NAME}</h2>
      <p style="font-size:20px;font-weight:bold;margin:0 0 12px">Congratulations!</p>
      <p>Your ticket number <strong>${ticketNumber}</strong> has been announced as a winner in the ${SITE_NAME} raffle.</p>
      ${
        message
          ? `<p style="margin:20px 0 4px;color:#555">A message from the organisers:</p>
             <p style="margin:0;padding:12px 16px;background:#f5f5f5;border-radius:6px">${escapeHtml(message).replace(/\n/g, "<br>")}</p>`
          : ""
      }
    </div>`;

  return {
    subject: `Congratulations! Ticket ${ticketNumber} has won`,
    text,
    html,
  };
}