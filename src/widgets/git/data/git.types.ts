export interface GitContributionDay {
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GitProfile {
  username: string;
  totalContributions: number;
  heatmap: GitContributionDay[];
}
