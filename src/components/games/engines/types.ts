import { GamePrompt, GameSession } from '@/src/services/gameService';

export interface GameEngineProps {
  session: GameSession | null;
  prompts: GamePrompt[];
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  submitAnswer: (answer: string) => void;
  myAnswer: string | null;
  partnerAnswer: string | null;
  isUser1: boolean;
  hasSeenTutorial: boolean;
  markTutorialSeen: () => Promise<void>;
  bondId: string;
  backgroundImage?: any;
  gameTypeSlug?: string;
}
