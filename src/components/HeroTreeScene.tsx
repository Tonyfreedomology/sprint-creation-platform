import React, { useEffect, useRef } from 'react';
import { initHeroScene } from './heroTreeScene.js';

interface HeroTreeSceneProps {
  className?: string;
}

export const HeroTreeScene: React.FC<HeroTreeSceneProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize the Three.js scene
    cleanupRef.current = initHeroScene(containerRef.current);

    // Cleanup function
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ 
        background: 'radial-gradient(ellipse at center, rgba(3, 26, 19, 0.8) 0%, rgba(17, 17, 17, 1) 100%)'
      }}
    />
  );
};