import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
export const intensityEnum = pgEnum("intensity", ["low", "medium", "high"]);

export const sessionTypeEnum = pgEnum("session_type", ["training", "casual"]);

export const fieldTypeEnum = pgEnum("field_type", [
  "number",
  "text",
  "select",
  "scale",
]);

/**
 * One row per training session.
 *
 * `sessionDate` is the night of the training itself. `painRating` is how you
 * felt the FOLLOWING day — that pairing is the whole point of the app, so it
 * lives on a single row rather than being split across two records.
 */
export const entries = pgTable(
  "entries",
  {
    id: serial("id").primaryKey(),
    sessionDate: date("session_date").notNull(),
    sessionType: sessionTypeEnum("session_type"),
    painRating: smallint("pain_rating").notNull(),
    steps: integer("steps"),
    carbsG: integer("carbs_g"),
    intensity: intensityEnum("intensity"),
    sleepHours: numeric("sleep_hours", { precision: 3, scale: 1 }),
    sorenessAreas: text("soreness_areas").array(),
    hydrationMl: integer("hydration_ml"),
    comments: text("comments"),
    /** Values for user-defined fields, keyed by `fieldDefinitions.key`. */
    custom: jsonb("custom").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // One entry per session date, so re-logging a day updates instead of
    // silently creating a duplicate.
    uniqueIndex("entries_session_date_key").on(table.sessionDate),
    index("entries_session_date_idx").on(table.sessionDate),
  ],
);

/**
 * User-defined extra fields. Built-in fields are real typed columns above;
 * only these live in `entries.custom`.
 */
export const fieldDefinitions = pgTable(
  "field_definitions",
  {
    id: serial("id").primaryKey(),
    /** Slug matching /^[a-z0-9_]{1,32}$/. Used as the JSONB key. */
    key: text("key").notNull(),
    label: text("label").notNull(),
    type: fieldTypeEnum("type").notNull(),
    /** Choices for `select` fields. */
    options: jsonb("options").$type<string[]>().notNull().default([]),
    unit: text("unit"),
    /** Deactivated fields disappear from the form but keep their history. */
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("field_definitions_key_key").on(table.key)],
);

export type Entry = typeof entries.$inferSelect;
export type FieldDefinition = typeof fieldDefinitions.$inferSelect;
