import { useState, useCallback } from 'react';
import { Card } from '@/components/game/GameCard';

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  playerHands: Card[][];
  currentSequence: number;
  currentPlayer: number;
  playerCount: number;
  gamePhase: "modeSelect" | "setup" | "aiSetup" | "lobby" | "playing" | "finished";
  gameMode: "local" | "online" | "ai" | null;
  roomCode: string | null;
  winner: number | null;
}

export const useAIPlayers = () => {
  const [aiThinking, setAiThinking] = useState<boolean[]>([]);

  const makeAIMove = useCallback(async (
    gameState: GameState,
    aiPlayerIndex: number,
    onCardPlay: (card: Card, playerIndex: number) => void,
    onDrawCard: () => void
  ) => {
    if (gameState.gamePhase !== 'playing' || gameState.currentPlayer !== aiPlayerIndex) {
      return;
    }

    // Set AI as thinking
    setAiThinking(prev => {
      const newThinking = [...prev];
      newThinking[aiPlayerIndex] = true;
      return newThinking;
    });

    // AI plays instantly

    const aiHand = gameState.playerHands[aiPlayerIndex];
    const currentTop = gameState.currentSequence;
    
    // Find playable cards
    const playableCards = aiHand.filter(card => {
      if (card.type === 'wild') return true;
      if (!card.value) return false;
      const diff = Math.abs(card.value - currentTop);
      return diff === 7 || diff === 9 || card.value === currentTop;
    });

    if (playableCards.length > 0) {
      // AI strategy: prefer cards that match exactly, then wild cards, then others
      const exactMatches = playableCards.filter(card => card.value === currentTop);
      const wildCards = playableCards.filter(card => card.type === 'wild');
      const sevenNineCards = playableCards.filter(card => {
        if (!card.value) return false;
        const diff = Math.abs(card.value - currentTop);
        return diff === 7 || diff === 9;
      });

      let cardToPlay: Card;
      if (exactMatches.length > 0) {
        cardToPlay = exactMatches[0];
      } else if (sevenNineCards.length > 0) {
        cardToPlay = sevenNineCards[0];
      } else {
        cardToPlay = wildCards[0];
      }

      onCardPlay(cardToPlay, aiPlayerIndex);
    } else {
      // Draw a card if no playable cards
      onDrawCard();
    }

    // Stop thinking
    setAiThinking(prev => {
      const newThinking = [...prev];
      newThinking[aiPlayerIndex] = false;
      return newThinking;
    });
  }, []);

  const initializeAI = useCallback((playerCount: number) => {
    setAiThinking(new Array(playerCount).fill(false));
  }, []);

  return {
    makeAIMove,
    initializeAI,
    aiThinking
  };
};