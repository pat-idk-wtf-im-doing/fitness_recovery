import { isUnlocked } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Heartbeat for the client keep-alive. The proxy refreshes the session cookie
 * on any authenticated request, so simply reaching this route extends the idle
 * window. Returns 401 once the session has lapsed so the client can re-lock.
 */
export async function GET() {
  return new Response(null, {
    status: (await isUnlocked()) ? 204 : 401,
    headers: { "Cache-Control": "no-store" },
  });
}
