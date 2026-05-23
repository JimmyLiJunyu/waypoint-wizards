import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import pg from "pg";

// native Node-Postgres connection pool pointing towards Neon URL
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

// wrap the pool in the Prisma 7 driver adapter
const adapter = new PrismaPg(pool);

// prevent connection leaks during nextjs local development hot-reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = 
    globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma; // node automatically manages n populates NODE_ENV based on terminal command

