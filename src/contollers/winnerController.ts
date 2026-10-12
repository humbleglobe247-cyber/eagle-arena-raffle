import { Request, Response } from "express";
import { z } from "zod";
import * as winnerService from "../services/winnerService";
import { parseBody, parseId } from "../utils/validate";

const announceSchema = z.object({
  ticketNumber: z
    .number("Ticket number is required")
    .int("Ticket number must be a whole number")
    .min(1, "Enter a valid ticket number"),
});

const emailSchema = z.object({
  note: z.string().trim().max(1000, "The note must be 1000 characters or fewer").optional(),
  resend: z.boolean().optional(),
});

export async function list(_req: Request, res: Response) {
  res.json(await winnerService.listWinners());
}

export async function announce(req: Request, res: Response) {
  const { ticketNumber } = parseBody(announceSchema, req.body ?? {});
  res.status(201).json(await winnerService.announceWinner(ticketNumber));
}

export async function remove(req: Request, res: Response) {
  await winnerService.removeWinner(parseId(req.params.id));
  res.status(204).send();
}

export async function email(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const { note, resend } = parseBody(emailSchema, req.body ?? {});
  res.json(await winnerService.emailWinner(id, note || undefined, resend ?? false));
}