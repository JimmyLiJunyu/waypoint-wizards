import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/auth/tokens";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/new-trip') || pathname.startsWith('/trip');
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/sign-up');

  const verifiedToken = token ? await verifyJWT(token) : null;

  if (isProtectedRoute && !verifiedToken) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (token) response.cookies.delete('token');
    return response;
  }

  if (verifiedToken && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/new-trip/:path*", "/login", "/sign-up", "/trip/:path*", "/dashboard/:path*"],
};
