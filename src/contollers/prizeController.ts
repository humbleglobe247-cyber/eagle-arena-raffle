import { Request, Response } from "express";
import { z } from "zod";
import * as prizeService from "../services/prizeService";
import { AppError } from "../utils/AppError";
import { parseBody, parseId } from "../utils/validate";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Prize name is required")
  .max(120, "Prize name must be 120 characters or fewer");

const createSchema = z.object({ name: nameSchema });
const updateSchema = z.object({ name: nameSchema.optional() });

export async function list(_req: Request, res: Response) {
  res.json(await prizeService.listPrizes());
}

export async function getOne(req: Request, res: Response) {
  res.json(await prizeService.getPrize(parseId(req.params.id)));
}

export async function create(req: Request, res: Response) {
  // `?? ""` gives a clear "name is required" message when the field is missing
  const { name } = parseBody(createSchema, { name: req.body?.name ?? "" });

  if (!req.file) throw new AppError(400, "Prize image is required");

  const prize = await prizeService.createPrize(name, req.file.buffer);
  res.status(201).json(prize);
}

export async function update(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const { name } = parseBody(updateSchema, { name: req.body?.name });

  if (name === undefined && !req.file) {
    throw new AppError(400, "Nothing to update");
  }

  res.json(await prizeService.updatePrize(id, { name, image: req.file?.buffer }));
}

export async function remove(req: Request, res: Response) {
  await prizeService.deletePrize(parseId(req.params.id));
  res.status(204).send();
}