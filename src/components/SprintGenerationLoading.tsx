import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';
import { AnimatedTextLoader } from './AnimatedTextLoader';

const loadingMessages = [
  "Analyzing your sprint content",
  "Mapping out a growth plan", 
  "Gathering the world's best ideas",
  "Building lesson sequence",
  "Crafting daily transformations",
  "Personalizing your unique voice",
  "Finalizing your masterpiece"
];

interface SprintGenerationLoadingProps {
  sprintTitle: string;
  sprintDuration: string;
  creatorName: string;
  currentStep?: string;
  progress?: number;
  onComplete?: () => void;
}

export const SprintGenerationLoading: React.FC<SprintGenerationLoadingProps> = ({ 
  sprintTitle, 
  sprintDuration, 
  creatorName,
  currentStep: providedStep = '',
  progress: providedProgress = 0,
  onComplete
}) => {
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  React.useEffect(() => {
    if (providedProgress > 0 && providedProgress >= 100) {
      // When we receive completion signal, quickly finish the progress bar
      setIsCompleting(true);
      const completeTimer = setTimeout(() => {
        setOverallProgress(100);
        const redirectTimer = setTimeout(() => {
          onComplete?.();
        }, 800); // Small delay after reaching 100% before redirect
        return () => clearTimeout(redirectTimer);
      }, 500);
      return () => clearTimeout(completeTimer);
    } else if (providedProgress > 0) {
      // Use provided progress
      setOverallProgress(providedProgress);
      
      // Update message based on progress
      const messageIndex = Math.min(
        Math.floor((providedProgress / 100) * loadingMessages.length),
        loadingMessages.length - 1
      );
      setCurrentMessageIndex(messageIndex);
    } else {
      // Fallback simulation - progress over 25 seconds
      const interval = setInterval(() => {
        setOverallProgress(prev => {
          const increment = 100 / (25 * 1000 / 500); // 25 seconds total, updating every 500ms
          const newProgress = Math.min(prev + increment, 95); // Cap at 95% until actual completion
          
          // Update message based on progress
          const messageIndex = Math.min(
            Math.floor((newProgress / 100) * loadingMessages.length),
            loadingMessages.length - 1
          );
          setCurrentMessageIndex(messageIndex);
          
          return newProgress;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [providedProgress, onComplete]);

  // Change message every few seconds for a more dynamic feel
  useEffect(() => {
    if (!isCompleting && overallProgress < 90) {
      const messageInterval = setInterval(() => {
        setCurrentMessageIndex(prev => {
          const maxIndex = Math.min(
            Math.floor((overallProgress / 100) * loadingMessages.length) + 1,
            loadingMessages.length - 1
          );
          return prev >= maxIndex ? 0 : prev + 1;
        });
      }, 3500);

      return () => clearInterval(messageInterval);
    }
  }, [overallProgress, isCompleting]);

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div className="max-w-4xl mx-auto space-y-12 text-center">
          {/* Header */}
          <div className="space-y-6">
            <div className="w-24 h-24 bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,223,220,0.3)]">
              <Zap className="w-12 h-12 text-black" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold gradient-text">
                Creating Your Sprint
              </h1>
              <p className="text-xl text-white/90">
                <strong className="gradient-text">{sprintTitle}</strong> for {creatorName}
              </p>
              <p className="text-white/70">
                Your {sprintDuration}-day transformational experience is being crafted
              </p>
            </div>
          </div>

          {/* Main Loader Component */}
          <div className="my-16">
            <AnimatedTextLoader 
              messages={loadingMessages} 
              currentMessageIndex={currentMessageIndex}
            />
          </div>

          {/* Progress Bar */}
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Progress</span>
              <span className="text-2xl font-bold gradient-text">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <Progress 
              value={overallProgress} 
              className="h-4 bg-white/10 shadow-inner" 
            />
          </div>

          {/* Bottom Message */}
          <div className="mt-12 text-center">
            <p className="text-white/60 text-sm">
              Hang tight - we're building something amazing for you
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};