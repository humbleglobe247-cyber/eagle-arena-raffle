import { env } from "./env";

const missing: string[] = [];

function need(name: string, found: string) {
  if (!found) missing.push(name);
}

need("RESEND_API_KEY", env.resendApiKey);
need("MAIL_FROM", env.mailFrom);
need("PAYSTACK_SECRET_KEY", env.paystackSecretKey);

if (env.nodeEnv === "production") {
  need("CLOUDINARY_CLOUD_NAME", env.cloudinaryCloudName);
  need("CLOUDINARY_API_KEY", env.cloudinaryApiKey);
  need("CLOUDINARY_API_SECRET", env.cloudinaryApiSecret);
}

if (missing.length > 0) {
  throw new Error(`Missing from the environment: ${missing.join(", ")}`);
}

if (!/^sk_(test|live)_/.test(env.paystackSecretKey)) {
  throw new Error(
    "PAYSTACK_SECRET_KEY must start with sk_test_ or sk_live_. A key starting with pk_ is the public key, which this server does not use."
  );
}