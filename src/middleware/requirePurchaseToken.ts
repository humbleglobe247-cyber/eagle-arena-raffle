import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function requirePurchaseToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Please verify your email first" });
  }

  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret, {
      audience: "purchase", // admin tokens carry a different audience and are rejected
    }) as jwt.JwtPayload;

    if (typeof payload.email !== "string") {
      return res.status(401).json({ message: "Please verify your email again" });
    }

    res.locals.email = payload.email;
    next();
  } catch {
    return res
      .status(401)
      .json({ message: "Your verification has expired. Please verify your email again." });
  }
}