-- Re-enable RLS with permissive policies for public game access
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

-- Allow all operations on game rooms (public game, no sensitive data)
CREATE POLICY "Allow all access to game rooms"
ON public.game_rooms
FOR ALL
USING (true)
WITH CHECK (true);

-- Allow all operations on game players (public game, no sensitive data)  
CREATE POLICY "Allow all access to game players"
ON public.game_players
FOR ALL
USING (true)
WITH CHECK (true);