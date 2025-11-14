import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import ScreenLayout from '../common/ScreenLayout';
import NavigationButtons from '../common/NavigationButtons';
import { TouchButton } from '../common/TouchButton';
import { InfoTooltip } from '../common/InfoTooltip';
import { ScreenProps } from './common';
import { Option } from '../../types';

interface MedicationDetail {
  currentlyTaking?: string;
  duration: string;
  lastTaken: string;
  highestDose: string;
  sideEffects?: string;
}

interface MedicationData {
  id: string;
  name: string;
  subtitle: string;
  category: 'semaglutide' | 'tirzepatide' | 'liraglutide' | 'other';
  doseOptions: { value: string; label: string }[];
}

// Dropdown options for duration
const durationOptions: Option[] = [
  { value: 'less_than_1_month', label: 'Less than 1 month' },
  { value: '1-3_months', label: '1-3 months' },
  { value: '3-6_months', label: '3-6 months' },
  { value: '6-12_months', label: '6-12 months' },
  { value: '1-2_years', label: '1-2 years' },
  { value: 'more_than_2_years', label: 'More than 2 years' }
];

// Dropdown options for last dose (currently taking)
const lastDoseOptions: Option[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '2-3_days_ago', label: '2-3 days ago' },
  { value: '4-7_days_ago', label: '4-7 days ago' },
  { value: '1-2_weeks_ago', label: '1-2 weeks ago' },
  { value: '2-4_weeks_ago', label: '2-4 weeks ago' },
  { value: '1-3_months_ago', label: '1-3 months ago' },
  { value: '3-6_months_ago', label: '3-6 months ago' },
  { value: 'more_than_6_months', label: 'More than 6 months ago' }
];

// Dropdown options for when stopped (not currently taking)
const whenStoppedOptions: Option[] = [
  { value: 'within_last_week', label: 'Within the last week' },
  { value: '1-2_weeks_ago', label: '1-2 weeks ago' },
  { value: '2-4_weeks_ago', label: '2-4 weeks ago' },
  { value: '1-3_months_ago', label: '1-3 months ago' },
  { value: '3-6_months_ago', label: '3-6 months ago' },
  { value: '6-12_months_ago', label: '6-12 months ago' },
  { value: 'more_than_1_year', label: 'More than 1 year ago' }
];

