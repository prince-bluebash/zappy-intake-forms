import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { ScreenProps } from './common';
import { ConsentScreen as ConsentScreenType, ConsentItem } from '../../types';
import ScreenLayout from '../common/ScreenLayout';
import NavigationButtons from '../common/NavigationButtons';

const ConsentScreen: React.FC<ScreenProps & { screen: ConsentScreenType }> = ({
  screen,
  answers,
  updateAnswer,
  onSubmit,
  showBack,
  onBack,
}) => {
  const { title, items } = screen;

  const handleToggle = (itemId: string, isChecked: boolean) => {
    // Update the central form state directly
    updateAnswer(itemId, isChecked);
  };
  
  // Check if all required items are consented to by reading from the central `answers` prop
  const isComplete = items
    .filter(item => item.required)
    .every(item => !!answers[item.id]);

  // Renders label text and correctly embeds anchor tags for any links
  const renderConsentLabel = (item: ConsentItem) => {
    if (!item.links || item.links.length === 0) {
      return item.label;
    }
  
    let label: (string | React.ReactNode)[] = [item.label];
    item.links.forEach((link, i) => {
      const newLabel: (string | React.ReactNode)[] = [];
      label.forEach(part => {
        if (typeof part !== 'string') {
          newLabel.push(part);
          return;
        }
        const split = part.split(link.label);
        split.forEach((text, j) => {
          newLabel.push(text);
          if (j < split.length - 1) {
            newLabel.push(
              <a 
                key={`${link.url}-${i}-${j}`} 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#00A896] hover:underline font-medium" 
                onClick={e => e.stopPropagation()}
              >
                {link.label}
              </a>
            );
          }
        });
      });
      label = newLabel;
    });
  
    return <span>{label}</span>;
  };


  return (
    <ScreenLayout title={title}>
      <div className="w-full space-y-4 mb-8 text-left">
        {items.map((item, index) => {
          const isChecked = !!answers[item.id];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <label 
                className={`flex items-start gap-2.5 cursor-pointer group p-5 bg-white rounded-2xl shadow-sm transition-all ${
                  isChecked 
                    ? 'border-2 border-[#00A896]' 
                    : 'border-2 border-neutral-200 hover:border-[#00A896]/50'
                }`}
                onClick={() => handleToggle(item.id, !answers[item.id])}
              >
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    id={item.id}
                    checked={isChecked}
                    onChange={() => handleToggle(item.id, !answers[item.id])}
                    className="absolute opacity-0 w-4 h-4 cursor-pointer z-10 peer"
                    aria-required={item.required}
                  />
                  <motion.div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-[#00A896] peer-focus-visible:ring-offset-2 ${
                      isChecked
                        ? "border-[#00A896] bg-[#00A896] shadow-md shadow-[#00A896]/30"
                        : "border-[#E8E8E8] bg-white group-hover:border-[#00A896]/50 group-hover:shadow-sm"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <AnimatePresence>
                      {isChecked && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180, opacity: 0 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          exit={{ scale: 0, rotate: 180, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  {isChecked && (
                    <motion.div
                      className="absolute inset-0 rounded border-2 border-[#00A896] opacity-0 pointer-events-none ring-2 ring-[#00A896]/20"
                      animate={{ opacity: [0, 0.3, 0], scale: [1, 1.3, 1.5] }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </div>
                <span className="text-sm leading-relaxed text-neutral-600 group-hover:text-neutral-700 transition-colors flex-1">
                  {renderConsentLabel(item)}
                </span>
              </label>
            </motion.div>
          );
        })}
      </div>
      <NavigationButtons
        showBack={showBack}
        onBack={onBack}
        onNext={onSubmit}
        isNextDisabled={!isComplete}
      />
    </ScreenLayout>
  );
};

export default ConsentScreen;
