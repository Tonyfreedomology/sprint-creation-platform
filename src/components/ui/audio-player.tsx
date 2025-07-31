import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, Download } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  isPlaying?: boolean;
  onPlayToggle?: () => void;
  onDownload?: () => void;
  className?: string;
  showDownload?: boolean;
  // New props to sync with external audio
  externalAudio?: HTMLAudioElement;
}

export function AudioPlayer({ 
  audioUrl, 
  title, 
  isPlaying = false, 
  onPlayToggle, 
  onDownload,
  className,
  showDownload = true,
  externalAudio 
}: AudioPlayerProps) {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync with external audio element if provided
  useEffect(() => {
    if (!externalAudio) return;

    const handleLoadedMetadata = () => {
      setDuration(externalAudio.duration);
      setIsLoaded(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(externalAudio.currentTime);
    };

    const handleEnded = () => {
      setCurrentTime(0);
    };

    externalAudio.addEventListener('loadedmetadata', handleLoadedMetadata);
    externalAudio.addEventListener('timeupdate', handleTimeUpdate);
    externalAudio.addEventListener('ended', handleEnded);

    // Set initial values if already loaded
    if (externalAudio.duration) {
      setDuration(externalAudio.duration);
      setIsLoaded(true);
    }

    return () => {
      externalAudio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      externalAudio.removeEventListener('timeupdate', handleTimeUpdate);
      externalAudio.removeEventListener('ended', handleEnded);
    };
  }, [externalAudio]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!externalAudio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    externalAudio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl p-4 backdrop-blur-sm border border-white/10",
      "bg-gradient-to-r from-neutral-900/80 to-neutral-800/80",
      className
    )}>
      {/* Ambient glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#22DFDC]/10 to-[#22EDB6]/10 blur-sm -z-10" />
      
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onPlayToggle}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] hover:scale-105 transition-all duration-200 text-black"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </Button>

        {/* Progress and Info */}
        <div className="flex-1 min-w-0">
          {title && (
            <div className="text-sm font-medium text-white mb-1 truncate">
              {title}
            </div>
          )}
          
          {/* Progress Bar */}
          <div 
            className="relative h-2 bg-white/10 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
            
            {/* Progress handle */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
          
          {/* Time Display */}
          <div className="flex justify-between text-xs text-white/60 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{isLoaded ? formatTime(duration) : '--:--'}</span>
          </div>
        </div>

        {/* Additional Controls */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-white/60" />
          
          {showDownload && onDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className="w-8 h-8 text-white/60 hover:text-white hover:bg-white/10"
            >
              <Download className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Animated waves visualization */}
      {isPlaying && (
        <div className="absolute left-16 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-0.5 bg-gradient-to-t from-[#22DFDC] to-[#22EDB6] rounded-full animate-pulse"
              style={{
                height: `${8 + Math.sin(Date.now() * 0.01 + i) * 4}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${0.8 + i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}