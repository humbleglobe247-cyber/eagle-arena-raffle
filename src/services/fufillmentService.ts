import { Order } from "../../generated/prisma/client";
import { prisma } from "../config/prisma";
import { ticketsPurchasedEmail } from "../emails/ticketsPurchased";
import { paymentProvider } from "../payment";
import { AppError } from "../utils/AppError";
import { sendMail } from "./mailService";

const CURRENCY = "NGN";

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.charAt(0)}***@${domain}`;
}

// Gives out ticket numbers inside one database transaction, so two payments
// can never receive the same number, even if they are confirmed at the same moment.
// Returns the new numbers, or null if another request already issued this order's tickets.
async function issueTickets(order: Order): Promise<number[] | null> {
  return prisma.$transaction(
    async (tx) => {
      // Claim the order. Only one caller can move it to PAID, which makes this safe to call twice.
      // Any status except PAID is accepted: if the provider says money arrived, tickets are owed.
      const claimed = await tx.order.updateMany({
        where: { id: order.id, status: { not: "PAID" } },
        data: { status: "PAID", paidAt: new Date() },
      });
      if (claimed.count === 0) return null;

      // The update locks the settings row until this transaction ends,
      // so concurrent orders take their numbers one after another.
      const settings = await tx.settings.update({
        where: { id: 1 },
        data: { nextTicketNumber: { increment: order.quantity } },
        select: { nextTicketNumber: true },
      });

      const first = settings.nextTicketNumber - order.quantity;
      const numbers = Array.from({ length: order.quantity }, (_, i) => first + i);

      await tx.ticket.createMany({
        data: numbers.map((number) => ({ orderId: order.id, number })),
      });

      return numbers;
    },
    { timeout: 20_000 }
  );
}

async function emailTickets(email: string, numbers: number[]) {
  try {
    await sendMail({ to: email, ...ticketsPurchasedEmail(numbers) });
  } catch (error) {
    // The tickets are already saved and shown on screen. A failed email must not undo that.
    console.error(`Could not email ticket numbers to ${email}:`, error);
  }
}

async function confirmWithProvider(order: Order) {
  const result = await paymentProvider.verify(order.reference);

  if (result.status === "pending") return;

  if (result.status === "failed") {
    await prisma.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "FAILED" },
    });
    return;
  }

  // Never trust a "success" without checking it paid exactly what we asked for.
  if (result.amount !== order.amount || result.currency !== CURRENCY) {
    console.error(
      `Payment mismatch for ${order.reference}: expected ${order.amount} ${CURRENCY}, got ${result.amount} ${result.currency}`
    );
    throw new AppError(409, "We could not confirm this payment. Please contact support.");
  }

  const numbers = await issueTickets(order);

  // Only the request that actually issued the tickets sends the email, so it is never sent twice.
  if (numbers) await emailTickets(order.email, numbers);
}

// Checks an order with the payment provider if it is still unpaid, then reports its state.
// Both the customer's return to the site and, later, the Paystack webhook call this.
export async function settleOrder(reference: string) {
  const order = await prisma.order.findUnique({ where: { reference } });
  if (!order) throw new AppError(404, "Order not found");

  if (order.status !== "PAID") {
    await confirmWithProvider(order);
  }

  const latest = await prisma.order.findUniqueOrThrow({
    where: { reference },
    include: { tickets: { orderBy: { number: "asc" }, select: { number: true } } },
  });

  return {
    reference: latest.reference,
    status: latest.status,
    quantity: latest.quantity,
    amount: latest.amount,
    email: maskEmail(latest.email),
    tickets: latest.tickets.map((ticket) => ticket.number),
  };
}

export async function listTicketsForEmail(email: string) {
  const tickets = await prisma.ticket.findMany({
    where: { order: { email, status: "PAID" } },
    orderBy: { number: "asc" },
    select: { number: true },
  });

  return tickets.map((ticket) => ticket.number);
}