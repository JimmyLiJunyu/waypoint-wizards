import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { createUser } from '@/services/userServices';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password!" });
    }

    await createUser({ email, password });

    return NextResponse.json({
      success: true,
      message: "User created successfully.",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("Signup Error details:", errorMessage);

    if (errorMessage === "Email already registered!") {
      return NextResponse.json({ error: errorMessage }, {status: 400});
    }
    
    return NextResponse.json(
      { error: errorMessage},
      { status: 500 },
    );
  }
}
