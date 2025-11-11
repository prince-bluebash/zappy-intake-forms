import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ScreenProps } from './common';
import ScreenLayout from '../common/ScreenLayout';
import Input from '../ui/Input';
import NavigationButtons from '../common/NavigationButtons';
import { TextScreen as TextScreenType } from '../../types';

const padDatePart = (value: number) => value.toString().padStart(2, '0');

const formatDateToISO = (date: Date) => {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  return `${year}-${month}-${day}`;
};

const formatDateToDisplay = (date: Date) => {
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const parseDateString = (value: string): Date | null => {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    if (parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day) {
      return parsed;
    }
    return null;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [month, day, year] = value.split('/').map(Number);
    const parsed = new Date(year, month - 1, day);
    if (parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day) {
      return parsed;
    }
  }

  return null;
};

const getYearsAgoDate = (years: number) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
};

const MINIMUM_SUPPORTED_AGE = 18;

const TextScreen: React.FC<ScreenProps & { screen: TextScreenType }> = ({ screen, answers, updateAnswer, onSubmit, showBack, onBack, headerSize, onSignInClick }) => {
  const { id, title, help_text, placeholder, required, validation, mask, min_today, multiline } = screen;
  const storedValue = answers[id] || '';
  const [error, setError] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDobField = id === 'demographics.dob';
  const storedDobDate = isDobField ? parseDateString(storedValue) : null;
  const dobInputValue = isDobField && storedDobDate ? formatDateToISO(storedDobDate) : '';
  const effectiveMinAge = isDobField ? Math.max(validation?.min_age ?? 0, MINIMUM_SUPPORTED_AGE) : validation?.min_age;
  const dobMax = isDobField ? formatDateToISO(getYearsAgoDate(effectiveMinAge ?? MINIMUM_SUPPORTED_AGE)) : undefined;
  const dobMin =
    isDobField && validation?.max_age !== undefined
      ? formatDateToISO(getYearsAgoDate(validation.max_age))
      : undefined;
  const value = storedValue;
  
  useEffect(() => {
    if (multiline) {
      textareaRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  }, [multiline]);

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoValue = e.target.value;
    if (!isoValue) {
      updateAnswer(id, '');
      if (error) {
        validate('');
      }
      return;
    }

    const parsed = parseDateString(isoValue);
    if (parsed) {
      const displayValue = formatDateToDisplay(parsed);
      updateAnswer(id, displayValue);
      if (error) {
        validate(displayValue);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (isDobField && e.target instanceof HTMLInputElement) {
      handleDobChange(e);
      return;
    }

    let inputValue = e.target.value;
    
    if (mask === '##-##-####' || mask === '##/##/####') {
        const separator = mask.includes('/') ? '/' : '-';
        const digitsOnly = inputValue.replace(/\D/g, '');
        const limitedDigits = digitsOnly.slice(0, 8);
        let formattedValue = '';
        if (limitedDigits.length > 4) {
            formattedValue = `${limitedDigits.slice(0, 2)}${separator}${limitedDigits.slice(2, 4)}${separator}${limitedDigits.slice(4)}`;
        } else if (limitedDigits.length > 2) {
            formattedValue = `${limitedDigits.slice(0, 2)}${separator}${limitedDigits.slice(2)}`;
        } else {
            formattedValue = limitedDigits;
        }
        inputValue = formattedValue;
    }

    updateAnswer(id, inputValue);
    if (error) {
      validate(inputValue);
    }
  };

  const validate = (currentValue: string): boolean => {
    if (required && !currentValue) {
      setError(isDobField ? 'Enter your date of birth to continue.' : 'This field is required.');
      return false;
    }

    if (!currentValue) {
      setError(undefined);
      return true; // Don't validate empty non-required fields
    }

    if (validation?.pattern && !new RegExp(validation.pattern).test(currentValue)) {
      const patternMessage =
        (isDobField && 'Enter your date of birth as MM/DD/YYYY.') ||
        validation.error ||
        'Enter a valid value.';
      setError(patternMessage);
      return false;
    }

    // Date-based validations
    if (mask === '##/##/####' || mask === '##-##-####' || isDobField) {
      const parts = currentValue.includes('/') ? currentValue.split('/') : currentValue.split('-');
      
      if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        const [month, day, year] = parts.map(Number);
        
        const inputDate = new Date(year, month - 1, day);
        // Check if the date is valid (e.g., not Feb 30)
        if (isNaN(inputDate.getTime()) || inputDate.getFullYear() !== year || inputDate.getMonth() !== month - 1 || inputDate.getDate() !== day) {
          setError(
            (isDobField && 'That date doesn’t look right. Double-check the month, day, and year.') ||
            validation?.error ||
            'Please enter a valid date.'
          );
          return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (inputDate > today) {
          setError(
            isDobField
              ? 'Dates in the future don’t work—please use your actual birth date.'
              : 'Date cannot be in the future.'
          );
          return false;
        }

        // Age validation
        if (validation?.min_age !== undefined || validation?.max_age !== undefined || isDobField) {
          let age = today.getFullYear() - inputDate.getFullYear();
          const m = today.getMonth() - inputDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < inputDate.getDate())) {
            age--;
          }
          const minimumAllowedAge = isDobField ? Math.max(validation?.min_age ?? 0, MINIMUM_SUPPORTED_AGE) : validation?.min_age;
          if (minimumAllowedAge !== undefined && age < minimumAllowedAge) {
            setError(
              isDobField
                ? `We’re only able to continue with patients who are at least ${minimumAllowedAge} years old.`
                : (validation.error || 'Value is below the minimum allowed.')
            );
            return false;
          }
          if (validation?.max_age !== undefined && age > validation.max_age) {
            setError(
              isDobField
                ? `We’re only able to support patients up to ${validation.max_age} years old.`
                : (validation.error || 'Value is above the maximum allowed.')
            );
            return false;
          }
        }
        // min_today validation (for future-only fields like appointments)
        if (min_today) {
          if (inputDate < today) {
            setError("Date cannot be in the past.");
            return false;
          }
        }
      }
    }
    
    setError(undefined);
    return true;
  };
  
  const handleBlur = () => {
    validate(value);
  }

  const handleSubmit = () => {
    if (validate(value)) {
      onSubmit();
    } else {
      if (multiline) {
        textareaRef.current?.focus();
      } else {
        inputRef.current?.focus();
      }
    }
  };

  const isComplete = !required || (value && value.length > 0);
  const isEmailField = id === 'email';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <ScreenLayout title={title} helpText={help_text} headerSize={headerSize}>
        
        {/* 🎁 PROMOTIONAL BANNER - Only show on email screen */}
        {isEmailField && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-[#00A896]/8 via-[#FF6B6B]/8 to-[#00A896]/8 border-2 border-[#FF6B6B]/20 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-sm">
              
              {/* ✅ ANIMATED CHECKMARK */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#00A896] flex items-center justify-center flex-shrink-0 shadow-md"
              >
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </motion.div>
              
              {/* 📝 PROMOTIONAL TEXT */}
              <p className="text-neutral-700">
                <span className="bg-gradient-to-r from-[#00A896] to-[#FF6B6B] bg-clip-text text-transparent">
                  Promo Applied:
                </span> Free Online Consultation
              </p>
              
            </div>
          </motion.div>
        )}
        
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="w-full space-y-8">
            {multiline ? (
              <textarea
                ref={textareaRef}
                id={id}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                rows={5}
                className="block w-full rounded-xl transition-colors py-[18px] px-5 text-[1.0625rem] text-[#2D3436] border-2 border-[#E8E8E8] focus:border-[#00A896] focus:outline-none"
              />
            ) : (
              <Input
                ref={inputRef}
                id={id}
                value={isDobField ? dobInputValue : value}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                error={error}
                maxLength={(!isDobField && (mask === '##/##/####' || mask === '##-##-####')) ? 10 : undefined}
                type={isDobField ? 'date' : undefined}
                max={isDobField ? dobMax : undefined}
                min={isDobField ? dobMin : undefined}
                required={required}
              />
            )}
            <NavigationButtons 
              showBack={showBack}
              onBack={onBack}
              onNext={handleSubmit}
              isNextDisabled={!isComplete}
              onSignInClick={onSignInClick}
              nextButtonType="submit"
            />
        </form>
      </ScreenLayout>
    </motion.div>
  );
};

export default TextScreen;
