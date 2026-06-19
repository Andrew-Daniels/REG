import type { Difficulty } from '../core/scoring';
import type { InfoFieldKey, ListingStatus } from '../core/listing';
import { PRESET_INFO } from '../core/listing';

export interface GameSettings {
  difficulty: Difficulty;
  sharedFields: InfoFieldKey[];
  statuses: ListingStatus[];
  /** undefined => include the "very very past". */
  recencyDays?: number;
  roundCount: number;
  timerSeconds: number;
  players: string[];
}

export function presetSettings(difficulty: Difficulty): GameSettings {
  return {
    difficulty,
    sharedFields: [...PRESET_INFO[difficulty]],
    statuses: ['closed'],
    recencyDays: 35,
    roundCount: 5,
    timerSeconds: 30,
    players: ['Player 1'],
  };
}
