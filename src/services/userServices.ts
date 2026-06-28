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

    const existingName = await prisma.user.findUnique({
        where: {name: data.name.toLowerCase()}
    })

    if (existingName) throw new Error("Name already taken.");

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return await prisma.user.create({
        data: {
            email: normalizedEmail,
            name: data.name,
            password: hashedPassword
        }
    });
}

export async function verifyUser(data: { email: string; password: string }) {
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