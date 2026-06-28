import { NextResponse } from "next/server";
import { verifyUser } from "@/services/userServices";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const { token } = await verifyUser({email, password});
    

   
    const response = NextResponse.json({ success: true });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error) {

    if (error instanceof Error) {
      if (error.message === "Invalid Email" || error.message === "Invalid Credentials") {
        return NextResponse.json({ error: error.message}, {status: 401});
      }
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
