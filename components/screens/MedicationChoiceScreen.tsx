import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import NavigationButtons from '../common/NavigationButtons';
import { apiClient, type ConsultationMedicationEntry, type ConsultationMedicationPharmacy, type ConsultationMedicationPackage } from '../../utils/api';
import { ScreenProps } from './common';

const DEFAULT_SERVICE_TYPE = 'Weight Loss';
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"%3E%3Crect fill="%23f3f4f6" width="1080" height="1080"/%3E%3C/svg%3E';

interface DoseOption {
  value: string;
  label: string;
  requiresScript?: boolean;
}

const STATIC_DOSE_OPTIONS_BY_MEDICATION: Record<string, DoseOption[]> = {
  semaglutide: [
    { value: 'no-preference', label: 'No preference' },
    { value: '0.25mg', label: '0.25 mg' },
    { value: '0.5mg', label: '0.5 mg' },
    { value: '1mg', label: '1 mg', requiresScript: true },
    { value: '1.7mg', label: '1.7 mg', requiresScript: true },
    { value: '2.4mg', label: '2.4 mg', requiresScript: true },
  ],
  tirzepatide: [
    { value: 'no-preference', label: 'No preference' },
    { value: '2.5mg', label: '2.5 mg' },
    { value: '5mg', label: '5 mg' },
    { value: '7.5mg', label: '7.5 mg', requiresScript: true },
    { value: '10mg', label: '10 mg', requiresScript: true },
    { value: '12.5mg', label: '12.5 mg', requiresScript: true },
    { value: '15mg', label: '15 mg', requiresScript: true },
  ],
  liraglutide: [
    { value: 'no-preference', label: 'No preference' },
    { value: '0.6mg', label: '0.6 mg' },
    { value: '1.2mg', label: '1.2 mg' },
    { value: '1.8mg', label: '1.8 mg' },
  ],
  sermorelin: [
    { value: 'no-preference', label: 'No preference' },
    { value: '250mcg', label: '250 mcg' },
    { value: '500mcg', label: '500 mcg' },
  ],
  semaglutidemethylcobalamin: [
    { value: 'no-preference', label: 'No preference' },
  ],
  tirzepatidemethylcobalamin: [
    { value: 'no-preference', label: 'No preference' },
  ],
};

const normalizeMedicationKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const getStaticDoseOptionsForName = (name: string): DoseOption[] => {
  const key = normalizeMedicationKey(name);
  return STATIC_DOSE_OPTIONS_BY_MEDICATION[key] || [];
};

const parseDoseOption = (raw: string | number | null | undefined): DoseOption | null => {
  if (raw === null || raw === undefined) return null;

  const rawString =
    typeof raw === 'number'
      ? Number.isFinite(raw)
        ? raw.toString()
        : ''
      : String(raw);
  const trimmed = rawString.trim();
  if (!trimmed) return null;

  if (/^no[-_\s]?preference$/i.test(trimmed)) {
    return { value: 'no-preference', label: 'No preference' };
  }

  const numericMatch = trimmed.match(/^([\d.,]+)\s*(mcg|µg|ug|mg|iu|ml|units?)?$/i);
  if (numericMatch) {
    const amount = numericMatch[1].replace(/,/g, '');
    const rawUnit = numericMatch[2];
    const normalizedUnit = rawUnit
      ? rawUnit.toLowerCase().replace(/^µg$|^ug$/i, 'mcg')
      : 'mg';
    const unitForLabel =
      normalizedUnit === 'units'
        ? 'units'
        : normalizedUnit;
    const label = `${amount} ${unitForLabel}`.trim();
    const value = `${amount}${normalizedUnit}`.replace(/\s+/g, '').toLowerCase();
    return { value, label };
  }

  const normalizedValue = trimmed.toLowerCase().replace(/\s+/g, '-');
  return { value: normalizedValue, label: trimmed };
};

