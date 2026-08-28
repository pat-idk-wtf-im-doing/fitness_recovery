import Link from "next/link";

import { EntryCard } from "@/components/EntryCard";
import { listEntries } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const entries = await listEntries();

  return (
    <main>
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recovery Log</h1>
          <p className="text-sm text-ink-400">
            {entries.length === 0
              ? "No sessions yet"
              : `${entries.length} session${entries.length === 1 ? "" : "s"} logged`}
          </p>
        </div>
        <Link href="/entry/new" className="btn-primary">
          + Log
        </Link>
      </header>

      {entries.length === 0 ? (
        <div className="card text-center">
          <p className="text-ink-300">Nothing logged yet.</p>
          <p className="mt-1 text-sm text-ink-400">
            Add your first session, or paste your old Samsung Notes into the
            Import tab.
          </p>
          <Link href="/entry/new" className="btn-primary mt-4 w-full">
            Log a session
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </main>
  );
}
