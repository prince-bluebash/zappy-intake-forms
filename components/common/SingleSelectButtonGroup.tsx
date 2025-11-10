import { motion } from 'framer-motion';
import { Option } from '../../types';
import { Check, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SingleSelectButtonGroupProps {
  options: Option[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export default function SingleSelectButtonGroup({
  options,
  selectedValue,
  onSelect,
  disabled = false,
}: SingleSelectButtonGroupProps) {
  const [showAutoAdvanceHint, setShowAutoAdvanceHint] = useState(false);

  useEffect(() => {
    // Check if user has seen hint before
    const hasSeenHint = localStorage.getItem('hasSeenAutoAdvance');
    if (!hasSeenHint) {
      setShowAutoAdvanceHint(true);
    }
  }, []);

  const handleSelect = (value: string) => {
    if (showAutoAdvanceHint) {
      localStorage.setItem('hasSeenAutoAdvance', 'true');
      setShowAutoAdvanceHint(false);
    }
    onSelect(value);
  };

  // Use horizontal layout for 2 options (like Male/Female)
  const isHorizontalLayout = options.length === 2;
  
  return (
    <div className={isHorizontalLayout ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
      {options.map((option, index) => {
        const isSelected = selectedValue === option.value;
        return (
          <motion.button
            key={option.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 + Math.random() * 0.02, duration: 0.3 }}
            onClick={() => !disabled && handleSelect(option.value)}
            disabled={disabled}
            whileTap={disabled ? {} : { scale: 0.98 }}
            whileHover={disabled ? {} : (isSelected ? { y: -2 } : {})}
            className={`option-button w-full py-3 sm:py-[18px] px-4 sm:px-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 text-left group relative overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0D9488]/20 ${
              disabled
                ? 'border-[#E8E8E8] bg-gray-100 cursor-not-allowed opacity-60'
                : isSelected
                ? 'border-[#1a7f72] bg-[#e6f3f2] shadow-md'
                : 'border-[#E8E8E8] bg-white hover:border-[#1a7f72]/30 hover:shadow-md hover:scale-[1.02] shadow-sm'
            }`}
            style={{ transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <div className="flex items-center justify-between gap-4">
              <span className={`text-base sm:text-lg leading-relaxed ${isSelected ? 'text-[#0D9488] font-medium' : 'text-[#2D3436]'}`}>
                {option.label}
              </span>
              {isSelected ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-6 h-6 rounded-full bg-[#00A896] flex items-center justify-center flex-shrink-0 shadow-md"
                >
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </motion.div>
              ) : (
                <motion.div 
                  className="w-6 h-6 rounded-full border-2 border-[#E8E8E8] group-hover:border-[#0D9488]/50 transition-all flex-shrink-0"
                  whileHover={{ scale: [1, 1.1, 1.05] }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </div>
          </motion.button>
        );
      })}
      
      {showAutoAdvanceHint && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-neutral-600 text-center mt-3 flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#1a7f72]" />
          <span>Tip: Selection advances automatically</span>
        </motion.div>
      )}
    </div>
  );
}
