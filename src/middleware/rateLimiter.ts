import { rateLimit } from "express-rate-limit";
import { env } from "../config/env";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function limiter(options: {
  windowMs: number;
  limit: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests,
    skip: () => !env.rateLimitEnabled,
    handler: (_req, res) => {
      res.status(429).json({ message: options.message });
    },
  });
}

// Everything under /api, per IP.
export const apiLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 600,
  message: "Too many requests. Please slow down and try again shortly.",
});

// Admin login: only failed attempts count, so the owner is never locked out by their own successes.
export const loginLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  message: "Too many login attempts. Please wait 15 minutes and try again.",
});

export const forgotPasswordLimiter = limiter({
  windowMs: HOUR,
  limit: 5,
  message: "Too many reset requests. Please try again in an hour.",
});

export const resetPasswordLimiter = limiter({
  windowMs: HOUR,
  limit: 10,
  message: "Too many attempts. Please try again in an hour.",
});

// Customer routes are deliberately generous. On mobile networks many customers
// can share one IP address, and the per-email limits (60 second wait, 5 wrong
// tries per code) already protect each individual address.
export const verificationRequestLimiter = limiter({
  windowMs: HOUR,
  limit: 20,
  message: "Too many code requests from this network. Please try again later.",
});

export const verificationCheckLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 40,
  message: "Too many attempts. Please wait a few minutes and try again.",
});

export const orderLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 30,
  message: "Too many orders from this network. Please wait a few minutes and try again.",
});

// The frontend polls this while waiting for a payment, and each check can call the payment provider.
export const orderStatusLimiter = limiter({
  windowMs: MINUTE,
  limit: 60,
  message: "Checking too often. Please wait a moment.",
});