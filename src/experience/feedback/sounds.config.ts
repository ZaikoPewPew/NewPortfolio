export type SoundId = "tap" | "hover" | "hoverCard" | "hoverEmployer" | "paper" | "bubble" | "swipe";

export interface SoundConfig {
  id: SoundId;
  path: string;
  volume: number;
}

export const sounds: SoundConfig[] = [
  { id: "tap", path: "/audio/tap_new.mp3", volume: 0.4 },
  { id: "hover", path: "/audio/hover_new.mp3", volume: 0.35 },
  { id: "hoverCard", path: "/audio/hover_card_new.mp3", volume: 0.35 },
  { id: "hoverEmployer", path: "/audio/8bit_hover_new.mp3", volume: 0.35 },
  { id: "paper", path: "/audio/paper_new.mp3", volume: 0.35 },
  { id: "bubble", path: "/audio/buble_hover_new.mp3", volume: 0.35 },
  { id: "swipe", path: "/audio/swipe_new.mp3", volume: 0.3 },
];

export const soundMap = Object.fromEntries(
  sounds.map((s) => [s.id, s])
) as Record<SoundId, SoundConfig>;
