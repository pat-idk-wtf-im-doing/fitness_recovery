import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { requireUnlocked } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { entries, fieldDefinitions } from "@/lib/db/schema";

export async function listEntries() {
  await requireUnlocked();
  return getDb().select().from(entries).orderBy(desc(entries.sessionDate));
}

export async function getEntry(id: number) {
  await requireUnlocked();
  const [entry] = await getDb().select().from(entries).where(eq(entries.id, id));
  return entry ?? null;
}

export async function listFieldDefinitions(activeOnly = false) {
  await requireUnlocked();
  const rows = await getDb()
    .select()
    .from(fieldDefinitions)
    .orderBy(asc(fieldDefinitions.sortOrder), asc(fieldDefinitions.id));

  return activeOnly ? rows.filter((row) => row.active) : rows;
}
