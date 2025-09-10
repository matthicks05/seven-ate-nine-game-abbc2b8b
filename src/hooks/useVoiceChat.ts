import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const useVoiceChat = (roomId: string) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Request microphone permission
  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      
      // Stop the stream initially
      stream.getTracks().forEach(track => track.stop());
      
      toast({
        title: "Microphone access granted",
        description: "You can now use voice chat"
      });
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Enable microphone access to use voice chat",
        variant: "destructive"
      });
    }
  };

  // Start/stop recording
  const toggleRecording = async () => {
    if (!hasPermission) {
      await requestPermission();
      return;
    }

    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        streamRef.current?.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        streamRef.current = stream;
        
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm'
        });
        
        mediaRecorderRef.current = mediaRecorder;
        
        const audioChunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          // Here you would typically send the audio to other players
          // For now, we'll just show a toast
          toast({
            title: "Voice message recorded",
            description: "Audio broadcasting functionality coming soon"
          });
        };
        
        mediaRecorder.start();
        setIsRecording(true);
        
      } catch (error) {
        toast({
          title: "Recording failed",
          description: "Could not start voice recording",
          variant: "destructive"
        });
      }
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // Will be opposite of current state
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    isRecording,
    isMuted,
    hasPermission,
    toggleRecording,
    toggleMute,
    requestPermission
  };
};