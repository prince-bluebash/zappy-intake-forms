export interface Discount {
  id: string;
  name: string;
  code: string;
  amount: number;
  percentage: number;
  description?: string;
}

export interface AutoAppliedDiscount {
  id: string;
  discount_id: string;
  package_id: string;
  is_auto_applied: boolean;
  starts_at?: string;
  ends_at?: string;
  created_at?: string;
  updated_at?: string;
  discount: Discount;
}

export interface ConsultationMedicationDetails {
  id: string;
  name?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  image_document_id?: string | null;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ConsultationMedicationPackage {
  id: string;
  invoice_amount?: number;
  invoice_amount_starter?: number | null;
  name?: string;
  pharmacy_id?: string;
  pharmacy_name?: string;
  plan?: string;
  service_type?: string;
  [key: string]: unknown;
}

export interface ConsultationMedicationPharmacy {
  id: string;
  name: string;
  dose_options?: Array<string | number | null> | null;
  doseOptions?: Array<string | number | null> | null;
  [key: string]: unknown;
}

export interface ConsultationMedicationEntry {
  medication: ConsultationMedicationDetails;
  packages?: ConsultationMedicationPackage[];
  pharmacies?: ConsultationMedicationPharmacy[];
}

export interface MedicationsResponse {
  medications: MedicationOption[];
  rawMedications: ConsultationMedicationEntry[];
  service_type?: string;
  state?: string;
}

export interface MedicationOption {
  medication: string;
  pharmacies: string[];
  details?: ConsultationMedicationDetails;
  packages?: ConsultationMedicationPackage[];
  pharmacyOptions?: ConsultationMedicationPharmacy[];
}

export interface PackagePlan {
  id: string;
  created_at?: string;
  updated_at?: string;
  discount?: any;
  discount_amount?: number | null;
  discount_tag?: string;
  invoice_amount?: number;
  invoice_amount_starter?: number | null;
  insurance?: boolean;
  is_active?: boolean;
  medication?: string;
  medication_id?: string;
  medication_description?: string | null;
  medication_subtitle?: string | null;
  name?: string;
  payment_plan_start_after?: number | null;
  pharmacy?: string;
  pharmacy_id?: string;
  plan?: string;
  service_type?: string;
  // Legacy camelCase fields for backward compatibility
  invoiceAmount?: number;
  per_month_price?: number | null;
  image_url?: string | null;
  image_document_id?: string | null;
  features?: string[];
  offers?: string[];
  tags?: string[];
  popular?: boolean;
  starter_package?: boolean;
  auto_applied_discount?: AutoAppliedDiscount | null;
}

interface PackagesResponse extends Array<PackagePlan> {}

interface ConsultationMedicationsResponse {
  medications?: ConsultationMedicationEntry[];
  service_type?: string;
  state?: string;
}

interface DiscountResponse {
  message: string;
  discount?: Discount;
}

export interface PaymentIntentResponse {
  client_secret?: string;
  clientSecret?: string;
  publishable_key?: string;
  publishableKey?: string;
  amount?: number;
  currency?: string;
  status?: string;
  payment_intent_id?: string;
  paymentIntentId?: string;
  customer_email?: string;
  customerEmail?: string;
  [key: string]: unknown;
}

export interface InvoiceResponse {
  id: string;
  number?: string | null;
  amount_due?: number | null;
  amountDue?: number | null;
  currency?: string | null;
  status?: string | null;
  description?: string | null;
  client_email?: string | null;
  clientEmail?: string | null;
  due_date?: string | null;
  dueDate?: string | null;
  payment_intent_payload?: PaymentIntentResponse | null;
  paymentIntentPayload?: PaymentIntentResponse | null;
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface InvoicePaymentIntentResponse {
  invoice: InvoiceResponse;
  payment_intent?: PaymentIntentResponse;
  paymentIntent?: PaymentIntentResponse;
}

export interface LeadPayload {
  email?: string;
  service?: string;
  status?: string;
  meta_data?: Record<string, unknown>;
  form_request_id?: string;
  id?: string;
}

export interface Lead {
  id: string;
  form_request_id?: string | null;
  email?: string | null;
  service?: string | null;
  status?: string | null;
  meta_data?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface LeadResponse {
  lead: Lead;
}

export interface SubmitConsultationResponse {
  message?: string;
  form_request_id?: string;
  [key: string]: unknown;
}

export interface CreatePaymentIntentPayload {
  amount?: number;
  currency?: string;
  email?: string;
  plan_id?: string;
  planId?: string;
  metadata?: Record<string, string | number>;
  payment_intent_id?: string;
  paymentIntentId?: string;
}

const BASE_URL = import.meta.env.VITE_BACKEND_API_BASE || 'http://localhost:3005';
const API_KEY = import.meta.env.VITE_BACKEND_API_KEY || '';

const defaultHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
};

const get = async <T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> => {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: defaultHeaders,
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMessage = data?.error || data?.message || 'Request failed';
    throw new Error(errorMessage);
  }

