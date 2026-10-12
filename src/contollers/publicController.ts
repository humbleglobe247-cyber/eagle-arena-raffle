import { Request, Response } from "express";
import { getSiteData } from "../services/publicService";

export async function site(_req: Request, res: Response) {
  // Sales status and winners change at any moment, so don't let anything cache this.
  res.set("Cache-Control", "no-store");
  res.json(await getSiteData());
}