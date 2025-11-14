import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import { ScreenProps } from './common';
import { CompositeScreen as CompositeScreenType, Field, FieldOrFieldGroup, SelectField, TextField, ConsentItemField, Link, MedicationDetailsGroupField, CheckboxField } from '../../types';
import ScreenLayout from '../common/ScreenLayout';
import NavigationButtons from '../common/NavigationButtons';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Checkbox from '../ui/Checkbox';
import CheckboxGroup from '../common/CheckboxGroup';
import SingleSelectButtonGroup from '../common/SingleSelectButtonGroup';
import { BMIGauge } from '../ui/Illustrations';
import RegionDropdown from '../common/RegionDropdown';

const MINIMUM_SUPPORTED_AGE = 18;

const checkCondition = (condition: string, answers: Record<string, any>): boolean => {
  const containsMatch = condition.match(/(\w+)\s+contains\s+['"]?([\w\s/.-]+)['"]?/);
  if (containsMatch) {
      const [, fieldId, value] = containsMatch;
      const fieldValue = answers[fieldId];
      return Array.isArray(fieldValue) && fieldValue.includes(value);
  }

  const match = condition.match(/([\w.]+)\s*(==|!=)\s*['"]?([\w\s/.-]+)['"]?/);
  if (!match) return true;

  const [, fieldId, operator, value] = match;
  const fieldValue = answers[fieldId];

  if (operator === '==') return String(fieldValue) === value;
  if (operator === '!=') return String(fieldValue) !== value;
  return true;
};

const shouldShowField = (field: Field, answers: Record<string, any>): boolean => {
  // Check progressive_display first
  if (field.progressive_display) {
    const { show_after_field, show_if_condition } = field.progressive_display;
    const previousFieldValue = answers[show_after_field];
    
    // Don't show if the previous field hasn't been answered
    if (previousFieldValue === undefined || previousFieldValue === null || previousFieldValue === '') {
      return false;
    }
    
    // If there's an additional condition, check it
    if (show_if_condition) {
      return checkCondition(show_if_condition, answers);
    }
    
    // Otherwise, show it if the previous field has a value
    return true;
  }
  
  // Check conditional_display
  if (field.conditional_display) {
    const { show_if } = field.conditional_display;

    if (show_if.includes(' OR ')) {
      return show_if.split(' OR ').some(cond => checkCondition(cond.trim(), answers));
    }
    if (show_if.includes(' AND ')) {
      return show_if.split(' AND ').every(cond => checkCondition(cond.trim(), answers));
    }
    return checkCondition(show_if, answers);
  }
  
  return true;
};

const applyPhoneMask = (value: string): string => {
    if (!value) return '';
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
    const length = digitsOnly.length;

    if (length === 0) return '';
    if (length <= 3) return `(${digitsOnly}`;
    if (length <= 6) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
};

const isDobFieldId = (fieldId: string): boolean =>
  fieldId === 'dob' || fieldId.endsWith('.dob') || fieldId === 'demographics.dob';

const padDatePart = (value: number): string => value.toString().padStart(2, '0');

const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  return `${year}-${month}-${day}`;
};

const formatDateToDisplay = (date: Date): string => {
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const parseDateString = (value: string): Date | null => {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    if (parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day) {
      return parsed;
    }
    return null;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [month, day, year] = value.split('/').map(Number);
    const parsed = new Date(year, month - 1, day);
    if (parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day) {
      return parsed;
    }
  }

  return null;
};

const getYearsAgoDate = (years: number): Date => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
};

const CompositeScreen: React.FC<ScreenProps & { screen: CompositeScreenType; apiPopulatedFields?: Set<string> }> = ({ screen, answers, updateAnswer, onSubmit, showBack, onBack, headerSize, calculations = {}, showLoginLink, onSignInClick, apiPopulatedFields = new Set() }) => {
  const { title, help_text, fields, footer_note, validation, post_screen_note, titleClassName, fieldLabelClassName, fieldSpacing } = screen;
  
  // Helper function to get label class for a field
  const getLabelClassName = (field: Field, defaultClass: string = 'block mb-2 font-medium text-md text-neutral-800'): string => {
    // Priority: field.labelClassName > screen.fieldLabelClassName > default
    return field.labelClassName || fieldLabelClassName || defaultClass;
  };
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const autoAdvanceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const pendingScrollToFieldRef = React.useRef<string | null>(null);

  useEffect(() => {
    const initialState = answers['home_state'];
    if (initialState && (answers['state'] === undefined || answers['state'] === null || answers['state'] === '')) {
      updateAnswer('state', initialState);
    }
  }, [answers, updateAnswer]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  // Watch for when a field becomes visible and scroll to it
  useEffect(() => {
    if (pendingScrollToFieldRef.current) {
      const fieldId = pendingScrollToFieldRef.current;
      
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
        
        if (fieldElement) {
          const rect = fieldElement.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          
          if (isVisible) {
            // Add a small offset to account for fixed headers
            const offset = -80;
            const elementPosition = fieldElement.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition + offset;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
            
            // Clear the pending scroll
            pendingScrollToFieldRef.current = null;
          }
        }
      });
    }
  }, [answers]); // Re-run when answers change (fields become visible)

  const allFields = useMemo(() => {
    const flattened: Field[] = [];
    const recurse = (items: FieldOrFieldGroup[]) => {
      for (const item of items) {
        if (Array.isArray(item)) {
          recurse(item);
        } else {
          flattened.push(item);
          if (item.type === 'medication_details_group') {
            recurse((item as MedicationDetailsGroupField).fields);
          }
        }
      }
    };
    recurse(fields);
    return flattened;
  }, [fields]);
  
  const validateField = (field: Field, value: any, currentAnswers: Record<string, any>): string | undefined => {
    if (!field) return undefined;

    if (field.type === 'consent_item') {
      if (field.required && value !== true) {
        return 'This consent is required to continue.';
      }
      return undefined;
    }

    if (field.required && (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0))) {
      return 'This field is required.';
    }

    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      return undefined;
    }

    if (field.validation) {
      if (field.validation.pattern && typeof value === 'string') {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          return field.validation.error;
        }
      }
      if (field.validation.matches) {
        if (value !== currentAnswers[field.validation.matches]) {
          return field.validation.error;
        }
      }
      if (field.type === 'number') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) { return 'Please enter a valid number.'; }

        if (field.validation.min !== undefined && numValue < field.validation.min) {
          return field.validation.error;
        }
        if (field.validation.max !== undefined && numValue > field.validation.max) {
          return field.validation.error;
        }
      }

      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        if (field.validation.greater_than_field) {
          const otherFieldId = field.validation.greater_than_field.field;
          const otherValueStr = currentAnswers[otherFieldId];
          if (otherValueStr !== undefined && otherValueStr !== null && otherValueStr !== '') {
            const otherValue = parseFloat(otherValueStr);
            if (!isNaN(otherValue) && numValue < otherValue) {
              return field.validation.greater_than_field.error;
            }
          }
        }
        if (field.validation.less_than_field) {
          const otherFieldId = field.validation.less_than_field.field;
          const otherValueStr = currentAnswers[otherFieldId];
          if (otherValueStr !== undefined && otherValueStr !== null && otherValueStr !== '') {
            const otherValue = parseFloat(otherValueStr);
            if (!isNaN(otherValue) && numValue > otherValue) {
              return field.validation.less_than_field.error;
            }
          }
        }
      }
    }
    
    if (field.type === 'number' && (!field.validation || (field.validation.min === undefined && field.validation.max === undefined))) {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) { return 'Please enter a valid number.'; }
      
      const min = 'min' in field ? field.min : undefined;
      const max = 'max' in field ? field.max : undefined;

      if (min !== undefined && numValue < min) {
        return `Value must be at least ${min}.`;
      }
      if (max !== undefined && numValue > max) {
        return `Value must be no more than ${max}.`;
      }
    }

    return undefined;
  };

  const handleBlur = (fieldId: string) => {
    const field = allFields.find(f => f.id === fieldId);
    if (field) {
      const error = validateField(field, answers[fieldId], answers);
      setErrors(prev => ({ ...prev, [fieldId]: error }));
    }
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string | undefined> = {};
    let allValid = true;

    const validateVisibleFields = (fieldsToValidate: FieldOrFieldGroup[]) => {
      for (const fieldOrGroup of fieldsToValidate) {
        if (Array.isArray(fieldOrGroup)) {
          validateVisibleFields(fieldOrGroup);
        } else {
          const field = fieldOrGroup;
          if (shouldShowField(field, answers)) {
            if (field.type === 'medication_details_group') {
              validateVisibleFields((field as MedicationDetailsGroupField).fields);
            } else {
              const error = validateField(field, answers[field.id], answers);
              if (error) {
                allValid = false;
                newErrors[field.id] = error;
              }
            }
          }
        }
      }
    };
    validateVisibleFields(fields);

    if (validation?.max_currently_taking) {
      const rule = validation.max_currently_taking;
      const currentlyTakingCount = rule.fields.filter(fieldId => answers[fieldId] === 'yes').length;
      
      if (currentlyTakingCount > rule.limit) {
        allValid = false;
        rule.fields.forEach(fieldId => {
          if (answers[fieldId] === 'yes') {
            newErrors[fieldId] = rule.error;
          }
        });
      }
    }

    setErrors(newErrors);

    if (allValid) {
      onSubmit();
    }
  };

  const isComplete = useMemo(() => {
    let complete = true;
    const checkCompletionRecursively = (fieldsToCheck: FieldOrFieldGroup[]) => {
      for (const fieldOrGroup of fieldsToCheck) {
        if (!complete) return;

        if (Array.isArray(fieldOrGroup)) {
          checkCompletionRecursively(fieldOrGroup);
        } else {
          const field = fieldOrGroup;
          if (shouldShowField(field, answers)) {
            if (field.type === 'medication_details_group') {
              checkCompletionRecursively((field as MedicationDetailsGroupField).fields);
            } else if (field.required) {
              const value = answers[field.id];
              if (field.type === 'consent_item') {
                if (value !== true) complete = false;
              } else if (Array.isArray(value)) {
                if (value.length === 0) complete = false;
              } else if (value === undefined || value === null || value === '') {
                complete = false;
              }
            }
          }
        }
      }
    };
    checkCompletionRecursively(fields);
    return complete;
  }, [fields, answers]);
  
  const renderConsentLabel = (item: { label?: string, links?: Link[] }) => {
    if (!item.label) {
      return null;
    }
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

  const renderField = (field: Field): React.ReactNode => {
    if (!shouldShowField(field, answers)) {
      return null;
    }
    const value = answers[field.id];
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'password': {
        const textField = field as TextField;
        const isPhoneMask = textField.mask === '(###) ###-####';
        const isDobField = isDobFieldId(field.id);
        const storedValue = typeof value === 'string' ? value : '';
        const storedDobDate = isDobField ? parseDateString(storedValue) : null;
        const dobInputValue = isDobField && storedDobDate ? formatDateToISO(storedDobDate) : '';
        const minimumAllowedAge = isDobField ? Math.max(textField.validation?.min_age ?? 0, MINIMUM_SUPPORTED_AGE) : undefined;
        const dobMaxDate = isDobField ? formatDateToISO(getYearsAgoDate(minimumAllowedAge ?? MINIMUM_SUPPORTED_AGE)) : undefined;
        const dobMinDate =
          isDobField && textField.validation?.max_age !== undefined
            ? formatDateToISO(getYearsAgoDate(textField.validation.max_age))
            : undefined;

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (isDobField) {
              const inputValue = e.target.value;
              if (!inputValue) {
                updateAnswer(field.id, '');
                if (errors[field.id]) {
                  setErrors(prev => ({ ...prev, [field.id]: undefined }));
                }
                return;
              }
              
              // For date input type (ISO format)
              if (inputValue.includes('-')) {
                const parsed = parseDateString(inputValue);
                if (parsed) {
                  const displayValue = formatDateToDisplay(parsed);
                  updateAnswer(field.id, displayValue);
                  if (errors[field.id]) {
                    setErrors(prev => ({ ...prev, [field.id]: undefined }));
                  }
                }
                return;
              }
              
              // For text input: auto-format mmddyyyy to mm/dd/yyyy
              const digitsOnly = inputValue.replace(/\D/g, '');
              let formatted = '';
              
              if (digitsOnly.length <= 2) {
                formatted = digitsOnly;
              } else if (digitsOnly.length <= 4) {
                formatted = digitsOnly.slice(0, 2) + '/' + digitsOnly.slice(2);
              } else if (digitsOnly.length <= 8) {
                formatted = digitsOnly.slice(0, 2) + '/' + digitsOnly.slice(2, 4) + '/' + digitsOnly.slice(4, 8);
              } else {
                formatted = digitsOnly.slice(0, 2) + '/' + digitsOnly.slice(2, 4) + '/' + digitsOnly.slice(4, 8);
              }
              
              updateAnswer(field.id, formatted);
              if (errors[field.id]) {
                setErrors(prev => ({ ...prev, [field.id]: undefined }));
              }
              return;
            }
            const val = e.target.value;
            if (isPhoneMask) {
                updateAnswer(field.id, applyPhoneMask(val));
            } else {
                updateAnswer(field.id, val);
            }
        };

        return textField.multiline ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {field.label && (
              <label htmlFor={field.id} className={getLabelClassName(field)}>
                {field.label}
                {field.required && <span className="text-[#FF7A59] ml-1">*</span>}
              </label>
            )}
            {field.help_text && (
              <p className="text-sm text-neutral-600 mb-3 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#0D9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {field.help_text}
              </p>
            )}
            <textarea
              id={field.id}
              value={value || ''}
              onChange={(e) => updateAnswer(field.id, e.target.value)}
              onBlur={() => handleBlur(field.id)}
              placeholder={field.placeholder}
              rows={textField.rows || 4}
              disabled={apiPopulatedFields.has(field.id)}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 bg-white resize-none ${
                apiPopulatedFields.has(field.id)
                  ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                  : errors[field.id]
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-gray-200 focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/10'
              } outline-none`}
            />
            {errors[field.id] && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-red-500 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors[field.id]}
              </motion.p>
            )}
          </motion.div>
        ) : (
          <Input
            id={field.id}
            type={field.type}
            inputMode={isDobField ? 'numeric' : undefined}
            label={field.label}
            labelClassName={getLabelClassName(field)}
            help_text={field.help_text}
            placeholder={isDobField ? 'MM/DD/YYYY' : field.placeholder}
            value={storedValue || ''}
            onChange={handleChange}
            onBlur={() => handleBlur(field.id)}
            error={errors[field.id]}
            maxLength={isDobField ? 10 : (!isDobField && isPhoneMask ? 14 : undefined)}
            required={textField.required}
            disabled={apiPopulatedFields.has(field.id)}
          />
        );
      }
      case 'number': {
        // Special handling for height fields - render them side by side
        if (field.id === 'height_ft') {
          const heightInField = fields.find(f => !Array.isArray(f) && f.id === 'height_in') as Field;
          if (heightInField) {
            const heightInValue = answers['height_in'];
            const isHeightRequired = field.required || heightInField.required;
            return (
              <div>
                <label className={getLabelClassName(field, 'text-sm leading-none font-medium select-none mb-3 text-neutral-800')}>
                  Height
                  {isHeightRequired && <span className="text-[#FF7A59] ml-1">*</span>}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      id={field.id}
                      type="text"
                      inputMode="numeric"
                      placeholder="5"
                      suffix="ft"
                      value={value || ''}
                      onChange={(e) => {
                          if (/^\d*\.?\d*$/.test(e.target.value)) {
                              updateAnswer(field.id, e.target.value);
                          }
                      }}
                      onBlur={() => handleBlur(field.id)}
                      error={errors[field.id]}
                      disabled={apiPopulatedFields.has(field.id)}
                    />
                  </div>
                  <div>
                    <Input
                      id="height_in"
                      type="text"
                      inputMode="numeric"
                      placeholder="10"
                      suffix="in"
                      value={heightInValue || ''}
                      onChange={(e) => {
                          if (/^\d*\.?\d*$/.test(e.target.value)) {
                              updateAnswer('height_in', e.target.value);
                          }
                      }}
                      onBlur={() => handleBlur('height_in')}
                      error={errors['height_in']}
                      disabled={apiPopulatedFields.has('height_in')}
                    />
                  </div>
                </div>
              </div>
            );
          }
        }
        // Skip rendering height_in separately if it's already handled with height_ft
        if (field.id === 'height_in') {
          const heightFtField = fields.find(f => !Array.isArray(f) && f.id === 'height_ft') as Field;
          if (heightFtField) {
            return null; // Already rendered with height_ft
          }
        }
        
        return (
          <Input
            id={field.id}
            type="text"
            inputMode="numeric"
            label={field.label}
            labelClassName={getLabelClassName(field, 'mb-2 text-neutral-800')}
            help_text={field.help_text}
            placeholder={field.placeholder}
            suffix={'suffix' in field ? field.suffix : undefined}
            value={value || ''}
            onChange={(e) => {
                if (/^\d*\.?\d*$/.test(e.target.value)) {
                    updateAnswer(field.id, e.target.value);
                }
            }}
            onBlur={() => handleBlur(field.id)}
            error={errors[field.id]}
            required={field.required}
            disabled={apiPopulatedFields.has(field.id)}
          />
        );
      }
      case 'single_select': {
        if (field.id === 'state') {
          return (
            <div>
              {field.label && (
                <label className={getLabelClassName(field, 'block text-xl sm:text-2xl text-neutral-900 mb-3 font-medium')}>
                  {field.label}
                  {field.required && <span className="text-[#FF7A59] ml-1">*</span>}
                </label>
              )}
              {field.help_text && (
                <p className="text-sm mb-3 text-neutral-600">{field.help_text}</p>
              )}
              <RegionDropdown
                value={value || ''}
                onChange={(stateCode) => updateAnswer(field.id, stateCode)}
                placeholder={field.placeholder || 'Select state'}
                disabled={apiPopulatedFields.has(field.id)}
              />
              {errors[field.id] && <p className="mt-2 text-sm font-medium text-red-500">{errors[field.id]}</p>}
            </div>
          );
        }

        const selectField = field as SelectField;
        const options = selectField.conditional_options 
            ? (selectField.conditional_options.options_map[answers[selectField.conditional_options.based_on]] || [])
            : selectField.options;

        const activeWarnings = selectField.conditional_warnings?.filter(warning => 
          value === warning.show_if_value
        ) || [];

        const handleSelect = (val: string) => {
          updateAnswer(field.id, val);
          
          // Handle auto-advance if enabled
          if (selectField.auto_advance && val) {
            // For GLP-1 experience screen, only auto-advance when "yes" is selected
            if (field.id === 'glp1_has_tried' && val !== 'yes') {
              return; // Don't auto-advance for "no" answer
            }
            
            if (autoAdvanceTimeoutRef.current) {
              clearTimeout(autoAdvanceTimeoutRef.current);
            }
            
            // Find the next field that will be shown
            // Check both progressive_display and conditional_display
            const currentFieldIndex = allFields.findIndex(f => f.id === field.id);
            const tempAnswers = { ...answers, [field.id]: val };
            
            // First, try to find a field that directly depends on the current field
            let nextField = allFields.find((f, index) => {
              // Skip fields before the current one
              if (index <= currentFieldIndex) return false;
              
              // Check if field has progressive_display pointing to current field
              if (f.progressive_display?.show_after_field === field.id) {
                return true;
              }
              
              // Check if field has conditional_display that depends on current field
              if (f.conditional_display?.show_if) {
                const showIf = f.conditional_display.show_if;
                // Check if the condition references the current field
                if (showIf.includes(`${field.id} ==`) || showIf.includes(`${field.id}!=`)) {
                  // Check if field will be visible with the new answer
                  return shouldShowField(f, tempAnswers);
                }
              }
              
              return false;
            });
            
            // If no direct dependency found, find the next visible field
            if (!nextField) {
              nextField = allFields.find((f, index) => {
                if (index <= currentFieldIndex) return false;
                return shouldShowField(f, tempAnswers);
              });
            }
            
            if (nextField) {
              // Wait for visual confirmation (300-600ms), using 500ms
              const delay = 500;
              autoAdvanceTimeoutRef.current = setTimeout(() => {
                // Set the field ID to scroll to - the useEffect will handle the actual scrolling
                // when the field becomes visible after React re-renders
                pendingScrollToFieldRef.current = nextField.id;
                
                // Try to scroll immediately in case the field is already visible
                requestAnimationFrame(() => {
                  const nextFieldElement = document.querySelector(`[data-field-id="${nextField.id}"]`);
                  if (nextFieldElement) {
                    const rect = nextFieldElement.getBoundingClientRect();
                    const isVisible = rect.width > 0 && rect.height > 0;
                    
                    if (isVisible) {
                      const offset = -80;
                      const elementPosition = nextFieldElement.getBoundingClientRect().top + window.pageYOffset;
                      const offsetPosition = elementPosition + offset;
                      
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                      });
                      pendingScrollToFieldRef.current = null;
                    }
                  }
                });
              }, delay);
            } else {
              // No next field, submit the screen to go to next step
              // Wait for visual confirmation first
              const delay = 500;
              autoAdvanceTimeoutRef.current = setTimeout(() => {
                onSubmit();
              }, delay);
            }
          }
        };

        return (
            <div data-field-id={field.id}>
                {field.label && (
                    <label className={getLabelClassName(field, 'block text-xl sm:text-2xl text-neutral-900 mb-3 font-medium')}>
                        {field.label}
                        {field.required && <span className="text-[#FF7A59] ml-1">*</span>}
                    </label>
                )}
                {field.help_text && (
                    <p className="text-sm -mt-2 mb-3 text-neutral-600">
                        {field.help_text}
                    </p>
                )}
                <SingleSelectButtonGroup
                    options={options}
                    selectedValue={value}
                    onSelect={handleSelect}
                    disabled={apiPopulatedFields.has(field.id)}
                />
                {activeWarnings.map((warning, index) => {
                  const warningType = warning.type || 'error';
                  const styles = {
                    error: {
                      container: 'bg-[#FFF5F3] border-[#E8E8E8]',
                      icon: 'text-[#FF6B6B]',
                      title: 'text-[#2D3436]',
                      message: 'text-red-700',
                      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                    },
                    warning: {
                      container: 'bg-[#FFF5F3] border-[#E8E8E8]',
                      icon: 'text-[#FF6B6B]',
                      title: 'text-[#2D3436]',
                      message: 'text-[#666666]',
                      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    },
                    info: {
                      container: 'bg-[#E0F5F3] border-[#E8E8E8]',
                      icon: 'text-[#00A896]',
                      title: 'text-[#2D3436]',
                      message: 'text-[#666666]',
                      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    }
                  };
                  const style = styles[warningType as keyof typeof styles];
                  
                  return (
                    <div key={index} className={`mt-4 p-4 rounded-xl border ${style.container} flex items-start gap-3`}>
                      <svg className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.iconPath} />
                      </svg>
                      <div>
                        <p className={`text-sm font-medium ${style.title}`}>{warning.title || 'Important'}</p>
                        <p className={`text-sm ${style.message} mt-1`}>{warning.message}</p>
                      </div>
                    </div>
                  );
                })}
                {errors[field.id] && <p className="mt-2 text-sm font-medium text-[#FF6B6B]">{errors[field.id]}</p>}
            </div>
        )
      }
      case 'multi_select': {
          const multiSelectField = field as SelectField;
          const handleMultiSelectChange = (newValues: string[]) => {
            // Clear other text when "other" is deselected
            if (multiSelectField.other_text_id && !newValues.includes('other')) {
              updateAnswer(multiSelectField.other_text_id, '');
            }
            updateAnswer(field.id, newValues);
            
            // Handle auto-advance for screens with auto_advance_on property
            if ('auto_advance_on' in screen && screen.auto_advance_on && newValues.includes(screen.auto_advance_on)) {
              if (autoAdvanceTimeoutRef.current) {
                clearTimeout(autoAdvanceTimeoutRef.current);
              }
              const delay = ('auto_advance_delay' in screen && screen.auto_advance_delay) ? screen.auto_advance_delay : 600;
              autoAdvanceTimeoutRef.current = setTimeout(() => {
                onSubmit();
              }, delay);
            }
            
            // Handle field-level auto-advance (only scroll, never auto-submit)
            if (multiSelectField.auto_advance && newValues.length > 0) {
              if (autoAdvanceTimeoutRef.current) {
                clearTimeout(autoAdvanceTimeoutRef.current);
              }
              
              // Find the next field that will be shown
              const currentFieldIndex = allFields.findIndex(f => f.id === field.id);
              const tempAnswers = { ...answers, [field.id]: newValues };
              
              // First, try to find a field that directly depends on the current field
              let nextField = allFields.find((f, index) => {
                // Skip fields before the current one
                if (index <= currentFieldIndex) return false;
                
                // Check if field has progressive_display pointing to current field
                if (f.progressive_display?.show_after_field === field.id) {
                  return true;
                }
                
                // Check if field has conditional_display that depends on current field
                if (f.conditional_display?.show_if) {
                  const showIf = f.conditional_display.show_if;
                  // Check if the condition references the current field
                  if (showIf.includes(`${field.id} ==`) || showIf.includes(`${field.id}!=`) || showIf.includes(`${field.id} contains`)) {
                    // Check if field will be visible with the new answer
                    return shouldShowField(f, tempAnswers);
                  }
                }
                
                return false;
              });
              
              // If no direct dependency found, find the next visible field
              if (!nextField) {
                nextField = allFields.find((f, index) => {
                  if (index <= currentFieldIndex) return false;
                  return shouldShowField(f, tempAnswers);
                });
              }
              
              // Only scroll if there's a next field - never auto-submit for multi_select
              if (nextField) {
                // Wait for visual confirmation (300-600ms), using 500ms
                const delay = 500;
                autoAdvanceTimeoutRef.current = setTimeout(() => {
                  // Set the field ID to scroll to - the useEffect will handle the actual scrolling
                  // when the field becomes visible after React re-renders
                  pendingScrollToFieldRef.current = nextField!.id;
                  
                  // Try to scroll immediately in case the field is already visible
                  requestAnimationFrame(() => {
                    const nextFieldElement = document.querySelector(`[data-field-id="${nextField!.id}"]`);
                    if (nextFieldElement) {
                      const rect = nextFieldElement.getBoundingClientRect();
                      const isVisible = rect.width > 0 && rect.height > 0;
                      
                      if (isVisible) {
                        const offset = -80;
                        const elementPosition = nextFieldElement.getBoundingClientRect().top + window.pageYOffset;
                        const offsetPosition = elementPosition + offset;
                        
                        window.scrollTo({
                          top: offsetPosition,
                          behavior: 'smooth'
                        });
                        pendingScrollToFieldRef.current = null;
                      }
                    }
                  });
                }, delay);
              }
              // If no next field, do nothing - user must manually click Continue
            }
          };
          const selectedValues = value || [];
          const showOtherInput = multiSelectField.other_text_id && selectedValues.includes('other');
          
          // Detect "none" option for mutual exclusivity
          const noneOption = multiSelectField.options.find(opt => opt.value === 'none');
          const exclusiveValue = noneOption ? 'none' : undefined;
          
          // Determine variant based on number of options (same threshold as MultiSelectScreen)
          const PILL_THRESHOLD = 5;
          const variant = multiSelectField.options.length > PILL_THRESHOLD ? 'pills' : 'default';
          
          return (
            <div>
              <CheckboxGroup
                id={field.id}
                label={field.label}
                help_text={field.help_text}
                required={field.required}
                options={multiSelectField.options}
                selectedValues={selectedValues}
                onChange={handleMultiSelectChange}
                exclusiveValue={exclusiveValue}
                variant={variant}
              />
              {showOtherInput && (
                <div className="mt-3">
                  <Input
                    id={multiSelectField.other_text_id}
                    placeholder={multiSelectField.other_text_placeholder ?? "Please specify"}
                    value={answers[multiSelectField.other_text_id] || ''}
                    onChange={(e) => updateAnswer(multiSelectField.other_text_id!, e.target.value)}
                    autoFocus
                  />
                </div>
              )}
              {(() => {
                // Check for conditional warnings and deduplicate by title and type
                const filteredWarnings = multiSelectField.conditional_warnings?.filter(warning => 
                  selectedValues.includes(warning.show_if_value)
                ) || [];
                
                // Deduplicate warnings: if multiple warnings have same title and type, show only one
                const seen = new Map<string, typeof filteredWarnings[0]>();
                filteredWarnings.forEach(warning => {
                  const key = `${warning.title || ''}_${warning.type || 'error'}`;
                  if (!seen.has(key)) {
                    seen.set(key, warning);
                  }
                });
                
                return Array.from(seen.values());
              })().map((warning, index) => {
                  const warningType = warning.type || 'error';
                  const styles = {
                    error: {
                      container: 'bg-[#FFF5F3] border-[#E8E8E8]',
                      icon: 'text-[#FF6B6B]',
                      title: 'text-[#2D3436]',
                      message: 'text-red-700',
                      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                    },
                    warning: {
                      container: 'bg-[#FFF5F3] border-[#E8E8E8]',
                      icon: 'text-[#FF6B6B]',
                      title: 'text-[#2D3436]',
                      message: 'text-[#666666]',
                      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    },
                    info: {
                      container: 'bg-[#E0F5F3] border-[#E8E8E8]',
                      icon: 'text-[#00A896]',
                      title: 'text-[#2D3436]',
                      message: 'text-[#666666]',
                      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    }
                  };
                  const style = styles[warningType as keyof typeof styles];
                  
                  return (
                    <div key={index} className={`mt-4 p-4 rounded-xl border ${style.container} flex items-start gap-3`}>
                      <svg className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.iconPath} />
                      </svg>
                      <div>
                        <p className={`text-sm font-medium ${style.title}`}>{warning.title || 'Important'}</p>
                        <p className={`text-sm ${style.message} mt-1`}>{warning.message}</p>
                      </div>
                    </div>
                  );
                })}
              {errors[field.id] && <p className="mt-2 text-sm font-medium text-[#FF6B6B]">{errors[field.id]}</p>}
            </div>
          )
      }
      case 'medication_details_group': {
        const groupField = field as MedicationDetailsGroupField;
        const findFirstCheckbox = (items: FieldOrFieldGroup[]): CheckboxField | undefined => {
          for (const item of items) {
            if (Array.isArray(item)) {
              const nested = findFirstCheckbox(item);
              if (nested) return nested;
            } else if (item.type === 'checkbox') {
              return item as CheckboxField;
            }
          }
          return undefined;
        };

        const primaryCheckbox = findFirstCheckbox(groupField.fields);
        const handleGroupClick = (event: React.MouseEvent<HTMLDivElement>) => {
          if (!primaryCheckbox) return;

          const target = event.target as HTMLElement | null;
          if (!target) return;

          const interactive = target.closest('input, select, textarea, button, a');
          if (interactive) {
            return;
          }

          const labelEl = target.closest('label');
          if (labelEl) {
            return;
          }

          const currentValue = !!answers[primaryCheckbox.id];
          updateAnswer(primaryCheckbox.id, !currentValue);
        };

        return (
          <div
            className="p-6 border-2 border-[#E8E8E8] rounded-2xl space-y-6 bg-[#fef8f2] my-4 cursor-pointer"
            onClick={handleGroupClick}
          >
            <h3 className="font-bold text-lg text-neutral-900 tracking-tight">{groupField.label}</h3>
            {groupField.fields.map((subFieldOrGroup, index) => {
              if (Array.isArray(subFieldOrGroup)) {
                return (
                  <div key={`sub-group-${index}`} className="grid grid-cols-2 gap-4">
                    {subFieldOrGroup.map(subField => (
                      <div key={subField.id}>{renderField(subField)}</div>
                    ))}
                  </div>
                );
              }
              return <div key={subFieldOrGroup.id}>{renderField(subFieldOrGroup)}</div>;
            })}
          </div>
        );
      }
      case 'consent_item': {
        const consentField = field as ConsentItemField;
        const isChecked = !!value;
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label 
              className={`flex items-start gap-2.5 cursor-pointer group p-5 bg-white rounded-2xl shadow-sm transition-all ${
                isChecked 
                  ? 'border-2 border-[#00A896]' 
                  : 'border-2 border-neutral-200 hover:border-[#00A896]/50'
              }`}
              onClick={() => updateAnswer(consentField.id, !value)}
            >
              <div className="relative mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  id={consentField.id}
                  checked={isChecked}
                  onChange={(e) => updateAnswer(consentField.id, e.target.checked)}
                  className="absolute opacity-0 w-4 h-4 cursor-pointer z-10 peer"
                  aria-required={consentField.required}
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
                {renderConsentLabel(consentField)}
              </span>
            </label>
            {errors[field.id] && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm font-medium text-[#FF6B6B]"
              >
                {errors[field.id]}
              </motion.p>
            )}
          </motion.div>
        );
      }
      case 'checkbox': {
        const checkboxField = field as CheckboxField;
        return (
          <div 
            className={`p-5 bg-white rounded-2xl shadow-sm cursor-pointer transition-all ${
              value ? 'border-2 border-[#00A896]' : 'border-2 border-neutral-200 hover:border-[#00A896]/50'
            }`}
            onClick={(event) => {
              const target = event.target as HTMLElement | null;
              if (target && (target.closest('label') || target.closest('input'))) {
                return;
              }
              event.stopPropagation();
              updateAnswer(checkboxField.id, !value);
            }}
          >
            <Checkbox
              id={checkboxField.id}
              label={checkboxField.label || ''}
              checked={!!value}
              onChange={(e) => {
                updateAnswer(checkboxField.id, e.target.checked);
              }}
            />
            {errors[field.id] && <p className="mt-2 text-sm font-medium text-[#FF6B6B]">{errors[field.id]}</p>}
          </div>
        );
      }
      default:
        return <div>Unsupported field type: {(field as any).type}</div>;
    }
  };

  const showBmiGauge = screen.id === 'assess.body_measurements' && calculations && 'bmi' in calculations && calculations.bmi && isComplete;

  return (
    <ScreenLayout title={title} helpText={help_text} headerSize={headerSize} titleClassName={titleClassName} showLoginLink={showLoginLink}>
      {screen.promo_banner && (
        <div className="mb-6 p-4 bg-teal-50 border-2 border-teal-200 rounded-xl flex items-center gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" strokeWidth="2.5" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-teal-800 font-medium">{screen.promo_banner.text}</span>
        </div>
      )}
      
      {/* Important Notice for GLP-1 Experience Step */}
      {screen.id === 'treatment.glp1_experience' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#FFF5F3] border-l-4 border-[#F25B5B] rounded-r-lg p-5 text-left max-w-3xl mx-auto mb-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#F25B5B] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-[#2D3436] leading-relaxed">
                <span className="font-semibold text-[#F25B5B]">First-time patients:</span> Federal regulations and medical safety protocols require all new GLP-1 patients to begin treatment at <span className="font-semibold">2.5mg weekly</span>. This allows your provider to monitor your response and adjust dosing appropriately over time, minimizing potential side effects.
              </p>
              <p className="text-sm text-[#2D3436] leading-relaxed mt-3">
                Our physicians can <span className="font-semibold">only prescribe higher doses</span> to patients who are actively continuing existing GLP-1 treatment.
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      <div className={`${fieldSpacing || 'space-y-6'} text-left`}>
        {fields.map((fieldOrGroup, index) => {
          if (Array.isArray(fieldOrGroup)) {
            return (
              <div key={`group-${index}`} className={fieldSpacing || 'space-y-6'}>
                {fieldOrGroup.map(field => {
                  const fieldContent = renderField(field);
                  return (
                    <div key={field.id} data-field-id={field.id}>
                      {field.progressive_display ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {fieldContent}
                        </motion.div>
                      ) : (
                        fieldContent
                      )}
                    </div>
                  );
                })}
              </div>
            );
          } else {
            const fieldContent = renderField(fieldOrGroup);
            return (
              <div key={fieldOrGroup.id} data-field-id={fieldOrGroup.id}>
                {fieldOrGroup.progressive_display ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {fieldContent}
                  </motion.div>
                ) : (
                  fieldContent
                )}
              </div>
            );
          }
        })}
      </div>

      {footer_note && (
        <p className="text-sm text-center mt-8 p-4 rounded-lg text-neutral-600 bg-[#E0F5F3]">
            {footer_note}
        </p>
      )}

      <AnimatePresence>
        {showBmiGauge && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            className="mt-8 flex justify-center"
          >
            <BMIGauge bmi={calculations.bmi as number} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isComplete && post_screen_note && !showBmiGauge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mt-8 text-center"
          >
            <div className="inline-block bg-[#E0F5F3] text-[#00A896] font-semibold px-5 py-2.5 rounded-full text-sm tracking-wide">
              {post_screen_note}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <NavigationButtons
        showBack={showBack}
        onBack={onBack}
        onNext={handleSubmit}
        isNextDisabled={!isComplete}
        nextButtonType="button"
        onSignInClick={onSignInClick}
      />
    </ScreenLayout>
  );
};

export default CompositeScreen;
