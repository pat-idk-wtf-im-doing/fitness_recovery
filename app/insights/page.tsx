import {
  FactorScatterChart,
  PainByIntensityChart,
  PainTrendChart,
  type IntensityPoint,
  type ScatterPoint,
  type TrendPoint,
} from "@/components/Charts";
import { formatIsoDate } from "@/lib/dates";
import type { Entry, FieldDefinition } from "@/lib/db/schema";
import { listEntries, listFieldDefinitions } from "@/lib/queries";
import { describeCorrelation, mean, pearson, rollingAverage, round } from "@/lib/stats";
import { INTENSITY_LABELS, INTENSITY_VALUES, type Intensity } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Below this many sessions the numbers are noise, so we say so plainly. */
const CONFIDENCE_THRESHOLD = 8;

type Factor = {
  label: string;
  value: (entry: Entry) => number | null;
};

function buildFactors(fields: FieldDefinition[]): Factor[] {
  const builtIn: Factor[] = [
    { label: "Steps", value: (entry) => entry.steps },
    { label: "Carbs (g)", value: (entry) => entry.carbsG },
    {
      label: "Sleep (hrs)",
      value: (entry) => (entry.sleepHours == null ? null : Number(entry.sleepHours)),
    },
    { label: "Water (ml)", value: (entry) => entry.hydrationMl },
    {
      label: "Intensity",
      value: (entry) =>
        entry.intensity ? INTENSITY_VALUES.indexOf(entry.intensity as Intensity) + 1 : null,
    },
  ];

  const custom: Factor[] = fields
    .filter((field) => field.type === "number" || field.type === "scale")
    .map((field) => ({
      label: field.unit ? `${field.label} (${field.unit})` : field.label,
      value: (entry: Entry) => {
        const raw = entry.custom?.[field.key];
        const parsed = Number(raw);
        return raw == null || Number.isNaN(parsed) ? null : parsed;
      },
    }));

  return [...builtIn, ...custom];
}

function formatShortDate(iso: string): string {
  return formatIsoDate(iso, { day: "numeric", month: "short" });
}

export default async function InsightsPage() {
  const [entries, fields] = await Promise.all([
    listEntries(),
    listFieldDefinitions(),
  ]);

  if (entries.length === 0) {
    return (
      <main>
        <h1 className="mb-5 text-2xl font-bold tracking-tight">Insights</h1>
        <div className="card text-center text-ink-400">
          Log a few sessions and your patterns will show up here.
        </div>
      </main>
    );
  }

  // listEntries() is newest-first; charts read left to right, oldest-first.
  const chronological = [...entries].reverse();
  const painValues = chronological.map((entry) => entry.painRating);
  const averages = rollingAverage(painValues, 4);

  const trend: TrendPoint[] = chronological.map((entry, index) => ({
    date: formatShortDate(entry.sessionDate),
    pain: entry.painRating,
    average: averages[index] == null ? null : round(averages[index]!),
  }));

  const byIntensity: IntensityPoint[] = INTENSITY_VALUES.map((value) => {
    const matching = entries.filter((entry) => entry.intensity === value);
    return {
      intensity: INTENSITY_LABELS[value],
      average: round(mean(matching.map((entry) => entry.painRating))),
      count: matching.length,
    };
  }).filter((point) => point.count > 0);

  const factors = buildFactors(fields);

  const correlations = factors
    .map((factor) => {
      const pairs = entries
        .map((entry): [number, number] | null => {
          const value = factor.value(entry);
          return value == null ? null : [value, entry.painRating];
        })
        .filter((pair): pair is [number, number] => pair !== null);

      return { label: factor.label, r: pearson(pairs), count: pairs.length };
    })
    .filter((row): row is { label: string; r: number; count: number } => row.r !== null)
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

  const scatterFor = (pick: (entry: Entry) => number | null): ScatterPoint[] =>
    entries
      .map((entry) => {
        const value = pick(entry);
        return value == null ? null : { x: value, y: entry.painRating };
      })
      .filter((point): point is ScatterPoint => point !== null);

  const carbsPoints = scatterFor((entry) => entry.carbsG);
  const stepsPoints = scatterFor((entry) => entry.steps);
  const lowData = entries.length < CONFIDENCE_THRESHOLD;

  return (
    <main className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
        <p className="text-sm text-ink-400">
          Based on {entries.length} session{entries.length === 1 ? "" : "s"}.
        </p>
      </header>

      {lowData ? (
        <div className="rounded-2xl border border-amber-900/50 bg-amber-950/25 p-4 text-sm text-amber-300">
          Fewer than {CONFIDENCE_THRESHOLD} sessions logged — treat everything
          below as a hint, not a finding.
        </div>
      ) : null}

      <section className="card">
        <h2 className="mb-3 font-semibold">Pain over time</h2>
        <PainTrendChart data={trend} />
        <p className="mt-2 text-xs text-ink-400">
          Green is each session, amber is the 4-session average.
        </p>
      </section>

      {byIntensity.length > 0 ? (
        <section className="card">
          <h2 className="mb-3 font-semibold">Average pain by intensity</h2>
          <PainByIntensityChart data={byIntensity} />
          <p className="mt-2 text-xs text-ink-400">
            {byIntensity
              .map((point) => `${point.intensity}: ${point.count}`)
              .join(" · ")}{" "}
            sessions
          </p>
        </section>
      ) : null}

      {correlations.length > 0 ? (
        <section className="card">
          <h2 className="mb-1 font-semibold">What tracks with your pain</h2>
          <p className="mb-3 text-xs text-ink-400">
            Correlation is not causation — use this to decide what to test, not
            what to conclude.
          </p>
          <ul className="divide-y divide-ink-700">
            {correlations.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-medium">{row.label}</p>
                  <p className="text-sm text-ink-400">
                    {describeCorrelation(row.r)} · {row.count} sessions
                  </p>
                </div>
                <span
                  className={`shrink-0 tabular-nums font-semibold ${
                    Math.abs(row.r) < 0.2
                      ? "text-ink-400"
                      : row.r > 0
                        ? "text-red-400"
                        : "text-green-400"
                  }`}
                >
                  {row.r > 0 ? "+" : ""}
                  {round(row.r, 2)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {carbsPoints.length >= 3 ? (
        <section className="card">
          <h2 className="mb-3 font-semibold">Carbs vs pain</h2>
          <FactorScatterChart data={carbsPoints} xLabel="Carbs (g)" />
        </section>
      ) : null}

      {stepsPoints.length >= 3 ? (
        <section className="card">
          <h2 className="mb-3 font-semibold">Steps vs pain</h2>
          <FactorScatterChart data={stepsPoints} xLabel="Steps" />
        </section>
      ) : null}
    </main>
  );
}
