import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/auth/tokens";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/new-trip") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token) {
    const verifiedToken = await verifyJWT(token);

    if (!verifiedToken && pathname.startsWith("/new-trip")) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }

    if (pathname.startsWith("/login") || pathname.startsWith("/sign-up")) {
      return NextResponse.redirect(new URL("/new-trip", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/new-trip/:path*", "/login", "/sign-up"],
};
