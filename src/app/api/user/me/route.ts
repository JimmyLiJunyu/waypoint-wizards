import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import * as jose from 'jose';



export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: "Authentication Token Missing."}, {status: 401});
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.log("JWT_SECRET is missing from environmental variables");
            return NextResponse.json( {error: "Internal Configuration Error"}, {status: 500});
        }

        const encodedSecret = new TextEncoder().encode(secret);
        const { payload } = await jose.jwtVerify(token, encodedSecret);

        const userEmail = payload.email as string | undefined;
        if (!userEmail) {
            return NextResponse.json({error: 'Invalid token payload structure'}, {status: 401});
        }

        // only return user metadata for a more lightweight app
        const user = await prisma.user.findUnique({
            where: {email: userEmail},
            select: {
                name: true,
                email: true,
                imageUrl: true
            },
        });

        if (!user) {
            return NextResponse.json({error: "User not found in database"}, {status:404});
        }
        return NextResponse.json(user);
    } catch (error) {
        console.log("Jose JWT Verification or Database failure: ", error);
        return NextResponse.json({ error: "Invalid or expired token"}, {status: 401});
    }
}