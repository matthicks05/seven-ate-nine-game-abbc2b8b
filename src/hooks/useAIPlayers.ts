import { useState, useCallback } from 'react';
import { Card } from '@/components/game/GameCard';

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  playerHands: Card[][];
  currentSequence: number;
  currentPlayer: number;
  playerCount: number;
  gamePhase: "modeSelect" | "setup" | "aiSetup" | "lobby" | "playing" | "finished" | "options";
  gameMode: "local" | "online" | "ai" | null;
  roomCode: string | null;
  winner: number | null;
  waitingForAddyCard?: boolean;
  addyBaseSequence?: number;
  aiDifficulty?: 'easy' | 'medium' | 'hard' | 'expert';
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

    // Thinking delay based on difficulty
    const baseDelay = gameState.aiDifficulty === 'easy' ? 500 : 
                     gameState.aiDifficulty === 'medium' ? 800 :
                     gameState.aiDifficulty === 'hard' ? 1200 : 1500;
    await new Promise(resolve => setTimeout(resolve, baseDelay + Math.random() * 400));

    try {
      // Call our AI edge function for intelligent moves
      const response = await fetch('/functions/v1/ai-game-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hand: gameState.playerHands[aiPlayerIndex],
          currentSequence: gameState.currentSequence,
          canDraw: gameState.deck.length > 0,
          difficulty: gameState.aiDifficulty || 'medium',
          discardPile: gameState.discardPile,
          waitingForAddyCard: gameState.waitingForAddyCard,
          addyBaseSequence: gameState.addyBaseSequence
        })
      });

      if (response.ok) {
        const aiDecision = await response.json();
        
        if (aiDecision.action === 'play' && aiDecision.cardId) {
          const cardToPlay = gameState.playerHands[aiPlayerIndex].find(
            card => card.id === aiDecision.cardId
          );
          if (cardToPlay) {
            onCardPlay(cardToPlay, aiPlayerIndex);
          } else {
            // Fallback to drawing if card not found
            onDrawCard();
          }
        } else {
          onDrawCard();
        }
      } else {
        // Fallback to simple AI logic
        await makeSimpleAIMove(gameState, aiPlayerIndex, onCardPlay, onDrawCard);
      }
    } catch (error) {
      console.error('AI move error:', error);
      // Fallback to simple AI logic
      await makeSimpleAIMove(gameState, aiPlayerIndex, onCardPlay, onDrawCard);
    }

    // Stop thinking
    setAiThinking(prev => {
      const newThinking = [...prev];
      newThinking[aiPlayerIndex] = false;
      return newThinking;
    });
  }, []);

  const makeSimpleAIMove = useCallback(async (
    gameState: GameState,
    aiPlayerIndex: number,
    onCardPlay: (card: Card, playerIndex: number) => void,
    onDrawCard: () => void
  ) => {
    const aiHand = gameState.playerHands[aiPlayerIndex];
    const currentTop = gameState.currentSequence;
    
    // Find playable cards
    let playableCards: Card[] = [];
    
    if (gameState.waitingForAddyCard) {
      // When waiting for addy card, only number cards can be played
      playableCards = aiHand.filter(card => card.type === 'number');
    } else {
      // Normal gameplay
      playableCards = aiHand.filter(card => {
        if (card.type === 'wild') return true;
        if (!card.value) return false;
        const diff = Math.abs(card.value - currentTop);
        return diff === 7 || diff === 9 || card.value === currentTop;
      });
    }

    if (playableCards.length > 0) {
      // Simple AI strategy based on difficulty
      let cardToPlay: Card;
      
      if (gameState.aiDifficulty === 'easy') {
        // Easy: Just play first available card
        cardToPlay = playableCards[0];
      } else {
        // Medium/Hard: Prefer exact matches, then strategic cards
        const exactMatches = playableCards.filter(card => card.value === currentTop);
        const wildCards = playableCards.filter(card => card.type === 'wild');
        const sevenNineCards = playableCards.filter(card => {
          if (!card.value) return false;
          const diff = Math.abs(card.value - currentTop);
          return diff === 7 || diff === 9;
        });

        if (exactMatches.length > 0) {
          cardToPlay = exactMatches[0];
        } else if (sevenNineCards.length > 0) {
          cardToPlay = sevenNineCards[0];
        } else {
          cardToPlay = wildCards[0];
        }
      }

      onCardPlay(cardToPlay, aiPlayerIndex);
    } else {
      // Draw a card if no playable cards
      onDrawCard();
    }
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