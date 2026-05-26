import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Prisma } from '@/generated/prisma/client';
import { signJWT } from "@/lib/auth/tokens";

export async function createUser(data: Prisma.UserCreateInput) {
    const normalizedEmail = data.email.toLowerCase();
    
    const existingUser = await prisma.user.findUnique({
        where: {email: normalizedEmail},
    });

    if (existingUser) {
        throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return await prisma.user.create({
        data: {
            email: normalizedEmail,
            password: hashedPassword
        }
    });
}

export async function verifyUser(data: Prisma.UserCreateInput) {
    const normalizedEmail = data.email.toLowerCase();

    const user = await prisma.user.findUnique({
        where: {email: normalizedEmail}
    });

    if (!user) throw new Error('Invalid Email');

    const isPwValid = await bcrypt.compare(data.password, user.password);
    if (!isPwValid) throw new Error("Invalid Credentials");

    const token = await signJWT({ userId: user.id, email: user.email });
    return {token};
}