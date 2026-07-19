/** Compact metric label: 1122 → "1.1k", 1981 → "2k", 22700 → "22.7k". */
export function formatCompactCount(count: number): string {
  if (!Number.isFinite(count) || count < 0) {
    throw new Error(`Invalid count: ${count}`);
  }

  if (count < 1000) {
    return String(Math.round(count));
  }

  const thousands = count / 1000;
  const label = thousands.toFixed(1).replace(/\.0$/, "");
  return `${label}k`;
}

/** Parse "22.7K" / "5.85K" / "117" into a number. */
export function parseCompactCountLabel(label: string): number {
  const match = label.trim().match(/^([\d]+(?:[.,]\d+)?)\s*([KkMm])?$/);
  if (!match) {
    throw new Error(`Cannot parse compact count "${label}"`);
  }

  const value = Number.parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid compact count "${label}"`);
  }

  const suffix = match[2]?.toLowerCase();
  if (suffix === "k") return Math.round(value * 1000);
  if (suffix === "m") return Math.round(value * 1_000_000);
  return Math.round(value);
}
