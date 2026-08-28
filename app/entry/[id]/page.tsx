import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteEntry } from "@/app/actions/entries";
import { EntryForm } from "@/components/EntryForm";
import { getEntry, listFieldDefinitions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditEntryPage(props: PageProps<"/entry/[id]">) {
  const { id } = await props.params;
  const entryId = Number(id);

  if (!Number.isInteger(entryId) || entryId <= 0) notFound();

  const [entry, fields] = await Promise.all([
    getEntry(entryId),
    listFieldDefinitions(true),
  ]);

  if (!entry) notFound();

  return (
    <main>
      <header className="mb-5">
        <Link href="/" className="text-sm text-ink-400 hover:text-ink-300">
          ← Back
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit session</h1>
      </header>

      <EntryForm entry={entry} fields={fields} />

      <form action={deleteEntry} className="mt-6">
        <input type="hidden" name="id" value={entry.id} />
        <button type="submit" className="btn-danger w-full">
          Delete this entry
        </button>
      </form>
    </main>
  );
}
