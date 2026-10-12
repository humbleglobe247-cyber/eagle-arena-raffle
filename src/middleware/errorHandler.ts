import { ErrorRequestHandler } from "express";
import multer from "multer";
import { AppError } from "../utils/AppError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5MB or smaller"
        : "Invalid file upload";
    return res.status(400).json({ message });
  }

  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON in request body" });
  }

  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
};