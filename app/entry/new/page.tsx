import Link from "next/link";

import { EntryForm } from "@/components/EntryForm";
import { listFieldDefinitions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewEntryPage() {
  const fields = await listFieldDefinitions(true);

  return (
    <main>
      <header className="mb-5">
        <Link href="/" className="text-sm text-ink-400 hover:text-ink-300">
          ← Back
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">New session</h1>
      </header>

      <EntryForm entry={null} fields={fields} />
    </main>
  );
}
