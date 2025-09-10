import { useState } from "react";
import { GameZone } from "./GameZone";
import { GameCard, Card } from "./GameCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 7-ate-9 deck creation
const createNumberCard = (id: string, value: number): Card => ({
  id,
  type: "number",
  value,
  isVisible: true
});

const createWildCard = (id: string, wildType: Card['wildType']): Card => ({
  id,
  type: "wild",
  wildType,
  isVisible: true
});

const createFullDeck = (): Card[] => {
  const deck: Card[] = [];
  
  // Numbered cards: 6 copies each of 1-9
  for (let value = 1; value <= 9; value++) {
    for (let copy = 1; copy <= 6; copy++) {
      deck.push(createNumberCard(`number-${value}-${copy}`, value));
    }
  }
  
  // Wild cards with specified quantities
  const wildCards = [
    { type: 'ate' as const, count: 5 },
    { type: 'addy' as const, count: 5 },
    { type: 'divide' as const, count: 5 },
    { type: 'british3' as const, count: 4 },
    { type: 'slicepi' as const, count: 3 },
    { type: 'nuuh' as const, count: 5 },
    { type: 'cannibal' as const, count: 4 },
    { type: 'negativity' as const, count: 5 },
    { type: 'tickles' as const, count: 5 }
  ];
  
  wildCards.forEach(({ type, count }) => {
    for (let i = 1; i <= count; i++) {
      deck.push(createWildCard(`wild-${type}-${i}`, type));
    }
  });
  
  return shuffleDeck(deck);
};

const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

interface GameState {
  deck: Card[];
  discardPile: Card[];
  playerHands: Card[][];
  currentSequence: number;
  currentPlayer: number;
  playerCount: number;
  gamePhase: "setup" | "playing" | "finished";
  winner: number | null;
}

