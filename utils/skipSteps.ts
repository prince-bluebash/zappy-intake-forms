import { Screen, FormConfig, Field } from '../types';

/**
 * Skip step configuration
 * Defines which steps should be skipped based on conditions
 */
export interface SkipStepRule {
  screenId: string;
  condition: (answers: Record<string, any>) => boolean;
  description?: string;
}

/**
 * Check if a value is considered "filled" (not empty/null/undefined)
 */
const isValueFilled = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return true; // Boolean values are always considered filled
  if (typeof value === 'number') return true; // Numbers are always considered filled
  return true;
};

/**
 * Get all required field IDs from a composite screen
 */
const getRequiredFieldIds = (screen: Screen): string[] => {
  if (screen.type !== 'composite' || !('fields' in screen)) {
    return [];
  }

  const requiredFields: string[] = [];
  
  const processField = (field: Field | Field[]): void => {
    if (Array.isArray(field)) {
      field.forEach(processField);
    } else {
      if (field.required && field.id) {
        requiredFields.push(field.id);
      }
      // Handle nested fields in medication_details_group
      if (field.type === 'medication_details_group' && 'fields' in field) {
        field.fields.forEach(processField);
      }
    }
  };

  screen.fields.forEach(processField);
  return requiredFields;
};

/**
 * Check if all required fields for a screen are available in answers
 */
export const areAllScreenFieldsAvailable = (
  screen: Screen,
  answers: Record<string, any>
): boolean => {
  // Skip non-input screens (content, interstitial, terminal, etc.)
  const skipScreenTypes = ['content', 'interstitial', 'terminal', 'review', 'plan_selection'];
  if (skipScreenTypes.includes(screen.type)) {
    return false; // Never skip these screens automatically
  }

  // For single_select, multi_select, autocomplete screens
  if (screen.type === 'single_select' || screen.type === 'multi_select' || screen.type === 'autocomplete') {
    if (!screen.required) {
      return false; // Don't skip optional screens
    }
    
    // Check if answer exists using field_id or screen.id
    const answerKey = ('field_id' in screen && screen.field_id) ? screen.field_id : screen.id;
    return isValueFilled(answers[answerKey]);
  }

  // For composite screens, check all required fields
  if (screen.type === 'composite') {
    const requiredFields = getRequiredFieldIds(screen);
    
    if (requiredFields.length === 0) {
      return false; // No required fields, don't skip
    }

    // Check if all required fields are filled
    return requiredFields.every(fieldId => isValueFilled(answers[fieldId]));
  }

  // For text, number, date screens
  if (screen.type === 'text' || screen.type === 'number' || screen.type === 'date') {
    if (!screen.required) {
      return false; // Don't skip optional screens
    }
    
    // Check if answer exists using screen.id
    return isValueFilled(answers[screen.id]);
  }

  // For consent screens, we generally don't skip them automatically
  if (screen.type === 'consent') {
    return false;
  }

  return false;
};

/**
 * Generate skip rules dynamically based on form configuration
 */
export const generateSkipRulesFromConfig = (config: FormConfig): SkipStepRule[] => {
  const rules: SkipStepRule[] = [];

  config.screens.forEach((screen) => {
    // Skip non-input screens
    const skipScreenTypes = ['content', 'interstitial', 'terminal', 'review', 'plan_selection'];
    if (skipScreenTypes.includes(screen.type)) {
      return;
    }

    // Generate a skip rule for this screen
    rules.push({
      screenId: screen.id,
      condition: (answers) => areAllScreenFieldsAvailable(screen, answers),
      description: `Skip ${screen.id} if all required fields are available in API data`,
    });
  });

  return rules;
};

/**
 * Default skip step rules
 * Add new rules here to skip additional steps based on conditions
 */
export const DEFAULT_SKIP_STEP_RULES: SkipStepRule[] = [
  {
    screenId: 'capture.email',
    condition: (answers) => {
      // Skip email capture if email already exists and is valid
      const email = answers.email;
      return Boolean(
        email &&
        typeof email === 'string' &&
        email.trim().length > 0 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      );
    },
    description: 'Skip email capture if email already exists',
  },
];

/**
 * Get all screens that should be skipped based on current answers
 */
export const getSkippedScreens = (
  answers: Record<string, any>,
  skipRules: SkipStepRule[] = DEFAULT_SKIP_STEP_RULES
): string[] => {
  return skipRules
    .filter(rule => rule.condition(answers))
    .map(rule => rule.screenId);
};

/**
 * Check if a specific screen should be skipped
 */
export const shouldSkipScreen = (
  screenId: string,
  answers: Record<string, any>,
  skipRules: SkipStepRule[] = DEFAULT_SKIP_STEP_RULES
): boolean => {
  const rule = skipRules.find(r => r.screenId === screenId);
  return rule ? rule.condition(answers) : false;
};

/**
 * Get the count of skipped screens
 */
export const getSkippedScreensCount = (
  answers: Record<string, any>,
  allScreens: Array<{ id: string }>,
  skipRules: SkipStepRule[] = DEFAULT_SKIP_STEP_RULES
): number => {
  const skippedScreenIds = getSkippedScreens(answers, skipRules);
  // Only count screens that actually exist in the form
  return allScreens.filter(screen => skippedScreenIds.includes(screen.id)).length;
};