const medications: MedicationData[] = [
  {
    id: 'wegovy',
    name: 'Wegovy',
    subtitle: 'Semaglutide for weight loss',
    category: 'semaglutide',
    doseOptions: [
      { value: '0.25mg', label: '0.25 mg' },
      { value: '0.5mg', label: '0.5 mg' },
      { value: '1mg', label: '1 mg' },
      { value: '1.7mg', label: '1.7 mg' },
      { value: '2.4mg', label: '2.4 mg' },
    ],
  },
  {
    id: 'ozempic',
    name: 'Ozempic',
    subtitle: 'Semaglutide for diabetes',
    category: 'semaglutide',
    doseOptions: [
      { value: '0.25mg', label: '0.25 mg' },
      { value: '0.5mg', label: '0.5 mg' },
      { value: '1mg', label: '1 mg' },
      { value: '2mg', label: '2 mg' },
    ],
  },
  {
    id: 'semaglutide_compound',
    name: 'Compounded Semaglutide',
    subtitle: 'From compounding pharmacy',
    category: 'semaglutide',
    doseOptions: [
      { value: '0.25mg', label: '0.25 mg' },
      { value: '0.5mg', label: '0.5 mg' },
      { value: '1mg', label: '1 mg' },
      { value: '1.7mg', label: '1.7 mg' },
      { value: '2.4mg', label: '2.4 mg' },
    ],
  },
  {
    id: 'zepbound',
    name: 'Zepbound',
    subtitle: 'Tirzepatide for weight loss',
    category: 'tirzepatide',
    doseOptions: [
      { value: '2.5mg', label: '2.5 mg' },
      { value: '5mg', label: '5 mg' },
      { value: '7.5mg', label: '7.5 mg' },
      { value: '10mg', label: '10 mg' },
      { value: '12.5mg', label: '12.5 mg' },
      { value: '15mg', label: '15 mg' },
    ],
  },
  {
    id: 'mounjaro',
    name: 'Mounjaro',
    subtitle: 'Tirzepatide for diabetes',
    category: 'tirzepatide',
    doseOptions: [
      { value: '2.5mg', label: '2.5 mg' },
      { value: '5mg', label: '5 mg' },
      { value: '7.5mg', label: '7.5 mg' },
      { value: '10mg', label: '10 mg' },
      { value: '12.5mg', label: '12.5 mg' },
      { value: '15mg', label: '15 mg' },
    ],
  },
  {
    id: 'tirzepatide_compound',
    name: 'Compounded Tirzepatide',
    subtitle: 'From compounding pharmacy',
    category: 'tirzepatide',
    doseOptions: [
      { value: '2.5mg', label: '2.5 mg' },
      { value: '5mg', label: '5 mg' },
      { value: '7.5mg', label: '7.5 mg' },
      { value: '10mg', label: '10 mg' },
      { value: '12.5mg', label: '12.5 mg' },
      { value: '15mg', label: '15 mg' },
    ],
  },
  {
    id: 'saxenda',
    name: 'Saxenda',
    subtitle: 'Liraglutide for weight loss',
    category: 'liraglutide',
    doseOptions: [
      { value: '0.6mg', label: '0.6 mg' },
      { value: '1.2mg', label: '1.2 mg' },
      { value: '1.8mg', label: '1.8 mg' },
      { value: '3mg', label: '3 mg' },
    ],
  },
  {
    id: 'victoza',
    name: 'Victoza',
    subtitle: 'Liraglutide for diabetes',
    category: 'liraglutide',
    doseOptions: [
      { value: '0.6mg', label: '0.6 mg' },
      { value: '1.2mg', label: '1.2 mg' },
      { value: '1.8mg', label: '1.8 mg' },
    ],
  },
  {
    id: 'liraglutide_compound',
    name: 'Compounded Liraglutide',
    subtitle: 'From compounding pharmacy',
    category: 'liraglutide',
    doseOptions: [
      { value: '0.6mg', label: '0.6 mg' },
      { value: '1.2mg', label: '1.2 mg' },
      { value: '1.8mg', label: '1.8 mg' },
      { value: '3mg', label: '3 mg' },
    ],
  },
];

const categoryLabels = {
  semaglutide: 'Semaglutide-based',
  tirzepatide: 'Tirzepatide-based',
  liraglutide: 'Liraglutide-based',
  other: 'Other',
};