export const GameBoard = () => {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    discardPile: [],
    playerHands: [],
    currentSequence: 1,
    currentPlayer: 0,
    playerCount: 4,
    gamePhase: "setup",
    winner: null
  });

  const startNewGame = (playerCount: number = 4) => {
    const fullDeck = createFullDeck();
    const playerHands: Card[][] = [];
    
    // Deal 7 cards to each player
    for (let i = 0; i < playerCount; i++) {
      playerHands.push(fullDeck.splice(0, 7));
    }
    
    // First card to discard pile sets sequence
    const firstCard = fullDeck.pop()!;
    const initialSequence = firstCard.type === "number" ? firstCard.value! : 1;
    
    setGameState({
      deck: fullDeck,
      discardPile: [firstCard],
      playerHands,
      currentSequence: initialSequence,
      currentPlayer: 0,
      playerCount,
      gamePhase: "playing",
      winner: null
    });
  };

  const handleCardPlay = (card: Card, playerIndex: number) => {
    if (gameState.currentPlayer !== playerIndex || gameState.gamePhase !== "playing") {
      return;
    }

    // Basic play logic - check if card can be played
    const canPlay = card.type === "wild" || 
                   card.value === gameState.currentSequence ||
                   card.wildType === "ate"; // Ate can substitute for any number

    if (!canPlay) {
      console.log("Cannot play this card");
      return;
    }

    // Update game state (simplified for now)
    const newPlayerHands = [...gameState.playerHands];
    const cardIndex = newPlayerHands[playerIndex].findIndex(c => c.id === card.id);
    
    if (cardIndex !== -1) {
      const playedCard = newPlayerHands[playerIndex].splice(cardIndex, 1)[0];
      const newDiscardPile = [...gameState.discardPile, playedCard];
      
      // Calculate next sequence number
      let nextSequence = gameState.currentSequence + 1;
      if (nextSequence > 9) nextSequence = 1;
      
      // Check for win condition
      let winner = null;
      if (newPlayerHands[playerIndex].length === 0) {
        winner = playerIndex;
      }
      
      setGameState({
        ...gameState,
        playerHands: newPlayerHands,
        discardPile: newDiscardPile,
        currentSequence: nextSequence,
        currentPlayer: (gameState.currentPlayer + 1) % gameState.playerCount,
        winner,
        gamePhase: winner !== null ? "finished" : "playing"
      });
    }
  };

  const handleDrawCard = () => {
    if (gameState.deck.length === 0) return;
    
    const newPlayerHands = [...gameState.playerHands];
    const drawnCard = gameState.deck.pop()!;
    newPlayerHands[gameState.currentPlayer].push(drawnCard);
    
    setGameState({
      ...gameState,
      deck: gameState.deck.slice(0, -1),
      playerHands: newPlayerHands,
      currentPlayer: (gameState.currentPlayer + 1) % gameState.playerCount
    });
  };

  if (gameState.gamePhase === "setup") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            7-ate-9
          </h1>
          <p className="text-muted-foreground max-w-md">
            Race to empty your hand by playing cards in sequence (1→2→3...→9→1). 
            Use wild cards strategically to disrupt opponents!
          </p>
          <div className="space-y-2">
            <p className="text-sm font-medium">Select number of players:</p>
            <div className="flex gap-2 justify-center">
              {[3, 4, 5].map(count => (
                <Button
                  key={count}
                  onClick={() => startNewGame(count)}
                  variant="outline"
                  className="w-12 h-12"
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            7-ate-9
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="bg-muted px-3 py-1 rounded-full">
              Next: {gameState.currentSequence}
            </span>
            <span className="bg-primary px-3 py-1 rounded-full text-primary-foreground">
              Player {gameState.currentPlayer + 1}'s Turn
            </span>
          </div>
        </div>
        <Button onClick={() => setGameState(prev => ({ ...prev, gamePhase: "setup" }))} variant="outline">
          New Game
        </Button>
      </div>

      {gameState.winner !== null && (
        <div className="text-center mb-6">
          <div className="bg-primary text-primary-foreground px-6 py-3 rounded-lg inline-block">
            🎉 Player {gameState.winner + 1} Wins! 🎉
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        
        {/* Left - Deck and Discard */}
        <div className="space-y-4">
          <GameZone
            title={`Draw Pile (${gameState.deck.length})`}
            cards={gameState.deck.length > 0 ? [{ ...gameState.deck[gameState.deck.length - 1], isVisible: false }] : []}
            layout="stack"
            onCardClick={handleDrawCard}
            className="bg-muted/30"
          />
          
          <GameZone
            title="Discard Pile"
            cards={gameState.discardPile}
            layout="stack"
            className="bg-card/50"
          />
        </div>

        {/* Center - Sequence Indicator */}
        <div className="flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Next Card Needed</h2>
            <div className="w-24 h-32 bg-gradient-primary rounded-lg flex items-center justify-center border-4 border-primary-glow">
              <span className="text-4xl font-bold text-primary-foreground">{gameState.currentSequence}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Sequence: 1→2→3→4→5→6→7→8→9→1
            </p>
          </div>
        </div>

        {/* Right - Game Stats */}
        <div className="space-y-4">
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-card-border">
            <h3 className="text-lg font-semibold mb-4 text-center">Players</h3>
            <div className="space-y-2">
              {gameState.playerHands.map((hand, index) => (
                <div key={index} className={cn(
                  "flex justify-between items-center p-2 rounded",
                  index === gameState.currentPlayer ? "bg-primary/10 border border-primary/20" : "bg-muted/20"
                )}>
                  <span className={cn(
                    "font-medium",
                    index === gameState.currentPlayer && "text-primary"
                  )}>
                    Player {index + 1}
                  </span>
                  <span className="text-sm">{hand.length} cards</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-card-border">
            <h3 className="text-lg font-semibold mb-4 text-center">Wild Cards</h3>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div>ATE - Any number</div>
              <div>ADD - Add & sum</div>
              <div>÷ - Give half cards</div>
              <div>3🇬🇧 - All draw 1</div>
              <div>π - Discard 1-4s</div>
              <div>NU-UH - Cancel/Skip</div>
              <div>🍽️ - Discard 2</div>
              <div>-1 - Play 3 lower</div>
              <div>2👋 - 2 players draw 2</div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Player's Hand */}
      <div className="mt-8">
        <GameZone
          title={`Your Hand (Player ${gameState.currentPlayer + 1})`}
          cards={gameState.playerHands[gameState.currentPlayer] || []}
          layout="fan"
          onCardClick={(card) => handleCardPlay(card, gameState.currentPlayer)}
          className="bg-card/30 backdrop-blur-sm border border-card-border"
        />
      </div>
    </div>
  );
};