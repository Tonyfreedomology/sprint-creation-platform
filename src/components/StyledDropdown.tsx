import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface StyledDropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiple?: boolean;
  values?: string[];
  onMultiChange?: (values: string[]) => void;
}

const StyledDropdown: React.FC<StyledDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className = "",
  multiple = false,
  values = [],
  onMultiChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (optionValue: string) => {
    if (multiple) {
      const newValues = values.includes(optionValue)
        ? values.filter(v => v !== optionValue)
        : [...values, optionValue];
      onMultiChange?.(newValues);
    } else {
      onChange?.(optionValue);
      setIsOpen(false);
    }
  };

  const getDisplayText = () => {
    if (multiple) {
      if (values.length === 0) return placeholder;
      if (values.length === 1) {
        const option = options.find(opt => opt.value === values[0]);
        return option?.label || values[0];
      }
      return `${values.length} selected`;
    }
    
    const selectedOption = options.find(opt => opt.value === value);
    return selectedOption?.label || placeholder;
  };

  const isSelected = (optionValue: string) => {
    return multiple ? values.includes(optionValue) : value === optionValue;
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#1E1E1E]/70 backdrop-blur border border-white/10 rounded px-4 py-3 flex items-center justify-between text-left transition-all duration-200 hover:border-[#22DFDC]/50 focus:outline-none focus:border-[#22DFDC] group"
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-white text-sm font-medium">
          {getDisplayText()}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[#22DFDC] group-hover:text-[#22EDB6]"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#2a2a2a] border-[#22DFDC]/30 rounded shadow-xl z-50 overflow-hidden"
          >
            <div className="py-2">
              {options.map((option, index) => (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionClick(option.value)}
                  className="w-full px-4 py-3 text-left hover:bg-[#22DFDC]/10 transition-colors duration-150 flex items-center justify-between group"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    {option.icon && (
                      <div className="text-[#22DFDC] group-hover:text-[#22EDB6] transition-colors">
                        {option.icon}
                      </div>
                    )}
                    <div>
                      <div className="text-white text-sm font-medium">
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-white/60 text-xs mt-1">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Radio/Circle Button */}
                  <div className="flex items-center">
                    {isSelected(option.value) ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-4 h-4 rounded-full bg-[#22DFDC] flex items-center justify-center"
                      >
                        <Check className="w-2.5 h-2.5 text-black" />
                      </motion.div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 group-hover:border-[#22DFDC]/50 transition-colors" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StyledDropdown;