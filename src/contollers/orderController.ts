import { Request, Response } from "express";
import { z } from "zod";
import * as orderService from "../services/orderService";
import { parseBody } from "../utils/validate";

const createSchema = z.object({
  quantity: z
    .number("Quantity is required")
    .int("Quantity must be a whole number")
    .min(1, "You must buy at least 1 ticket"),
});

export async function create(req: Request, res: Response) {
  const { quantity } = parseBody(createSchema, req.body ?? {});
  const order = await orderService.createOrder(res.locals.email, quantity);
  res.status(201).json(order);
}