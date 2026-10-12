import "dotenv/config";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in .env");
}



export const env = {
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL as string,
  adminEmail: process.env.ADMIN_EMAIL as string,
  adminPassword: process.env.ADMIN_PASSWORD as string,
  jwtSecret: process.env.JWT_SECRET,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY as string,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET as string,
  resendApiKey: process.env.RESEND_API_KEY as string,
  mailFrom: process.env.MAIL_FROM as string,
  frontendUrl: (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, ""),
  paymentProvider: (process.env.PAYMENT_PROVIDER ?? "mock").trim().toLowerCase(),
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY ?? "",

  nodeEnv: process.env.NODE_ENV ?? "development",

  corsOrigins: (process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
  trustProxy: Number(process.env.TRUST_PROXY ?? 0),
  rateLimitEnabled:
    (process.env.RATE_LIMIT ?? (process.env.NODE_ENV === "production" ? "on" : "off")) === "on",
};
