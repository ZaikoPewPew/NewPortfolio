import type { GitProfile } from "./git.types";

function randomLevel(): 0 | 1 | 2 | 3 | 4 {
  const levels = [0, 1, 2, 3, 4] as const;
  return levels[Math.floor(Math.random() * levels.length)]!;
}

export function getMockGitProfile(): GitProfile {
  return {
    username: "@zaikoopewpew",
    totalContributions: 190,
    heatmap: Array.from({ length: 52 }, () => ({ level: randomLevel() })),
  };
}
