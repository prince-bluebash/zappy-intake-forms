import React, { useState } from 'react';
import { Info, AlertCircle } from 'lucide-react';
import { Label } from './label';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  labelClassName?: string; // Custom CSS classes for label
  help_text?: string;
  error?: string;
  suffix?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, labelClassName, help_text, error, suffix, type = 'text', ...props }, ref) => {
    const isPasswordField = type === 'password';
    const [showPassword, setShowPassword] = useState(false);
    const inputType = isPasswordField ? (showPassword ? 'text' : 'password') : type;
    const hasTrailingAdornment = !!suffix || isPasswordField;
    const errorId = `${id}-error`;
    return (
      <div className="w-full">
        {label && (
          <Label htmlFor={id} className={labelClassName || "mb-2 text-neutral-800"}>
            {label}
            {props.required && <span className="text-[#FF6B6B] ml-1">*</span>}
          </Label>
        )}
        {help_text && (
          <p className="text-sm text-neutral-600 mb-3 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#0D9488]" />
            {help_text}
          </p>
        )}
        <div className="relative">
          <input
            id={id}
            ref={ref}
            type={inputType}
            aria-required={props.required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            {...props}
            style={{ transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
            className={`
               w-full py-3 sm:py-[18px] px-4 sm:px-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 bg-white
              ${hasTrailingAdornment ? 'pr-16' : ''}
              ${error ? 'border-red-400 focus:border-red-500  focus:ring-red-100' : 'border-[#E8E8E8] bg-white hover:shadow-md shadow-sm'}
            `}
          />
          {suffix && !isPasswordField && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none font-medium text-neutral-600 text-sm">
              {suffix}
            </span>
          )}
          {isPasswordField && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-4 text-sm font-semibold text-[#00A896] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A896]/40 transition-colors"
              style={{
                transitionDuration: 'var(--timing-fast)',
                transitionTimingFunction: 'var(--easing-elegant)'
              }}
              onClick={() => setShowPassword(prev => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-2 text-sm font-medium text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
