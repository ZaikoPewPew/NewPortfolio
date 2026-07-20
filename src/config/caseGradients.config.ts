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
  {
    id: "cobalt",
    label: "Cobalt",
    gradientFrom: "#0a0f1a",
    gradientTo: "#1e5fd9",
    washTint: "#1e5fd9",
    gradientAngle: 130,
  },
  {
    id: "copper",
    label: "Copper",
    gradientFrom: "#180f08",
    gradientTo: "#c2703c",
    washTint: "#c2703c",
    gradientAngle: 125,
  },
  {
    id: "chartreuse",
    label: "Chartreuse",
    gradientFrom: "#0f1408",
    gradientTo: "#a8e62e",
    washTint: "#a8e62e",
    gradientAngle: 140,
  },
  {
    id: "coral-salmon",
    label: "Coral Salmon",
    gradientFrom: "#1a0e0d",
    gradientTo: "#ff7a5c",
    washTint: "#ff7a5c",
    gradientAngle: 135,
  },
  {
    id: "indigo",
    label: "Indigo",
    gradientFrom: "#0a0a1a",
    gradientTo: "#4b3f9e",
    washTint: "#4b3f9e",
    gradientAngle: 130,
  },
  {
    id: "olive-khaki",
    label: "Olive Khaki",
    gradientFrom: "#10120a",
    gradientTo: "#7a8450",
    washTint: "#7a8450",
    gradientAngle: 120,
  },
  {
    id: "mustard-brown",
    label: "Mustard Brown",
    gradientFrom: "#150f08",
    gradientTo: "#b8862e",
    washTint: "#b8862e",
    gradientAngle: 125,
  },
  {
    id: "periwinkle",
    label: "Periwinkle",
    gradientFrom: "#0e0e1a",
    gradientTo: "#8ea0f0",
    washTint: "#8ea0f0",
    gradientAngle: 135,
  },
  {
    id: "blood-orange",
    label: "Blood Orange",
    gradientFrom: "#180a08",
    gradientTo: "#d9451f",
    washTint: "#d9451f",
    gradientAngle: 130,
  },
  {
    id: "emerald",
    label: "Emerald",
    gradientFrom: "#081410",
    gradientTo: "#0fae6d",
    washTint: "#0fae6d",
    gradientAngle: 135,
  },
  {
    id: "plum-aubergine",
    label: "Plum Aubergine",
    gradientFrom: "#140a12",
    gradientTo: "#6b2f5e",
    washTint: "#6b2f5e",
    gradientAngle: 130,
  },
  {
    id: "neon-cyan",
    label: "Neon Cyan",
    gradientFrom: "#08141a",
    gradientTo: "#22d3ee",
    washTint: "#22d3ee",
    gradientAngle: 140,
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
