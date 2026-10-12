import { prisma } from "../config/prisma";
import { getSettings, isSalesOpen } from "./settingsService";

export async function getSiteData() {
  const [settings, prizes, winners] = await Promise.all([
    getSettings(),
    prisma.prize.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true, imageUrl: true },
    }),
    prisma.winner.findMany({
      orderBy: { announcedAt: "asc" }, // in the order they were announced
      select: { ticketNumber: true },
    }),
  ]);

  const now = new Date();

  return {
    currency: "NGN",
    ticketPrice: settings.ticketPrice, // in kobo; the frontend formats it as naira
    closesAt: settings.closesAt,
    salesOpen: isSalesOpen(settings, now),
    serverTime: now, // lets the countdown ignore a wrong clock on the visitor's device
    prizes,
    winners: winners.map((winner) => winner.ticketNumber),
  };
}