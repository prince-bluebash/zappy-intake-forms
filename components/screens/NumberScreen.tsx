import React, { useState, useEffect, useRef } from 'react';
import { ScreenProps } from './common';
import ScreenLayout from '../common/ScreenLayout';
import Input from '../ui/Input';
import NavigationButtons from '../common/NavigationButtons';
import { NumberScreen as NumberScreenType } from '../../types';

const NumberScreen: React.FC<ScreenProps & { screen: NumberScreenType }> = ({ screen, answers, updateAnswer, onSubmit, showBack, onBack, onSignInClick }) => {
  const { id, title, help_text, placeholder, required, suffix, min, max } = screen;
  const value = answers[id] || '';
  const [error, setError] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Allow only numbers
    if (/^\d*$/.test(rawValue)) {
        updateAnswer(id, rawValue);
        if (error) validate(rawValue);
    }
  };

  const validate = (currentValue: string): boolean => {
    if (required && !currentValue) {
        setError('This field is required.');
        return false;
    }
    
    if (currentValue) {
      const num = parseFloat(currentValue);
      if (isNaN(num)) {
        setError("Please enter a valid number.");
        return false;
      }
      if (min !== undefined && num < min) {
        setError(`Value must be at least ${min}.`);
        return false;
      }
      if (max !== undefined && num > max) {
        setError(`Value must be no more than ${max}.`);
        return false;
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
        inputRef.current?.focus();
    }
  };

  const isComplete = !required || (value && value.length > 0);

  return (
    <ScreenLayout title={title} helpText={help_text}>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="w-full space-y-8">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          error={error}
          suffix={suffix}
        />
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
  );
};

export default NumberScreen;
