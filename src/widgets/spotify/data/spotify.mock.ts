import type { SpotifyPlayback } from "./spotify.types";

export function getMockSpotifyPlayback(): SpotifyPlayback {
  return {
    tracks: [
      { title: "Blinding Lights", artist: "The Weeknd" },
      { title: "Starboy", artist: "The Weeknd" },
      { title: "Save Your Tears", artist: "The Weeknd" },
    ],
    currentIndex: 0,
    isPlaying: false,
    profileUrl: "https://open.spotify.com",
  };
}
