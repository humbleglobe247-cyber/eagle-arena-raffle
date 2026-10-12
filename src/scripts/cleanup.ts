import { prisma } from "../config/prisma";
import { runCleanup } from "../services/cleanupService";

runCleanup()
  .then((result) => console.log("Cleanup finished:", result))
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());