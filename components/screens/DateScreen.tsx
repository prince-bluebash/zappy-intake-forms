import React, { useEffect, useRef, useState } from 'react';
import { ScreenProps } from './common';
import ScreenLayout from '../common/ScreenLayout';
import Input from '../ui/Input';
import NavigationButtons from '../common/NavigationButtons';
import { DateScreen as DateScreenType } from '../../types';
import { Calendar } from 'lucide-react';

const DateScreen: React.FC<ScreenProps & { screen: DateScreenType }> = ({ screen, answers, updateAnswer, onSubmit, showBack, onBack, onSignInClick }) => {
  const { id, title, help_text, required, min_today } = screen;
  const value = answers[id] || '';
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Format the display value when component mounts
  useEffect(() => {
    if (value && displayValue === '') {
      // If value is already in YYYY-MM-DD format, convert to MMDDYYYY for display
      if (value.includes('-') && value.length === 10) {
        const [year, month, day] = value.split('-');
        setDisplayValue(`${month}${day}${year}`);
      } else if (typeof value === 'string' && /^\d{1,8}$/.test(value)) {
        setDisplayValue(value);
      }
    }
  }, [value, displayValue]);
  
  const formatDateInput = (input: string) => {
    // Remove all non-numeric characters
    const numbersOnly = input.replace(/\D/g, '');
    
    // Limit to 8 digits (mmddyyyy)
    return numbersOnly.slice(0, 8);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatDateInput(inputValue);
    
    // Always update display value first
    setDisplayValue(formatted);

    // Always store the current formatted value (don't convert to ISO until submission)
    updateAnswer(id, formatted);
  };

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isValidDate = (dateString: string) => {
    if (dateString.length !== 8) return false;
    const month = dateString.slice(0, 2);
    const day = dateString.slice(2, 4);
    const year = dateString.slice(4, 8);
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.getFullYear() == parseInt(year) &&
           date.getMonth() == parseInt(month) - 1 &&
           date.getDate() == parseInt(day);
  };

  const isComplete = !required || (displayValue && displayValue.length === 8 && isValidDate(displayValue));

  return (
    <ScreenLayout title={title} helpText={help_text}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="w-full space-y-8">
        <div className="relative">
          <Input
            ref={inputRef}
            id={id}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            placeholder="MMDDYYYY"
            className="pr-12"
          />
          <Calendar 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#666666] pointer-events-none" 
          />
        </div>
        <NavigationButtons
          showBack={showBack}
          onBack={onBack}
          onNext={onSubmit}
          isNextDisabled={!isComplete}
          onSignInClick={onSignInClick}
          nextButtonType="submit"
        />
      </form>
    </ScreenLayout>
  );
};

export default DateScreen;
