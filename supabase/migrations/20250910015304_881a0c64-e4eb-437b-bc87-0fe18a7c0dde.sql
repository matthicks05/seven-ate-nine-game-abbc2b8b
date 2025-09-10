-- Create game rooms table
CREATE TABLE public.game_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  max_players INTEGER NOT NULL DEFAULT 5,
  current_players INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, playing, finished
  game_state JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create players table for room membership
CREATE TABLE public.game_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  player_index INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id),
  UNIQUE(room_id, player_index)
);

-- Enable Row Level Security
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_rooms
CREATE POLICY "Users can view rooms they're in"
ON public.game_rooms
FOR SELECT
USING (
  id IN (
    SELECT room_id FROM public.game_players 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Hosts can update their rooms"
ON public.game_rooms
FOR UPDATE
USING (host_id = auth.uid());

CREATE POLICY "Users can create rooms"
ON public.game_rooms
FOR INSERT
WITH CHECK (host_id = auth.uid());

-- RLS Policies for game_players
CREATE POLICY "Players can view other players in same room"
ON public.game_players
FOR SELECT
USING (
  room_id IN (
    SELECT room_id FROM public.game_players 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can join rooms"
ON public.game_players
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave rooms"
ON public.game_players
FOR DELETE
USING (user_id = auth.uid());

-- Function to update room player count
CREATE OR REPLACE FUNCTION update_room_player_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.game_rooms 
  SET current_players = (
    SELECT COUNT(*) FROM public.game_players 
    WHERE room_id = COALESCE(NEW.room_id, OLD.room_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.room_id, OLD.room_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to maintain player count
CREATE TRIGGER update_room_count_on_join
  AFTER INSERT ON public.game_players
  FOR EACH ROW EXECUTE FUNCTION update_room_player_count();

CREATE TRIGGER update_room_count_on_leave
  AFTER DELETE ON public.game_players
  FOR EACH ROW EXECUTE FUNCTION update_room_player_count();

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for game_rooms updated_at
CREATE TRIGGER update_game_rooms_updated_at
  BEFORE UPDATE ON public.game_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;