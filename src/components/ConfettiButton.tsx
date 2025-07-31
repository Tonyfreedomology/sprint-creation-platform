import React from 'react';
import confetti from 'canvas-confetti';

interface ConfettiButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const ConfettiButton: React.FC<ConfettiButtonProps> = ({
  children,
  onClick,
  className = '',
  style = {},
  disabled = false,
  type = 'button'
}) => {
  const triggerConfetti = () => {
    // Create multiple bursts for a more dramatic effect
    const colors = ['#22DFDC', '#22EDB6', '#ffffff', '#ffd700'];
    
    // First burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
      shapes: ['circle', 'square'],
      scalar: 1.2,
    });
    
    // Second burst with slight delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: colors,
        shapes: ['circle'],
        scalar: 0.8,
      });
    }, 250);
  };

  const handleClick = () => {
    triggerConfetti();
    onClick?.();
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`px-6 py-3 text-base rounded-full font-medium text-white transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #22DFDC, #22EDB6)',
        border: 'none',
        boxShadow: '0 0 20px rgba(34, 223, 220, 0.4), 0 4px 15px rgba(0, 0, 0, 0.2)',
        ...style
      }}
    >
      {children}
    </button>
  );
};

export default ConfettiButton;