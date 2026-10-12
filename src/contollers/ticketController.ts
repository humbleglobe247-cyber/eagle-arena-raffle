import { Request, Response } from "express";
import * as fulfillmentService from "../services/fufillmentService";

export async function orderStatus(req: Request, res: Response) {
  const raw = req.params.reference;
  const reference = Array.isArray(raw) ? raw[0] : raw;

  res.set("Cache-Control", "no-store");
  res.json(await fulfillmentService.settleOrder(reference));
}

export async function myTickets(_req: Request, res: Response) {
  const email: string = res.locals.email;

  res.set("Cache-Control", "no-store");
  res.json({
    email,
    tickets: await fulfillmentService.listTicketsForEmail(email),
  });
}