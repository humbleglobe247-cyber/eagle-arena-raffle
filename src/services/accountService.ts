import bcrypt from "bcrypt";
import { createHash, randomBytes } from "node:crypto";
import {
  ADMIN_RESET_PATH,
  RESET_COOLDOWN_SECONDS,
  RESET_TOKEN_TTL_MINUTES,
} from "../config/constants";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { passwordChangedEmail, passwordResetEmail, emailChangedEmail, } from "../emails/accountsEmails";
import { AppError } from "../utils/AppError";
import { sendMail, type Mail } from "./mailService";

const INVALID_LINK = "This reset link is invalid or has expired. Please request a new one.";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Sends an email in the background. If it fails, the change it belongs to still stands.
function sendInBackground(to: string, mail: Omit<Mail, "to">) {
  sendMail({ to, ...mail }).catch((error) =>
    console.error(`Could not send an email to ${to}:`, error)
  );
}

// Always finishes quietly, whether or not the email belongs to the admin,
// so the answer never reveals which address is registered.
export async function requestPasswordReset(email: string) {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return;

  const latest = await prisma.passwordResetToken.findFirst({
    where: { adminId: admin.id },
    orderBy: { createdAt: "desc" },
  });
  if (latest && Date.now() - latest.createdAt.getTime() < RESET_COOLDOWN_SECONDS * 1000) {
    return; // asked too recently; the earlier email is still valid
  }

  const token = randomBytes(32).toString("hex");

  await prisma.$transaction([
    // A new link cancels any earlier unused one.
    prisma.passwordResetToken.updateMany({
      where: { adminId: admin.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: {
        adminId: admin.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000),
      },
    }),
  ]);

  const link = `${env.frontendUrl}${ADMIN_RESET_PATH}?token=${token}`;
  sendInBackground(admin.email, passwordResetEmail(link));
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: { select: { email: true } } },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError(400, INVALID_LINK);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction(async (tx) => {
    // Claim the link so it can only ever be used once, even by two quick requests.
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) throw new AppError(400, INVALID_LINK);

    await tx.admin.update({ where: { id: record.adminId }, data: { passwordHash } });

    // Cancel any other outstanding reset links.
    await tx.passwordResetToken.updateMany({
      where: { adminId: record.adminId, usedAt: null },
      data: { usedAt: new Date() },
    });
  });

  sendInBackground(record.admin.email, passwordChangedEmail());
}

export async function changeAdminEmail(
  adminId: number,
  currentPassword: string,
  newEmail: string
) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) throw new AppError(401, "Not authorized");

  if (!(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    throw new AppError(401, "Current password is incorrect");
  }
  if (newEmail === admin.email) {
    throw new AppError(400, "That is already your email address");
  }

  try {
    await prisma.admin.update({ where: { id: adminId }, data: { email: newEmail } });
  } catch (error) {
    if ((error as { code?: string } | null)?.code === "P2002") {
      throw new AppError(409, "That email address is already in use");
    }
    throw error;
  }

  // Tell the old address, in case someone else made the change.
  sendInBackground(admin.email, emailChangedEmail(newEmail));
}