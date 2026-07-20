/**
 * Wash / hover gradient presets for case title links on home.
 * Add entries here — each interactive case picks one via `pickCaseGradient(slug)`.
 */
export type CaseGradientPreset = {
  id: string;
  label: string;
  gradientFrom: string;
  gradientTo: string;
  washTint: string;
  gradientAngle: number;
};

export const caseGradientPresets: readonly CaseGradientPreset[] = [
  {
    id: "crimson",
    label: "Crimson",
    gradientFrom: "#1a0d0d",
    gradientTo: "#e8402f",
    washTint: "#e8402f",
    gradientAngle: 130,
  },
  {
    id: "burnt-orange",
    label: "Burnt Orange",
    gradientFrom: "#1a1108",
    gradientTo: "#e8752f",
    washTint: "#e8752f",
    gradientAngle: 125,
  },
  {
    id: "amber-gold",
    label: "Amber Gold",
    gradientFrom: "#1a1508",
    gradientTo: "#e0ab3f",
    washTint: "#e0ab3f",
    gradientAngle: 120,
  },
  {
    id: "forest",
    label: "Forest",
    gradientFrom: "#0a140d",
    gradientTo: "#3f9a5c",
    washTint: "#3f9a5c",
    gradientAngle: 135,
  },
  {
    id: "acid-lime",
    label: "Acid Lime",
    gradientFrom: "#0d1408",
    gradientTo: "#baff29",
    washTint: "#baff29",
    gradientAngle: 140,
  },
  {
    id: "smoky-teal",
    label: "Smoky Teal",
    gradientFrom: "#08141a",
    gradientTo: "#2dd4bf",
    washTint: "#2dd4bf",
    gradientAngle: 130,
  },
  {
    id: "sapphire",
    label: "Sapphire",
    gradientFrom: "#0a0d1a",
    gradientTo: "#3d6fd9",
    washTint: "#3d6fd9",
    gradientAngle: 135,
  },
  {
    id: "electric-violet",
    label: "Electric Violet",
    gradientFrom: "#12081a",
    gradientTo: "#8b5cf6",
    washTint: "#8b5cf6",
    gradientAngle: 130,
  },
  {
    id: "hot-magenta",
    label: "Hot Magenta",
    gradientFrom: "#1a081a",
    gradientTo: "#e94560",
    washTint: "#e94560",
    gradientAngle: 145,
  },
  {
    id: "merlot",
    label: "Merlot",
    gradientFrom: "#140a0d",
    gradientTo: "#8f2d42",
    washTint: "#8f2d42",
    gradientAngle: 130,
  },
  {
    id: "chrome-steel",
    label: "Chrome/Steel",
    gradientFrom: "#0d0d0e",
    gradientTo: "#9aa3a8",
    washTint: "#9aa3a8",
    gradientAngle: 120,
  },
  {
    id: "dusty-rose",
    label: "Dusty Rose",
    gradientFrom: "#150d10",
    gradientTo: "#c98a92",
    washTint: "#c98a92",
    gradientAngle: 135,
  },
];

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Stable pick from the list (same slug → same preset; looks random across cases). */
export function pickCaseGradient(seed: string): CaseGradientPreset {
  const presets = caseGradientPresets;
  if (presets.length === 0) {
    return {
      id: "fallback",
      label: "Fallback",
      gradientFrom: "#0d0d0e",
      gradientTo: "#9aa3a8",
      washTint: "#9aa3a8",
      gradientAngle: 120,
    };
  }
  return presets[hashSeed(seed) % presets.length]!;
}
