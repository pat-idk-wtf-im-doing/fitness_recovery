import { redirect } from "next/navigation";

import { LoginForm } from "./LoginForm";
import { isUnlocked } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isUnlocked()) redirect("/");

  return (
    <main className="flex min-h-[70vh] flex-col justify-center">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Recovery Log</h1>
        <p className="text-sm text-ink-400">Enter your PIN to continue.</p>
      </header>

      <LoginForm />
    </main>
  );
}
