"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/lib/db";
import { requireUnlocked } from "@/lib/auth";
import { entries } from "@/lib/db/schema";
import { isImportable, parseNotes, type ParsedRow } from "@/lib/parse-notes";
import { listEntries } from "@/lib/queries";

export type ImportState = {
  rows?: ParsedRow[];
  text?: string;
  duplicates?: string[];
  imported?: number;
  error?: string;
};

const MAX_INPUT_CHARS = 100_000;
const MAX_ROWS = 500;

export async function previewImport(
  _prevState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  await requireUnlocked();

  const text = String(formData.get("text") ?? "");

  if (!text.trim()) return { error: "Paste something first." };
  if (text.length > MAX_INPUT_CHARS) {
    return { error: "That is a lot of text — split it into smaller batches." };
  }

  const rows = parseNotes(text);
  if (rows.length === 0) return { error: "Could not find any entries in that." };
  if (rows.length > MAX_ROWS) {
    return { error: `Found ${rows.length} entries — import at most ${MAX_ROWS} at a time.` };
  }

  const existing = await listEntries();
  const existingDates = new Set(existing.map((entry) => entry.sessionDate));
  const duplicates = rows
    .filter((row) => row.entry.sessionDate && existingDates.has(row.entry.sessionDate))
    .map((row) => row.entry.sessionDate!)
    .filter((date, index, all) => all.indexOf(date) === index);

  return { rows, text, duplicates };
}

export async function commitImport(
  _prevState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  await requireUnlocked();

  const text = String(formData.get("text") ?? "");
  if (!text.trim()) return { error: "Nothing to import." };
  if (text.length > MAX_INPUT_CHARS) return { error: "Input too large." };

  // Re-parse server-side rather than trusting a posted preview payload.
  const rows = parseNotes(text).filter(isImportable);
  if (rows.length === 0) return { error: "No valid entries to import." };
  if (rows.length > MAX_ROWS) return { error: "Too many entries in one batch." };

  const values = rows.map((row) => ({
    sessionDate: row.entry.sessionDate!,
    painRating: row.entry.painRating!,
    steps: row.entry.steps,
    carbsG: row.entry.carbsG,
    intensity: row.entry.intensity,
    sleepHours: row.entry.sleepHours != null ? String(row.entry.sleepHours) : null,
    hydrationMl: row.entry.hydrationMl,
    comments: row.entry.comments,
    updatedAt: new Date(),
  }));

  // De-duplicate within the batch so one date cannot hit the same row twice.
  const byDate = new Map(values.map((value) => [value.sessionDate, value]));

  for (const value of byDate.values()) {
    await getDb()
      .insert(entries)
      .values(value)
      .onConflictDoUpdate({ target: entries.sessionDate, set: value });
  }

  revalidatePath("/");
  revalidatePath("/insights");

  return { imported: byDate.size };
}
