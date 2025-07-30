import React from 'react';
import { motion } from 'framer-motion';

interface ProgressPillProps {
  completed: number;
  total: number;
  label?: string;
  className?: string;
}

export function ProgressPill({ completed, total, label = "Publishing Progress", className = "" }: ProgressPillProps) {
  const percentage = Math.round((completed / total) * 100);

  return (
    <motion.div 
      className={`relative px-4 py-2 rounded-full backdrop-blur-sm bg-gradient-glassmorphic border border-primary/20 ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-primary font-medium">{completed} / {total}</span>
      </div>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/20 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-primary"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

interface TimestampPillProps {
  timestamp: string;
  className?: string;
}

export function TimestampPill({ timestamp, className = "" }: TimestampPillProps) {
  return (
    <div className={`px-4 py-2 rounded-full backdrop-blur-sm bg-gradient-glassmorphic border border-primary/20 ${className}`}>
      <div className="text-sm text-muted-foreground">
        {timestamp}
      </div>
    </div>
  );
}