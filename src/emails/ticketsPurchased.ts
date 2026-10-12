import { SITE_NAME } from "../config/constants";

export function ticketsPurchasedEmail(numbers: number[]) {
  const count = numbers.length;
  const list = numbers.join(", ");
  const noun = count === 1 ? "ticket" : "tickets";

  return {
    subject: `Your ${SITE_NAME} ticket ${count === 1 ? "number" : "numbers"}`,
    text: [
      `Thank you for your purchase.`,
      "",
      `You bought ${count} ${noun}. Your ticket ${count === 1 ? "number is" : "numbers are"}:`,
      list,
      "",
      "Keep this email. If one of your tickets wins, we will announce the number on the website and contact you at this address.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">
        <h2 style="margin:0 0 16px">${SITE_NAME}</h2>
        <p>Thank you for your purchase.</p>
        <p>You bought <strong>${count} ${noun}</strong>. Your ticket ${count === 1 ? "number is" : "numbers are"}:</p>
        <p style="font-size:20px;font-weight:bold;line-height:1.6;word-break:break-word">${list}</p>
        <p style="color:#555">Keep this email. If one of your tickets wins, we will announce the number on the website and contact you at this address.</p>
      </div>`,
  };
}