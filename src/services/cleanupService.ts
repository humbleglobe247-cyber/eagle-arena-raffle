import { prisma } from "../config/prisma";

const DAY = 24 * 60 * 60 * 1000;

const CODE_RETENTION = 1 * DAY;
const RESET_TOKEN_RETENTION = 7 * DAY;
const UNPAID_ORDER_AFTER = 3 * DAY;

export async function runCleanup(now = new Date()) {
  const before = (ms: number) => new Date(now.getTime() - ms);

  const codes = await prisma.verificationCode.deleteMany({
    where: { createdAt: { lt: before(CODE_RETENTION) } },
  });

  const resetTokens = await prisma.passwordResetToken.deleteMany({
    where: { createdAt: { lt: before(RESET_TOKEN_RETENTION) } },
  });

  const staleOrders = await prisma.order.updateMany({
    where: { status: "PENDING", createdAt: { lt: before(UNPAID_ORDER_AFTER) } },
    data: { status: "FAILED" },
  });

  return {
    deletedCodes: codes.count,
    deletedResetTokens: resetTokens.count,
    expiredOrders: staleOrders.count,
  };
}