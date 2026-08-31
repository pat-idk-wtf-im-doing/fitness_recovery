"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Keeps the session alive while the app is actually on screen.
 *
 * The idle window is short, so reading a page or filling in a long form would
 * otherwise lapse without any navigation. Pings only while the document is
 * visible — once the app is backgrounded or closed the pings stop and the
 * session is allowed to expire.
 */
const PING_INTERVAL_MS = 2 * 60 * 1000; // Comfortably inside the idle window.

export function SessionKeepAlive() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/login") return;

    let cancelled = false;

    async function ping() {
      if (document.visibilityState !== "visible") return;

      try {
        const response = await fetch("/api/session", { cache: "no-store" });
        if (!cancelled && response.status === 401) {
          router.replace("/login");
        }
      } catch {
        // Offline or a dropped request; the next ping retries.
      }
    }

    const timer = setInterval(ping, PING_INTERVAL_MS);
    document.addEventListener("visibilitychange", ping);
    void ping();

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", ping);
    };
  }, [pathname, router]);

  return null;
}
