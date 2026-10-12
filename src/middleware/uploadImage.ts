import multer from "multer";
import { AppError } from "../utils/AppError";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new AppError(400, "Image must be a JPG, PNG or WebP file"));
    }
    cb(null, true);
  },
}).single("image");