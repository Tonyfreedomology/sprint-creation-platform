import React from 'react';
import { motion } from 'framer-motion';
import { User, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkeuToggleProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SkeuToggle({ value, onChange, className }: SkeuToggleProps) {
  const isOn = value === 'female';

  const handleToggle = () => {
    onChange(isOn ? 'male' : 'female');
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-3">
        {/* Male Label */}
        <span className={cn(
          "text-sm font-medium transition-colors duration-200",
          !isOn ? "text-white" : "text-white/40"
        )}>
          Male
        </span>

        {/* Toggle Container */}
        <motion.button
          className="relative w-16 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          style={{
            background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
            boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(255,255,255,0.1)'
          }}
          onClick={handleToggle}
          whileTap={{ scale: 0.98 }}
        >
          {/* Track */}
          <div 
            className="absolute inset-1 rounded-full transition-all duration-300"
            style={{
              background: isOn 
                ? 'linear-gradient(145deg, #e91e63, #c2185b)' // Magenta for female
                : 'linear-gradient(145deg, #00bcd4, #0097a7)', // Blue-green for male
              boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.3)'
            }}
          />

          {/* Thumb */}
          <motion.div
            className="absolute top-1 w-6 h-6 bg-white rounded-full flex items-center justify-center"
            style={{
              boxShadow: '0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
            }}
            animate={{
              x: isOn ? 32 : 4,
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30
            }}
          >
            {/* Icon */}
            <motion.div
              animate={{
                rotate: isOn ? 360 : 0,
              }}
              transition={{
                duration: 0.3,
                ease: "easeInOut"
              }}
            >
              {isOn ? (
                <User className="w-3 h-3 text-pink-600" />
              ) : (
                <User className="w-3 h-3 text-cyan-600" />
              )}
            </motion.div>
          </motion.div>

          {/* Inner Light Effect */}
          <motion.div
            className="absolute inset-1 rounded-full pointer-events-none"
            style={{
              background: isOn 
                ? 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)'
                : 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)',
            }}
            animate={{
              opacity: isOn ? 1 : 1,
            }}
          />
        </motion.button>

        {/* Female Label */}
        <span className={cn(
          "text-sm font-medium transition-colors duration-200",
          isOn ? "text-white" : "text-white/40"
        )}>
          Female
        </span>
      </div>
    </div>
  );
}