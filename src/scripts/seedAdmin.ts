import bcrypt from "bcrypt";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { MIN_PASSWORD_LENGTH } from "../config/constants";

async function main() {
  if (!env.adminEmail || !env.adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  }

  if (env.adminPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error("ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters");
  }

  const existing = await prisma.admin.count();
  if (existing > 0) {
    console.log("An admin already exists. Nothing to do.");
    return;
  }

  const passwordHash = await bcrypt.hash(env.adminPassword, 12);

  await prisma.admin.create({
    data: {
      email: env.adminEmail.toLowerCase(),
      passwordHash,
    },
  });

  console.log("Admin created.");
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());