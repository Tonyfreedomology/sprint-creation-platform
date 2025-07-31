import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedTextLoaderProps {
  messages: string[];
  currentMessageIndex: number;
}

export const AnimatedTextLoader: React.FC<AnimatedTextLoaderProps> = ({ 
  messages, 
  currentMessageIndex 
}) => {
  const [displayedMessage, setDisplayedMessage] = useState(messages[0] || '');

  useEffect(() => {
    if (messages[currentMessageIndex]) {
      setDisplayedMessage(messages[currentMessageIndex]);
    }
  }, [currentMessageIndex, messages]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-8">
        {/* Animated dots loader */}
        <div className="flex items-center justify-center space-x-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-4 h-4 bg-gradient-to-r from-[#22DFDC] to-[#22EDB6] rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Animated text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.6,
              ease: [0.59, 0.25, 0.12, 1.17],
            }}
            className="text-2xl md:text-3xl font-semibold text-white text-center max-w-2xl"
          >
            {displayedMessage}
          </motion.div>
        </AnimatePresence>

        {/* Subtle background glow effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              "radial-gradient(circle at 50% 50%, rgba(34, 223, 220, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 50%, rgba(34, 237, 182, 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 50%, rgba(34, 223, 220, 0.1) 0%, transparent 50%)",
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
};