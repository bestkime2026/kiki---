export type GameMode = 'classic' | 'time' | 'ai_battle';

export interface Block {
  id: string;
  value: number;
  row: number;
  col: number;
}

export interface GameState {
  grid: Block[];
  target: number;
  score: number;
  aiScore: number;
  selectedIds: string[];
  gameOver: boolean;
  mode: GameMode;
  timeLeft: number;
  level: number;
}
