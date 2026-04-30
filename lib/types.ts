export enum GameMode {
  SOLO = 'solo',
  VERSUS = 'versus',
}

export interface Top10Item {
  rank: number;
  name: string;
  value: string;
  aliases?: string[]; // Alternative names or keywords
  revealed: boolean;
  revealedBy?: string; // Player ID in versus mode
}

export interface QuizTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  items: Top10Item[];
}

export interface GameState {
  mode: GameMode;
  topic: QuizTopic | null;
  score: {
    player1: number;
    player2: number;
  };
  currentPlayer: 'player1' | 'player2';
  isGameOver: boolean;
  attempts: number;
  lastGuessResult: 'hit' | 'miss' | null;
}
