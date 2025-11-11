import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ScreenLayout from '../common/ScreenLayout';
import NavigationButtons from '../common/NavigationButtons';
import PlanSelectionOnly from '../common/PlanSelectionOnly';
import { ScreenProps } from './common';
import type { PackagePlan } from '../../utils/api';

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
};

const isMonthToMonthLabel = (label: string): boolean => /month\s*to\s*month/i.test(label);

const parsePlanDuration = (plan: PackagePlan | null | undefined): number | null => {
  if (!plan) return null;

  if (typeof plan.payment_plan_start_after === 'number' && Number.isFinite(plan.payment_plan_start_after)) {
    return plan.payment_plan_start_after;
  }

  const source = `${plan.plan || ''} ${plan.name || ''}`;
  const match = source.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const value = Number(match[1]);
    if (!Number.isNaN(value)) {
      return value;
    }
  }
  return null;
};

const requiresPlanGoal = (plan: PackagePlan | null | undefined): boolean => {
  if (!plan) return false;
  const combinedLabel = `${plan.plan || ''} ${plan.name || ''}`;
  if (combinedLabel && isMonthToMonthLabel(combinedLabel)) {
    return false;
  }
  const duration = parsePlanDuration(plan);
  return !!(duration && duration > 1);
};

export default function PlanSelectionScreen({ screen, answers, updateAnswer, onSubmit, showBack, onBack, defaultCondition }: ScreenProps) {
  const title = 'headline' in screen ? screen.headline : (screen as any).title;
  const helpText = 'body' in screen ? screen.body : (screen as any).help_text;

  const selectedMedication = answers['selected_medication'] || answers['medication_choice'] || '';
  const selectedMedicationName = answers['selected_medication_name'] || selectedMedication || '';
  const selectedMedicationKey = selectedMedicationName || selectedMedication || '';
  const selectedPlanId = answers['selected_plan_id'] || '';
  const stateCode = answers['home_state'] || answers['shipping_state'] || answers['state'] || '';
  const serviceType = typeof (screen as any)?.service_type === 'string' 
    ? (screen as any).service_type 
    : defaultCondition || 'Weight Loss';
  const pharmacyPreferences = (answers['medication_pharmacy_preferences'] as Record<string, string[]>) || {};
  const preferenceKey = selectedMedicationKey || selectedMedication;
  const preferenceList = pharmacyPreferences[preferenceKey] || pharmacyPreferences[selectedMedication] || [];
  const selectedPharmacyId =
    answers['selected_pharmacy_id'] ||
    answers['selected_pharmacy'] ||
    preferenceList[0] ||
    '';
  
  // Map pharmacy ID to name for API
  const pharmacyMap: Record<string, string> = {
    'empower': 'Empower',
    'hallandale': 'Hallandale',
    'olympia': 'Olympia',
    'wells': 'Wells',
    'no-preference': ''
  };
  const selectedPharmacyName = answers['selected_pharmacy_name'] || pharmacyMap[selectedPharmacyId] || '';
  
  // Map medication ID to full name for API
  const medicationMap: Record<string, string> = {
    'semaglutide': 'Semaglutide',
    'tirzepatide': 'Tirzepatide'
  };
  const selectedMedicationForAPI =
    selectedMedicationName ||
    medicationMap[selectedMedication] ||
    selectedMedication;

  const [selectedPlanDetails, setSelectedPlanDetails] = useState<PackagePlan | null>(() => {
    const details = answers['selected_plan_details'];
    return details && typeof details === 'object' ? (details as PackagePlan) : null;
  });
  const [selectedPlanGoal, setSelectedPlanGoal] = useState<string>(() => {
    const goalAnswer = answers['selected_plan_goal'] || answers['dose_strategy'];
    return typeof goalAnswer === 'string' ? goalAnswer : '';
  });

  const handlePlanGoalSelect = useCallback((goal: string) => {
    setSelectedPlanGoal(goal);
    updateAnswer('selected_plan_goal', goal);
    updateAnswer('dose_strategy', goal);
  }, [updateAnswer]);

  const handlePlanSelect = useCallback((planId: string, plan: PackagePlan | null) => {
    updateAnswer('selected_plan_id', planId);
    updateAnswer('selected_plan', planId);
    if (plan) {
      const price = plan.per_month_price ?? plan.invoice_amount ?? plan.invoiceAmount;
      updateAnswer('selected_plan_name', plan.name || plan.plan || '');
      updateAnswer('selected_plan_price', price ?? null);
      updateAnswer('selected_plan_price_display', formatCurrency(price));
      updateAnswer('selected_plan_medication', plan.medication || '');
      updateAnswer('selected_plan_pharmacy', plan.pharmacy || '');
      updateAnswer('selected_plan_details', plan);
    } else {
      updateAnswer('selected_plan', '');
      updateAnswer('selected_plan_name', '');
      updateAnswer('selected_plan_price', null);
      updateAnswer('selected_plan_price_display', '');
      updateAnswer('selected_plan_medication', '');
      updateAnswer('selected_plan_pharmacy', '');
      updateAnswer('selected_plan_details', null);
    }
    setSelectedPlanDetails(plan);
    if (!requiresPlanGoal(plan)) {
      setSelectedPlanGoal('');
      updateAnswer('selected_plan_goal', '');
      updateAnswer('dose_strategy', '');
    }
  }, [updateAnswer]);

  const goalRequired = useMemo(() => requiresPlanGoal(selectedPlanDetails), [selectedPlanDetails]);
  const canContinue = Boolean(selectedPlanId && (!goalRequired || selectedPlanGoal));

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <ScreenLayout title={title || 'Select Your Plan'} helpText="">
        {selectedMedicationName && (
          <div className="mb-6 p-4 bg-gradient-to-r from-[#00A896]/5 to-[#E0F5F3]/5 rounded-xl border border-[#00A896]/20">
            <p className="text-sm text-neutral-600">
              Selected Medication: <span className="font-medium text-[#00A896]">{selectedMedicationName}</span>
            </p>
          </div>
        )}

        <div className="mb-8">
          <PlanSelectionOnly
            medication={selectedMedicationForAPI}
            selectedPlanId={selectedPlanId}
            onSelect={handlePlanSelect}
            state={stateCode}
            serviceType={serviceType}
            pharmacyName={selectedPharmacyName}
            selectedPlanGoal={selectedPlanGoal}
            onPlanGoalChange={handlePlanGoalSelect}
            shouldShowGoalForPlan={requiresPlanGoal}
          />
          {goalRequired && !selectedPlanGoal && (
            <p className="mt-3 text-sm font-medium text-red-500">
              Please choose how you want to manage your dose for this program.
            </p>
          )}
        </div>

        <NavigationButtons
          showBack={showBack}
          onBack={onBack}
          onNext={onSubmit}
          isNextDisabled={!canContinue}
        />
      </ScreenLayout>
    </motion.div>
  );
}