  return data as T;
};

const post = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = data?.error || data?.message || 'Request failed';
    throw new Error(errorMessage);
  }

  return data as T;
};

const postFormData = async <T>(path: string, formData: FormData): Promise<T> => {
  // For FormData, we must NOT set Content-Type header - browser will set it with boundary
  const headers: HeadersInit = {
    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: headers,
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = data?.error || data?.message || 'Request failed';
    throw new Error(errorMessage);
  }

  return data as T;
};

const getDataWithToken = async <T>(
  path: string,
  token: string,
): Promise<T> => {
  const fullPath = `${BASE_URL}${path}`;
  const url = new URL(fullPath, fullPath.startsWith('/') ? window.location.origin : undefined);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: headers,
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMessage = data?.error || data?.message || 'Request failed';
    throw new Error(errorMessage);
  }

  return data as T;
};

export const apiClient = {
  getPackages: (
    state: string,
    serviceType: string,
    medication?: string,
    pharmacyName?: string
  ) =>
    get<PackagesResponse>('/consultations/packages', {
      state,
      service_type: serviceType,
      medication,
      pharmacy_name: pharmacyName,
    }),

  getMedications: async (state: string, serviceType: string): Promise<MedicationsResponse> => {
    const data = await get<ConsultationMedicationsResponse>('/consultations/medications', {
      state,
      service_type: serviceType,
    });

    const medications =
      (data?.medications || []).map((entry) => {
        const medicationDetails = entry?.medication || ({} as ConsultationMedicationDetails);
        const displayName =
          medicationDetails.title ||
          medicationDetails.name ||
          medicationDetails.subtitle ||
          medicationDetails.id ||
          'Medication';

        const pharmacyOptions = entry?.pharmacies || [];

        return {
          medication: displayName,
          pharmacies: pharmacyOptions
            .map((pharmacy) => pharmacy?.name)
            .filter((name): name is string => Boolean(name && name.trim())),
          details: medicationDetails,
          packages: entry?.packages || [],
          pharmacyOptions,
        } as MedicationOption;
      }) || [];

    return {
      medications,
      rawMedications: data?.medications || [],
      service_type: data?.service_type,
      state: data?.state,
    } as MedicationsResponse;
  },

  applyDiscount: (discountCode: string, planId: string) =>
    get<DiscountResponse>(`/consultations/packages/${planId}/discounts/check?discount_code=${discountCode}`),
  // get<DiscountResponse>(`/consultations/apply-discount?discount_code=${discountCode}`),

  submitConsultation: (payload: Record<string, unknown>) =>
    post<SubmitConsultationResponse>('/consultations/submit', payload),

  login: (payload: Record<string, unknown>) =>
    post<any>('/consultations/login', payload),

  forgotPassword: (payload: Record<string, unknown>) =>
    post<any>('/api/v1/auth/forgot-password', payload),

  clientRecord: (payload: Record<string, unknown>) =>
    post<any>('/consultations/client-records', payload),

  createOrUpdateLead: (payload: LeadPayload) =>
    post<LeadResponse>('/consultations/leads', payload),

  createPaymentIntent: (payload: CreatePaymentIntentPayload) =>
    post<PaymentIntentResponse>('/payments/payment-intent', payload),

  getPaymentIntent: (paymentIntentId: string) =>
    get<PaymentIntentResponse>(`/payments/payment-intent/${paymentIntentId}`),

  getInvoicePaymentIntent: (invoiceId: string) =>
    post<InvoicePaymentIntentResponse>(`/stripe/invoices/${invoiceId}/payment-intent`, {}),

  checkClientRecord: (email: string) =>
    get<{ exists: boolean; message: string; short_code: string }>('/consultations/client-records/check', {
      email,
    }),
  
  setupIntent: (payload: Record<string, unknown>) =>
    post<PaymentIntentResponse>('/consultations/setup-intent', payload),

  updateProfilePhoto: (payload: FormData, patientId: string) =>
    postFormData<any>(`/api/v1/patients/${patientId}/profile-picture`, payload),
  
  getAuthMe: (token: string) =>
    getDataWithToken<any>('/api/v1/auth/me', token),
};

export type ApiClient = typeof apiClient;
