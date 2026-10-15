import "dotenv/config";

const nodeEnv = process.env.NODE_ENV ?? "development";

if (!["development", "staging", "production"].includes(nodeEnv)) {
  throw new Error(
    `NODE_ENV must be development, staging or production (got "${nodeEnv}")`
  );
}

const isProduction = nodeEnv === "production";

function value(name: string) {
  return process.env[name]?.trim() ?? "";
}

function required(name: string) {
  const found = value(name);
  if (!found) throw new Error(`${name} is missing in .env`);
  return found;
}

const jwtSecret = required("JWT_SECRET");
if (isProduction && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production");
}


// const frontendUrl = (
//   value("FRONTEND_URL") || (isProduction ? "" : "http://localhost:5201")
// ).replace(/\/$/, "");

// if (isProduction && frontendUrl && !frontendUrl.startsWith("https://")) {
//   throw new Error("FRONTEND_URL must be an https:// address in production");
// }


const frontendUrl = (
  value("FRONTEND_URL") || (isProduction ? "" : "http://localhost:5201")
).replace(/\/$/, "");

if (isProduction && frontendUrl && !frontendUrl.startsWith("https://")) {
  throw new Error("FRONTEND_URL must be an https:// address in production");
}


const trustProxy = Number(value("TRUST_PROXY") || 0);
if (!Number.isInteger(trustProxy) || trustProxy < 0) {
  throw new Error("TRUST_PROXY must be a whole number such as 0 or 1");
}

export const env = {
  nodeEnv,
  port: Number(value("PORT")) || 5000,
  databaseUrl: required("DATABASE_URL"),
  jwtSecret,
  adminEmail: value("ADMIN_EMAIL"),
  adminPassword: value("ADMIN_PASSWORD"),
  cloudinaryCloudName: value("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: value("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: value("CLOUDINARY_API_SECRET"),
  resendApiKey: value("RESEND_API_KEY"),
  mailFrom: value("MAIL_FROM"),
  frontendUrl,
  paystackSecretKey: value("PAYSTACK_SECRET_KEY"),
  corsOrigins: (value("CORS_ORIGINS") || frontendUrl)
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
  trustProxy,
  // Always on in production. Elsewhere it is off unless RATE_LIMIT=on.
  rateLimitEnabled: isProduction || value("RATE_LIMIT") === "on",
};