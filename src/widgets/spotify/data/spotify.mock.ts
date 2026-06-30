import tracks from "./tracks.json";
import type { SpotifyPlayback, SpotifyTrack } from "./spotify.types";

export function getMockSpotifyPlayback(): SpotifyPlayback {
  return {
    tracks: tracks as SpotifyTrack[],
    currentIndex: 0,
    isPlaying: false,
  };
}
