import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { containsProfanity, blurProfanity, getTempBanDuration } from '@/utils/profanityFilter';
import { useToast } from '@/components/ui/use-toast';

interface ChatMessage {
  id: string;
  room_id: string;
  session_id: string;
  player_name: string;
  message: string;
  is_moderated: boolean;
  created_at: string;
}

interface BannedUser {
  id: string;
  room_id: string;
  session_id: string;
  player_name: string;
  banned_until: string;
  reason: string;
}

export const useChat = (roomId: string, sessionId: string, playerName: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [isBanned, setIsBanned] = useState(false);
  const { toast } = useToast();

  // Check if current user is banned
  const checkBanStatus = async () => {
    const { data } = await supabase
      .from('banned_users')
      .select('*')
      .eq('room_id', roomId)
      .eq('session_id', sessionId)
      .gte('banned_until', new Date().toISOString())
      .single();

    setIsBanned(!!data);
    return !!data;
  };

  // Send a chat message
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    // Check if user is banned
    const banned = await checkBanStatus();
    if (banned) {
      toast({
        title: "You are temporarily banned",
        description: "You cannot send messages due to inappropriate language",
        variant: "destructive"
      });
      return;
    }

    const hasProfanity = containsProfanity(messageText);
    
    if (hasProfanity) {
      // Temp ban the user
      const banUntil = getTempBanDuration();
      await supabase.from('banned_users').insert({
        room_id: roomId,
        session_id: sessionId,
        player_name: playerName,
        banned_until: banUntil.toISOString(),
        reason: 'Inappropriate language'
      });

      toast({
        title: "Temporarily banned",
        description: "You've been banned for 5 minutes due to inappropriate language",
        variant: "destructive"
      });

      setIsBanned(true);
    }

    // Send the message (blurred if contains profanity)
    const finalMessage = hasProfanity ? blurProfanity(messageText) : messageText;
    
    await supabase.from('chat_messages').insert({
      room_id: roomId,
      session_id: sessionId,
      player_name: playerName,
      message: finalMessage,
      is_moderated: hasProfanity
    });
  };

  // Load existing messages
  const loadMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (data) {
      setMessages(data);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!roomId) return;

    loadMessages();
    checkBanStatus();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('chat-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    // Subscribe to bans
    const bansChannel = supabase
      .channel('banned-users')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'banned_users',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        const newBan = payload.new as BannedUser;
        setBannedUsers(prev => [...prev, newBan]);
        
        // Check if this ban affects current user
        if (newBan.session_id === sessionId) {
          setIsBanned(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(bansChannel);
    };
  }, [roomId, sessionId]);

  // Check ban status periodically
  useEffect(() => {
    if (!isBanned) return;

    const interval = setInterval(async () => {
      const banned = await checkBanStatus();
      if (!banned) {
        setIsBanned(false);
        toast({
          title: "Ban lifted",
          description: "You can now send messages again",
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isBanned]);

  return {
    messages,
    sendMessage,
    isBanned,
    bannedUsers
  };
};