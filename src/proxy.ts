import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import {
  SESSION_COOKIE,
  getAuthSecret,
} from "@/lib/auth-constants";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isLoginPage = pathname === "/login";
  const isPublicAsset =
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/samples/") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/icon" ||
    pathname.startsWith("/icon?");

  if (isPublicAsset) {
    return NextResponse.next();
  }

  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, getAuthSecret());
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (!valid && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      response.cookies.delete(SESSION_COOKIE);
    }
    return response;
  }

  if (valid && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