const buildDoseOptionsFromPharmacy = (
  pharmacy: ConsultationMedicationPharmacy | null | undefined
): DoseOption[] => {
  if (!pharmacy) {
    return [];
  }

  const rawOptionsCandidate =
    Array.isArray(pharmacy.dose_options) && pharmacy.dose_options
      ? pharmacy.dose_options
      : Array.isArray((pharmacy as { doseOptions?: Array<unknown> }).doseOptions)
      ? (pharmacy as { doseOptions?: Array<unknown> }).doseOptions
      : null;

  const rawOptions = Array.isArray(rawOptionsCandidate) ? rawOptionsCandidate : [];

  if (!rawOptions || rawOptions.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const formatted: DoseOption[] = [];

  for (const rawOption of rawOptions) {
    const parsed = parseDoseOption(rawOption as string | number | null | undefined);
    if (!parsed || seen.has(parsed.value)) continue;
    seen.add(parsed.value);
    formatted.push(parsed);
  }

  return formatted;
};

const ensureNoPreferenceOption = (options: DoseOption[], shouldInclude: boolean): DoseOption[] => {
  if (!shouldInclude || options.length === 0) {
    return options;
  }

  const hasNoPreference = options.some((option) => option.value === 'no-preference');
  if (hasNoPreference) {
    return options;
  }

  return [{ value: 'no-preference', label: 'No preference' }, ...options];
};

const formatDoseForSubmission = (doseValue: string): string => {
  const trimmed = (doseValue ?? '').trim();

  if (!trimmed) return '';
  if (trimmed === 'no-preference') return trimmed;

  const numericMatch = trimmed.match(/[\d]+(?:[.,]\d+)?/);
  if (numericMatch) {
    return numericMatch[0].replace(',', '.');
  }

  return trimmed;
};

const getDoseSortWeight = (option: DoseOption): number => {
  if (option.value === 'no-preference') {
    return Number.NEGATIVE_INFINITY;
  }

  const numeric = parseFloat(option.value.replace(/[^\d.]/g, ''));
  if (Number.isNaN(numeric)) {
    return Number.POSITIVE_INFINITY;
  }
  return numeric;
};

const sortDoseOptions = (options: DoseOption[]): DoseOption[] => {
  const sorted = [...options];
  sorted.sort((a, b) => {
    const weightA = getDoseSortWeight(a);
    const weightB = getDoseSortWeight(b);

    if (weightA === weightB) {
      return a.label.localeCompare(b.label);
    }

    return weightA - weightB;
  });
  return sorted;
};

const shouldAddNoPreference = (medicationName: string): boolean => {
  const fallbackOptions = getStaticDoseOptionsForName(medicationName);
  return fallbackOptions.some((option) => option.value === 'no-preference');
};

const getDoseOptionsForMedication = (
  medicationName: string | undefined,
  pharmacy: ConsultationMedicationPharmacy | null | undefined
): DoseOption[] => {
  const dynamicOptions = buildDoseOptionsFromPharmacy(pharmacy);
  if (dynamicOptions.length > 0) {
    const withNoPreference = ensureNoPreferenceOption(dynamicOptions, shouldAddNoPreference(medicationName || ''));
    return sortDoseOptions(withNoPreference);
  }

  if (!medicationName) {
    return [];
  }

  return getStaticDoseOptionsForName(medicationName);
};

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
};

const getLowestStartingPrice = (packages: ConsultationMedicationPackage[] = []): number | null => {
  if (!packages || packages.length === 0) return null;

  const prices: number[] = [];

  for (const pkg of packages) {
    // Prefer invoice_amount_starter, fallback to invoice_amount
    const starterPrice = typeof pkg.invoice_amount_starter === 'number' && !Number.isNaN(pkg.invoice_amount_starter)
      ? pkg.invoice_amount_starter
      : null;
    
    const regularPrice = typeof pkg.per_month_price === 'number' && !Number.isNaN(pkg.per_month_price)
      ? pkg.per_month_price
      : null;

    // Use starter price if available, otherwise use regular price
    const price = starterPrice !== null ? starterPrice : regularPrice;
    
    if (price !== null && price > 0) {
      prices.push(price);
    }
  }

  if (prices.length === 0) return null;
  return Math.min(...prices);
};

