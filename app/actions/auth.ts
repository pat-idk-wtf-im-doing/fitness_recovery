"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  verifyPin,
} from "@/lib/session";

export type LoginState = { error?: string };

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

/**
 * Best-effort brute-force throttle. Serverless instances do not share memory,
 * so this slows an attacker down rather than stopping them outright — the real
 * protection is a PIN long enough to not be guessable (see APP_PIN in env.ts).
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

async function clientKey(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function takeAttempt(key: string): boolean {
  const now = Date.now();

  // Opportunistic cleanup so the map cannot grow without bound.
  for (const [existing, record] of attempts) {
    if (record.resetAt <= now) attempts.delete(existing);
  }

  const record = attempts.get(key);
  if (!record || record.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  record.count += 1;
  return record.count <= MAX_ATTEMPTS;
}

export async function unlock(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const pin = String(formData.get("pin") ?? "");
  if (!pin) return { error: "Enter your PIN." };

  const key = await clientKey();
  if (!takeAttempt(key)) {
    return { error: "Too many attempts. Wait 15 minutes and try again." };
  }

  if (!(await verifyPin(pin))) {
    // Blunt the timing signal and make scripted guessing slower.
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { error: "Wrong PIN." };
  }

  attempts.delete(key);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect("/");
}

export async function lock(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
