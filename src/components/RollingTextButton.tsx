import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface RollingTextButtonProps {
  children: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  duration?: number;
  stagger?: number;
}

const RollingTextButton: React.FC<RollingTextButtonProps> = ({
  children,
  onClick,
  className = '',
  style = {},
  duration = 0.4,
  stagger = 35
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Generate unique class name for scoped styles
  const uniqueId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);
  const innerClassName = `rolling-text-inner-${uniqueId}`;
  
  // Calculate line height and offset for the rolling effect
  const fontSize = 18; // Default button font size
  const lineHeight = 1.2;
  const absoluteLineHeight = fontSize * lineHeight;
  const yOffset = `-${absoluteLineHeight}px`;
  
  // Convert stagger percentage to factor
  const staggerFactor = stagger / 100;
  
  const styles = `
    .${innerClassName} {
      display: flex;
      overflow: hidden;
      width: max-content;
      user-select: none;
      text-shadow: 0 ${absoluteLineHeight}px 0 currentColor;
    }
    
    .${innerClassName} span {
      display: block;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      white-space: pre;
      flex-shrink: 0;
      line-height: ${lineHeight};
      color: currentColor;
    }
  `;
  
  const spanVariants = {
    initial: { y: "0%" },
    hover: { y: yOffset }
  };
  
  return (
    <>
      <style>{styles}</style>
      <button
        className={className}
        style={style}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={innerClassName}>
          {[...children].map((char, index) => {
            const delay = children.length > 0 
              ? (duration / children.length) * index * staggerFactor 
              : 0;
            
            return (
              <motion.span
                key={index}
                variants={spanVariants}
                initial="initial"
                animate={isHovered ? "hover" : "initial"}
                transition={{
                  type: "spring",
                  duration,
                  bounce: 0,
                  delay
                }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            );
          })}
        </div>
      </button>
    </>
  );
};

export default RollingTextButton;