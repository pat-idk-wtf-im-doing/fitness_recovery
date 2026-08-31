/**
 * Signed, stateless session cookie for the app's PIN gate.
 *
 * The cookie holds an expiry timestamp plus an HMAC-SHA256 signature of that
 * timestamp. Without SESSION_SECRET a client cannot forge one, so possession of
 * a valid cookie proves the PIN was entered at some point before it expired.
 *
 * Uses Web Crypto so the same code runs in `proxy.ts` and in Server Components.
 */
import "server-only";

import { env } from "@/lib/env";

export const SESSION_COOKIE = "recovery_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

/** Compares two byte arrays without leaking where they first differ. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * Checks a submitted PIN against APP_PIN. Both sides are hashed first so the
 * comparison is constant-time and does not leak the PIN's length.
 */
export async function verifyPin(candidate: string): Promise<boolean> {
  const [submitted, expected] = await Promise.all([
    hmac(`pin:${candidate}`),
    hmac(`pin:${env.APP_PIN}`),
  ]);
  return timingSafeEqual(submitted, expected);
}

export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = String(expiresAt);
  return `${payload}.${toBase64Url(await hmac(`session:${payload}`))}`;
}

export async function isValidSessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;

  const separator = token.indexOf(".");
  if (separator <= 0) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!/^\d{1,15}$/.test(payload)) return false;

  const expected = toBase64Url(await hmac(`session:${payload}`));
  if (!timingSafeEqual(encoder.encode(signature), encoder.encode(expected))) {
    return false;
  }

  return Number(payload) > Date.now();
}
