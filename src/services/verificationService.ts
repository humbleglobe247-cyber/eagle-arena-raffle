import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import {
  CODE_MAX_ATTEMPTS,
  CODE_RESEND_COOLDOWN_SECONDS,
  CODE_TTL_MINUTES,
  PURCHASE_TOKEN_TTL,
} from "../config/constants";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { verificationCodeEmail } from "../emails/verificationCode";
import { AppError } from "../utils/AppError";
import { sendMail } from "./mailService";
import { getSettings, isSalesOpen } from "./settingsService";

// Codes are stored as a keyed hash, so a leaked database does not reveal live codes.
function hashCode(email: string, code: string) {
  return createHmac("sha256", env.jwtSecret).update(`${email}:${code}`).digest("hex");
}

export async function requestCode(email: string) {
  if (!isSalesOpen(await getSettings())) {
    throw new AppError(400, "Ticket sales are not open right now");
  }

  const latest = await prisma.verificationCode.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (latest) {
    const waitMs =
      latest.createdAt.getTime() + CODE_RESEND_COOLDOWN_SECONDS * 1000 - Date.now();
    if (waitMs > 0) {
      throw new AppError(
        429,
        `Please wait ${Math.ceil(waitMs / 1000)} seconds before asking for a new code`
      );
    }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");

  // A new code cancels any earlier unused one for this email.
  const [, created] = await prisma.$transaction([
    prisma.verificationCode.updateMany({
      where: { email, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.verificationCode.create({
      data: {
        email,
        codeHash: hashCode(email, code),
        expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60_000),
      },
    }),
  ]);

  try {
    await sendMail({ to: email, ...verificationCodeEmail(code) });
  } catch (error) {
    // The customer never got the code, so don't make them wait out the cooldown.
    await prisma.verificationCode.delete({ where: { id: created.id } });
    throw error;
  }
}

export async function verifyCode(email: string, code: string) {
  const record = await prisma.verificationCode.findFirst({
    where: { email, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new AppError(400, "That code is invalid or has expired. Please request a new one.");
  }
  if (record.attempts >= CODE_MAX_ATTEMPTS) {
    throw new AppError(429, "Too many wrong attempts. Please request a new code.");
  }

  const expected = Buffer.from(record.codeHash);
  const actual = Buffer.from(hashCode(email, code));
  const matches =
    expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!matches) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new AppError(400, "That code is incorrect.");
  }

  // Claim the code atomically so one code can only ever be used once.
  const claimed = await prisma.verificationCode.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) {
    throw new AppError(400, "That code has already been used. Please request a new one.");
  }

  return jwt.sign({ email }, env.jwtSecret, {
    expiresIn: PURCHASE_TOKEN_TTL,
    audience: "purchase",
  });
}