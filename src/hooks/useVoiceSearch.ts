import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useVoiceSearch = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Verificar suporte no primeiro uso
  useState(() => {
    const supported = 'MediaRecorder' in window && 'navigator' in window && 'mediaDevices' in navigator;
    setIsSupported(supported);
  });

  const startRecording = useCallback(async () => {
    if (!isSupported || isRecording) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      return true;
    } catch (error) {
      console.error('Error starting voice recording:', error);
      return false;
    }
  }, [isSupported, isRecording]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!isRecording || !mediaRecorderRef.current) return null;

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      
      mediaRecorder.onstop = async () => {
        try {
          // Stop all tracks
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
          
          // Create audio blob
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mediaRecorder.mimeType || 'audio/webm' 
          });

          // Convert to base64 for sending to edge function
          const arrayBuffer = await audioBlob.arrayBuffer();
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

          // Send to transcription service
          const { data, error } = await supabase.functions.invoke('voice-to-text', {
            body: { audio: base64Audio }
          });

          if (error) {
            console.error('Transcription error:', error);
            resolve(null);
            return;
          }

          resolve(data?.text || null);
        } catch (error) {
          console.error('Error processing voice recording:', error);
          resolve(null);
        }
      };

      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorderRef.current = null;
    });
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    }
  }, [isRecording]);

  return {
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording
  };
};