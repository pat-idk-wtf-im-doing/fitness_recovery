import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, isValidSessionToken } from "@/lib/session";

/**
 * Optimistic PIN gate. This is a fast cookie-signature check only — it keeps
 * unauthenticated requests from reaching pages at all, but it is NOT the
 * security boundary. Every query and Server Action re-checks via lib/auth.ts,
 * because a matcher change would otherwise silently drop coverage.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login") return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await isValidSessionToken(token)) return NextResponse.next();

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/).*)",
  ],
};
