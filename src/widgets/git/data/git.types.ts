export type GitContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface GitContributionDay {
  level: GitContributionLevel;
}

export interface GitProfile {
  username: string;
  profileUrl: string;
  heatmap: GitContributionDay[];
}
