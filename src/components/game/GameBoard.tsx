import { useState } from "react";
import { GameZone } from "./GameZone";
import { GameCard, Card } from "./GameCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Sample game state - replace with your actual game logic
const createCard = (id: string, value: number | "skip", color?: "blue" | "red" | "green" | "yellow", isVisible = true): Card => ({
  id,
  value,
  color,
  isVisible
});

export const GameBoard = () => {
  const [gameState, setGameState] = useState({
    stockPile: Array.from({ length: 30 }, (_, i) => createCard(`stock-${i}`, Math.floor(Math.random() * 12) + 1, ["blue", "red", "green", "yellow"][Math.floor(Math.random() * 4)] as any, false)),
    playerHand: Array.from({ length: 7 }, (_, i) => createCard(`hand-${i}`, Math.floor(Math.random() * 12) + 1, ["blue", "red", "green", "yellow"][Math.floor(Math.random() * 4)] as any)),
    discardPiles: [[], [], [], []] as Card[][],
    buildingPiles: [[], [], [], []] as Card[][],
    score: 0,
    turn: 1
  });

  const handleCardClick = (card: Card, index: number) => {
    console.log("Card clicked:", card, "at index:", index);
    // Add your game logic here
  };

  const handleNewGame = () => {
    // Reset game state
    setGameState({
      stockPile: Array.from({ length: 30 }, (_, i) => createCard(`stock-${i}`, Math.floor(Math.random() * 12) + 1, ["blue", "red", "green", "yellow"][Math.floor(Math.random() * 4)] as any, false)),
      playerHand: Array.from({ length: 7 }, (_, i) => createCard(`hand-${i}`, Math.floor(Math.random() * 12) + 1, ["blue", "red", "green", "yellow"][Math.floor(Math.random() * 4)] as any)),
      discardPiles: [[], [], [], []],
      buildingPiles: [[], [], [], []],
      score: 0,
      turn: 1
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Skip-Bo Style Card Game
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="bg-muted px-3 py-1 rounded-full">
              Turn: {gameState.turn}
            </span>
            <span className="bg-primary px-3 py-1 rounded-full text-primary-foreground">
              Score: {gameState.score}
            </span>
          </div>
        </div>
        <Button onClick={handleNewGame} variant="outline">
          New Game
        </Button>
      </div>

      {/* Main Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        
        {/* Left Column - Stock and Discard */}
        <div className="space-y-4">
          <GameZone
            title="Stock Pile"
            cards={gameState.stockPile}
            layout="stack"
            onCardClick={handleCardClick}
            className="bg-muted/30"
          />
          
          <div className="grid grid-cols-2 gap-2">
            {gameState.discardPiles.map((pile, index) => (
              <GameZone
                key={`discard-${index}`}
                title={`Discard ${index + 1}`}
                cards={pile}
                layout="stack"
                isDropZone
                onCardClick={handleCardClick}
                cardSize="sm"
              />
            ))}
          </div>
        </div>

        {/* Middle Column - Building Piles */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center mb-4">Building Piles</h2>
          <div className="grid grid-cols-2 gap-4">
            {gameState.buildingPiles.map((pile, index) => (
              <GameZone
                key={`building-${index}`}
                title={`Pile ${index + 1}`}
                cards={pile}
                layout="stack"
                isDropZone
                isActive={pile.length === 0 || (pile[pile.length - 1]?.value as number) < 12}
                onCardClick={handleCardClick}
                className="min-h-40"
              />
            ))}
          </div>
        </div>

        {/* Right Column - Player Info */}
        <div className="space-y-4">
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-card-border">
            <h3 className="text-lg font-semibold mb-4 text-center">Game Rules</h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Build sequences 1-12 on building piles</li>
              <li>• Use Skip cards as wild cards</li>
              <li>• Empty your stock pile to win</li>
              <li>• Discard unwanted cards</li>
            </ul>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-card-border">
            <h3 className="text-lg font-semibold mb-4 text-center">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Cards in Stock:</span>
                <span className="font-bold">{gameState.stockPile.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Cards in Hand:</span>
                <span className="font-bold">{gameState.playerHand.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed Piles:</span>
                <span className="font-bold">
                  {gameState.buildingPiles.filter(pile => pile.length === 12).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Hand */}
      <div className="mt-8">
        <GameZone
          title="Your Hand"
          cards={gameState.playerHand}
          layout="fan"
          onCardClick={handleCardClick}
          className="bg-card/30 backdrop-blur-sm border border-card-border"
        />
      </div>
    </div>
  );
};