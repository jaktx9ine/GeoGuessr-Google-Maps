export interface LocationData {
  id: string;
  name: string;
  description: string;
  country: string;
  lat: number;
  lng: number;
  heading?: number;
  pitch?: number;
  zoom?: number;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
  category: string;
}

export interface Guess {
  round: number;
  targetLat: number;
  targetLng: number;
  guessedLat: number;
  guessedLng: number;
  distanceKm: number;
  score: number;
  locationName: string;
  isTimeout?: boolean;
}

export interface GameState {
  currentRound: number;
  totalScore: number;
  rounds: Guess[];
  gameMode: string;
  status: 'start' | 'playing' | 'guessed' | 'finished';
  currentLocation: LocationData | null;
  selectedGuessLatLng: { lat: number; lng: number } | null;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
  mode: string;
}
