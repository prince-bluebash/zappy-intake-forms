import { parseISO, isValid, format } from 'date-fns';
import { apiClient } from './api';

export interface PatientData {
  patient: {
    id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    mobile_phone?: string;
    extracted_phone_number?: string;
    phone_number_kc?: string;
    notification_consent?: boolean;
    medication?: string;
    weight_goal_lbs?: number;
    profile?: {
      address?: {
        default: boolean;
        street?: string;
        unit?: string;
        locality?: string;
        region?: string;
        postalCode?: string;
        country?: string;
      };
      dateOfBirth?: string;
      dayOfBirth?: string;
      genderIdentity?: string;
      middleName?: string;
    };
    [key: string]: any;
  };
}

const AUTH_TOKEN_STORAGE_KEY = 'zappy_auth_token';

/**
 * Store token in localStorage
 */
export const storeToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.warn('[TokenAuth] Failed to store token in localStorage:', error);
  }
};

/**
 * Get token from localStorage
 */
export const getTokenFromStorage = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch (error) {
    console.warn('[TokenAuth] Failed to read token from localStorage:', error);
    return null;
  }
};

/**
 * Get token from window.authToken
 */
export const getTokenFromWindow = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const authToken = (window as any).authToken;
  if (typeof authToken === 'string' && authToken.trim().length > 0) {
    return authToken.trim();
  }
  
  return null;
};

/**
 * Get token from URL query parameters
 */
export const getTokenFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  // Check for both 'token' and 'tokne' (typo in user's example)
  return params.get('token') || params.get('tokne') || null;
};

/**
 * Remove token from URL without page reload
 */
export const removeTokenFromUrl = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const url = new URL(window.location.href);
    // Remove both 'token' and 'tokne' parameters
    url.searchParams.delete('token');
    url.searchParams.delete('tokne');
    
    // Update URL without reloading the page
    window.history.replaceState({}, '', url.toString());
  } catch (error) {
    console.warn('[TokenAuth] Failed to remove token from URL:', error);
  }
};

/**
 * Get token from multiple sources in priority order:
 * 1. URL query parameters (highest priority - will be stored and removed)
 * 2. window.authToken
 * 3. localStorage
 */
export const getToken = (): string | null => {
  // Priority 1: URL parameters (if found, should be stored and removed)
  const urlToken = getTokenFromUrl();
  if (urlToken) {
    // Store token in localStorage
    storeToken(urlToken);
    // Remove token from URL
    removeTokenFromUrl();
    return urlToken;
  }
  
  // Priority 3: localStorage
  const storageToken = getTokenFromStorage();
  if (storageToken) {
    return storageToken;
  }
  
  return null;
};

/**
 * Fetch patient data using token
 */
export const fetchPatientData = async (token: string): Promise<PatientData | null> => {
  try {
    const response = await apiClient.getAuthMe(token);
    return response as PatientData;
  } catch (error) {
    console.error('[TokenAuth] Failed to fetch patient data:', error);
    return null;
  }
};

/**
 * Map patient data from API response to form answers
 * Returns both the answers and a set of field IDs that were populated from API
 */
