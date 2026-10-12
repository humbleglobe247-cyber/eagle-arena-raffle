import { Settings } from "../../generated/prisma/client";
import { prisma } from "../config/prisma";

export type SettingsChanges = {
  ticketPrice?: number;
  closesAt?: Date | null;
};

// The site has exactly one settings row (id 1), created the first time it's needed.
export function getSettings() {
  return prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}

export function updateSettings(changes: SettingsChanges) {
  return prisma.settings.upsert({
    where: { id: 1 },
    update: changes,
    create: { id: 1, ...changes },
  });
}

// Sales are open only when a price is set and the closing date is still ahead.
export function isSalesOpen(settings: Settings, now = new Date()) {
  return (
    settings.ticketPrice > 0 &&
    settings.closesAt !== null &&
    settings.closesAt > now
  );
}

export function withSalesStatus(settings: Settings) {
  return { ...settings, salesOpen: isSalesOpen(settings) };
}