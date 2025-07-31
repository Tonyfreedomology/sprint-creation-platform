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
    <div className={cn("flex justify-center", className)}>
      {/* Toggle Container */}
      <motion.button
        className="relative w-20 h-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        style={{
          background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
          boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.7), inset -3px -3px 6px rgba(255,255,255,0.1)'
        }}
        onClick={handleToggle}
        whileTap={{ scale: 0.98 }}
      >
        {/* Track */}
        <div 
          className="absolute inset-1 rounded-xl transition-all duration-300"
          style={{
            background: isOn 
              ? 'linear-gradient(145deg, #ff1493, #ff69b4)' // Bright magenta for female
              : 'linear-gradient(145deg, #00ffff, #0080ff)', // Bright cyan-blue for male
            boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.4)'
          }}
        />

        {/* Thumb */}
        <motion.div
          className="absolute top-1 w-8 h-8 bg-white rounded-xl flex items-center justify-center"
          style={{
            boxShadow: '0 3px 6px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)'
          }}
          animate={{
            x: isOn ? 44 : 4,
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
              <User className="w-4 h-4 text-pink-600" />
            ) : (
              <User className="w-4 h-4 text-cyan-600" />
            )}
          </motion.div>
        </motion.div>

        {/* Inner Light Effect */}
        <motion.div
          className="absolute inset-1 rounded-xl pointer-events-none"
          style={{
            background: isOn 
              ? 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.4) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 50%)',
          }}
          animate={{
            opacity: 1,
          }}
        />
      </motion.button>
    </div>
  );
}