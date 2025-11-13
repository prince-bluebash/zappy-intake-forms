import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import ScreenHeader from './ScreenHeader';

interface ScreenLayoutProps {
  title?: string;
  helpText?: string;
  headerSize?: string;
  titleClassName?: string; // Custom CSS classes for title
  children?: ReactNode;
  showHeader?: boolean;
  showLoginLink?: boolean; // For compatibility
  progress?: number; // Progress percentage 0-100
  currentStep?: number; // Current step number
  totalSteps?: number; // Total steps
  sectionLabel?: string; // Section name (e.g., "Medical History")
  sectionStep?: number; // Current step within section
  sectionTotal?: number; // Total steps in section
  showBack?: boolean; // Show back arrow
  onBack?: () => void; // Back handler
}

export default function ScreenLayout({ 
  title, 
  helpText, 
  headerSize, 
  titleClassName,
  children, 
  showHeader = true,
  progress,
  currentStep,
  totalSteps,
  sectionLabel,
  sectionStep,
  sectionTotal,
  showBack,
  onBack
}: ScreenLayoutProps) {
  const defaultTitleSize = headerSize === 'large' ? 'text-3xl sm:text-4xl md:text-5xl' : 'text-2xl sm:text-3xl md:text-4xl';
  const titleSize = titleClassName || defaultTitleSize;
  
  return (
    <div className="w-full">
      <div className="w-full">
        {/* Progress Bar */}
        {(progress !== undefined || (currentStep !== undefined && totalSteps !== undefined)) && (
          <ScreenHeader
            onBack={onBack}
            sectionLabel={sectionLabel}
            currentStep={sectionStep}
            totalSteps={sectionTotal}
            progressPercentage={progress ?? ((currentStep! / totalSteps!) * 100)}
          />
        )}
        
        {showHeader && title && (
          <div className="mb-6 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${titleSize} text-[#2D3436] mb-3 sm:mb-4 leading-tight tracking-tight`}
              style={{ letterSpacing: '-0.02em' }}
            >
              {title}
            </motion.h1>
            {helpText && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-base sm:text-lg text-neutral-600"
                style={{ lineHeight: '1.65' }}
              >
                {helpText}
              </motion.p>
            )}
          </div>
        )}
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
