-- Remove auth dependencies and add session-based approach
-- Drop existing foreign key constraints and policies
DROP POLICY IF EXISTS "Users can view rooms they're in" ON public.game_rooms;
DROP POLICY IF EXISTS "Hosts can update their rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Players can view other players in same room" ON public.game_players;
DROP POLICY IF EXISTS "Users can join rooms" ON public.game_players;
DROP POLICY IF EXISTS "Users can leave rooms" ON public.game_players;

-- Modify tables to use session IDs instead of user IDs
ALTER TABLE public.game_rooms DROP CONSTRAINT IF EXISTS game_rooms_host_id_fkey;
ALTER TABLE public.game_players DROP CONSTRAINT IF EXISTS game_players_user_id_fkey;

-- Update columns to use session IDs
ALTER TABLE public.game_rooms RENAME COLUMN host_id TO host_session_id;
ALTER TABLE public.game_players RENAME COLUMN user_id TO session_id;

-- Update data types to TEXT for session IDs
ALTER TABLE public.game_rooms ALTER COLUMN host_session_id TYPE TEXT;
ALTER TABLE public.game_players ALTER COLUMN session_id TYPE TEXT;

-- Disable RLS since we don't need user-specific access control
ALTER TABLE public.game_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players DISABLE ROW LEVEL SECURITY;

-- Add cleanup function to remove old rooms
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS void AS $$
BEGIN
  -- Delete rooms older than 24 hours that are not playing
  DELETE FROM public.game_rooms 
  WHERE created_at < NOW() - INTERVAL '24 hours' 
    AND status != 'playing';
END;
$$ LANGUAGE plpgsql SET search_path = public;