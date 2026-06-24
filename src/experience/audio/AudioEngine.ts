import type { SoundId } from "../feedback/sounds.config";
import { soundMap } from "../feedback/sounds.config";

class AudioEngine {
  private cache = new Map<SoundId, HTMLAudioElement>();
  private unlocked = false;

  unlock() {
    this.unlocked = true;
  }

  async play(id: SoundId) {
    if (!this.unlocked && typeof window !== "undefined") {
      this.unlocked = true;
    }

    const config = soundMap[id];
    if (!config) return;

    let audio = this.cache.get(id);
    if (!audio) {
      audio = new Audio(config.path);
      audio.volume = config.volume;
      this.cache.set(id, audio);
    }

    try {
      audio.currentTime = 0;
      await audio.play();
    } catch {
      // Missing audio file or autoplay blocked — silent fallback
    }
  }
}

export const audioEngine = new AudioEngine();
