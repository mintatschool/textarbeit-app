
export interface SyllableWord {
  fullWord: string;
  syllables: string[];
}

export interface Stage {
  words: SyllableWord[];
  completedWordIndices: number[];
  targetWordIndex: number | null;
}

export type GameMode = 'both-empty' | 'left-filled' | 'right-filled';

export interface GameState {
  stages: Stage[];
  currentStageIndex: number;
  gameStatus: 'loading' | 'playing' | 'stage-complete' | 'finished';
  rewardImage?: string;
  pieceScale: number;
  wordsPerStage: number;
  gameMode: GameMode;
}
