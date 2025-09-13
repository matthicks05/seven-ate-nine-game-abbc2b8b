import { useState, useEffect } from "react";
import { GameZone } from "./GameZone";
import { GameCard, Card } from "./GameCard";

import { PlayerStatsModal } from "./PlayerStatsModal";
import ChatPanel from "../chat/ChatPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useGameRoom } from "@/hooks/useGameRoom";
import { useAIPlayers } from "@/hooks/useAIPlayers";
import { useGameScoring } from "@/hooks/useGameScoring";
import { useAuth } from "@/components/auth/AuthContext";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { MessageCircle, Trophy, LogIn, Settings, HelpCircle, Palette, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";


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
  gamePhase: "modeSelect" | "setup" | "aiSetup" | "lobby" | "playing" | "finished" | "options" | "rules";
  gameMode: "local" | "online" | "ai" | null;
  roomCode: string | null;
  winner: number | null;
  waitingForAddyCard: boolean;
  addyBaseSequence: number | null;
  aiDifficulty: 'easy' | 'medium' | 'hard' | 'expert';
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
    winner: null,
    waitingForAddyCard: false,
    addyBaseSequence: null,
    aiDifficulty: 'medium'
  });
  
  const [showTurnTransition, setShowTurnTransition] = useState(false);
  const [pendingPlayer, setPendingPlayer] = useState<number | null>(null);

  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { currentRoom, players, isLoading, createRoom, joinRoom, leaveRoom, sessionId } = useGameRoom();
  const { makeAIMove, initializeAI, aiThinking } = useAIPlayers();
  const { currentTheme, setTheme, themes } = useTheme();
  const { awardPointsForWin, recordGamePlayed } = useGameScoring();
  
  // Safely get auth context
  let user = null;
  let signOut = () => {};
  try {
    const authContext = useAuth();
    user = authContext.user;
    signOut = authContext.signOut;
  } catch (error) {
    // Auth context not available, continue without auth features
    console.log('Auth context not available');
  }
  
  const navigate = useNavigate();

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
      winner: null,
      waitingForAddyCard: false,
      addyBaseSequence: null,
      aiDifficulty: gameState.aiDifficulty
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

    // Check if card can be played
    let canPlay = false;
    
    if (gameState.waitingForAddyCard) {
      // When waiting for addy card, only allow number cards
      canPlay = card.type === "number";
    } else {
      // Normal play logic
      canPlay = card.type === "wild" || 
                card.value === gameState.currentSequence;
    }

    if (!canPlay) {
      console.log("Cannot play this card");
      return;
    }

    // Update game state
    const newPlayerHands = [...gameState.playerHands];
    const cardIndex = newPlayerHands[playerIndex].findIndex(c => c.id === card.id);
    
    if (cardIndex !== -1) {
      const playedCard = newPlayerHands[playerIndex].splice(cardIndex, 1)[0];
      const newDiscardPile = [...gameState.discardPile, playedCard];
      
      let nextSequence = gameState.currentSequence;
      let waitingForAddyCard = false;
      let addyBaseSequence = null;
      let shouldAdvancePlayer = true;
      let newDeck = [...gameState.deck];
      
      if (gameState.waitingForAddyCard && card.type === "number") {
        // Handle addy second card - add to the base sequence
        nextSequence = (gameState.addyBaseSequence! + card.value!) % 10;
        if (nextSequence === 0) nextSequence = 10;
        if (nextSequence > 9) nextSequence = nextSequence - 9;
        waitingForAddyCard = false;
        addyBaseSequence = null;
      } else if (card.type === "wild" && card.wildType === "addy") {
        // Addy card played - wait for second card
        waitingForAddyCard = true;
        addyBaseSequence = gameState.currentSequence;
        shouldAdvancePlayer = false; // Don't advance player, they get to play another card
      } else if (card.type === "number") {
        // Regular number card
        nextSequence = card.value! + 1;
        if (nextSequence > 9) nextSequence = 1;
      } else if (card.type === "wild" && card.wildType === "ate") {
        // Ate card - keeps current sequence
        nextSequence = gameState.currentSequence + 1;
        if (nextSequence > 9) nextSequence = 1;
      } else if (card.type === "wild" && card.wildType === "divide") {
        // Divide card - give half cards to next player
        const currentPlayerHand = newPlayerHands[playerIndex];
        const nextPlayerIndex = (playerIndex + 1) % gameState.playerCount;
        
        // If only 1 card left (the divide card we just played), player wins
        if (currentPlayerHand.length === 0) {
          // Player wins by playing their last card
        } else {
          // Calculate how many cards to give (half, rounded down if odd)
          const cardsToGive = Math.floor(currentPlayerHand.length / 2);
          
          if (cardsToGive > 0) {
            // Remove cards from current player and give to next player
            const cardsToMove = currentPlayerHand.splice(0, cardsToGive);
            newPlayerHands[nextPlayerIndex].push(...cardsToMove);
          }
        }
        
        nextSequence = gameState.currentSequence + 1;
        if (nextSequence > 9) nextSequence = 1;
      } else if (card.type === "wild" && card.wildType === "british3") {
        // British 3 (4): All players draw one card
        for (let i = 0; i < gameState.playerCount; i++) {
          if (newDeck.length > 0) {
            const drawnCard = newDeck.pop()!;
            newPlayerHands[i].push(drawnCard);
          }
        }
        nextSequence = 4; // British 3 has value 4
      } else if (card.type === "wild" && card.wildType === "slicepi") {
        // Slice of Pi (3): Discard all 1s, 2s, 3s, and 4s from hand
        newPlayerHands[playerIndex] = newPlayerHands[playerIndex].filter(c => 
          c.type === "wild" || (c.type === "number" && c.value > 4)
        );
        nextSequence = 3; // Slice of Pi has value 3
      } else if (card.type === "wild" && card.wildType === "nuuh") {
        // Nu-uh Card (5): Skip drawing, skip turn, or cancel another card's effect
        // Skip next player by advancing twice
        shouldAdvancePlayer = true;
        nextSequence = 5; // Nu-uh has value 5
      } else if (card.type === "wild" && card.wildType === "cannibal") {
        // Cannibal Card (4): Discard 2 of your cards, all others draw 1
        // Discard 2 cards from current player (if they have them)
        if (newPlayerHands[playerIndex].length >= 2) {
          newPlayerHands[playerIndex].splice(-2, 2);
        } else if (newPlayerHands[playerIndex].length === 1) {
          newPlayerHands[playerIndex].splice(-1, 1);
        }
        // All other players draw 1
        for (let i = 0; i < gameState.playerCount; i++) {
          if (i !== playerIndex && newDeck.length > 0) {
            const drawnCard = newDeck.pop()!;
            newPlayerHands[i].push(drawnCard);
          }
        }
        nextSequence = 4; // Cannibal has value 4
      } else if (card.type === "wild" && card.wildType === "negativity") {
        // Mr Negativity (5): Play any 3 cards lower than last played card
        // This is complex - for now just set sequence to 5 and let player play normally
        // TODO: Implement special state for playing 3 cards lower
        nextSequence = 5; // Mr Negativity has value 5
      } else if (card.type === "wild" && card.wildType === "tickles") {
        // Two Tickles (5): Choose 2 players to each draw 2 cards
        // For now, make the next 2 players draw 2 cards each
        // TODO: Add player selection UI
        let drawnFor = 0;
        for (let i = 1; i <= gameState.playerCount && drawnFor < 2; i++) {
          const targetPlayer = (playerIndex + i) % gameState.playerCount;
          if (targetPlayer !== playerIndex) {
            for (let j = 0; j < 2 && newDeck.length > 0; j++) {
              const drawnCard = newDeck.pop()!;
              newPlayerHands[targetPlayer].push(drawnCard);
            }
            drawnFor++;
          }
        }
        nextSequence = 5; // Two Tickles has value 5
      } else {
        // Default wild card behavior
        nextSequence = gameState.currentSequence + 1;
        if (nextSequence > 9) nextSequence = 1;
      }
      
      // Check for win condition
      let winner = null;
      if (newPlayerHands[playerIndex].length === 0) {
        winner = playerIndex;
        
        // Award points for wins in online/AI mode
        if ((gameState.gameMode === 'online' || gameState.gameMode === 'ai') && user) {
          if (winner === 0 || (gameState.gameMode === 'ai' && winner === 0)) {
            // Human player won
            setTimeout(() => awardPointsForWin(gameState.gameMode, user.id), 1000);
          } else {
            // Record the game as played (loss)
            setTimeout(() => recordGamePlayed(gameState.gameMode, user.id), 1000);
          }
        }
      }
      
      // Handle Nu-uh card's double advance
      const advanceBy = (card.type === "wild" && card.wildType === "nuuh") ? 2 : 1;
      const nextPlayer = shouldAdvancePlayer ? (gameState.currentPlayer + advanceBy) % gameState.playerCount : gameState.currentPlayer;
      
      // For local games, show turn transition to prevent card peeking
      if (gameState.gameMode === "local" && winner === null && shouldAdvancePlayer) {
        setPendingPlayer(nextPlayer);
        setShowTurnTransition(true);
      }
      
      setGameState({
        ...gameState,
        deck: newDeck,
        playerHands: newPlayerHands,
        discardPile: newDiscardPile,
        currentSequence: nextSequence,
        currentPlayer: gameState.gameMode === "local" && winner === null && shouldAdvancePlayer ? gameState.currentPlayer : nextPlayer,
        winner,
        gamePhase: winner !== null ? "finished" : "playing",
        waitingForAddyCard,
        addyBaseSequence
      });
    }
  };

  const handleDrawCard = () => {
    if (gameState.deck.length === 0) return;
    
    const newPlayerHands = [...gameState.playerHands];
    const drawnCard = gameState.deck.pop()!;
    newPlayerHands[gameState.currentPlayer].push(drawnCard);
    const nextPlayer = (gameState.currentPlayer + 1) % gameState.playerCount;
    
    // For local games, show turn transition to prevent card peeking
    if (gameState.gameMode === "local") {
      setPendingPlayer(nextPlayer);
      setShowTurnTransition(true);
    }
    
    setGameState({
      ...gameState,
      deck: gameState.deck.slice(0, -1),
      playerHands: newPlayerHands,
      currentPlayer: gameState.gameMode === "local" ? gameState.currentPlayer : nextPlayer
    });
  };
  
  const confirmTurnTransition = () => {
    if (pendingPlayer !== null) {
      setGameState(prev => ({
        ...prev,
        currentPlayer: pendingPlayer
      }));
    }
    setShowTurnTransition(false);
    setPendingPlayer(null);
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
  }, [gameState.currentPlayer, gameState.gamePhase, gameState.gameMode, gameState.winner, aiThinking, makeAIMove]);

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
          
          {/* Auth section */}
          <div className="p-4 bg-card/50 rounded-lg border">
            {user ? (
              <div className="space-y-2">
                <p className="text-sm">Welcome back, <span className="font-medium">{user.email}</span>!</p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowLeaderboard(!showLeaderboard)}
                  >
                    <Trophy className="h-4 w-4 mr-1" />
                    Leaderboard
                  </Button>
                  <Button variant="ghost" size="sm" onClick={signOut}>
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Sign in to track wins and compete!</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/auth')}
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  Sign In
                </Button>
              </div>
            )}
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
            
            {/* Options and Help buttons */}
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => {
                  console.log('Options button clicked');
                  setGameState(prev => ({
                    ...prev,
                    gamePhase: "options"
                  }));
                }}
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                <Settings className="h-4 w-4 mr-1" />
                Options
              </Button>
              <Button 
                onClick={() => {
                  console.log('Rules button clicked');
                  setGameState(prev => ({
                    ...prev,
                    gamePhase: "rules"
                  }));
                }}
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                Rules
              </Button>
            </div>
          </div>

          {/* Leaderboard overlay */}
          {showLeaderboard && (
            <div className="mt-8 w-full max-w-md">
              <Leaderboard />
            </div>
          )}
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

  if (gameState.gamePhase === "options") {
    const themePreviewColors: Record<Theme, { primary: string; secondary: string; accent: string }> = {
      vibrant: { primary: '#C084FC', secondary: '#22D3EE', accent: '#FDE047' },
      forest: { primary: '#34D399', secondary: '#A78BFA', accent: '#FBBF24' },
      ocean: { primary: '#38BDF8', secondary: '#10B981', accent: '#F59E0B' },
      sunset: { primary: '#FB7185', secondary: '#FB923C', accent: '#FBBF24' },
      cosmic: { primary: '#A855F7', secondary: '#C084FC', accent: '#22D3EE' }
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-md w-full">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Game Options
            </h1>
            <p className="text-muted-foreground">
              Customize your game experience
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-card/30 backdrop-blur-sm border border-primary/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 justify-center">
                <Palette className="h-5 w-5" />
                Color Theme
              </h3>
              <div className="grid gap-3">
                {(Object.keys(themes) as Theme[]).map((themeKey) => {
                  const colors = themePreviewColors[themeKey];
                  const isSelected = currentTheme === themeKey;
                  
                  return (
                    <Button
                      key={themeKey}
                      variant={isSelected ? "default" : "outline"}
                      className="w-full justify-between h-auto p-4"
                      onClick={() => setTheme(themeKey)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: colors.primary }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: colors.secondary }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: colors.accent }}
                          />
                        </div>
                        <span className="font-medium">{themes[themeKey]}</span>
                      </div>
                      {isSelected && (
                        <Badge variant="secondary" className="ml-2">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => setGameState(prev => ({ ...prev, gamePhase: "modeSelect" }))}
            className="w-full"
          >
            Back to Main Menu
          </Button>
        </div>
      </div>
    );
  }

  if (gameState.gamePhase === "rules") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              7-ate-9 Rules
            </h1>
            <p className="text-muted-foreground">
              Learn how to play this exciting card sequence game!
            </p>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-card-border space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary">Basic Rules</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">🎯 Objective</h4>
                    <p className="text-muted-foreground">Be the first player to empty your hand of all cards!</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">📋 Setup</h4>
                    <p className="text-muted-foreground">Each player starts with 7 cards. The sequence starts at the value of the first discard card.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">🔄 Sequence</h4>
                    <p className="text-muted-foreground">Cards must be played in order: 1→2→3→4→5→6→7→8→9→1→2...</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary">Playing Cards</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">✅ Valid Plays</h4>
                    <p className="text-muted-foreground">Play the exact number needed OR use wild cards for special effects</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">🎴 Can't Play?</h4>
                    <p className="text-muted-foreground">Draw a card from the deck if you cannot play</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">🏆 Winning</h4>
                    <p className="text-muted-foreground">First player to play all their cards wins the round!</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-primary">Wild Cards</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div className="bg-background/50 rounded-lg p-3 border">
                  <h4 className="font-medium text-accent mb-2">🍽️ Ate Card</h4>
                  <p className="text-muted-foreground">Advances sequence by 1 (like eating the next number)</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border">
                  <h4 className="font-medium text-accent mb-2">➕ Addy Card</h4>
                  <p className="text-muted-foreground">Play this + a number card = new sequence value</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border">
                  <h4 className="font-medium text-accent mb-2">➗ Divide Card</h4>
                  <p className="text-muted-foreground">Give half your remaining cards to the next player</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border">
                  <h4 className="font-medium text-accent mb-2">🇬🇧 Cup of Three Card</h4>
                  <p className="text-muted-foreground">All players draw one card</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border">
                  <h4 className="font-medium text-accent mb-2">🥧 Slice of Pi Card</h4>
                  <p className="text-muted-foreground">Discard all 1s, 2s, 3s, and 4s from hand</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border">
                  <h4 className="font-medium text-accent mb-2">🚫 Nu-uh Card</h4>
                  <p className="text-muted-foreground">Skip drawing, skip turn, or cancel another card's effect</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border">
                  <h4 className="font-medium text-accent mb-2">🍽️ Cannibal Card</h4>
                  <p className="text-muted-foreground">Discard 2 of your cards, all others draw 1</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border">
                  <h4 className="font-medium text-accent mb-2">😠 Mr Negativity Card</h4>
                  <p className="text-muted-foreground">Play any 3 cards lower than last played card</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border">
                  <h4 className="font-medium text-accent mb-2">😄 Two Tickles Card</h4>
                  <p className="text-muted-foreground">Choose 2 players to each draw 2 cards</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-primary">Strategy Tips</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">💡 Basic Strategy</h4>
                  <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                    <li>Keep track of the sequence number</li>
                    <li>Save wild cards for strategic moments</li>
                    <li>Watch other players' card counts</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">🎯 Advanced Tips</h4>
                  <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                    <li>Use Addy cards to change difficult sequences</li>
                    <li>Time your Divide cards when you have many cards</li>
                    <li>Block opponents from winning with strategic wilds</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => setGameState(prev => ({ ...prev, gamePhase: "modeSelect" }))}
            className="w-full"
          >
            Back to Main Menu
          </Button>
        </div>
      </div>
    );
  }

  if (gameState.gamePhase === "setup" || gameState.gamePhase === "aiSetup") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
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
          
          {gameState.gamePhase === "aiSetup" && (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-medium mb-3">AI Difficulty:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'easy', label: 'Easy', desc: 'Beginner friendly' },
                    { value: 'medium', label: 'Medium', desc: 'Balanced play' },
                    { value: 'hard', label: 'Hard', desc: 'Strategic AI' },
                    { value: 'expert', label: 'Expert', desc: 'Master level' }
                  ].map(diff => (
                    <Button
                      key={diff.value}
                      onClick={() => setGameState(prev => ({ ...prev, aiDifficulty: diff.value as any }))}
                      variant={gameState.aiDifficulty === diff.value ? "default" : "outline"}
                      className="flex flex-col h-auto p-3"
                    >
                      <span className="font-semibold">{diff.label}</span>
                      <span className="text-xs opacity-80">{diff.desc}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <p className="text-lg font-medium">
              Select number of {gameState.gamePhase === "aiSetup" ? "AI opponents" : "players"}:
            </p>
            <div className="flex gap-3 justify-center">
              {(gameState.gamePhase === "aiSetup" ? [3, 4, 5] : [3, 4, 5]).map(count => (
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
                AI players will automatically play their turns at {gameState.aiDifficulty} difficulty
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
                <Button 
                  onClick={() => {
                    setGameState(prev => ({
                      ...prev,
                      gamePhase: "rules"
                    }));
                  }}
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  Rules
                </Button>
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

      {/* Turn Transition Screen for Local Games */}
      {showTurnTransition && gameState.gameMode === "local" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-card p-8 rounded-xl text-center space-y-6 max-w-md mx-4">
            <h2 className="text-2xl font-bold">Pass Device</h2>
            <p className="text-muted-foreground">
              Hand the device to <span className="font-semibold text-primary">Player {(pendingPlayer || 0) + 1}</span>
            </p>
            <Button onClick={confirmTurnTransition} size="lg" className="w-full">
              Ready - Start My Turn
            </Button>
          </div>
        </div>
      )}

      {/* Addy Card Status */}
      {gameState.waitingForAddyCard && (
        <div className="text-center mb-4">
          <div className="bg-orange-500 text-white px-4 py-2 rounded-lg inline-block animate-pulse">
            ✨ Addy Card Active - Play a number card to add to {gameState.addyBaseSequence}!
          </div>
        </div>
      )}

      {/* Current Player Turn Indicator - Prominent for all screen sizes */}
      <div className="text-center mb-6">
        <div className="relative">
          {/* Main turn indicator */}
          <div className="bg-gradient-to-r from-primary to-primary-glow px-8 py-4 rounded-2xl text-primary-foreground inline-block shadow-2xl animate-pulse border-4 border-primary-glow/50">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-primary-foreground rounded-full animate-bounce"></div>
              <span className="text-xl md:text-2xl font-bold">
                {gameState.gameMode === "ai" && gameState.currentPlayer > 0 
                  ? `AI Player ${gameState.currentPlayer}'s Turn` 
                  : gameState.gameMode === "ai" && gameState.currentPlayer === 0
                  ? "Your Turn!"
                  : `Player ${gameState.currentPlayer + 1}'s Turn`}
              </span>
              <div className="w-3 h-3 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            {gameState.gameMode === "ai" && aiThinking[gameState.currentPlayer] && (
              <div className="text-sm mt-1 opacity-90">AI is thinking...</div>
            )}
          </div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-glow rounded-2xl blur-xl opacity-30 animate-pulse -z-10"></div>
        </div>
      </div>

      {gameState.winner !== null && (
        <div className="text-center mb-4 md:mb-6">
          <div className="bg-primary text-primary-foreground px-4 py-2 md:px-6 md:py-3 rounded-lg inline-block">
            🎉 {gameState.gameMode === "ai" && gameState.winner > 0 ? `AI Player ${gameState.winner}` : `Player ${gameState.winner + 1}`} Wins! 🎉
            {(gameState.gameMode === 'online' || gameState.gameMode === 'ai') && gameState.winner === 0 && user && (
              <div className="text-sm mt-1">+1 point earned!</div>
            )}
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

      {/* Desktop Layout - UNO Style */}
      <div className="hidden md:flex min-h-screen relative overflow-hidden">
        
        {/* Opponent Players positioned around the table */}
        
        {/* Top Player - Centered above table */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="opacity-80 hover:opacity-100 transition-opacity">
            <GameZone
              title={gameState.gameMode === "ai" ? `AI Player 3 (${gameState.playerHands[2]?.length || 0})` : `Player 3 (${gameState.playerHands[2]?.length || 0})`}
              cards={gameState.playerHands[2]?.map((card, index) => ({ ...card, id: `p3-${index}`, isVisible: false })) || []}
              cardSize="md"
              layout="fan"
              className={`scale-75 transition-all duration-300 ${
                gameState.playerCount === 5 
                  ? "transform -rotate-[35deg] -translate-x-40 translate-y-12" 
                  : ""
              }`}
            />
          </div>
        </div>
        
        {/* Left Player - Positioned outward from center table */}
        <div className="absolute left-1/2 top-1/3 transform -translate-x-[405px] -translate-y-1/2 -rotate-90 z-10">
          <div className="opacity-80 hover:opacity-100 transition-opacity">
            <GameZone
              title={gameState.gameMode === "ai" ? `AI Player 2 (${gameState.playerHands[1]?.length || 0})` : `Player 2 (${gameState.playerHands[1]?.length || 0})`}
              cards={gameState.playerHands[1]?.map((card, index) => ({ ...card, id: `p2-${index}`, isVisible: false })) || []}
              cardSize="md"
              layout="fan"
              className="scale-75"
            />
          </div>
        </div>
        
        {/* Right Player - Positioned outward from center table */}
        <div className="absolute right-1/2 top-1/3 transform translate-x-[405px] -translate-y-1/2 rotate-90 z-10">
          <div className="opacity-80 hover:opacity-100 transition-opacity">
            <GameZone
              title={gameState.gameMode === "ai" ? `AI Player 4 (${gameState.playerHands[3]?.length || 0})` : `Player 4 (${gameState.playerHands[3]?.length || 0})`}
              cards={gameState.playerHands[3]?.map((card, index) => ({ ...card, id: `p4-${index}`, isVisible: false })) || []}
              cardSize="md"
              layout="fan"
              className="scale-75"
            />
        </div>

        {/* Fifth Player - Top Right for 5-player mode */}
        {gameState.playerCount === 5 && (
          <div className="absolute top-8 right-1/2 transform translate-x-32 z-10">
            <div className="opacity-80 hover:opacity-100 transition-opacity">
              <GameZone
                title={gameState.gameMode === "ai" ? `AI Player 5 (${gameState.playerHands[4]?.length || 0})` : `Player 5 (${gameState.playerHands[4]?.length || 0})`}
                cards={gameState.playerHands[4]?.map((card, index) => ({ ...card, id: `p5-${index}`, isVisible: false })) || []}
                cardSize="md"
                layout="fan"
                className="scale-75 transform rotate-45"
              />
            </div>
          </div>
        )}
        </div>

        {/* Main Game Table Area */}
        <div className="flex-1 flex flex-col">
          
          {/* Center Table - Draw/Discard Piles */}
          <div className="flex-1 flex items-center justify-center relative">
            {/* Game Table Surface */}
            <div className="bg-gradient-radial from-background/90 to-background/60 rounded-full w-96 h-96 flex items-center justify-center relative border-4 border-primary/20 shadow-2xl">
              
              {/* Center Card Piles */}
              <div className="flex gap-8 items-center">
                {/* Draw Pile */}
                <div 
                  onClick={handleDrawCard} 
                  className="cursor-pointer hover:scale-110 transition-all duration-200 hover:rotate-3"
                >
                  <GameZone
                    title={`DRAW (${gameState.deck.length})`}
                    cards={gameState.deck.length > 0 ? [{ ...gameState.deck[gameState.deck.length - 1], isVisible: false }] : []}
                    cardSize="lg"
                    layout="stack"
                    className="bg-primary/10 rounded-xl border-2 border-primary/30 shadow-lg"
                  />
                </div>
                
                {/* Discard Pile */}
                <div className="relative">
                  <GameZone
                    title="DISCARD"
                    cards={gameState.discardPile.slice(-1)}
                    cardSize="lg"
                    layout="stack"
                    className="bg-accent/10 rounded-xl border-2 border-accent/30 shadow-lg"
                  />
                </div>
              </div>
              
              {/* Current Sequence Display in Center */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20">
                <div className="bg-accent/90 backdrop-blur-sm rounded-full px-6 py-3 border-2 border-accent shadow-lg">
                  <div className="text-center">
                    <div className="text-sm font-medium text-primary-foreground mb-1">next needed card</div>
                    <div className="text-3xl font-bold text-primary-foreground">{gameState.currentSequence}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Player Area - Current Player's Hand */}
          <div className="p-8 z-20">
            <div className="relative">
              {/* Curved UNO-style hand background */}
              <div className="bg-gradient-to-t from-primary/25 to-primary/10 rounded-t-[4rem] p-8 border-t-4 border-primary/40 shadow-2xl backdrop-blur-sm">
                <GameZone
                  title={gameState.gameMode === "ai" ? 
                    (gameState.currentPlayer === 0 ? "YOUR TURN!" : "Your Hand") :
                    (gameState.currentPlayer === 0 ? "YOUR TURN!" : `Player ${gameState.currentPlayer + 1}'s Hand`)
                  }
                  cards={gameState.gameMode === "ai" ? 
                    (gameState.playerHands[0] || []) : 
                    (gameState.playerHands[gameState.currentPlayer] || [])
                  }
                  onCardClick={(card) => handleCardPlay(card, gameState.gameMode === "ai" ? 0 : gameState.currentPlayer)}
                  cardSize="lg"
                  layout="fan"
                  isActive={gameState.gameMode === "ai" ? gameState.currentPlayer === 0 : true}
                  className="transform translate-y-2"
                />
              </div>
              
              {/* Active player glow effect */}
              {((gameState.gameMode === "ai" && gameState.currentPlayer === 0) || gameState.gameMode !== "ai") && (
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent rounded-t-[4rem] animate-pulse pointer-events-none" />
              )}
            </div>
          </div>
         </div>
      </div>

      {/* Mobile Layout - UNO Style */}
      <div className="md:hidden flex flex-col min-h-screen relative overflow-hidden">
        {/* Top Opponent */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 rotate-180 opacity-75 scale-90 z-10">
          <GameZone
            title={gameState.gameMode === "ai" ? "AI Player" : "Opponent"}
            cards={gameState.playerHands[1]?.map((card, index) => ({ ...card, id: `mobile-p2-${index}`, isVisible: false })).slice(0, 5) || []}
            cardSize="lg"
            layout="fan"
          />
        </div>
        
        {/* Side Opponents */}
        <div className="absolute left-2 top-1/3 -rotate-90 opacity-60 scale-75 z-10">
          <GameZone
            title="Player"
            cards={gameState.playerHands[2]?.map((card, index) => ({ ...card, id: `mobile-p3-${index}`, isVisible: false })).slice(0, 3) || []}
            cardSize="lg"
            layout="fan"
          />
        </div>
        <div className="absolute right-2 top-1/3 rotate-90 opacity-60 scale-75 z-10">
          <GameZone
            title="Player"
            cards={gameState.playerHands[3]?.map((card, index) => ({ ...card, id: `mobile-p4-${index}`, isVisible: false })).slice(0, 3) || []}
            cardSize="lg"
            layout="fan"
          />
        </div>

        {/* Center Game Table */}
        <div className="flex-1 flex items-center justify-center z-20 mt-20 mb-20">
          <div className="bg-gradient-radial from-background/90 to-background/60 rounded-full p-8 border-2 border-primary/20">
            <div className="flex gap-4">
              <div onClick={handleDrawCard} className="cursor-pointer hover:scale-105 transition-transform">
                <GameZone
                  title={`DRAW (${gameState.deck.length})`}
                  cards={gameState.deck.length > 0 ? [{ ...gameState.deck[gameState.deck.length - 1], isVisible: false }] : []}
                  cardSize="lg"
                  layout="stack"
                  className="bg-primary/10 rounded-lg border border-primary/30"
                />
              </div>
              <GameZone
                title="DISCARD"
                cards={gameState.discardPile.slice(-1)}
                cardSize="lg"
                layout="stack"
                className="bg-accent/10 rounded-lg border border-accent/30"
              />
            </div>
          </div>
        </div>

        {/* Bottom Player Hand - Curved UNO Style */}
        <div className="z-20">
          <div className="bg-gradient-to-t from-primary/25 to-primary/10 rounded-t-[2rem] p-6 border-t-2 border-primary/40 shadow-xl">
            <GameZone
              title={gameState.gameMode === "ai" ?
                (gameState.currentPlayer === 0 ? "YOUR TURN!" : "Your Hand") :
                (gameState.currentPlayer === 0 ? "YOUR TURN!" : `Player ${gameState.currentPlayer + 1}'s Hand`)
              }
              cards={gameState.gameMode === "ai" ? 
                (gameState.playerHands[0] || []) : 
                (gameState.playerHands[gameState.currentPlayer] || [])
              }
              onCardClick={(card) => handleCardPlay(card, gameState.gameMode === "ai" ? 0 : gameState.currentPlayer)}
              cardSize="lg"
              layout="fan"
              isActive={gameState.gameMode === "ai" ? gameState.currentPlayer === 0 : true}
            />
            {((gameState.gameMode === "ai" && gameState.currentPlayer === 0) || gameState.gameMode !== "ai") && (
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-t-[2rem] animate-pulse pointer-events-none" />
            )}
          </div>
        </div>
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