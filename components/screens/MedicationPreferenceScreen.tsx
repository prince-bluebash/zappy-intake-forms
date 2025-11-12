import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCircle2 } from 'lucide-react';
import ScreenLayout from '../common/ScreenLayout';
import NavigationButtons from '../common/NavigationButtons';
import { ScreenProps } from './common';

interface DoseOption {
  value: string;
  label: string;
  requiresScript?: boolean;
}

interface MedicationOption {
  id: string;
  name: string;
  subtitle: string;
  category: 'semaglutide' | 'tirzepatide' | 'liraglutide' | 'no_preference';
  startingPrice: number;
  doseOptions: DoseOption[];
}

const medications: MedicationOption[] = [
  {
    id: 'wegovy',
    name: 'Wegovy',
    subtitle: 'Semaglutide for weight loss',
    category: 'semaglutide',
    startingPrice: 299,
    doseOptions: [
      { value: '0.25mg', label: '0.25 mg' },
      { value: '0.5mg', label: '0.5 mg' },
      { value: '1mg', label: '1 mg', requiresScript: true },
      { value: '1.7mg', label: '1.7 mg', requiresScript: true },
      { value: '2.4mg', label: '2.4 mg', requiresScript: true },
    ],
  },
  {
    id: 'semaglutide_compound',
    name: 'Compounded Semaglutide',
    subtitle: 'From compounding pharmacy',
    category: 'semaglutide',
    startingPrice: 199,
    doseOptions: [
      { value: '0.25mg', label: '0.25 mg' },
      { value: '0.5mg', label: '0.5 mg' },
      { value: '1mg', label: '1 mg', requiresScript: true },
      { value: '1.7mg', label: '1.7 mg', requiresScript: true },
      { value: '2.4mg', label: '2.4 mg', requiresScript: true },
    ],
  },
  {
    id: 'zepbound',
    name: 'Zepbound',
    subtitle: 'Tirzepatide for weight loss',
    category: 'tirzepatide',
    startingPrice: 399,
    doseOptions: [
      { value: '2.5mg', label: '2.5 mg' },
      { value: '5mg', label: '5 mg' },
      { value: '7.5mg', label: '7.5 mg', requiresScript: true },
      { value: '10mg', label: '10 mg', requiresScript: true },
      { value: '12.5mg', label: '12.5 mg', requiresScript: true },
      { value: '15mg', label: '15 mg', requiresScript: true },
    ],
  },
  {
    id: 'tirzepatide_compound',
    name: 'Compounded Tirzepatide',
    subtitle: 'From compounding pharmacy',
    category: 'tirzepatide',
    startingPrice: 249,
    doseOptions: [
      { value: '2.5mg', label: '2.5 mg' },
      { value: '5mg', label: '5 mg' },
      { value: '7.5mg', label: '7.5 mg', requiresScript: true },
      { value: '10mg', label: '10 mg', requiresScript: true },
      { value: '12.5mg', label: '12.5 mg', requiresScript: true },
      { value: '15mg', label: '15 mg', requiresScript: true },
    ],
  },
  {
    id: 'saxenda',
    name: 'Saxenda',
    subtitle: 'Liraglutide for weight loss',
    category: 'liraglutide',
    startingPrice: 329,
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
    startingPrice: 289,
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
    startingPrice: 189,
    doseOptions: [
      { value: '0.6mg', label: '0.6 mg' },
      { value: '1.2mg', label: '1.2 mg' },
      { value: '1.8mg', label: '1.8 mg' },
      { value: '3mg', label: '3 mg' },
    ],
  },
  {
    id: 'no_preference',
    name: "I don't have a preference",
    subtitle: 'Let our provider recommend',
    category: 'no_preference',
    startingPrice: 0,
    doseOptions: [],
  },
];

const categoryLabels = {
  semaglutide: 'Semaglutide-based',
  tirzepatide: 'Tirzepatide-based',
  liraglutide: 'Liraglutide-based',
  no_preference: 'Other Options',
};

