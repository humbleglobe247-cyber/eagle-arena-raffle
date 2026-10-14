import { env } from "../config/env";
import { paystackProvider } from "./paystackProvider";

if (!env.paystackSecretKey) {
  throw new Error("PAYSTACK_SECRET_KEY is missing in .env");
}

// Two guards that stop expensive mix-ups.
const isLiveKey = env.paystackSecretKey.startsWith("sk_live_");

if (env.nodeEnv === "production" && !isLiveKey) {
  throw new Error("Production needs a live Paystack key (it starts with sk_live_).");
}
if (env.nodeEnv !== "production" && isLiveKey) {
  throw new Error("A live Paystack key can only be used when NODE_ENV=production.");
}

export const paymentProvider = paystackProvider;