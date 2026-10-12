import { z } from "zod";
import { AppError } from "./AppError";

export function parseBody<S extends z.ZodType>(
  schema: S,
  data: unknown
): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(400, result.error.issues[0].message);
  }
  return result.data;
}

export function parseId(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "Invalid id");
  }
  return id;
}