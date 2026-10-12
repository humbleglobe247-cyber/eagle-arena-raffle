import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, env.jwtSecret, {
      audience: "admin", // purchase tokens carry a different audience and are rejected here
    }) as jwt.JwtPayload;

    const adminId = Number(payload.sub);
    if (!Number.isInteger(adminId) || adminId <= 0) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.locals.adminId = adminId;
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized" });
  }
}