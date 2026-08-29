"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { saveEntry, type EntryFormState } from "@/app/actions/entries";
import { SubmitButton } from "@/components/SubmitButton";
import { todayIso } from "@/lib/dates";
import type { Entry, FieldDefinition } from "@/lib/db/schema";
import {
  INTENSITY_LABELS,
  INTENSITY_VALUES,
  SESSION_TYPE_LABELS,
  SESSION_TYPE_VALUES,
  SORENESS_AREAS,
  type Intensity,
  type SessionType,
} from "@/lib/validation";

function painColor(value: number): string {
  if (value <= 3) return "#4ade80";
  if (value <= 6) return "#fbbf24";
  return "#f87171";
}

export function EntryForm({
  entry,
  fields,
}: {
  entry: Entry | null;
  fields: FieldDefinition[];
}) {
  const [state, formAction] = useActionState<EntryFormState, FormData>(
    saveEntry,
    {},
  );

  const [pain, setPain] = useState(entry?.painRating ?? 3);
  const [sessionType, setSessionType] = useState<SessionType | "">(
    (entry?.sessionType as SessionType | null) ?? "",
  );
  const [intensity, setIntensity] = useState<Intensity | "">(
    (entry?.intensity as Intensity | null) ?? "",
  );
  const [soreness, setSoreness] = useState<string[]>(entry?.sorenessAreas ?? []);
  const [showMore, setShowMore] = useState(
    Boolean(
      entry?.sleepHours ||
        entry?.hydrationMl ||
        entry?.rpe ||
        entry?.sorenessAreas?.length,
    ),
  );

  const today = todayIso();
  const errors = state.fieldErrors ?? {};

  function toggleSoreness(area: string) {
    setSoreness((current) =>
      current.includes(area)
        ? current.filter((item) => item !== area)
        : [...current, area],
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {entry ? <input type="hidden" name="id" value={entry.id} /> : null}
      {soreness.map((area) => (
        <input key={area} type="hidden" name="sorenessAreas" value={area} />
      ))}
      <input type="hidden" name="intensity" value={intensity} />
      <input type="hidden" name="sessionType" value={sessionType} />

      <div className="card space-y-5">
        <div>
          <label htmlFor="sessionDate" className="label">
            Training date
          </label>
          <input
            id="sessionDate"
            name="sessionDate"
            type="date"
            max={today}
            defaultValue={entry?.sessionDate ?? today}
            className="input"
            required
          />
          <p className="mt-1.5 text-xs text-ink-400">
            The night you trained. Pain below is how you felt the next day.
          </p>
          {errors.sessionDate ? (
            <p className="field-error">{errors.sessionDate}</p>
          ) : null}
        </div>

        <div>
          <span className="label">Session type</span>
          <div className="grid grid-cols-2 gap-2">
            {SESSION_TYPE_VALUES.map((value) => {
              const selected = sessionType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSessionType(selected ? "" : value)}
                  aria-pressed={selected}
                  className={`min-h-12 rounded-xl border text-base font-semibold transition active:scale-[0.98] ${
                    selected
                      ? "border-accent bg-accent text-ink-950"
                      : "border-ink-600 bg-ink-800 text-ink-300 hover:bg-ink-700"
                  }`}
                >
                  {SESSION_TYPE_LABELS[value]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="painRating" className="label mb-0">
              Next-day pain
            </label>
            <span
              className="text-3xl font-bold tabular-nums"
              style={{ color: painColor(pain) }}
            >
              {pain}
              <span className="text-base font-normal text-ink-400">/10</span>
            </span>
          </div>
          <input
            id="painRating"
            name="painRating"
            type="range"
            min={0}
            max={10}
            step={1}
            value={pain}
            onChange={(event) => setPain(Number(event.target.value))}
            className="h-3 w-full cursor-pointer appearance-none rounded-full bg-ink-700 accent-current"
            style={{ accentColor: painColor(pain) }}
          />
          <div className="mt-1 flex justify-between text-xs text-ink-400">
            <span>No pain</span>
            <span>Worst</span>
          </div>
          {errors.painRating ? (
            <p className="field-error">{errors.painRating}</p>
          ) : null}
        </div>

        <div>
          <span className="label">Training intensity</span>
          <div className="grid grid-cols-3 gap-2">
            {INTENSITY_VALUES.map((value) => {
              const selected = intensity === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setIntensity(selected ? "" : value)}
                  aria-pressed={selected}
                  className={`min-h-12 rounded-xl border text-base font-semibold transition active:scale-[0.98] ${
                    selected
                      ? "border-accent bg-accent text-ink-950"
                      : "border-ink-600 bg-ink-800 text-ink-300 hover:bg-ink-700"
                  }`}
                >
                  {INTENSITY_LABELS[value]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="steps" className="label">
              Steps
            </label>
            <input
              id="steps"
              name="steps"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="8000"
              defaultValue={entry?.steps ?? ""}
              className="input"
            />
            {errors.steps ? <p className="field-error">{errors.steps}</p> : null}
          </div>
          <div>
            <label htmlFor="carbsG" className="label">
              Carbs (g)
            </label>
            <input
              id="carbsG"
              name="carbsG"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="250"
              defaultValue={entry?.carbsG ?? ""}
              className="input"
            />
            {errors.carbsG ? <p className="field-error">{errors.carbsG}</p> : null}
          </div>
        </div>
      </div>

      <div className="card space-y-5">
        <button
          type="button"
          onClick={() => setShowMore((value) => !value)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-medium text-ink-300">
            More detail (optional)
          </span>
          <span className="text-ink-400">{showMore ? "−" : "+"}</span>
        </button>

        {showMore ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sleepHours" className="label">
                  Sleep (hrs)
                </label>
                <input
                  id="sleepHours"
                  name="sleepHours"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min={0}
                  max={24}
                  placeholder="7.5"
                  defaultValue={entry?.sleepHours ?? ""}
                  className="input"
                />
                {errors.sleepHours ? (
                  <p className="field-error">{errors.sleepHours}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="hydrationMl" className="label">
                  Water (ml)
                </label>
                <input
                  id="hydrationMl"
                  name="hydrationMl"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="2000"
                  defaultValue={entry?.hydrationMl ?? ""}
                  className="input"
                />
                {errors.hydrationMl ? (
                  <p className="field-error">{errors.hydrationMl}</p>
                ) : null}
              </div>
            </div>

            <div>
              <label htmlFor="rpe" className="label">
                Session RPE (1–10)
              </label>
              <input
                id="rpe"
                name="rpe"
                type="number"
                inputMode="numeric"
                min={1}
                max={10}
                placeholder="7"
                defaultValue={entry?.rpe ?? ""}
                className="input"
              />
              {errors.rpe ? <p className="field-error">{errors.rpe}</p> : null}
            </div>

            <div>
              <span className="label">Where it hurt</span>
              <div className="flex flex-wrap gap-2">
                {SORENESS_AREAS.map((area) => {
                  const selected = soreness.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleSoreness(area)}
                      aria-pressed={selected}
                      className={`min-h-10 rounded-full border px-3.5 text-sm font-medium transition active:scale-[0.98] ${
                        selected
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-ink-600 bg-ink-800 text-ink-300"
                      }`}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {fields.length > 0 ? (
        <div className="card space-y-5">
          <p className="text-sm font-medium text-ink-300">Your fields</p>
          {fields.map((field) => (
            <CustomField
              key={field.id}
              field={field}
              defaultValue={entry?.custom?.[field.key]}
            />
          ))}
        </div>
      ) : null}

      <div className="card">
        <label htmlFor="comments" className="label">
          Comments
        </label>
        <textarea
          id="comments"
          name="comments"
          rows={4}
          placeholder="Tight hamstrings walking downstairs, slept badly…"
          defaultValue={entry?.comments ?? ""}
          className="input resize-y"
        />
        {errors.comments ? <p className="field-error">{errors.comments}</p> : null}
      </div>

      {state.error ? (
        <p role="alert" className="field-error text-center">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Link href="/" className="btn-secondary flex-1">
          Cancel
        </Link>
        <div className="flex-1">
          <SubmitButton
            label={entry ? "Save changes" : "Save entry"}
            busyLabel="Saving…"
          />
        </div>
      </div>
    </form>
  );
}

function CustomField({
  field,
  defaultValue,
}: {
  field: FieldDefinition;
  defaultValue: unknown;
}) {
  const name = `custom.${field.key}`;
  const value = defaultValue == null ? "" : String(defaultValue);
  const label = field.unit ? `${field.label} (${field.unit})` : field.label;

  if (field.type === "select") {
    return (
      <div>
        <label htmlFor={name} className="label">
          {label}
        </label>
        <select id={name} name={name} defaultValue={value} className="input">
          <option value="">—</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={field.type === "text" ? "text" : "number"}
        inputMode={field.type === "text" ? "text" : "decimal"}
        min={field.type === "scale" ? 0 : undefined}
        max={field.type === "scale" ? 10 : undefined}
        defaultValue={value}
        className="input"
      />
    </div>
  );
}
