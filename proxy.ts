import { NextResponse, type NextRequest } from "next/server";

import {
  SESSION_COOKIE,
  createSessionToken,
  isValidSessionToken,
  sessionCookieOptions,
} from "@/lib/session";

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

  if (!(await isValidSessionToken(token))) {
    // Endpoints are fetched directly; a redirect would be read as success.
    if (pathname.startsWith("/api/")) {
      return new NextResponse(null, {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Sliding expiry: any activity pushes the deadline out, so the session only
  // lapses after SESSION_MAX_AGE_SECONDS with no requests at all.
  const response = NextResponse.next();
  response.cookies.set(
    SESSION_COOKIE,
    await createSessionToken(),
    sessionCookieOptions,
  );
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/).*)",
  ],
};
