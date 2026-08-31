"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { requireUnlocked } from "@/lib/auth";
import { fieldDefinitions } from "@/lib/db/schema";
import {
  FIELD_KEY_REGEX,
  fieldDefinitionSchema,
  slugifyFieldKey,
} from "@/lib/validation";

export type FieldFormState = { error?: string; success?: string };

export async function createField(
  _prevState: FieldFormState,
  formData: FormData,
): Promise<FieldFormState> {
  await requireUnlocked();

  const rawOptions = String(formData.get("options") ?? "")
    .split(",")
    .map((option) => option.trim())
    .filter(Boolean);

  const parsed = fieldDefinitionSchema.safeParse({
    label: formData.get("label"),
    type: formData.get("type"),
    unit: formData.get("unit") || undefined,
    options: rawOptions,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid field." };
  }

  const { label, type, unit, options } = parsed.data;

  if (type === "select" && (!options || options.length < 2)) {
    return { error: "Give a select field at least two comma-separated choices." };
  }

  const key = slugifyFieldKey(label);
  if (!FIELD_KEY_REGEX.test(key)) {
    return { error: "That name has no usable letters or numbers." };
  }

  const [existing] = await getDb()
    .select({ id: fieldDefinitions.id })
    .from(fieldDefinitions)
    .where(eq(fieldDefinitions.key, key));

  if (existing) {
    return { error: `A field named "${label}" already exists.` };
  }

  const [{ max }] = await getDb()
    .select({ max: sql<number>`coalesce(max(${fieldDefinitions.sortOrder}), 0)::int` })
    .from(fieldDefinitions);

  await getDb().insert(fieldDefinitions).values({
    key,
    label,
    type,
    unit: unit || null,
    options: type === "select" ? (options ?? []) : [],
    sortOrder: max + 1,
  });

  revalidatePath("/settings/fields");
  revalidatePath("/entry/new");
  return { success: `Added "${label}".` };
}

export async function setFieldActive(formData: FormData): Promise<void> {
  await requireUnlocked();

  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  const active = formData.get("active") === "true";
  if (!id.success) return;

  await getDb()
    .update(fieldDefinitions)
    .set({ active })
    .where(eq(fieldDefinitions.id, id.data));

  revalidatePath("/settings/fields");
  revalidatePath("/entry/new");
}
