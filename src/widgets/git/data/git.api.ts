import { siteConfig } from "../../../config/site.config";
import { buildHeatmapDates } from "./buildHeatmapDates";
import { GIT_HEATMAP_SIZE } from "./git.constants";
import { getMockGitProfile } from "./git.mock";
import type {
  GitContributionDay,
  GitContributionLevel,
  GitProfile,
} from "./git.types";

export { GIT_HEATMAP_COLS, GIT_HEATMAP_ROWS, GIT_HEATMAP_SIZE } from "./git.constants";

interface ContributionsResponse {
  total?: {
    lastYear?: number;
  };
  contributions: Array<{
    date: string;
    count: number;
    level: number;
  }>;
}

const CONTRIBUTIONS_API = "https://github-contributions-api.jogruber.de/v4";

function getGithubUsername(): string {
  const url = siteConfig.social.github;
  return url.replace(/\/$/, "").split("/").pop() ?? "ZaikoPewPew";
}

function clampLevel(level: number): GitContributionLevel {
  const n = Math.max(0, Math.min(4, Math.round(level)));
  return n as GitContributionLevel;
}

/** Последние 108 дней → сетка 18×6 (row-major, как в CSS grid). */
export function mapContributionsToHeatmap(
  contributions: ContributionsResponse["contributions"],
): GitContributionDay[] {
  const recent = contributions.slice(-GIT_HEATMAP_SIZE);

  if (recent.length === 0) {
    return buildHeatmapDates().map((date) => ({ date, level: 0 }));
  }

  const endDate = new Date(recent[recent.length - 1].date);
  const dates = buildHeatmapDates(endDate);
  const byDate = new Map(
    recent.map((day) => [day.date, clampLevel(day.level)] as const),
  );

  return dates.map((date) => ({
    date,
    level: byDate.get(date) ?? 0,
  }));
}

/** Live contributions for the last year (`?y=last`). Safe in browser (CORS *). */
export async function fetchGitContributions(
  username: string,
): Promise<Pick<GitProfile, "heatmap" | "commitsPerYear">> {
  const response = await fetch(`${CONTRIBUTIONS_API}/${username}?y=last`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`GitHub contributions API: ${response.status}`);
  }

  const data = (await response.json()) as ContributionsResponse;
  const commitsPerYear =
    data.total?.lastYear ??
    data.contributions.reduce((sum, day) => sum + day.count, 0);

  return {
    heatmap: mapContributionsToHeatmap(data.contributions),
    commitsPerYear,
  };
}

export async function getApiGitProfile(): Promise<GitProfile> {
  const username = getGithubUsername();

  try {
    const live = await fetchGitContributions(username);

    return {
      username: `@${username}`,
      profileUrl: siteConfig.social.github,
      ...live,
    };
  } catch (error) {
    console.warn("[git-widget] API failed, using mock:", error);
    return getMockGitProfile();
  }
}
