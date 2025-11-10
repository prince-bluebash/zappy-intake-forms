import { ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavigationButtonsProps {
  showBack?: boolean;
  onBack?: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
  nextLabel?: string;
  nextButtonType?: 'button' | 'submit';
  layout?: 'spread' | 'grouped'; // New prop for layout variant
}

export default function NavigationButtons({
  showBack,
  onBack,
  onNext,
  isNextDisabled,
  isNextLoading,
  nextLabel = 'Continue',
  nextButtonType = 'button',
  layout = 'spread',
}: NavigationButtonsProps) {
  // Always center the continue button, no back button at bottom
  // Unified button styling matching DemographicsScreen, EmailCaptureScreen, etc.
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="flex justify-center items-center mt-12"
    >
      <motion.button
        onClick={nextButtonType === 'button' ? onNext : undefined}
        type={nextButtonType}
        disabled={isNextDisabled || isNextLoading}
        whileHover={!isNextDisabled && !isNextLoading ? { scale: 1.02 } : {}}
        whileTap={!isNextDisabled && !isNextLoading ? { scale: 0.98 } : {}}
        data-continue-button
        className={`px-6 sm:px-8 py-3 sm:py-4 rounded-full transition-all duration-300 flex items-center gap-2 ${
          isNextDisabled || isNextLoading
            ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
            : 'bg-[#FF6B6B] hover:bg-[#FF5252] text-white shadow-[0_10px_40px_rgba(255,107,107,0.3)] hover:shadow-[0_20px_60px_rgba(255,107,107,0.4)]'
        }`}
      >
        {isNextLoading && (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        <span className="text-base sm:text-lg">{nextLabel}</span>
        {!isNextLoading && <ArrowRight className="w-5 h-5" />}
      </motion.button>
    </motion.div>
  );
}
