export type HapticId = "light" | "medium";

export const hapticPatterns: Record<HapticId, number | number[]> = {
  light: 10,
  medium: [20, 10, 20],
};
