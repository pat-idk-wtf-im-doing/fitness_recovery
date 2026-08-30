import Link from "next/link";

import { formatIsoDate } from "@/lib/dates";
import type { Entry } from "@/lib/db/schema";
import {
  INTENSITY_LABELS,
  SESSION_TYPE_LABELS,
  type Intensity,
  type SessionType,
} from "@/lib/validation";

function painTone(value: number): string {
  if (value <= 3) return "bg-green-500/15 text-green-400";
  if (value <= 6) return "bg-amber-500/15 text-amber-400";
  return "bg-red-500/15 text-red-400";
}

function sessionTone(type: SessionType): string {
  return type === "training"
    ? "bg-accent/15 text-accent"
    : "bg-ink-700 text-ink-300";
}

export function EntryCard({ entry }: { entry: Entry }) {
  const stats = [
    entry.steps != null ? `${entry.steps.toLocaleString()} steps` : null,
    entry.carbsG != null ? `${entry.carbsG}g carbs` : null,
    entry.sleepHours != null ? `${entry.sleepHours}h sleep` : null,
  ].filter(Boolean);

  return (
    <Link
      href={`/entry/${entry.id}`}
      className="card block transition hover:border-ink-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">
              {formatIsoDate(entry.sessionDate, {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            {entry.sessionType ? (
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-semibold ${sessionTone(entry.sessionType as SessionType)}`}
              >
                {SESSION_TYPE_LABELS[entry.sessionType as SessionType]}
              </span>
            ) : null}
          </div>
          {entry.intensity ? (
            <p className="mt-0.5 text-sm text-ink-400">
              {INTENSITY_LABELS[entry.intensity as Intensity]} intensity
            </p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums ${painTone(entry.painRating)}`}
        >
          {entry.painRating}/10
        </span>
      </div>

      {stats.length > 0 ? (
        <p className="mt-2.5 text-sm text-ink-400">{stats.join(" · ")}</p>
      ) : null}

      {entry.sorenessAreas?.length ? (
        <p className="mt-2 text-sm text-ink-300">
          {entry.sorenessAreas.join(", ")}
        </p>
      ) : null}

      {entry.comments ? (
        <p className="mt-2 line-clamp-2 text-sm text-ink-400 italic">
          “{entry.comments}”
        </p>
      ) : null}
    </Link>
  );
}