export const mapPatientDataToFormAnswers = (patientData: PatientData): {
  answers: Record<string, any>;
  apiPopulatedFields: Set<string>;
} => {
  const { patient } = patientData;
  const answers: Record<string, any> = {};
  const apiPopulatedFields = new Set<string>();

  // Email
  if (patient.email) {
    answers.email = patient.email.toLowerCase().trim();
    apiPopulatedFields.add('email');
  }

  // Name fields
  if (patient.first_name) {
    answers.first_name = patient.first_name;
    answers.account_firstName = patient.first_name;
    apiPopulatedFields.add('first_name');
    apiPopulatedFields.add('account_firstName');
  }
  if (patient.last_name) {
    answers.last_name = patient.last_name;
    answers.account_lastName = patient.last_name;
    apiPopulatedFields.add('last_name');
    apiPopulatedFields.add('account_lastName');
  }
  if (patient.profile?.middleName) {
    answers.middle_name = patient.profile.middleName;
    apiPopulatedFields.add('middle_name');
  }

  // Phone
  const phone = patient.extracted_phone_number || patient.mobile_phone || patient.phone_number_kc;
  if (phone) {
    // Remove formatting for storage
    const cleanPhone = phone.replace(/\D/g, '');
    answers.phone = cleanPhone;
    answers.account_phone = cleanPhone;
    apiPopulatedFields.add('phone');
    apiPopulatedFields.add('account_phone');
  }

  // Notification consent
  if (typeof patient.notification_consent === 'boolean') {
    answers.notification_consent = patient.notification_consent;
    apiPopulatedFields.add('notification_consent');
  }

  // Address
  if (patient.profile?.address) {
    const addr = patient.profile.address;
    if (addr.street) {
      answers.address_line1 = addr.street;
      answers.shipping_address = addr.street;
      apiPopulatedFields.add('address_line1');
      apiPopulatedFields.add('shipping_address');
    }
    if (addr.unit) {
      answers.address_line2 = addr.unit;
      apiPopulatedFields.add('address_line2');
    }
    if (addr.locality) {
      answers.city = addr.locality;
      answers.shipping_city = addr.locality;
      apiPopulatedFields.add('city');
      apiPopulatedFields.add('shipping_city');
    }
    if (addr.region) {
      answers.state = addr.region.toUpperCase();
      answers.shipping_state = addr.region.toUpperCase();
      answers.home_state = addr.region.toUpperCase();
      apiPopulatedFields.add('state');
      apiPopulatedFields.add('shipping_state');
      apiPopulatedFields.add('home_state');
    }
    if (addr.postalCode) {
      answers.zip_code = addr.postalCode;
      answers.shipping_zip = addr.postalCode;
      apiPopulatedFields.add('zip_code');
      apiPopulatedFields.add('shipping_zip');
    }
    if (addr.country) {
      answers.country = addr.country.toUpperCase();
      apiPopulatedFields.add('country');
    }

    // Structured address object
    answers.address = {
      street: addr.street || '',
      unit: addr.unit || '',
      locality: addr.locality || '',
      region: addr.region?.toUpperCase() || '',
      postalCode: addr.postalCode || '',
      country: addr.country?.toUpperCase() || 'US',
      default: addr.default || false,
    };
    apiPopulatedFields.add('address');
  }

  // Date of Birth
  if (patient.profile?.dateOfBirth || patient.profile?.dayOfBirth) {
    const dob = patient.profile.dateOfBirth || patient.profile.dayOfBirth;
    if (dob) {
      // Convert ISO date to MM/DD/YYYY format using date-fns
      const date = parseISO(dob);
      if (isValid(date)) {
        answers.dob = format(date, 'MM/dd/yyyy');
        apiPopulatedFields.add('dob');
      }
    }
  }

  // Gender Identity
  if (patient.profile?.genderIdentity) {
    answers.sex_birth = patient.profile.genderIdentity === 'Man/Boy' ? 'male' : 'female';
    apiPopulatedFields.add('sex_birth');
  }

  // Medication preference
  if (patient.medication) {
    answers.selected_medication = patient.medication;
    apiPopulatedFields.add('selected_medication');
  }

  // Weight goal
  if (patient.weight_goal_lbs) {
    answers.goal_weight = patient.weight_goal_lbs;
    apiPopulatedFields.add('goal_weight');
  }

  // Client record ID
  if (patient.id) {
    answers.client_record_id = patient.id;
    apiPopulatedFields.add('client_record_id');
  }

  return { answers, apiPopulatedFields };
};

/**
 * Check if we should skip email capture step
 */
export const shouldSkipEmailCapture = (answers: Record<string, any>): boolean => {
  return Boolean(answers.email && typeof answers.email === 'string' && answers.email.trim().length > 0);
};