const ImageWithFallback = ({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) => (
  <img
    src={src || PLACEHOLDER_IMAGE}
    alt={alt}
    className={className}
    onError={(event) => {
      const element = event.target as HTMLImageElement;
      element.src = PLACEHOLDER_IMAGE;
    }}
  />
);

const deriveMedicationIdentity = (entry: ConsultationMedicationEntry) => {
  const details = entry?.medication || {};
  const name =
  (typeof (details as any).title === 'string' && (details as any).title.trim()) ??
    'Medication';
    const medication =
  (typeof (details as any).name === 'string' && (details as any).name.trim()) ??
    'Medication';
  const id = (typeof (details as any).id === 'string' && (details as any).id.trim()) || name;
  const description = (typeof (details as any).description === 'string' && (details as any).description.trim()) || '';
  const imageUrl = (typeof (details as any).image_url === 'string' && (details as any).image_url.trim()) || null;
  return { id, name, medication, description, imageUrl, details };
};

const dedupePharmacies = (pharmacies: ConsultationMedicationPharmacy[] = []) => {
  const seen = new Set<string>();
  return pharmacies.filter((pharmacy) => {
    if (!pharmacy || typeof pharmacy.id !== 'string' || !pharmacy.id || typeof pharmacy.name !== 'string' || !pharmacy.name) {
      return false;
    }
    if (seen.has(pharmacy.id)) return false;
    seen.add(pharmacy.id);
    return true;
  });
};

export default function MedicationChoiceScreen({
  screen,
  answers,
  updateAnswer,
  onSubmit,
  showBack,
  onBack,
  defaultCondition,
  showLoginLink,
  calculations,
}: ScreenProps) {
  const stateCode = answers['home_state'] || answers['shipping_state'] || answers['state'] || 'CA';
  const serviceType =
    typeof (screen as any)?.service_type === 'string' ? (screen as any).service_type : defaultCondition || DEFAULT_SERVICE_TYPE;

  const hasGLP1Experience = answers['glp1_has_tried'] === 'yes';

  const [medications, setMedications] = useState<ConsultationMedicationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedMedicationId, setExpandedMedicationId] = useState<string | null>(null);

  const [selectedMedicationId, setSelectedMedicationId] = useState<string>(answers['selected_medication_id'] || '');
  const [selectedMedicationName, setSelectedMedicationName] = useState<string>(
    answers['selected_medication_name'] || answers['selected_medication'] || ''
  );
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>(
    answers['selected_pharmacy_id'] || answers['selected_pharmacy'] || ''
  );
  const [selectedDose, setSelectedDose] = useState<string>(answers['selected_dose'] || '');

  useEffect(() => {
    if (!stateCode || !serviceType) {
      setMedications([]);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchMedications = async () => {
      try {
        const response = await apiClient.getMedications(stateCode, serviceType);
        if (!isMounted) {
          return;
        }

        const fetchedMedications = response.rawMedications || [];
        setMedications(fetchedMedications);

        let nextMedicationId = selectedMedicationId;
        let nextMedicationName = selectedMedicationName;

        if (!nextMedicationId && nextMedicationName) {
          const matchedByName = fetchedMedications.find((entry) => {
            const identity = deriveMedicationIdentity(entry);
            return identity.name.toLowerCase() === nextMedicationName.toLowerCase();
          });

          if (matchedByName) {
            const identity = deriveMedicationIdentity(matchedByName);
            nextMedicationId = identity.id;
            nextMedicationName = identity.name;
          }
        }

        if (nextMedicationId && !nextMedicationName) {
          const matchedById = fetchedMedications.find((entry) => {
            const identity = deriveMedicationIdentity(entry);
            return identity.id === nextMedicationId;
          });

          if (matchedById) {
            const identity = deriveMedicationIdentity(matchedById);
            nextMedicationName = identity.name;
          }
        }

        if (!nextMedicationId && fetchedMedications.length === 1) {
          const identity = deriveMedicationIdentity(fetchedMedications[0]);
          nextMedicationId = identity.id;
          nextMedicationName = identity.name;
        }

        if (nextMedicationId) {
          setSelectedMedicationId(nextMedicationId);
        }

        if (nextMedicationName) {
          setSelectedMedicationName(nextMedicationName);
        }

        setExpandedMedicationId((previous) => previous || nextMedicationId || null);
      } catch (fetchError) {
        console.error(fetchError);
        if (isMounted) {
          const message =
            fetchError instanceof Error ? fetchError.message : 'Something went wrong while loading medications.';
          setError(message);
          setMedications([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMedications();

    return () => {
      isMounted = false;
    };
  }, [stateCode, serviceType]);

  const selectedMedicationEntry = useMemo(() => {
    if (!medications.length) return null;

    if (selectedMedicationId) {
      const matchedById = medications.find((entry) => {
        const identity = deriveMedicationIdentity(entry);
        return identity.id === selectedMedicationId;
      });
      if (matchedById) return matchedById;
    }

    if (selectedMedicationName) {
      const loweredName = selectedMedicationName.toLowerCase();
      const matchedByName = medications.find((entry) => {
        const identity = deriveMedicationIdentity(entry);
        return identity.name.toLowerCase() === loweredName;
      });
      if (matchedByName) return matchedByName;
    }

    return null;
  }, [medications, selectedMedicationId, selectedMedicationName]);

  const selectedMedicationIdentity = useMemo(
    () => (selectedMedicationEntry ? deriveMedicationIdentity(selectedMedicationEntry) : null),
    [selectedMedicationEntry]
  );

  const selectedPharmacy = useMemo(() => {
    if (!selectedMedicationEntry || !selectedPharmacyId) return null;
    const pharmacies = selectedMedicationEntry.pharmacies || [];
    return pharmacies.find((pharmacy) => pharmacy && pharmacy.id === selectedPharmacyId) || null;
  }, [selectedMedicationEntry, selectedPharmacyId]);

  const selectedDoseOptions = useMemo(() => {
    const medicationName = selectedMedicationIdentity?.name || selectedMedicationName;
    return medicationName ? getDoseOptionsForMedication(medicationName, selectedPharmacy) : [];
  }, [selectedMedicationIdentity, selectedMedicationName, selectedPharmacy]);

  const requiresDoseSelection =
    hasGLP1Experience && selectedDoseOptions.length > 1 && selectedDoseOptions.every((option) => option.value !== 'no-preference');

  const canContinue = Boolean(
    selectedMedicationId &&
      selectedPharmacyId &&
      (requiresDoseSelection ? selectedDose : selectedDose || !requiresDoseSelection)
  );

  const handleMedicationClick = (entry: ConsultationMedicationEntry) => {
    const identity = deriveMedicationIdentity(entry);

    setExpandedMedicationId((current) => (current === identity.id ? null : identity.id));

    if (selectedMedicationId !== identity.id) {
      setSelectedMedicationId('');
      setSelectedMedicationName(identity.medication)
      setSelectedPharmacyId('');
      setSelectedDose('');
    }
  };

  const handlePharmacySelect = (
    pharmacy: ConsultationMedicationPharmacy,
    entry: ConsultationMedicationEntry,
    medicationName: string
  ) => {
    const identity = deriveMedicationIdentity(entry);

    setSelectedMedicationId(identity.id);
    setSelectedMedicationName(identity.medication)
    setSelectedPharmacyId(pharmacy.id);

    updateAnswer('selected_medication_id', identity.id);
    updateAnswer('selected_medication', medicationName);
    updateAnswer('selected_medication_name', identity.medication);
    updateAnswer('selected_medication_details', identity.details);

    updateAnswer('selected_pharmacy_id', pharmacy.id);
    updateAnswer('selected_pharmacy', pharmacy.id);
    updateAnswer('selected_pharmacy_name', pharmacy.name);

    const existingPreferences =
      (answers['medication_pharmacy_preferences'] as Record<string, string[]>) || {};
    const updatedPreferences = {
      ...existingPreferences,
      [medicationName]: [pharmacy.id],
    };
    updateAnswer('medication_pharmacy_preferences', updatedPreferences);
    updateAnswer('medication_preferences', [medicationName]);
    updateAnswer('treatment.medication_preference', medicationName);

    const doseOptions = getDoseOptionsForMedication(medicationName, pharmacy);
    if (doseOptions.length === 0) {
      setSelectedDose('no-preference');
      updateAnswer('selected_dose', formatDoseForSubmission('no-preference'));
      return;
    }

    const availableDoses = doseOptions.filter((option) => option.value !== 'no-preference');

    if (availableDoses.length === 0) {
      const defaultOption = doseOptions[0];
      setSelectedDose(defaultOption.value);
      updateAnswer('selected_dose', formatDoseForSubmission(defaultOption.value));
      return;
    }

    if (availableDoses.length === 1) {
      const onlyDose = availableDoses[0];
      setSelectedDose(onlyDose.value);
      updateAnswer('selected_dose', formatDoseForSubmission(onlyDose.value));
      return;
    }

    if (!hasGLP1Experience) {
      const starterDose = availableDoses[0];
      setSelectedDose(starterDose.value);
      updateAnswer('selected_dose', formatDoseForSubmission(starterDose.value));
      return;
    }

    setSelectedDose('');
    updateAnswer('selected_dose', formatDoseForSubmission(''));
  };

  const handleDoseSelect = (doseValue: string) => {
    setSelectedDose(doseValue);
    updateAnswer('selected_dose', formatDoseForSubmission(doseValue));
  };

  const renderContent = () => {
    if (!stateCode) {
      return (
        <p className="text-center text-neutral-500">
          Provide your state first to see medications available in your area.
        </p>
      );
    }

    if (loading) {
      return (
        <div className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#00A896]/20 border-t-[#00A896]" />
          <p className="mt-4 text-neutral-600">Loading medication options...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-8 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      );
    }

    if (medications.length === 0) {
      return (
        <p className="text-center text-neutral-500">
          We don&apos;t have medications available for your state yet. Please check back soon.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {medications.map((entry, index) => {
          const { id: medicationId, name: medicationName, description, imageUrl } = deriveMedicationIdentity(entry);
          const apiPharmacies = dedupePharmacies(entry?.pharmacies);
          const pharmacies = apiPharmacies;
          const packages = entry?.packages || [];
          const lowestPrice = getLowestStartingPrice(packages);
          const isExpanded = expandedMedicationId === medicationId;
          const isMedicationSelected = selectedMedicationId === medicationId;
          const activePharmacy =
            isMedicationSelected && selectedPharmacyId
              ? pharmacies.find((pharmacyOption) => pharmacyOption.id === selectedPharmacyId) || null
              : null;
          const doseOptions = getDoseOptionsForMedication(medicationName, activePharmacy);

          return (
            <motion.div
              key={medicationId || `${medicationName}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              className="bg-[#E6F6F5]"
            >
              <motion.button
                type="button"
                onClick={() => handleMedicationClick(entry)}
                className={`w-full p-4 text-left ${
                  isExpanded
                    ? 'rounded-t-xl border-2 border-[#00A896] bg-gradient-to-r from-[#00A896]/5 via-[#FF6B6B]/5 to-[#00A896]/5 shadow-md'
                    : isMedicationSelected
                    ? 'rounded-xl border-2 border-[#00A896] bg-gradient-to-r from-[#00A896]/5 via-[#FF6B6B]/5 to-[#00A896]/5 shadow-md'
                    : 'rounded-xl border-2 border-gray-200 bg-white hover:border-[#FF6B6B]/30 hover:shadow-md hover:scale-[1.01]'
                }`}
                style={{ transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gradient-to-br from-[#FDFBF7] to-gray-50">
                    <ImageWithFallback
                      src={imageUrl}
                      alt={medicationName}
                      className="h-16 w-16 object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`leading-relaxed ${
                          isMedicationSelected || isExpanded ? 'text-[#00A896]' : 'text-neutral-700'
                        }`}
                      >
                        {medicationName}
                      </span>
                      {lowestPrice !== null && (
                        <span
                          className="text-xs text-neutral-500"
                        >
                          Starting at {formatCurrency(lowestPrice)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600">
                      {description || 'Clinician-prescribed medication tailored to your goals.'}
                    </p>
                  </div>

                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown
                      className={`h-5 w-5 ${isMedicationSelected || isExpanded ? 'text-[#00A896]' : 'text-gray-400'}`}
                    />
                  </motion.div>
                </div>
              </motion.button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-5 rounded-b-xl border-2 border-t-0 border-[#00A896] bg-gradient-to-r from-[#00A896]/5 via-[#FF6B6B]/5 to-[#00A896]/5 px-6 pb-6 pt-4">
                      <div className="space-y-3">
                        <p className="text-sm text-neutral-700">Choose your preferred pharmacy</p>
                        {pharmacies.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {pharmacies.map((pharmacyOption) => {
                              const isPharmacySelected =
                                selectedPharmacyId === pharmacyOption.id && selectedMedicationId === medicationId;

                              return (
                                <motion.button
                                  key={pharmacyOption.id}
                                  type="button"
                                  onClick={() => handlePharmacySelect(pharmacyOption, entry, medicationName)}
                                  whileTap={{ scale: 0.97 }}
                                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 transition-all duration-200 touch-manipulation ${
                                    isPharmacySelected
                                      ? 'bg-[#00A896] text-white shadow-md'
                                      : 'bg-white text-neutral-700 border-2 border-gray-200 hover:border-[#00A896]/30'
                                  }`}
                                >
                                  {isPharmacySelected && <Check className="h-4 w-4" strokeWidth={3} />}
                                  <span className="text-sm">{pharmacyOption.name}</span>
                                </motion.button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-neutral-600">
                            Pharmacies will be assigned by the clinical team for this medication.
                          </p>
                        )}
                      </div>

                      <AnimatePresence>
                        {/* {selectedPharmacyId && selectedMedicationId === medicationId && doseOptions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-3"
                          >
                            {!hasGLP1Experience && doseOptions.some((option) => option.value !== 'no-preference') ? (
                              <>
                                <p className="text-sm text-neutral-700">Starter dose</p>
                                <div className="rounded-xl border border-[#00A896]/20 bg-[#ffffff] p-4">
                                  <p className="mb-3 text-sm text-neutral-600">
                                    Since you&apos;re new to GLP-1 medications, we&apos;ll start with the lowest dose to
                                    help your body adjust gradually.
                                  </p>
                                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#00A896] px-4 py-2.5 text-white shadow-md">
                                    <Check className="h-4 w-4" strokeWidth={3} />
                                    <span className="text-sm">
                                      {
                                        (
                                          doseOptions.find((option) => option.value === selectedDose) ||
                                          doseOptions.find((option) => option.value !== 'no-preference') ||
                                          doseOptions[0]
                                        )?.label
                                      }
                                    </span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-neutral-700">Select your preferred dose</p>
                                <div className="flex flex-wrap gap-2">
                                  {doseOptions.map((doseOption) => {
                                    const isDoseSelected = selectedDose === doseOption.value;
                                    return (
                                      <motion.button
                                        key={doseOption.value}
                                        type="button"
                                        onClick={() => handleDoseSelect(doseOption.value)}
                                        whileTap={{ scale: 0.97 }}
                                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 transition-all duration-200 touch-manipulation ${
                                          isDoseSelected
                                            ? 'bg-[#00A896] text-white shadow-md'
                                            : 'bg-white text-neutral-700 border-2 border-gray-200 hover:border-[#00A896]/30'
                                        }`}
                                      >
                                        {isDoseSelected && <Check className="h-4 w-4" strokeWidth={3} />}
                                        <span className="text-sm">{doseOption.label}</span>
                                        {doseOption.requiresScript && <span className="text-xs opacity-70">*</span>}
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </motion.div>
                        )} */}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="w-full min-h-screen bg-[#fef8f2] p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2D3436] mb-2">
            What medication are you interested in today?
          </h1>
          <p className="text-[#666666]">
            Select the medication and pharmacy that works best for you.
          </p>
        </div>

        {/* Content */}
        {renderContent()}

        {/* Navigation */}
        <NavigationButtons
          onBack={onBack}
          onNext={() => onSubmit()}
          showBack={showBack}
          isNextDisabled={!selectedMedicationId || !selectedPharmacyId}
        />
      </div>
    </div>
  );
}
