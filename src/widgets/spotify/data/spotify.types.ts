export interface SpotifyTrack {
  title: string;
  artist: string;
}

export interface SpotifyPlayback {
  tracks: SpotifyTrack[];
  currentIndex: number;
  isPlaying: boolean;
}
