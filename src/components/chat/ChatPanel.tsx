import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, MessageCircle, Volume2, VolumeX } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  roomId: string;
  sessionId: string;
  playerName: string;
  isVisible: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  roomId, 
  sessionId, 
  playerName, 
  isVisible 
}) => {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, sendMessage, isBanned } = useChat(roomId, sessionId, playerName);
  const { 
    isRecording, 
    isMuted, 
    hasPermission, 
    toggleRecording, 
    toggleMute, 
    requestPermission 
  } = useVoiceChat(roomId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isBanned) return;
    
    await sendMessage(messageInput);
    setMessageInput('');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isVisible) return null;

  return (
    <Card className="w-80 h-full flex flex-col bg-background/95 backdrop-blur">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Chat & Voice</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            Room: {roomId}
          </Badge>
        </div>
      </div>

      {/* Voice Controls */}
      <div className="p-3 border-b bg-muted/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Voice Chat</span>
          <div className="flex gap-2">
            {!hasPermission ? (
              <Button
                size="sm"
                variant="outline"
                onClick={requestPermission}
                className="text-xs"
              >
                Enable Mic
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant={isRecording ? "destructive" : "default"}
                  onClick={toggleRecording}
                  className={cn(
                    "transition-all",
                    isRecording && "animate-pulse"
                  )}
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant={isMuted ? "secondary" : "outline"}
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
        {isRecording && (
          <div className="mt-2">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
              Recording...
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex flex-col gap-1 p-2 rounded-lg",
                message.session_id === sessionId
                  ? "bg-primary/10 ml-4"
                  : "bg-muted mr-4"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  {message.player_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{message.message}</span>
                {message.is_moderated && (
                  <Badge variant="destructive" className="text-xs">
                    Moderated
                  </Badge>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-3">
        {isBanned && (
          <div className="mb-2 p-2 bg-destructive/10 text-destructive text-xs rounded">
            You are temporarily banned from chatting due to inappropriate language.
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={isBanned ? "You are banned..." : "Type a message..."}
            disabled={isBanned}
            className="flex-1"
            maxLength={200}
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={!messageInput.trim() || isBanned}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ChatPanel;