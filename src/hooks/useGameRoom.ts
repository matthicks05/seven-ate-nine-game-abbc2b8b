import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GameRoom {
  id: string;
  room_code: string;
  host_session_id: string;
  max_players: number;
  current_players: number;
  status: string;
  game_state: any;
}

interface GamePlayer {
  id: string;
  room_id: string;
  session_id: string;
  player_index: number;
  display_name: string;
  is_host: boolean;
}

// Generate a unique session ID for this browser session
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('game_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('game_session_id', sessionId);
  }
  return sessionId;
};

export const useGameRoom = () => {
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createRoom = async (displayName: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      
      const sessionId = getSessionId();
      const roomCode = generateRoomCode();
      
      // Create room
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          room_code: roomCode,
          host_session_id: sessionId,
          max_players: 5,
          status: 'waiting'
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add host as first player
      const { error: playerError } = await supabase
        .from('game_players')
        .insert({
          room_id: room.id,
          session_id: sessionId,
          player_index: 0,
          display_name: displayName,
          is_host: true
        });

      if (playerError) throw playerError;

      setCurrentRoom(room);
      return roomCode;
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async (roomCode: string, displayName: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const sessionId = getSessionId();

      // Find room by code
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .eq('status', 'waiting')
        .single();

      if (roomError || !room) {
        toast({
          title: "Room Not Found",
          description: "Invalid room code or room is not available",
          variant: "destructive"
        });
        return false;
      }

      if (room.current_players >= room.max_players) {
        toast({
          title: "Room Full",
          description: "This room is already full",
          variant: "destructive"
        });
        return false;
      }

      // Check if session already in room
      const { data: existingPlayer } = await supabase
        .from('game_players')
        .select('*')
        .eq('room_id', room.id)
        .eq('session_id', sessionId)
        .single();

      if (existingPlayer) {
        setCurrentRoom(room);
        return true;
      }

      // Add player to room
      const { error: playerError } = await supabase
        .from('game_players')
        .insert({
          room_id: room.id,
          session_id: sessionId,
          player_index: room.current_players,
          display_name: displayName,
          is_host: false
        });

      if (playerError) throw playerError;

      setCurrentRoom(room);
      toast({
        title: "Joined Room",
        description: `Successfully joined room ${roomCode}`,
      });
      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: "Failed to join room",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const leaveRoom = async () => {
    try {
      const sessionId = getSessionId();
      if (!currentRoom) return;

      await supabase
        .from('game_players')
        .delete()
        .eq('room_id', currentRoom.id)
        .eq('session_id', sessionId);

      setCurrentRoom(null);
      setPlayers([]);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const updateGameState = async (gameState: any) => {
    try {
      if (!currentRoom) return;

      const { error } = await supabase
        .from('game_rooms')
        .update({ game_state: gameState })
        .eq('id', currentRoom.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating game state:', error);
    }
  };

  const startGame = async () => {
    try {
      if (!currentRoom) return;

      const { error } = await supabase
        .from('game_rooms')
        .update({ status: 'playing' })
        .eq('id', currentRoom.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentRoom) return;

    // Subscribe to room changes
    const roomChannel = supabase
      .channel(`room-${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${currentRoom.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setCurrentRoom(payload.new as GameRoom);
          }
        }
      )
      .subscribe();

    // Subscribe to player changes
    const playersChannel = supabase
      .channel(`players-${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `room_id=eq.${currentRoom.id}`
        },
        async () => {
          // Refresh players list
          const { data: updatedPlayers } = await supabase
            .from('game_players')
            .select('*')
            .eq('room_id', currentRoom.id)
            .order('player_index');
          
          if (updatedPlayers) {
            setPlayers(updatedPlayers);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(playersChannel);
    };
  }, [currentRoom]);

  // Load players when room changes
  useEffect(() => {
    if (!currentRoom) return;

    const loadPlayers = async () => {
      const { data: roomPlayers } = await supabase
        .from('game_players')
        .select('*')
        .eq('room_id', currentRoom.id)
        .order('player_index');
      
      if (roomPlayers) {
        setPlayers(roomPlayers);
      }
    };

    loadPlayers();
  }, [currentRoom]);

  return {
    currentRoom,
    players,
    isLoading,
    createRoom,
    joinRoom,
    leaveRoom,
    updateGameState,
    startGame
  };
};

const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};