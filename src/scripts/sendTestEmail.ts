import { sendMail } from "../services/mailService";

const to = process.argv[2];

if (!to) {
  console.error("Usage: pnpm mail:test someone@example.com");
  process.exit(1);
}

sendMail({
  to,
  subject: "Raffle test email",
  text: "If you can read this, email sending works.",
  html: "<p>If you can read this, <strong>email sending works</strong>.</p>",
})
  .then(() => console.log(`Test email sent to ${to}`))
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });