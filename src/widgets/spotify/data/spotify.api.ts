import type { SpotifyPlayback } from "./spotify.types";

export async function getApiSpotifyPlayback(): Promise<SpotifyPlayback> {
  throw new Error("Spotify API not implemented — используй tracks.json");
}