const GLP1HistoryScreen: React.FC<ScreenProps & { screen: any }> = ({ 
  answers, 
  updateAnswer, 
  onSubmit, 
  showBack, 
  onBack, 
  showLoginLink 
}) => {
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const [expandedMedication, setExpandedMedication] = useState<string | null>(null);
  const [medicationDetails, setMedicationDetails] = useState<Record<string, MedicationDetail>>({});
  const [otherMedication, setOtherMedication] = useState({
    selected: false,
    expanded: false,
    name: '',
    duration: '',
    lastTaken: '',
    highestDose: '',
    sideEffects: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFullList, setShowFullList] = useState(true);

  useEffect(() => {
    const selected: string[] = [];
    const details: Record<string, MedicationDetail> = {};

    medications.forEach((med) => {
      if (answers[`used_${med.id}`]) {
        selected.push(med.id);
        details[med.id] = {
          currentlyTaking: answers[`${med.id}_currently_taking`],
          duration: answers[`${med.id}_duration`] || '',
          lastTaken: answers[`${med.id}_last_taken`] || '',
          highestDose: answers[`${med.id}_highest_dose`] || '',
          sideEffects: answers[`${med.id}_side_effects`] || '',
        };
      }
    });

    if (answers.used_other) {
      setOtherMedication({
        selected: true,
        expanded: false,
        name: answers.other_name || '',
        duration: answers.other_duration || '',
        lastTaken: answers.other_last_taken || '',
        highestDose: answers.other_highest_dose || '',
        sideEffects: answers.other_side_effects || '',
      });
    }

    setSelectedMedications(selected);
    setMedicationDetails(details);
  }, [answers]);

  const toggleMedication = (medId: string) => {
    const isSelected = selectedMedications.includes(medId);
    
    if (isSelected) {
      const newSelected = selectedMedications.filter(id => id !== medId);
      setSelectedMedications(newSelected);
      
      const newDetails = { ...medicationDetails };
      delete newDetails[medId];
      setMedicationDetails(newDetails);
      
      if (expandedMedication === medId) {
        setExpandedMedication(null);
      }
    } else {
      const newSelected = [...selectedMedications, medId];
      setSelectedMedications(newSelected);
      
      if (!medicationDetails[medId]) {
        setMedicationDetails({
          ...medicationDetails,
          [medId]: {
            currentlyTaking: undefined,
            duration: '',
            lastTaken: '',
            highestDose: '',
            sideEffects: '',
          },
        });
      }
      setExpandedMedication(medId);
    }
    setErrors({});
  };

  const toggleExpanded = (medId: string) => {
    setExpandedMedication(expandedMedication === medId ? null : medId);
  };

  const updateMedicationDetail = (medId: string, field: keyof MedicationDetail, value: string) => {
    setMedicationDetails({
      ...medicationDetails,
      [medId]: {
        ...medicationDetails[medId],
        [field]: value,
      },
    });
    
    const errorKey = `${medId}_${field}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const hasCurrentMedication = (): boolean => {
    return selectedMedications.some(medId => medicationDetails[medId]?.currentlyTaking === 'yes');
  };

  const shouldAskCurrentlyTaking = (medId: string): boolean => {
    if (hasCurrentMedication()) {
      return medicationDetails[medId]?.currentlyTaking === 'yes';
    }
    return true;
  };

  const isMedicationComplete = (medId: string): boolean => {
    const details = medicationDetails[medId];
    if (!details) return false;
    
    const needsCurrentlyTaking = shouldAskCurrentlyTaking(medId);
    
    if (needsCurrentlyTaking) {
      if (!details.currentlyTaking) return false;
    }
    
    const hasRequired = details.duration && details.lastTaken && details.highestDose;
    return !!hasRequired;
  };

  const isOtherMedicationComplete = (): boolean => {
    if (!otherMedication.selected) return true;
    if (!otherMedication.name || !otherMedication.duration || !otherMedication.lastTaken || !otherMedication.highestDose) {
      return false;
    }
    return true;
  };

  const hasCompleteMedication = (): boolean => {
    const hasCompleteStandard = selectedMedications.some(medId => isMedicationComplete(medId));
    const hasCompleteOther = otherMedication.selected && isOtherMedicationComplete();
    return hasCompleteStandard || hasCompleteOther;
  };

  const handleNext = () => {
    const newErrors: Record<string, string> = {};
    
    if (selectedMedications.length === 0 && !otherMedication.selected) {
      newErrors.general = "Please select at least one GLP-1 medication you've used";
    }

    selectedMedications.forEach((medId) => {
      if (!isMedicationComplete(medId)) {
        newErrors[medId] = 'Please complete all required fields';
      }
    });

    if (otherMedication.selected && !isOtherMedicationComplete()) {
      newErrors.other = 'Please complete all required fields';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorElement = document.querySelector('[data-error="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    medications.forEach((med) => {
      updateAnswer(`used_${med.id}`, selectedMedications.includes(med.id));
      if (selectedMedications.includes(med.id)) {
        const details = medicationDetails[med.id];
        if (details.currentlyTaking) updateAnswer(`${med.id}_currently_taking`, details.currentlyTaking);
        updateAnswer(`${med.id}_duration`, details.duration);
        updateAnswer(`${med.id}_last_taken`, details.lastTaken);
        updateAnswer(`${med.id}_highest_dose`, details.highestDose);
        if (details.sideEffects) updateAnswer(`${med.id}_side_effects`, details.sideEffects);
      }
    });

    updateAnswer('used_other', otherMedication.selected);
    if (otherMedication.selected) {
      updateAnswer('other_name', otherMedication.name);
      updateAnswer('other_duration', otherMedication.duration);
      updateAnswer('other_last_taken', otherMedication.lastTaken);
      updateAnswer('other_highest_dose', otherMedication.highestDose);
      if (otherMedication.sideEffects) updateAnswer('other_side_effects', otherMedication.sideEffects);
    }

    onSubmit();
  };

  const groupedMedications = medications.reduce((acc, med) => {
    if (!acc[med.category]) acc[med.category] = [];
    acc[med.category].push(med);
    return acc;
  }, {} as Record<string, MedicationData[]>);

  Object.keys(groupedMedications).forEach((category) => {
    groupedMedications[category].sort((a, b) => {
      const aSelected = selectedMedications.includes(a.id);
      const bSelected = selectedMedications.includes(b.id);
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      
      return 0;
    });
  });

  return (
    <ScreenLayout
      title="Which GLP-1 medications have you used?"
      helpText="Select each medication and provide details about your experience"
      showLoginLink={showLoginLink}
    >
      <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#FFF5F3] border border-[#F25B5B] rounded-r-lg p-5 text-left max-w-3xl mx-auto mb-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#F25B5B] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-[#2D3436] leading-relaxed">
                <span className="font-semibold text-[#F25B5B]">Please note:</span> If it's been <span className="font-semibold">more than 2 weeks</span> since your last dose, we'll need to <span className="font-semibold">restart you at the lowest dosage</span> for your safety and comfort.
              </p>
              <p className="text-sm text-[#2D3436] leading-relaxed mt-3">
              <span className="font-semibold">Here's why:</span> After 14+ days, <span className="font-semibold">your body loses its tolerance</span> to the medication and needs time to readjust. Starting at a higher dose could cause unnecessary nausea and discomfort—and we want to avoid that.
              </p>
            </div>
          </div>
        </motion.div>
      <div className="space-y-6">
        {(selectedMedications.length > 0 || otherMedication.selected) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00A896]/5 border border-[#00A896]/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00A896]" />
              <span className="text-xs text-neutral-700">
                {selectedMedications.length + (otherMedication.selected ? 1 : 0)} selected
              </span>
            </div>
          </motion.div>
        )}

        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3"
            data-error="true"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errors.general}</p>
          </motion.div>
        )}

        {!showFullList && hasCompleteMedication() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {Object.entries(groupedMedications).map(([category, meds]) => {
              const selectedInCategory = meds.filter(med => selectedMedications.includes(med.id));
              if (selectedInCategory.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-xs uppercase tracking-wider text-neutral-400 mb-2 px-1">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h3>
                  <div className="space-y-2">
                    {selectedInCategory.map((med) => {
                      const isComplete = isMedicationComplete(med.id);
                      return (
                        <div
                          key={med.id}
                          className="rounded-xl border-2 border-[#00A896] bg-gradient-to-r from-[#00A896]/5 to-[#E0F5F3]/5 p-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-[#00A896] flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-[#00A896]">{med.name}</div>
                            </div>
                            {isComplete && (
                              <div className="text-xs text-neutral-600">Complete</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {otherMedication.selected && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-neutral-400 mb-2 px-1">Other</h3>
                <div className="rounded-xl border-2 border-[#00A896] bg-gradient-to-r from-[#00A896]/5 to-[#E0F5F3]/5 p-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#00A896] flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#00A896]">
                        {otherMedication.name || 'Other GLP-1'}
                      </div>
                    </div>
                    {isOtherMedicationComplete() && (
                      <div className="text-xs text-neutral-600">Complete</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4">
              <button
                onClick={() => setShowFullList(true)}
                className="flex-1 sm:flex-none min-h-[48px] px-6 py-3 bg-white text-neutral-700 border-2 border-gray-200 hover:border-[#00A896]/30 rounded-xl font-medium transition-all duration-200 focus:outline-none"
              >
                + Add Another Medication
              </button>
              
              <button
                onClick={handleNext}
                className="flex-1 sm:flex-none min-h-[48px] px-8 py-3 bg-[#00A896] hover:bg-[#0F766E] text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {showFullList && (
          <>
            {Object.entries(groupedMedications).map(([category, meds]) => (
              <div key={category}>
                <h3 className="text-xs uppercase tracking-wider text-neutral-400 mb-2 px-1">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
                <div className="space-y-2">
                  {meds.map((med, index) => {
                    const isSelected = selectedMedications.includes(med.id);
                    const isExpanded = expandedMedication === med.id;
                    const isComplete = isMedicationComplete(med.id);
                    const hasError = errors[med.id];
                    const shouldShowCurrentlyTaking = shouldAskCurrentlyTaking(med.id);
                    const details = medicationDetails[med.id];
                    
                    const prevMed = index > 0 ? meds[index - 1] : null;
                    const isPrevSelected = prevMed ? selectedMedications.includes(prevMed.id) : false;
                    const showSeparator = !isSelected && isPrevSelected;

                    return (
                      <div key={`wrapper-${med.id}`} className="space-y-2">
                        {showSeparator && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 py-1 px-1"
                          >
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
                            <span className="text-[10px] uppercase tracking-wider text-neutral-400">Available</span>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
                          </motion.div>
                        )}
                        <motion.div
                          key={med.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{
                            layout: { type: "spring", stiffness: 350, damping: 30 },
                            opacity: { duration: 0.2 },
                          }}
                          className={`rounded-xl border-2 transition-all duration-200 ${
                            hasError
                              ? 'border-red-300 bg-red-50'
                              : isSelected
                              ? 'border-[#00A896] bg-gradient-to-r from-[#00A896]/5 to-[#E0F5F3]/5 shadow-sm'
                              : 'border-gray-200 bg-white'
                          }`}
                          data-error={hasError ? 'true' : undefined}
                        >
                          <button
                            onClick={() => toggleMedication(med.id)}
                            className="w-full text-left p-3 min-h-[48px] focus:outline-none rounded-xl"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-[#00A896] to-[#E0F5F3] border-[#00A896]'
                                    : 'border-gray-300'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${isSelected ? 'text-[#00A896]' : 'text-neutral-900'}`}>
                                  {med.name}
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {isSelected && isComplete && (
                                  <CheckCircle2 className="w-4 h-4 text-[#00A896]" />
                                )}
                                {isSelected && (
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpanded(med.id);
                                    }}
                                    className="p-1 hover:bg-[#00A896]/10 rounded transition-colors cursor-pointer"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-[#00A896]" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-[#00A896]" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>

                          <AnimatePresence>
                            {isSelected && isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 pb-3 pt-2 space-y-3 border-t border-[#00A896]/10">
                                  {hasError && (
                                    <div className="p-2.5 rounded-lg bg-red-100 border border-red-200 flex items-start gap-2">
                                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                      <p className="text-xs text-red-700">{errors[med.id]}</p>
                                    </div>
                                  )}

                                  {shouldShowCurrentlyTaking && (
                                    <div>
                                      <div className="flex items-center gap-1.5 mb-2">
                                        <label className="text-xs text-neutral-700">
                                          Are you currently taking this medication? <span className="text-[#FF6B6B]">*</span>
                                        </label>
                                        <InfoTooltip 
                                          content="This helps us understand if you're actively using this medication."
                                          side="right"
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <TouchButton
                                          onClick={() => updateMedicationDetail(med.id, 'currentlyTaking', 'yes')}
                                          selected={details?.currentlyTaking === 'yes'}
                                          variant="outline"
                                          size="sm"
                                          fullWidth
                                        >
                                          Yes
                                        </TouchButton>
                                        <TouchButton
                                          onClick={() => updateMedicationDetail(med.id, 'currentlyTaking', 'no')}
                                          selected={details?.currentlyTaking === 'no'}
                                          variant="outline"
                                          size="sm"
                                          fullWidth
                                        >
                                          No
                                        </TouchButton>
                                      </div>
                                    </div>
                                  )}

                                  {(shouldShowCurrentlyTaking ? details?.currentlyTaking : true) && (
                                    <>
                                      <div>
                                        <label className="block text-xs text-neutral-700 mb-1.5">
                                          {shouldShowCurrentlyTaking && details?.currentlyTaking === 'yes' 
                                            ? 'How long have you been taking it?' 
                                            : 'How long were you on it?'}{' '}
                                          <span className="text-[#FF6B6B]">*</span>
                                        </label>
                                        <Select
                                          id={`${med.id}_duration`}
                                          value={details?.duration || ''}
                                          onChange={(e) => updateMedicationDetail(med.id, 'duration', e.target.value)}
                                          options={durationOptions}
                                          required
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs text-neutral-700 mb-1.5">
                                          {shouldShowCurrentlyTaking && details?.currentlyTaking === 'yes' 
                                            ? 'When did you last take it?' 
                                            : 'When did you stop taking it?'}{' '}
                                          <span className="text-[#FF6B6B]">*</span>
                                        </label>
                                        <Select
                                          id={`${med.id}_last_taken`}
                                          value={details?.lastTaken || ''}
                                          onChange={(e) => updateMedicationDetail(med.id, 'lastTaken', e.target.value)}
                                          options={shouldShowCurrentlyTaking && details?.currentlyTaking === 'yes' 
                                            ? lastDoseOptions 
                                            : whenStoppedOptions}
                                          required
                                        />
                                      </div>

                                      <div>
                                        <div className="flex items-center gap-1.5 mb-2">
                                          <label className="text-xs text-neutral-700">
                                            What's the highest dose you've taken? <span className="text-[#FF6B6B]">*</span>
                                          </label>
                                          <InfoTooltip 
                                            content="A prescription copy is required to continue doses higher than 0.5 mg."
                                            side="right"
                                          />
                                        </div>
                                        <div className="grid grid-cols-3 gap-1.5">
                                          {med.doseOptions.map((option) => (
                                            <TouchButton
                                              key={option.value}
                                              onClick={() => updateMedicationDetail(med.id, 'highestDose', option.value)}
                                              selected={details?.highestDose === option.value}
                                              variant="outline"
                                              size="sm"
                                              className="text-xs"
                                            >
                                              {option.label}
                                            </TouchButton>
                                          ))}
                                        </div>
                                      </div>

                                      <div>
                                        <label className="block text-xs text-neutral-700 mb-1.5">
                                          Did you experience any side effects? <span className="text-neutral-500">(optional)</span>
                                        </label>
                                        <textarea
                                          value={details?.sideEffects || ''}
                                          onChange={(e) => updateMedicationDetail(med.id, 'sideEffects', e.target.value)}
                                          placeholder="e.g., Nausea"
                                          rows={2}
                                          className="w-full px-3 py-2 text-sm bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#00A896] transition-all duration-200 resize-none"
                                        />
                                      </div>

                                      {isComplete && (
                                        <div className="flex justify-end pt-1">
                                          <TouchButton
                                            onClick={() => {
                                              setExpandedMedication(null);
                                              setShowFullList(false);
                                            }}
                                            variant="primary"
                                            size="sm"
                                            className="px-6"
                                          >
                                            Done
                                          </TouchButton>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        {showFullList && (
          <NavigationButtons
            showBack={showBack}
            onBack={onBack}
            onNext={handleNext}
            isNextDisabled={false}
          />
        )}
      </div>
    </ScreenLayout>
  );
};

export default GLP1HistoryScreen;
