import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { loginAdmin, changeAdminPassword } from "../services/authService";
import { MIN_PASSWORD_LENGTH } from "../config/constants";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(MIN_PASSWORD_LENGTH),
})

// login
export async function login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const token = await loginAdmin(parsed.data.email, parsed.data.password);
    if (!token) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({ token });
}

export async function me(_req: Request, res: Response) {
    const admin = await prisma.admin.findUnique({
        where: { id: res.locals.adminId },
        select: { id: true, email: true },
    });
    res.json(admin);
}


// chanagepassword
export async function changePassword(req: Request, res: Response) {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        });
    }

    const { currentPassword, newPassword } = parsed.data;

    if (currentPassword === newPassword) {
        return res
            .status(400)
            .json({ message: "New password must be different from the current one" });
    }

    const changed = await changeAdminPassword(
        res.locals.adminId,
        currentPassword,
        newPassword
    );
    if (!changed) {
        return res.status(401).json({ message: "Current password is incorrect" });
    }

    res.json({ message: "Password updated" });
}