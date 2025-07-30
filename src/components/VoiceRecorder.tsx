import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  maxDuration?: number; // in seconds
  className?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  maxDuration = 60,
  className = ""
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        onRecordingComplete(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);

      toast({
        title: "Recording started",
        description: `Recording will automatically stop after ${maxDuration} seconds`,
      });

    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record your voice",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      toast({
        title: "Recording complete",
        description: `Recorded ${duration} seconds of audio`,
      });
    }
  };

  const playRecording = () => {
    if (recordedBlob && !isPlaying) {
      const audioUrl = URL.createObjectURL(recordedBlob);
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audioRef.current.play();
      setIsPlaying(true);
    } else if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Recording Controls */}
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <Button
            type="button"
            onClick={startRecording}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            disabled={isPlaying}
          >
            <Mic className="w-4 h-4" />
            Start Recording
          </Button>
        ) : (
          <Button
            type="button"
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Stop Recording
          </Button>
        )}

        {recordedBlob && (
          <Button
            type="button"
            onClick={playRecording}
            variant="outline"
            className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        )}
      </div>

      {/* Timer and Status */}
      <div className="flex items-center gap-4 text-sm">
        <div className="text-white/70">
          Duration: {formatTime(duration)} / {formatTime(maxDuration)}
        </div>
        
        {isRecording && (
          <div className="flex items-center gap-2 text-red-400">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            Recording...
          </div>
        )}
        
        {recordedBlob && !isRecording && (
          <div className="text-green-400 text-xs">
            ✓ Recording saved ({Math.round(recordedBlob.size / 1024)}KB)
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isRecording && (
        <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
          <div 
            className="h-full bg-red-500 transition-all duration-1000"
            style={{ width: `${(duration / maxDuration) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};