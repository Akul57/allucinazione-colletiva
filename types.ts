
export enum Role {
  GOOD = 'BUONO',
  HALLUCINATED = 'ALLUCINATO',
  IMPOSTOR = 'CATTIVO',
}

export interface Player {
  id: string;
  name: string;
  role: Role;
  assignedWord: string | null; // Null for Impostor
  isRevealed: boolean;
  isAlive: boolean;
}

export interface GameData {
  category: string;
  normalWord: string;
  similarWord: string;
}

export interface SavedGroup {
  id: string;
  name: string;
  playerNames: string[];
}

export enum GamePhase {
  SETUP = 'SETUP',
  LOADING = 'LOADING',
  PLAYER_REGISTRATION = 'PLAYER_REGISTRATION',
  CARD_REVEAL = 'CARD_REVEAL',
  GAME_READY = 'GAME_READY',
  PLAYING = 'PLAYING', // Main status screen
  VOTING_INTRO = 'VOTING_INTRO', // "Pass phone to X"
  VOTING_TURN = 'VOTING_TURN', // X selects who to eliminate
  RUNOFF_INTRO = 'RUNOFF_INTRO', // "It's a tie!"
  ROUND_RESULTS = 'ROUND_RESULTS', // Show who died
  GAME_OVER = 'GAME_OVER',
}

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 12;
