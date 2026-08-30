import type { Intensity } from "@/lib/validation";

export type ParsedEntry = {
  sessionDate: string | null;
  painRating: number | null;
  steps: number | null;
  carbsG: number | null;
  intensity: Intensity | null;
  sleepHours: number | null;
  hydrationMl: number | null;
  comments: string | null;
};

export type ParsedRow = {
  entry: ParsedEntry;
  errors: string[];
};

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (year < 100) year += 2000;
  const date = new Date(year, month - 1, day);
  // Rejects things like 31 February that silently roll over.
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * Handles the date formats people actually type: ISO, slash/dot separated
 * (day-first), and "13 Aug 2026" / "Aug 13 2026".
 */
function parseLooseDate(text: string): string | null {
  const iso = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return toIso(+iso[1], +iso[2], +iso[3]);

  const numeric = text.match(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})\b/);
  if (numeric) {
    let day = +numeric[1];
    let month = +numeric[2];
    // Day-first by default; flip only when that reading is impossible.
    if (day <= 12 && month > 12) [day, month] = [month, day];
    return toIso(+numeric[3], month, day);
  }

  const dayFirst = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})\.?\s*(\d{4})?/i);
  if (dayFirst) {
    const month = MONTHS[dayFirst[2].slice(0, 3).toLowerCase()];
    if (month) {
      return toIso(dayFirst[3] ? +dayFirst[3] : new Date().getFullYear(), month, +dayFirst[1]);
    }
  }

  const monthFirst = text.match(/\b([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?/i);
  if (monthFirst) {
    const month = MONTHS[monthFirst[1].slice(0, 3).toLowerCase()];
    if (month) {
      return toIso(monthFirst[3] ? +monthFirst[3] : new Date().getFullYear(), month, +monthFirst[2]);
    }
  }

  return null;
}

function num(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function parseIntensity(text: string): Intensity | null {
  const match = text.match(/\b(low|med(?:ium)?|high)\b/i);
  if (!match) return null;
  const word = match[1].toLowerCase();
  if (word.startsWith("med")) return "medium";
  return word as Intensity;
}

/** Pulls one entry out of a free-text note block. */
function parseNoteBlock(block: string): ParsedRow {
  const text = block.trim();

  const entry: ParsedEntry = {
    sessionDate: parseLooseDate(text),
    painRating: num(text, /pain[^\d\n]{0,15}(\d{1,2})/i),
    steps: num(text, /steps?[^\d\n]{0,15}([\d,]+)/i),
    carbsG: num(text, /carb\w*[^\d\n]{0,15}([\d,]+)/i),
    intensity: parseIntensity(text),
    sleepHours: num(text, /sleep[^\d\n]{0,15}([\d.]+)/i),
    hydrationMl: num(text, /(?:water|hydration)[^\d\n]{0,15}([\d,]+)/i),
    comments: null,
  };

  // Anything after an explicit comment marker, else the leftover prose lines.
  const marked = text.match(/(?:comments?|notes?)\s*[:\-]\s*([\s\S]+)/i);
  if (marked) {
    entry.comments = marked[1].trim();
  } else {
    const leftovers = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.length > 0 &&
          !/^\W*(pain|steps?|carb|intensity|sleep|water|hydration|date)\b/i.test(line) &&
          !parseLooseDate(line),
      );
    entry.comments = leftovers.length > 0 ? leftovers.join(" ") : null;
  }

  return { entry, errors: validate(entry) };
}

function validate(entry: ParsedEntry): string[] {
  const errors: string[] = [];
  if (!entry.sessionDate) errors.push("No date found");
  if (entry.painRating == null) errors.push("No pain rating found");
  else if (entry.painRating < 0 || entry.painRating > 10) errors.push("Pain must be 0–10");
  if (entry.sleepHours != null && entry.sleepHours > 24) errors.push("Sleep looks wrong");
  return errors;
}

/** Minimal RFC-4180-ish splitter that respects quoted commas. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else quoted = false;
      } else current += char;
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

const HEADER_ALIASES: Record<string, keyof ParsedEntry> = {
  date: "sessionDate",
  sessiondate: "sessionDate",
  day: "sessionDate",
  pain: "painRating",
  painrating: "painRating",
  steps: "steps",
  carbs: "carbsG",
  carbsg: "carbsG",
  carbohydrates: "carbsG",
  intensity: "intensity",
  sleep: "sleepHours",
  sleephours: "sleepHours",
  water: "hydrationMl",
  hydration: "hydrationMl",
  hydrationml: "hydrationMl",
  comments: "comments",
  comment: "comments",
  notes: "comments",
};

function normaliseHeader(cell: string): keyof ParsedEntry | null {
  const key = cell.toLowerCase().replace(/[^a-z]/g, "");
  return HEADER_ALIASES[key] ?? null;
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headers = splitCsvLine(lines[0]).map(normaliseHeader);

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const entry: ParsedEntry = {
      sessionDate: null, painRating: null, steps: null, carbsG: null,
      intensity: null, sleepHours: null, hydrationMl: null, comments: null,
    };

    headers.forEach((header, index) => {
      const raw = cells[index]?.trim();
      if (!header || !raw) return;

      switch (header) {
        case "sessionDate":
          entry.sessionDate = parseLooseDate(raw);
          break;
        case "intensity":
          entry.intensity = parseIntensity(raw);
          break;
        case "comments":
          entry.comments = raw;
          break;
        case "sleepHours": {
          const value = Number(raw.replace(/,/g, ""));
          entry.sleepHours = Number.isFinite(value) ? value : null;
          break;
        }
        default: {
          const value = Number(raw.replace(/[^\d.-]/g, ""));
          if (Number.isFinite(value)) entry[header] = value as never;
        }
      }
    });

    return { entry, errors: validate(entry) };
  });
}

function looksLikeCsv(text: string): boolean {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
  if (!firstLine.includes(",")) return false;
  const recognised = splitCsvLine(firstLine).filter((cell) => normaliseHeader(cell));
  return recognised.length >= 2;
}

/**
 * Accepts either a CSV with a header row, or free-form note blocks separated
 * by blank lines.
 */
export function parseNotes(text: string): ParsedRow[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (looksLikeCsv(trimmed)) return parseCsv(trimmed);

  return trimmed
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(parseNoteBlock);
}

export function isImportable(row: ParsedRow): boolean {
  return row.errors.length === 0;
}

export const SAMPLE_INPUT = `13 Aug 2026
Pain: 4/10
Steps: 9200
Carbs: 260g
Intensity: high
Comments: hamstrings tight on stairs

6 Aug 2026
Pain: 2
Steps: 7100
Carbs: 310
Intensity: medium
Slept well, felt fine`;
