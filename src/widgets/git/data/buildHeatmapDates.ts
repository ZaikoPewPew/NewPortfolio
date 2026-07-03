import { GIT_HEATMAP_SIZE } from "./git.constants";

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Последние N календарных дней, заканчивая `endDate` (включительно). */
export function buildHeatmapDates(endDate = new Date()): string[] {
  const dates: string[] = [];

  for (let offset = GIT_HEATMAP_SIZE - 1; offset >= 0; offset -= 1) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - offset);
    dates.push(toIsoDate(date));
  }

  return dates;
}
