import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/prisma";


export async function loginAdmin(email: string, password: string) {
  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!admin) return null;

  const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordMatches) return null;

  return jwt.sign({ sub: String(admin.id) }, env.jwtSecret, {
    expiresIn: "1h",
    audience: "admin"
  });
}

export async function changeAdminPassword(
  adminId: number,
  currentPassword: string,
  newPassword: string
) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) return false;

  const matches = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!matches) return false;

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.admin.update({
    where: { id: adminId },
    data: { passwordHash },
  });

  return true;
}