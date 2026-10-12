import { Request, Response } from "express";
import { z } from "zod";
import * as settingsService from "../services/settingsService";
import { AppError } from "../utils/AppError";
import { parseBody } from "../utils/validate";

// ticketPrice is in kobo (₦1,000 = 100000); the admin form converts from naira.
const updateSchema = z.object({
  ticketPrice: z
    .number("Ticket price must be a number")
    .int("Ticket price must be a whole number of kobo")
    .positive("Ticket price must be more than 0")
    .optional(),
  closesAt: z.coerce.date("Closing date is not a valid date").nullable().optional(),
});

export async function get(_req: Request, res: Response) {
  const settings = await settingsService.getSettings();
  res.json(settingsService.withSalesStatus(settings));
}

export async function update(req: Request, res: Response) {
  const changes = parseBody(updateSchema, req.body ?? {});

  if (Object.keys(changes).length === 0) {
    throw new AppError(400, "Nothing to update");
  }

  const settings = await settingsService.updateSettings(changes);
  res.json(settingsService.withSalesStatus(settings));
}