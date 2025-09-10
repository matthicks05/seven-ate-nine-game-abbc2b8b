-- Fix function search paths for security
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
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;