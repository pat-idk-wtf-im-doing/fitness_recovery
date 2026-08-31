/**
 * Data Access Layer guard.
 *
 * Every server-side read/write path calls through here. Proxy (`proxy.ts`) only
 * does an optimistic redirect; this is the check that actually protects data.
 */
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { SESSION_COOKIE, isValidSessionToken } from "@/lib/session";

/** Memoized per render pass so a page with many queries verifies once. */
export const isUnlocked = cache(async (): Promise<boolean> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return isValidSessionToken(token);
});

/** Redirects to the PIN screen unless the caller has a valid session. */
export async function requireUnlocked(): Promise<void> {
  if (!(await isUnlocked())) {
    redirect("/login");
  }
}
