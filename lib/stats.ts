/**
 * Small statistics helpers for the insights page. Deliberately plain functions
 * so they can run on the server and stay easy to reason about.
 */

/** Pearson correlation coefficient, or null when there is too little data. */
export function pearson(pairs: Array<[number, number]>): number | null {
  const n = pairs.length;
  if (n < 3) return null;

  let sumX = 0;
  let sumY = 0;
  for (const [x, y] of pairs) {
    sumX += x;
    sumY += y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;
  for (const [x, y] of pairs) {
    const dx = x - meanX;
    const dy = y - meanY;
    covariance += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }

  const denominator = Math.sqrt(varianceX * varianceY);
  // Zero variance means the factor never changed — no relationship to measure.
  if (denominator === 0) return null;

  return covariance / denominator;
}

export function describeCorrelation(r: number): string {
  const magnitude = Math.abs(r);
  const strength =
    magnitude >= 0.7
      ? "Strong"
      : magnitude >= 0.4
        ? "Moderate"
        : magnitude >= 0.2
          ? "Weak"
          : "No real";

  if (strength === "No real") return "No real link";
  return `${strength} link — more of this, ${r > 0 ? "more" : "less"} pain`;
}

/** Trailing average over the last `window` values, used to smooth the trend. */
export function rollingAverage(
  values: number[],
  window: number,
): Array<number | null> {
  return values.map((_, index) => {
    if (index < window - 1) return null;
    const slice = values.slice(index - window + 1, index + 1);
    return slice.reduce((total, value) => total + value, 0) / slice.length;
  });
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function round(value: number, places = 1): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/** Groups numeric values into readable buckets for the scatter summaries. */
export function bucketAverages(
  pairs: Array<[number, number]>,
  bucketSize: number,
): Array<{ bucket: string; average: number; count: number }> {
  const groups = new Map<number, number[]>();

  for (const [x, y] of pairs) {
    const bucket = Math.floor(x / bucketSize) * bucketSize;
    const existing = groups.get(bucket);
    if (existing) existing.push(y);
    else groups.set(bucket, [y]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([bucket, values]) => ({
      bucket: `${bucket.toLocaleString()}–${(bucket + bucketSize).toLocaleString()}`,
      average: round(mean(values)),
      count: values.length,
    }));
}
