import { NextResponse } from "next/server";

export async function POST() {
    try {
        const response = NextResponse.json(
            {message: "Logged out successfully"},
            {status: 200}
        );

        response.cookies.set("token", "", {
            httpOnly: true,
            secure: process.env.NODE_EV === "production",
            sameSite: "lax",
            maxAge: 0,
            path: "/",
        });

        return response;
    } catch (error) {
        console.log("Logout error: ", error);
        return NextResponse.json(
            {message: "Internal Server Error"},
            {status: 500}
        );
    }
}