import { ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface NavigationButtonsProps {
  showBack?: boolean;
  onBack?: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
  nextLabel?: string;
  nextButtonType?: 'button' | 'submit';
  layout?: 'spread' | 'grouped'; // New prop for layout variant
  onSignInClick?: () => void; // Optional handler for sign-in link
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
  onSignInClick,
}: NavigationButtonsProps) {
  const [showSignInLink, setShowSignInLink] = useState(false);

  // Check if zappy_auth_token exists in localStorage
  useEffect(() => {
    const checkAuthToken = () => {
      if (typeof window !== 'undefined') {
        const authToken = sessionStorage.getItem('client_record_id');
        setShowSignInLink(!authToken);
      }
    };

    checkAuthToken();
    // Also check on storage events (in case token is added/removed in another tab)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', checkAuthToken);
      return () => window.removeEventListener('storage', checkAuthToken);
    }
  }, []);

  // Always center the continue button, no back button at bottom
  // Unified button styling matching DemographicsScreen, EmailCaptureScreen, etc.
  return (
    <div className="mt-12">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="flex justify-center items-center"
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

      {/* Sign-in link - Show if no auth token and handler is provided */}
      {showSignInLink && onSignInClick && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-4"
        >
          <button
            onClick={onSignInClick}
            className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Already have an account?{' '}
            <span className="text-[#00A896] font-medium">Sign in</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}
