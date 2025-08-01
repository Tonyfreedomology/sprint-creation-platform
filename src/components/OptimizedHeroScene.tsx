import React from 'react';

export const OptimizedHeroScene: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}>
      {/* CSS-based floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 25 }).map((_, i) => {
          const delay = Math.random() * 10;
          const duration = 8 + Math.random() * 4;
          const left = Math.random() * 70 + 30;
          const animationName = `float-${i}`;
          
          return (
            <div key={i}>
              <style>
                {`
                  @keyframes ${animationName} {
                    0%, 100% { 
                      transform: translateY(0px) translateX(0px);
                      opacity: 0.4;
                    }
                    25% { 
                      transform: translateY(-20px) translateX(10px);
                      opacity: 0.8;
                    }
                    50% { 
                      transform: translateY(-40px) translateX(-5px);
                      opacity: 1;
                    }
                    75% { 
                      transform: translateY(-60px) translateX(15px);
                      opacity: 0.6;
                    }
                  }
                `}
              </style>
              <div
                className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 opacity-80"
                style={{
                  left: `${left}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `${animationName} ${duration}s ease-in-out infinite`,
                  animationDelay: `${delay}s`,
                  boxShadow: '0 0 6px #22dfdc, 0 0 12px #22dfdc',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* SVG Tree with mouse interaction */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full group">
        <svg
          viewBox="0 0 200 300"
          className="w-full h-full opacity-60 group-hover:opacity-80 transition-all duration-300 group-hover:scale-105"
          style={{
            filter: 'drop-shadow(0 0 8px #22dfdc)',
          }}
        >
          <defs>
            <linearGradient id="treeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1fae6b" />
              <stop offset="100%" stopColor="#34e7a8" />
            </linearGradient>
          </defs>
          
          {/* Main trunk */}
          <path
            d="M100 280 L100 200"
            stroke="url(#treeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            className="animate-[draw_2s_ease-out_forwards]"
            style={{
              strokeDasharray: 1000,
              strokeDashoffset: 1000,
              animation: 'draw 2s ease-out forwards'
            }}
          />
          
          {/* Level 1 branches */}
          <path
            d="M100 220 L80 180 M100 220 L120 180"
            stroke="url(#treeGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            style={{
              strokeDasharray: 1000,
              strokeDashoffset: 1000,
              animation: 'draw 2s ease-out 0.3s forwards',
              opacity: 0
            }}
          />
          
          {/* Level 2 branches */}
          <path
            d="M80 190 L65 160 M80 190 L90 155 M120 190 L110 155 M120 190 L135 160"
            stroke="url(#treeGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            style={{
              strokeDasharray: 1000,
              strokeDashoffset: 1000,
              animation: 'draw 2s ease-out 0.6s forwards',
              opacity: 0
            }}
          />
          
          {/* Level 3 branches */}
          <path
            d="M65 170 L55 145 M65 170 L70 140 M90 165 L85 140 M90 165 L95 140 M110 165 L105 140 M110 165 L115 140 M135 170 L130 140 M135 170 L145 145"
            stroke="url(#treeGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              strokeDasharray: 1000,
              strokeDashoffset: 1000,
              animation: 'draw 2s ease-out 0.9s forwards',
              opacity: 0
            }}
          />
        </svg>
      </div>

      <style>
        {`
          @keyframes draw {
            from {
              stroke-dasharray: 1000;
              stroke-dashoffset: 1000;
              opacity: 0;
            }
            to {
              stroke-dasharray: 1000;
              stroke-dashoffset: 0;
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};