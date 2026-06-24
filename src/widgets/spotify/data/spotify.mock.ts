import type { SpotifyTrack } from "./spotify.types";

export function getMockTrack(): SpotifyTrack {
  return {
    title: "True colors",
    artist: "The Weeknd",
    isPlaying: true,
  };
}
