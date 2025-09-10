-- Add chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_moderated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add banned users table for temporary bans
CREATE TABLE public.banned_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  banned_until TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT DEFAULT 'Inappropriate language',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Create policies for chat messages (public access for game functionality)
CREATE POLICY "Anyone can view chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create chat messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (true);

-- Create policies for banned users (public access for game functionality)
CREATE POLICY "Anyone can view banned users" 
ON public.banned_users 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create banned users" 
ON public.banned_users 
FOR INSERT 
WITH CHECK (true);

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.banned_users;

-- Set replica identity for real-time updates
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.banned_users REPLICA IDENTITY FULL;