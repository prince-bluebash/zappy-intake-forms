import React, { useEffect } from 'react';
import ScreenLayout from '../common/ScreenLayout';
import NavigationButtons from '../common/NavigationButtons';
import DiscountSelection from '../common/DiscountSelection';
import { ScreenProps } from './common';
import type { Discount } from '../../utils/api';

const DiscountCodeScreen: React.FC<ScreenProps> = ({
  screen,
  answers,
  updateAnswer,
  onSubmit,
  showBack,
  onBack,
}) => {
  const title = 'headline' in screen ? screen.headline : (screen as any).title;
  const helpText = 'body' in screen ? screen.body : (screen as any).help_text;

  const storedDiscount = (answers['discount_data'] as Discount | null) || null;
  const storedCode = answers['discount_code_entered'] || '';

  useEffect(() => {
    if (!storedDiscount) {
      updateAnswer('discount_id', '');
      updateAnswer('discount_code', '');
      updateAnswer('discount_amount', 0);
      updateAnswer('discount_percentage', 0);
      updateAnswer('discount_description', '');
    }
  }, []); // run once to ensure defaults

  const handleDiscountChange = (discount: Discount | null, code: string) => {
    updateAnswer('discount_code_entered', code);

    if (discount) {
      updateAnswer('discount_id', discount.id);
      updateAnswer('discount_code', discount.code);
      updateAnswer('discount_amount', discount.amount);
      updateAnswer('discount_percentage', discount.percentage);
      updateAnswer('discount_description', discount.description || '');
      updateAnswer('discount_data', discount);
    } else {
      updateAnswer('discount_id', '');
      updateAnswer('discount_code', '');
      updateAnswer('discount_amount', 0);
      updateAnswer('discount_percentage', 0);
      updateAnswer('discount_description', '');
      updateAnswer('discount_data', null);
    }
  };

  // Handler to clear discount when going back
  const handleBack = () => {
    // Clear all discount-related fields
    updateAnswer('discount_code_entered', '');
    updateAnswer('discount_id', '');
    updateAnswer('discount_code', '');
    updateAnswer('discount_amount', 0);
    updateAnswer('discount_percentage', 0);
    updateAnswer('discount_description', '');
    updateAnswer('discount_data', null);
    // Call the original onBack handler
    onBack();
  };

  return (
    <ScreenLayout title={title} helpText={helpText}>
      <DiscountSelection
        selectedDiscountId={answers['discount_id']}
        storedDiscount={storedDiscount}
        storedCode={storedCode}
        onSelect={handleDiscountChange}
      />

      <NavigationButtons
        showBack={showBack}
        onBack={handleBack}
        onNext={onSubmit}
      />
    </ScreenLayout>
  );
};

export default DiscountCodeScreen;
