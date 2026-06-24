import type { SoundId } from "./sounds.config";
import type { HapticId } from "./haptics.config";
import { audioEngine } from "../audio/AudioEngine";
import { userPreferences } from "../preferences/UserPreferences";
import { hapticPatterns } from "./haptics.config";

export interface FeedbackEvent {
  sound?: SoundId;
  haptic?: HapticId;
  source?: string;
}

let hoverDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function vibrate(pattern: number | number[]) {
  if (!userPreferences.get().haptics) return;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export const feedback = {
  emit(event: FeedbackEvent) {
    if (event.sound && userPreferences.get().sound) {
      if (event.sound === "hoverSoft") {
        if (hoverDebounceTimer) return;
        hoverDebounceTimer = setTimeout(() => {
          hoverDebounceTimer = null;
        }, 300);
      }
      void audioEngine.play(event.sound);
    }

    if (event.haptic) {
      vibrate(hapticPatterns[event.haptic]);
    }
  },

  unlock() {
    audioEngine.unlock();
  },
};
