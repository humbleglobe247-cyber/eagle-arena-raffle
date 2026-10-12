import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { deleteImage, uploadPrizeImage } from "./imageService";

export function listPrizes() {
  return prisma.prize.findMany({ orderBy: { id: "asc" } });
}

export async function getPrize(id: number) {
  const prize = await prisma.prize.findUnique({ where: { id } });
  if (!prize) throw new AppError(404, "Prize not found");
  return prize;
}

export async function createPrize(name: string, image: Buffer) {
  const stored = await uploadPrizeImage(image);

  try {
    return await prisma.prize.create({
      data: { name, imageUrl: stored.url, imagePublicId: stored.publicId },
    });
  } catch (error) {
    await deleteImage(stored.publicId); // don't leave an orphaned image behind
    throw error;
  }
}

export async function updatePrize(
  id: number,
  changes: { name?: string; image?: Buffer }
) {
  const existing = await getPrize(id);
  const stored = changes.image ? await uploadPrizeImage(changes.image) : null;

  try {
    const updated = await prisma.prize.update({
      where: { id },
      data: {
        ...(changes.name !== undefined && { name: changes.name }),
        ...(stored && { imageUrl: stored.url, imagePublicId: stored.publicId }),
      },
    });

    if (stored) await deleteImage(existing.imagePublicId); // remove the replaced image
    return updated;
  } catch (error) {
    if (stored) await deleteImage(stored.publicId);
    throw error;
  }
}

export async function deletePrize(id: number) {
  const prize = await getPrize(id);

  await prisma.prize.delete({ where: { id } });
  await deleteImage(prize.imagePublicId);
}