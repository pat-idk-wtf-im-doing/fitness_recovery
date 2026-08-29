"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { listFieldDefinitions } from "@/lib/queries";
import { entrySchema, parseCustomValues } from "@/lib/validation";

export type EntryFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function collectCustom(formData: FormData): Record<string, unknown> {
  const custom: Record<string, unknown> = {};
  for (const [name, value] of formData.entries()) {
    if (name.startsWith("custom.")) {
      custom[name.slice("custom.".length)] = value;
    }
  }
  return custom;
}

export async function saveEntry(
  _prevState: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const rawId = formData.get("id");
  const id = rawId ? Number(rawId) : null;

  const parsed = entrySchema.safeParse({
    sessionDate: formData.get("sessionDate"),
    sessionType: formData.get("sessionType"),
    painRating: formData.get("painRating"),
    steps: formData.get("steps"),
    carbsG: formData.get("carbsG"),
    intensity: formData.get("intensity"),
    sleepHours: formData.get("sleepHours"),
    sorenessAreas: formData.getAll("sorenessAreas").map(String),
    hydrationMl: formData.get("hydrationMl"),
    rpe: formData.get("rpe"),
    comments: formData.get("comments"),
    custom: collectCustom(formData),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { error: "Check the highlighted fields.", fieldErrors };
  }

  const values = parsed.data;
  const definitions = await listFieldDefinitions(true);
  const custom = parseCustomValues(values.custom, definitions);

  const row = {
    sessionDate: values.sessionDate,
    sessionType: values.sessionType ?? null,
    painRating: values.painRating,
    steps: values.steps ?? null,
    carbsG: values.carbsG ?? null,
    intensity: values.intensity ?? null,
    sleepHours: values.sleepHours != null ? String(values.sleepHours) : null,
    sorenessAreas: values.sorenessAreas?.length ? values.sorenessAreas : null,
    hydrationMl: values.hydrationMl ?? null,
    rpe: values.rpe ?? null,
    comments: values.comments?.trim() ? values.comments.trim() : null,
    custom,
    updatedAt: new Date(),
  };

  if (id) {
    await getDb().update(entries).set(row).where(eq(entries.id, id));
  } else {
    // Re-logging the same training date edits that session rather than
    // creating a second row for the same night.
    await getDb()
      .insert(entries)
      .values(row)
      .onConflictDoUpdate({ target: entries.sessionDate, set: row });
  }

  revalidatePath("/");
  revalidatePath("/insights");
  redirect("/");
}

export async function deleteEntry(formData: FormData): Promise<void> {
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return;

  await getDb().delete(entries).where(eq(entries.id, id.data));

  revalidatePath("/");
  revalidatePath("/insights");
  redirect("/");
}
