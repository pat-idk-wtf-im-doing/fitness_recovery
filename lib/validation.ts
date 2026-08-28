import { z } from "zod";

import type { FieldDefinition } from "@/lib/db/schema";

export const INTENSITY_VALUES = ["low", "medium", "high"] as const;
export type Intensity = (typeof INTENSITY_VALUES)[number];

export const INTENSITY_LABELS: Record<Intensity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const SORENESS_AREAS = [
  "Hamstrings",
  "Quads",
  "Calves",
  "Glutes",
  "Groin",
  "Hip flexors",
  "Lower back",
  "Knees",
  "Ankles",
  "Feet",
  "Shoulders",
] as const;

/** Turns "" / null into undefined so optional numeric inputs clear cleanly. */
const blankToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const optionalInt = (min: number, max: number) =>
  z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(min).max(max).optional(),
  );

const optionalFloat = (min: number, max: number) =>
  z.preprocess(
    blankToUndefined,
    z.coerce.number().min(min).max(max).optional(),
  );

/** Custom field keys are JSONB keys, never SQL identifiers. Still slugged. */
export const FIELD_KEY_REGEX = /^[a-z0-9_]{1,32}$/;

export const entrySchema = z.object({
  sessionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Use the date picker." })
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "That is not a real date.",
    })
    .refine(
      (value) => {
        // Compare as plain dates so a session logged "today" is always valid
        // regardless of the viewer's timezone.
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        return value <= todayStr;
      },
      { message: "Training date cannot be in the future." },
    ),
  painRating: z.coerce
    .number()
    .int()
    .min(0, { message: "Pain runs from 0 to 10." })
    .max(10, { message: "Pain runs from 0 to 10." }),
  steps: optionalInt(0, 200_000),
  carbsG: optionalInt(0, 2_000),
  intensity: z.preprocess(
    blankToUndefined,
    z.enum(INTENSITY_VALUES).optional(),
  ),
  sleepHours: optionalFloat(0, 24),
  sorenessAreas: z.array(z.string().max(40)).max(20).optional(),
  hydrationMl: optionalInt(0, 20_000),
  rpe: optionalInt(1, 10),
  comments: z
    .string()
    .max(2_000, { message: "Keep comments under 2000 characters." })
    .optional(),
  custom: z.record(z.string(), z.unknown()).optional(),
});

export type EntryInput = z.input<typeof entrySchema>;
export type EntryValues = z.output<typeof entrySchema>;

export const fieldDefinitionSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, { message: "Give the field a name." })
    .max(40, { message: "Keep the name under 40 characters." }),
  type: z.enum(["number", "text", "select", "scale"]),
  unit: z.string().trim().max(16).optional(),
  options: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
});

export type FieldDefinitionInput = z.infer<typeof fieldDefinitionSchema>;

export function slugifyFieldKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
}

/**
 * Validates submitted custom values against the active field definitions and
 * drops anything not on the allowlist. Unknown keys are silently discarded so
 * a tampered form body cannot inject arbitrary JSONB.
 */
export function parseCustomValues(
  raw: Record<string, unknown> | undefined,
  definitions: FieldDefinition[],
): Record<string, unknown> {
  if (!raw) return {};

  const result: Record<string, unknown> = {};

  for (const def of definitions) {
    if (!def.active) continue;
    if (!FIELD_KEY_REGEX.test(def.key)) continue;

    const value = raw[def.key];
    if (value === undefined || value === null || value === "") continue;

    switch (def.type) {
      case "number":
      case "scale": {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          result[def.key] =
            def.type === "scale"
              ? Math.min(10, Math.max(0, Math.round(parsed)))
              : parsed;
        }
        break;
      }
      case "select": {
        const text = String(value);
        if (def.options.includes(text)) result[def.key] = text;
        break;
      }
      case "text": {
        result[def.key] = String(value).slice(0, 500);
        break;
      }
    }
  }

  return result;
}
