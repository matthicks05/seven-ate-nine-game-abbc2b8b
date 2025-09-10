-- Create user scores table for points system
CREATE TABLE public.user_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  last_game_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for user_scores
CREATE POLICY "Users can view all scores for leaderboard" 
ON public.user_scores 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own scores" 
ON public.user_scores 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scores" 
ON public.user_scores 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to award points for game wins
CREATE OR REPLACE FUNCTION public.award_points(p_user_id UUID, p_points INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_scores (user_id, points, games_won, games_played, last_game_at)
  VALUES (p_user_id, p_points, 1, 1, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    points = user_scores.points + p_points,
    games_won = user_scores.games_won + 1,
    games_played = user_scores.games_played + 1,
    last_game_at = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to record game played (for losses)
CREATE OR REPLACE FUNCTION public.record_game_played(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_scores (user_id, games_played, last_game_at)
  VALUES (p_user_id, 1, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    games_played = user_scores.games_played + 1,
    last_game_at = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add update timestamp trigger
CREATE TRIGGER update_user_scores_updated_at
BEFORE UPDATE ON public.user_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();