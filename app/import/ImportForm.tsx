"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  commitImport,
  previewImport,
  type ImportState,
} from "@/app/actions/import";
import { SAMPLE_INPUT } from "@/lib/parse-notes";

function SubmitButton({ label, busyLabel }: { label: string; busyLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? busyLabel : label}
    </button>
  );
}

export function ImportForm() {
  const [preview, previewAction] = useActionState<ImportState, FormData>(
    previewImport,
    {},
  );
  const [result, commitAction] = useActionState<ImportState, FormData>(
    commitImport,
    {},
  );
  const [text, setText] = useState("");

  if (result.imported) {
    return (
      <div className="card text-center">
        <p className="text-lg font-semibold text-accent">
          Imported {result.imported} session{result.imported === 1 ? "" : "s"}.
        </p>
        <Link href="/" className="btn-primary mt-4 w-full">
          View your log
        </Link>
      </div>
    );
  }

  const rows = preview.rows ?? [];
  const valid = rows.filter((row) => row.errors.length === 0);
  const invalid = rows.filter((row) => row.errors.length > 0);

  return (
    <div className="space-y-5">
      <form action={previewAction} className="card space-y-4">
        <div>
          <label htmlFor="text" className="label">
            Paste your notes or CSV
          </label>
          <textarea
            id="text"
            name="text"
            rows={10}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={SAMPLE_INPUT}
            className="input resize-y font-mono text-sm"
          />
          <p className="mt-1.5 text-xs text-ink-400">
            Separate each session with a blank line. A CSV with a header row
            works too.
          </p>
        </div>

        {preview.error ? (
          <p role="alert" className="field-error">
            {preview.error}
          </p>
        ) : null}
        {result.error ? (
          <p role="alert" className="field-error">
            {result.error}
          </p>
        ) : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setText(SAMPLE_INPUT)}
            className="btn-secondary flex-1"
          >
            Use sample
          </button>
          <div className="flex-1">
            <SubmitButton label="Preview" busyLabel="Reading…" />
          </div>
        </div>
      </form>

      {rows.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-semibold">
            Found {rows.length} entr{rows.length === 1 ? "y" : "ies"} —{" "}
            <span className="text-accent">{valid.length} ready</span>
            {invalid.length > 0 ? (
              <span className="text-red-400"> · {invalid.length} skipped</span>
            ) : null}
          </h2>

          {preview.duplicates && preview.duplicates.length > 0 ? (
            <p className="rounded-xl border border-amber-900/50 bg-amber-950/25 p-3 text-sm text-amber-300">
              {preview.duplicates.length} date
              {preview.duplicates.length === 1 ? " is" : "s are"} already logged
              and will be overwritten: {preview.duplicates.join(", ")}
            </p>
          ) : null}

          <div className="space-y-2">
            {rows.map((row, index) => (
              <div
                key={index}
                className={`card ${row.errors.length > 0 ? "border-red-900/50" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">
                    {row.entry.sessionDate ?? "No date"}
                  </p>
                  {row.entry.painRating != null ? (
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {row.entry.painRating}/10
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-ink-400">
                  {[
                    row.entry.steps != null ? `${row.entry.steps} steps` : null,
                    row.entry.carbsG != null ? `${row.entry.carbsG}g carbs` : null,
                    row.entry.intensity,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "No extra detail"}
                </p>
                {row.errors.length > 0 ? (
                  <p className="field-error">{row.errors.join(" · ")}</p>
                ) : null}
              </div>
            ))}
          </div>

          {valid.length > 0 ? (
            <form action={commitAction}>
              <input type="hidden" name="text" value={preview.text ?? ""} />
              <SubmitButton
                label={`Import ${valid.length} entr${valid.length === 1 ? "y" : "ies"}`}
                busyLabel="Importing…"
              />
            </form>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
