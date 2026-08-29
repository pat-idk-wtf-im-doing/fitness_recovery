/** Today as `YYYY-MM-DD` in the viewer's local timezone (not UTC). */
export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Formats a `YYYY-MM-DD` string as a plain date — no timezone shifting. */
export function formatIsoDate(
  iso: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, options);
}
