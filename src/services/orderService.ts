import { randomUUID } from "node:crypto";
import { MAX_ORDER_AMOUNT_KOBO } from "../config/constants";
import { prisma } from "../config/prisma";
import { paymentProvider } from "../payment";
import { AppError } from "../utils/AppError";
import { getSettings, isSalesOpen } from "./settingsService";

export async function createOrder(email: string, quantity: number) {
  const settings = await getSettings();

  if (!isSalesOpen(settings)) {
    throw new AppError(400, "Ticket sales are not open right now");
  }

  // The total is always worked out here from the saved price, never taken from the customer.
  const amount = settings.ticketPrice * quantity;

  if (amount > MAX_ORDER_AMOUNT_KOBO) {
    throw new AppError(
      400,
      "That quantity is too large for one order. Please buy in smaller batches."
    );
  }

  const reference = `RAF-${randomUUID()}`;

  const order = await prisma.order.create({
    data: { email, quantity, amount, reference },
  });

  try {
    const { authorizationUrl } = await paymentProvider.initialize({
      email,
      amount,
      reference,
      metadata: { orderId: order.id, quantity },
    });

    return { reference, quantity, amount, authorizationUrl };
  } catch (error) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    throw error;
  }
}