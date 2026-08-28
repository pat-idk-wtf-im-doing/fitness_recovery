import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { entries, fieldDefinitions } from "@/lib/db/schema";

export async function listEntries() {
  return getDb().select().from(entries).orderBy(desc(entries.sessionDate));
}

export async function getEntry(id: number) {
  const [entry] = await getDb().select().from(entries).where(eq(entries.id, id));
  return entry ?? null;
}

export async function listFieldDefinitions(activeOnly = false) {
  const rows = await getDb()
    .select()
    .from(fieldDefinitions)
    .orderBy(asc(fieldDefinitions.sortOrder), asc(fieldDefinitions.id));

  return activeOnly ? rows.filter((row) => row.active) : rows;
}
