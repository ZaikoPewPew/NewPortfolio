import { siteConfig } from "../../../config/site.config";
import { buildHeatmapDates } from "./buildHeatmapDates";
import type { GitContributionLevel, GitProfile } from "./git.types";

const githubUsername =
  siteConfig.social.github.replace(/\/$/, "").split("/").pop() ??
  "ZaikoPewPew";

/** Статичная heatmap из макета Figma (18×6, hover-состояние). */
const HEATMAP_LEVELS: GitContributionLevel[] = [
  1, 1, 0, 1, 3, 4, 0, 1, 1, 1, 0, 2, 1, 1, 0, 2, 2, 1,
  2, 1, 2, 1, 0, 1, 1, 1, 1, 1, 2, 0, 1, 1, 4, 1, 4, 1,
  2, 0, 0, 1, 4, 2, 0, 1, 1, 2, 1, 4, 4, 0, 1, 0, 1, 2,
  2, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 1, 0, 2, 1, 1, 0,
  0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 2, 0, 0, 0, 2, 1, 1, 3,
  0, 1, 3, 1, 3, 1, 2, 1, 2, 2, 3, 2, 3, 3, 1, 2, 1, 2,
];

const MOCK_DATES = buildHeatmapDates();

export function getMockGitProfile(): GitProfile {
  return {
    username: `@${githubUsername}`,
    profileUrl: siteConfig.social.github,
    heatmap: HEATMAP_LEVELS.map((level, index) => ({
      level,
      date: MOCK_DATES[index],
    })),
  };
}
