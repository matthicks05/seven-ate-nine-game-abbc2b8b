import { useState, useEffect } from "react";
import { GameZone } from "./GameZone";
import { GameCard, Card } from "./GameCard";
import { GameRulesModal } from "./GameRulesModal";
import { PlayerStatsModal } from "./PlayerStatsModal";
import ChatPanel from "../chat/ChatPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useGameRoom } from "@/hooks/useGameRoom";
import { useAIPlayers } from "@/hooks/useAIPlayers";
import { MessageCircle } from "lucide-react";


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
  gamePhase: "modeSelect" | "setup" | "aiSetup" | "lobby" | "playing" | "finished";
  gameMode: "local" | "online" | "ai" | null;
  roomCode: string | null;
  winner: number | null;
}

const GameBoardContent = () => {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    discardPile: [],
    playerHands: [],
    currentSequence: 1,
    currentPlayer: 0,
    playerCount: 4,
    gamePhase: "modeSelect",
    gameMode: null,
    roomCode: null,
    winner: null
  });

  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showChat, setShowChat] = useState(true);
  const { currentRoom, players, isLoading, createRoom, joinRoom, leaveRoom, sessionId } = useGameRoom();
  const { makeAIMove, initializeAI, aiThinking } = useAIPlayers();

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
      gameMode: gameState.gameMode,
      roomCode: gameState.roomCode,
      winner: null
    });

    // Initialize AI if in AI mode
    if (gameState.gameMode === "ai") {
      initializeAI(playerCount);
    }
  };

  const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const selectGameMode = (mode: "local" | "online" | "ai") => {
    if (mode === "local") {
      setGameState(prev => ({
        ...prev,
        gameMode: mode,
        gamePhase: "setup"
      }));
    } else if (mode === "ai") {
      setGameState(prev => ({
        ...prev,
        gameMode: mode,
        gamePhase: "aiSetup"
      }));
    } else {
      // Online mode - go to join/create selection
      setGameState(prev => ({
        ...prev,
        gameMode: mode,
        gamePhase: "lobby"
      }));
    }
  };

  const handleCreateRoom = async () => {
    if (!displayName.trim()) return;
    
    const roomCode = await createRoom(displayName.trim());
    if (roomCode) {
      setGameState(prev => ({
        ...prev,
        roomCode,
        gamePhase: "lobby"
      }));
    }
  };

  const handleJoinRoom = async () => {
    if (!displayName.trim() || !joinRoomCode.trim()) return;
    
    const success = await joinRoom(joinRoomCode.trim().toUpperCase(), displayName.trim());
    if (success) {
      setGameState(prev => ({
        ...prev,
        roomCode: joinRoomCode.trim().toUpperCase(),
        gamePhase: "lobby"
      }));
    }
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

  // Effect to handle AI moves
  useEffect(() => {
    if (gameState.gameMode === "ai" && gameState.gamePhase === "playing" && !gameState.winner) {
      const currentPlayer = gameState.currentPlayer;
      const isAITurn = currentPlayer > 0; // Player 0 is human, others are AI
      
      if (isAITurn && !aiThinking[currentPlayer]) {
        makeAIMove(gameState, currentPlayer, handleCardPlay, handleDrawCard);
      }
    }
  }, [gameState, aiThinking, makeAIMove]);

  if (gameState.gamePhase === "modeSelect") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-md">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              7-ate-9
            </h1>
            <p className="text-muted-foreground">
              Race to empty your hand by playing cards in sequence (1→2→3...→9→1). 
              Use wild cards strategically to disrupt opponents!
            </p>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Choose Game Mode</h2>
            
            <div className="grid gap-4">
              <Button
                onClick={() => selectGameMode("local")}
                variant="outline"
                className="h-20 text-left p-6 hover:bg-primary/5"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-lg">🏠 Local Game</div>
                  <div className="text-sm text-muted-foreground">
                    Pass-and-play on this device (3-5 players)
                  </div>
                </div>
              </Button>
              
              <Button
                onClick={() => selectGameMode("online")}
                variant="outline"
                className="h-20 text-left p-6 hover:bg-primary/5"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-lg">🌐 Online Game</div>
                  <div className="text-sm text-muted-foreground">
                    Play with friends on different devices
                  </div>
                </div>
              </Button>
              
              <Button
                onClick={() => selectGameMode("ai")}
                variant="outline"
                className="h-20 text-left p-6 hover:bg-primary/5"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-lg">🤖 AI Mode</div>
                  <div className="text-sm text-muted-foreground">
                    Play against AI opponents (max 5 players)
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.gamePhase === "lobby") {
    // Show room creation/joining interface if no room selected
    if (!currentRoom) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-8 max-w-md">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Online Game
            </h1>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="w-full"
                />
              </div>

              <div className="grid gap-4">
                <Button
                  onClick={handleCreateRoom}
                  disabled={!displayName.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? "Creating..." : "Create New Room"}
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">or</div>
                
                <div className="space-y-2">
                  <Input
                    value={joinRoomCode}
                    onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter room code"
                    maxLength={4}
                    className="w-full text-center text-lg tracking-wider"
                  />
                  <Button
                    onClick={handleJoinRoom}
                    disabled={!displayName.trim() || !joinRoomCode.trim() || isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {isLoading ? "Joining..." : "Join Room"}
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={() => setGameState(prev => ({ ...prev, gamePhase: "modeSelect" }))}
                variant="ghost"
                className="w-full"
              >
                ← Back to Mode Selection
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Show lobby for current room
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-md">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Online Game Lobby
          </h1>
          
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-card-border space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Room Code</h3>
              <div className="text-4xl font-bold tracking-wider bg-primary px-4 py-2 rounded-lg text-primary-foreground">
                {currentRoom.room_code}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Share this code with your friends
              </p>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Connected Players ({players.length}/{currentRoom.max_players})</h4>
              <div className="space-y-1">
                {players.map((player) => (
                  <div key={player.id} className="bg-muted/50 p-2 rounded flex justify-between items-center">
                    <span>{player.display_name}</span>
                    {player.is_host && <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Host</span>}
                  </div>
                ))}
                {players.length < currentRoom.max_players && (
                  <div className="text-muted-foreground text-sm">Waiting for more players...</div>
                )}
              </div>
            </div>
            
            <div className="space-y-2 pt-4">
              <Button 
                onClick={() => startNewGame(players.length)}
                className="w-full"
                disabled={players.length < 2}
              >
                Start Game ({players.length < 2 ? 'Need 2+ players' : 'Ready!'})
              </Button>
              <Button 
                onClick={() => {
                  leaveRoom();
                  setGameState(prev => ({ ...prev, gamePhase: "modeSelect" }));
                }}
                variant="outline"
                className="w-full"
              >
                Leave Room
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.gamePhase === "setup" || gameState.gamePhase === "aiSetup") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {gameState.gamePhase === "aiSetup" ? "AI Game Setup" : "Local Game Setup"}
            </h1>
            <p className="text-muted-foreground">
              {gameState.gamePhase === "aiSetup" 
                ? "You'll play as Player 1, AI controls the rest" 
                : "Pass the device around for each player's turn"
              }
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-lg font-medium">
              Select number of {gameState.gamePhase === "aiSetup" ? "AI opponents" : "players"}:
            </p>
            <div className="flex gap-3 justify-center">
              {(gameState.gamePhase === "aiSetup" ? [2, 3, 4, 5] : [3, 4, 5]).map(count => (
                <Button
                  key={count}
                  onClick={() => startNewGame(count)}
                  variant="outline"
                  className="w-16 h-16 text-lg font-bold"
                >
                  {count}
                </Button>
              ))}
            </div>
            {gameState.gamePhase === "aiSetup" && (
              <p className="text-sm text-muted-foreground text-center">
                AI players will automatically play their turns
              </p>
            )}
          </div>
          
          <Button 
            onClick={() => setGameState(prev => ({ ...prev, gamePhase: "modeSelect" }))}
            variant="ghost"
            className="mt-4"
          >
            ← Back to Mode Selection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 md:p-4">
      <div className="flex gap-4 max-w-7xl mx-auto">
        {/* Main Game Area */}
        <div className="flex-1">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                7-ate-9
              </h1>
              {/* Mobile: Show current sequence prominently */}
              <div className="md:hidden bg-gradient-primary px-3 py-1 rounded-full">
                <span className="text-primary-foreground font-bold">Next: {gameState.currentSequence}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Mobile: Chat toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="md:hidden"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              
              {/* Mobile: Compact action buttons */}
              <div className="md:hidden flex gap-1">
                <GameRulesModal />
                <PlayerStatsModal 
                  playerHands={gameState.playerHands}
                  currentPlayer={gameState.currentPlayer}
                  deckLength={gameState.deck.length}
                  discardLength={gameState.discardPile.length}
                />
              </div>
              
              {/* Desktop: Full header info */}
              <div className="hidden md:flex items-center gap-4 text-sm">
                <span className="bg-muted px-3 py-1 rounded-full">
                  Next: {gameState.currentSequence}
                </span>
                <span className="bg-primary px-3 py-1 rounded-full text-primary-foreground">
                  Player {gameState.currentPlayer + 1}'s Turn
                </span>
              </div>
              
              <Button 
                onClick={() => setGameState(prev => ({ ...prev, gamePhase: "modeSelect" }))} 
                variant="outline"
                size="sm"
              >
                New Game
              </Button>
            </div>
          </div>

      {/* Mobile: Current player indicator */}
      <div className="md:hidden text-center mb-4">
        <div className="bg-primary px-4 py-2 rounded-full text-primary-foreground inline-block">
          Player {gameState.currentPlayer + 1}'s Turn
        </div>
      </div>

      {gameState.winner !== null && (
        <div className="text-center mb-4 md:mb-6">
          <div className="bg-primary text-primary-foreground px-4 py-2 md:px-6 md:py-3 rounded-lg inline-block">
            🎉 Player {gameState.winner + 1} Wins! 🎉
          </div>
        </div>
      )}

      {/* Mobile-First Layout */}
      <div className="space-y-4 md:hidden">
        {/* Mobile: Center sequence indicator prominently */}
        <div className="text-center">
          <div className="w-20 h-28 bg-gradient-primary rounded-lg flex items-center justify-center border-4 border-primary-glow mx-auto">
            <span className="text-3xl font-bold text-primary-foreground">{gameState.currentSequence}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Sequence: 1→2→3→4→5→6→7→8→9→1
          </p>
        </div>

        {/* Mobile: Deck and discard in one row */}
        <div className="grid grid-cols-2 gap-2">
          <GameZone
            title={`Draw (${gameState.deck.length})`}
            cards={gameState.deck.length > 0 ? [{ ...gameState.deck[gameState.deck.length - 1], isVisible: false }] : []}
            layout="stack"
            onCardClick={handleDrawCard}
            className="bg-muted/30"
            cardSize="sm"
          />
          
          <GameZone
            title="Played"
            cards={gameState.discardPile}
            layout="stack"
            className="bg-card/50"
            cardSize="sm"
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        
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

        {/* Right - Game Stats (Desktop Only) */}
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
                    {gameState.gameMode === "ai" && index > 0 ? `AI Player ${index}` : `Player ${index + 1}`}
                    {aiThinking[index] && gameState.gameMode === "ai" && " (thinking...)"}
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

          {/* Player Hand - Mobile Optimized */}
          <div className="mt-4 md:mt-8">
            <GameZone
              title={`Your Hand (Player ${gameState.currentPlayer + 1})`}
              cards={gameState.playerHands[gameState.currentPlayer] || []}
              layout="fan"
              onCardClick={(card) => handleCardPlay(card, gameState.currentPlayer)}
              className="bg-card/30 backdrop-blur-sm border border-card-border"
              cardSize="md"
            />
          </div>
        </div>

        {/* Chat Panel - Desktop */}
        {showChat && gameState.gameMode === "online" && currentRoom && (
          <div className="hidden md:block w-80 h-[80vh] sticky top-4">
            <ChatPanel
              roomId={currentRoom.room_code}
              sessionId={sessionId || ''}
              playerName={displayName || `Player ${gameState.currentPlayer + 1}`}
              isVisible={showChat}
            />
          </div>
        )}

        {/* Chat Panel - Mobile (Overlay) */}
        {showChat && gameState.gameMode === "online" && currentRoom && (
          <div className="md:hidden fixed inset-x-4 bottom-4 top-20 z-50">
            <ChatPanel
              roomId={currentRoom.room_code}
              sessionId={sessionId || ''}
              playerName={displayName || `Player ${gameState.currentPlayer + 1}`}
              isVisible={showChat}
            />
          </div>
        )}
      </div>
     </div>
   );
 };

export const GameBoard = () => {
  return <GameBoardContent />;
};