import { Request, Response } from "express";
import { z } from "zod";
import * as salesService from "../services/salesService";
import { parseBody } from "../utils/validate";

const paging = {
  page: z.coerce.number("page must be a number").int().min(1, "page must be 1 or more").default(1),
  limit: z.coerce
    .number("limit must be a number")
    .int()
    .min(1, "limit must be 1 or more")
    .max(100, "limit cannot be more than 100")
    .default(20),
};

const search = z.string().trim().max(254, "Search text is too long").optional();

const ordersQuery = z.object({
  ...paging,
  status: z.enum(["PENDING", "PAID", "FAILED"], "status must be PENDING, PAID or FAILED").optional(),
  search,
});

const buyersQuery = z.object({ ...paging, search });

export async function summary(_req: Request, res: Response) {
  res.json(await salesService.getSummary());
}

export async function orders(req: Request, res: Response) {
  res.json(await salesService.listOrders(parseBody(ordersQuery, req.query)));
}

export async function buyers(req: Request, res: Response) {
  res.json(await salesService.listBuyers(parseBody(buyersQuery, req.query)));
}