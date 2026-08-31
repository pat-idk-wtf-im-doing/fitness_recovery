import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Nav } from "@/components/Nav";
import { SessionKeepAlive } from "@/components/SessionKeepAlive";

export const metadata: Metadata = {
  title: "Recovery Log",
  description: "Track how you feel the day after training.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Recovery Log",
    statusBarStyle: "black-translucent",
  },
  // This is a private journal; keep it out of search engines entirely.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#08090c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SessionKeepAlive />
        <div className="mx-auto w-full max-w-lg flex-1 px-4 pt-6 pb-4">
          {children}
        </div>
        <Nav />
      </body>
    </html>
  );
}