const MedicationPreferenceScreen: React.FC<ScreenProps & { screen: any }> = ({
  answers,
  updateAnswer,
  onSubmit,
  showBack,
  onBack,
  showLoginLink,
}) => {
  const [selectedMedication, setSelectedMedication] = useState<string | null>(
    answers.selected_medication_name || null
  );
  const [selectedDose, setSelectedDose] = useState<string | null>(
    answers.preferred_dose || null
  );

  const handleMedicationSelect = (medId: string) => {
    setSelectedMedication(medId);
    setSelectedDose(null); // Reset dose when changing medication
    
    // Use the same variable names as MedicationOptionsScreen
    const medicationData:any = medications.find((med) => med.id === medId) || '';
    updateAnswer('selected_medication', medicationData?.name);
    updateAnswer('selected_medication_name', medId);
    updateAnswer('medication_preferences', [medicationData?.name]);
    updateAnswer('treatment.medication_preference', medicationData?.name);
    updateAnswer('preferred_dose', null);
  };

  const handleDoseSelect = (dose: string) => {
    setSelectedDose(dose);
    updateAnswer('preferred_dose', dose);
  };

  const handleContinue = () => {
    if (selectedMedication && (selectedMedication === 'no_preference' || selectedDose)) {
      onSubmit();
    }
  };

  const groupedMedications = medications.reduce((acc, med) => {
    if (!acc[med.category]) acc[med.category] = [];
    acc[med.category].push(med);
    return acc;
  }, {} as Record<string, MedicationOption[]>);

  return (
    <ScreenLayout
      title="Which medication are you interested in?"
      showLoginLink={showLoginLink}
    >
      <div className="space-y-6">
        {Object.entries(groupedMedications).map(([category, meds], categoryIndex) => (
          <div key={category}>
            <h4 className="text-sm uppercase tracking-wider text-neutral-500 mb-3 px-1">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h4>
            <div className="space-y-3">
              {meds.map((med, index) => {
                const isSelected = selectedMedication === med.id;

                return (
                  <motion.div key={med.id}>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: categoryIndex * 0.05 + index * 0.03,
                        duration: 0.3,
                      }}
                      onClick={() => handleMedicationSelect(med.id)}
                      className={`w-full rounded-xl border-2 transition-all duration-200 p-4 ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 bg-white hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                            isSelected
                              ? 'bg-primary border-primary'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                        </div>

                        <div className="flex-1 text-left">
                          <div className={`font-medium ${isSelected ? 'text-primary' : 'text-neutral-900'}`}>
                            {med.name}
                          </div>
                        </div>

                        {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </div>
                    </motion.button>

                    {/* Inline Dose Selection */}
                    {isSelected && med.doseOptions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 space-y-4"
                      >
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-neutral-900 mb-1">
                              Do you have a preference for the dose?
                            </h4>
                            <p className="text-xs text-neutral-600">
                              A copy of your prescription is required.*
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            {med.doseOptions.map((dose) => (
                              <button
                                key={dose.value}
                                onClick={() => handleDoseSelect(dose.value)}
                                className={`py-2 px-3 rounded-lg border-2 transition-all duration-200 text-sm ${
                                  selectedDose === dose.value
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-gray-200 bg-white text-neutral-700 hover:border-primary/30'
                                }`}
                              >
                                <div className="font-medium">{dose.label}</div>
                                {dose.requiresScript && (
                                  <div className={`text-xs mt-1 ${selectedDose === dose.value ? 'text-white/80' : 'text-[var(--coral)]'}`}>
                                    *
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <NavigationButtons
        showBack={showBack}
        onBack={onBack}
        onNext={handleContinue}
        isNextDisabled={!selectedMedication || (selectedMedication !== 'no_preference' && !selectedDose)}
      />
    </ScreenLayout>
  );
};

export default MedicationPreferenceScreen;
