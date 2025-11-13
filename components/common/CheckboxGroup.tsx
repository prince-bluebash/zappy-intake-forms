import React from 'react';
import { Option } from '../../types';
import { Info, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Label } from '../ui/label';

interface CheckboxGroupProps {
  id: string;
  label?: string;
  help_text?: string;
  required?: boolean;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  exclusiveValue?: string;
  exclusiveLabel?: string;
  exclusiveMessage?: string;
  onExclusiveSelect?: () => void;
  variant?: 'default' | 'pills'; // New: pill variant for mobile
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  id,
  label,
  help_text,
  required,
  options,
  selectedValues,
  onChange,
  exclusiveValue,
  exclusiveLabel,
  onExclusiveSelect,
  variant = 'pills', // Default to pills for mobile optimization
}) => {
  const handleChange = (value: string, checked: boolean) => {
    let newValues: string[];

    if (exclusiveValue && value === exclusiveValue) {
      // If selecting exclusive option, clear all others
      newValues = checked ? [exclusiveValue] : [];
      if (checked && onExclusiveSelect) {
        onExclusiveSelect();
      }
    } else {
      // If selecting non-exclusive option, remove exclusive if present
      newValues = selectedValues.filter((v) => v !== exclusiveValue);
      
      if (checked) {
        newValues.push(value);
      } else {
        newValues = newValues.filter((v) => v !== value);
      }
    }

    onChange(newValues);
  };

  // Create options array with exclusive option if provided
  const allOptions = [...options];
  if (exclusiveValue && exclusiveLabel) {
    allOptions.push({ value: exclusiveValue, label: exclusiveLabel });
  }

  // Sort options: exclusive option always first
  const sortedOptions = [...allOptions];
  if (exclusiveValue) {
    const exclusiveIndex = sortedOptions.findIndex(opt => opt.value === exclusiveValue);
    if (exclusiveIndex >= 0) {
      const [exclusiveOption] = sortedOptions.splice(exclusiveIndex, 1);
      sortedOptions.unshift(exclusiveOption); // Always first
    }
  }

  // Pill variant render
  if (variant === 'pills') {
    return (
      <div>
        {label && (
          <Label className="text-xl sm:text-2xl text-neutral-900">
            {label}
            {required && <span className="text-[#FF7A59] ml-1">*</span>}
          </Label>
        )}
        {help_text && (
          <p className="text-sm leading-relaxed text-neutral-600 mt-2 mb-4 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#00A896]" />
            {help_text}
          </p>
        )}
        <div className="flex flex-wrap gap-2.5 mt-3">
          {sortedOptions.map((option, index) => {
            const isChecked = selectedValues.includes(option.value);
            const isExclusive = exclusiveValue === option.value;
            
            return (
              <motion.button
                key={option.value}
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                onClick={() => handleChange(option.value, !isChecked)}
                whileTap={{ scale: 0.95 }}
                className={`
                  pill-button relative min-h-[48px] px-4 py-3 rounded-xl border-2 transition-all duration-300 text-center
                  focus:outline-none focus-visible:ring-4 focus-visible:ring-[#00A896]/20 text-sm sm:text-base
                  ${isExclusive
                    ? isChecked
                      ? 'border-[#8B7FC5] bg-[#E8E7F3] text-[#8B7FC5] shadow-md font-medium'
                      : 'border-[#D4D0E8] bg-[#F8F7FC] text-[#8B7FC5] hover:border-[#8B7FC5] hover:shadow-sm'
                    : isChecked
                      ? 'border-[#00A896] bg-[#E0F5F3] text-[#00A896] shadow-md font-medium'
                      : 'border-[#E8E8E8] bg-white text-[#2D3436] hover:border-[#00A896]/40 hover:shadow-md hover:scale-[1.02]'
                  }
                `}
              >
                <div className="flex items-center gap-2 justify-center">
                  {isChecked && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      {isExclusive ? (
                        <X className="w-4 h-4" strokeWidth={2.5} />
                      ) : (
                        <Check className="w-4 h-4" strokeWidth={2.5} />
                      )}
                    </motion.div>
                  )}
                  <span className="leading-relaxed">
                    {option.label}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // Default variant (large cards)
  return (
    <div>
      {label && (
        <Label className="mb-3 text-xl sm:text-2xl text-neutral-900">
          {label}
          {required && <span className="text-[#FF7A59] ml-1">*</span>}
        </Label>
      )}
      {help_text && (
        <p className="text-sm leading-relaxed text-neutral-600 mb-4 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#00A896]" />
          {help_text}
        </p>
      )}
      <div className="space-y-4">
        {sortedOptions.map((option, index) => {
          const isChecked = selectedValues.includes(option.value);
          const isExclusive = exclusiveValue === option.value;
          
          return (
            <motion.button
              key={option.value}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 + Math.random() * 0.02, duration: 0.3 }}
              onClick={() => handleChange(option.value, !isChecked)}
              whileTap={{ scale: 0.98 }}
              whileHover={isChecked ? { y: -2 } : {}}
              className={`w-full py-5 sm:py-[18px] px-5 sm:px-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 text-left group relative overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-[#00A896]/20 ${
                isExclusive
                  ? isChecked
                    ? 'border-[#8B7FC5] bg-[#E8E7F3] shadow-md'
                    : 'border-[#D4D0E8] bg-[#F8F7FC] hover:border-[#8B7FC5] hover:shadow-md shadow-sm'
                  : isChecked
                    ? 'border-[#00A896] bg-[#E0F5F3] shadow-md'
                    : 'border-[#E8E8E8] bg-white hover:border-[#00A896]/30 hover:shadow-md hover:scale-[1.02] shadow-sm'
              }`}
              style={{ transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              <div className="flex items-center justify-between gap-4">
                <span className={`text-base sm:text-lg leading-relaxed ${
                  isExclusive
                    ? isChecked ? 'text-[#8B7FC5] font-medium' : 'text-[#8B7FC5]'
                    : isChecked ? 'text-[#00A896] font-medium' : 'text-[#2D3436]'
                }`}>
                  {option.label}
                </span>
                {isChecked ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                      isExclusive
                        ? 'bg-[#8B7FC5]'
                        : 'bg-[#00A896]'
                    }`}
                  >
                    {isExclusive ? (
                      <X className="w-4 h-4 text-white" strokeWidth={3} />
                    ) : (
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    className={`w-6 h-6 rounded-full border-2 transition-all flex-shrink-0 ${
                      isExclusive
                        ? 'border-[#8B7FC5]'
                        : 'border-[#E8E8E8] group-hover:border-[#00A896]/50'
                    }`}
                    whileHover={{ scale: [1, 1.1, 1.05] }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default CheckboxGroup;
