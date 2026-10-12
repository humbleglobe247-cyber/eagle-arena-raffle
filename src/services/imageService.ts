import { cloudinary } from "../config/cloudinary";
import { AppError } from "../utils/AppError";

const FOLDER = "raffle/prizes";

export type StoredImage = { url: string; publicId: string };

export function uploadPrizeImage(buffer: Buffer): Promise<StoredImage> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: FOLDER,
        resource_type: "image",
        allowed_formats: ["jpg", "png", "webp"],
        transformation: [{ width: 1600, height: 1600, crop: "limit" }],
      },
      (error, result) => {
        if (error || !result) {
          if (error?.http_code === 400) {
            return reject(new AppError(400, "That file is not a supported image"));
          }
          console.error("Cloudinary upload failed:", error);
          return reject(new AppError(502, "Image upload failed. Please try again."));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    stream.end(buffer);
  });
}

// Never throws: a failed cleanup must not turn a successful request into an error.
export async function deleteImage(publicId: string | null): Promise<void> {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (error) {
    console.error(`Failed to delete Cloudinary image ${publicId}:`, error);
  }
}