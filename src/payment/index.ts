// import { env } from "../config/env";
// import { paystackProvider } from "./paystackProvider";

// if (!env.paystackSecretKey) {
//   throw new Error("PAYSTACK_SECRET_KEY is missing in .env");
// }

// // Two guards that stop expensive mix-ups.
// const isLiveKey = env.paystackSecretKey.startsWith("sk_live_");

// if (env.nodeEnv === "production" && !isLiveKey) {
//   throw new Error("Production needs a live Paystack key (it starts with sk_live_).");
// }
// if (env.nodeEnv !== "production" && isLiveKey) {
//   throw new Error("A live Paystack key can only be used when NODE_ENV=production.");
// }

// export const paymentProvider = paystackProvider;


import { env } from "../config/env";
import { paystackProvider } from "./paystackProvider";

if (!env.paystackSecretKey) {
  throw new Error("PAYSTACK_SECRET_KEY is missing in .env");
}

const isLiveKey = env.paystackSecretKey.startsWith("sk_live_");
const livePaymentsEnabled =
  process.env.ENABLE_LIVE_PAYMENTS === "true";

if (livePaymentsEnabled && env.nodeEnv !== "production") {
  throw new Error(
    "Live payments can only be enabled when NODE_ENV=production."
  );
}

if (livePaymentsEnabled && !isLiveKey) {
  throw new Error(
    "ENABLE_LIVE_PAYMENTS requires a live Paystack key."
  );
}

if (!livePaymentsEnabled && isLiveKey) {
  throw new Error(
    "Live Paystack keys cannot be used while ENABLE_LIVE_PAYMENTS is disabled."
  );
}

export const paymentProvider = paystackProvider;

