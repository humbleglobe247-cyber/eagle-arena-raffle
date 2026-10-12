import type { Winner } from "../../generated/prisma/client";
import { prisma } from "../config/prisma";
import { winnerEmail } from "../emails/winnerCongratulations";
import { AppError } from "../utils/AppError";
import { sendMail } from "./mailService";

async function withBuyerEmails(winners: Winner[]) {
  const tickets = await prisma.ticket.findMany({
    where: { number: { in: winners.map((winner) => winner.ticketNumber) } },
    select: { number: true, order: { select: { email: true } } },
  });
  const emailByNumber = new Map(tickets.map((t) => [t.number, t.order.email]));

  return winners.map((winner) => ({
    id: winner.id,
    ticketNumber: winner.ticketNumber,
    email: emailByNumber.get(winner.ticketNumber) ?? null,
    announcedAt: winner.announcedAt,
    emailedAt: winner.emailedAt,
    note: winner.note,
  }));
}

export async function listWinners() {
  const winners = await prisma.winner.findMany({ orderBy: { announcedAt: "asc" } });
  return withBuyerEmails(winners);
}

export async function announceWinner(ticketNumber: number) {
  const ticket = await prisma.ticket.findUnique({
    where: { number: ticketNumber },
    select: { order: { select: { status: true } } },
  });

  if (!ticket || ticket.order.status !== "PAID") {
    throw new AppError(404, `Ticket ${ticketNumber} was not found`);
  }

  try {
    const winner = await prisma.winner.create({ data: { ticketNumber } });
    const [result] = await withBuyerEmails([winner]);
    return result;
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "P2002") {
      throw new AppError(409, `Ticket ${ticketNumber} has already been announced`);
    }
    throw error;
  }
}

export async function removeWinner(id: number) {
  const winner = await prisma.winner.findUnique({ where: { id } });
  if (!winner) throw new AppError(404, "Winner not found");

  await prisma.winner.delete({ where: { id } });
}

export async function emailWinner(id: number, note: string | undefined, resend: boolean) {
  const winner = await prisma.winner.findUnique({ where: { id } });
  if (!winner) throw new AppError(404, "Winner not found");

  if (winner.emailedAt && !resend) {
    throw new AppError(
      409,
      "This winner has already been emailed. Send resend: true to email them again."
    );
  }

  const ticket = await prisma.ticket.findUnique({
    where: { number: winner.ticketNumber },
    select: { order: { select: { email: true } } },
  });
  if (!ticket) throw new AppError(404, "The buyer of this ticket could not be found");

  // If sending fails, sendMail throws and nothing is marked as emailed.
  await sendMail({ to: ticket.order.email, ...winnerEmail(winner.ticketNumber, note) });

  const updated = await prisma.winner.update({
    where: { id },
    data: { emailedAt: new Date(), note: note ?? null },
  });

  const [result] = await withBuyerEmails([updated]);
  return result;
}