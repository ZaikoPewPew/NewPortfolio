export type SoundId = "tap" | "hoverSoft" | "pageTransition";

export interface SoundConfig {
  id: SoundId;
  path: string;
  volume: number;
}

export const sounds: SoundConfig[] = [
  { id: "tap", path: "/audio/tap.mp3", volume: 0.4 },
  { id: "hoverSoft", path: "/audio/hover-soft.mp3", volume: 0.2 },
  { id: "pageTransition", path: "/audio/page-transition.mp3", volume: 0.3 },
];

export const soundMap = Object.fromEntries(
  sounds.map((s) => [s.id, s])
) as Record<SoundId, SoundConfig>;
