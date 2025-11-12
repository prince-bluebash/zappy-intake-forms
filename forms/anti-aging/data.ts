import { FormConfig } from "../../types";

const formConfig: FormConfig = {
  default_condition: "Anti-Aging",
  meta: {
    product: "Longevity-Focused Anti-Aging Program",
    form_name: "Anti-Aging Health Assessment",
    version: "2.0.0",
    language: "en-US",
  },
  settings: {
    theme: {
      primary_hex: "#8b5cf6",
      accent_hex: "#f472b6",
      secondary_hex: "#6b7280",
      font_stack: '"Nunito Sans", sans-serif',
      background_hex: "#fdf4ff",
      selection_states: {
        hover_hex: "#e0e7ff",
        active_hex: "#8b5cf6",
        selected_hex: "#4338ca",
        border_selected_hex: "#3730a3",
      },
      lavender_accent: "#E8E7F3",
      lavender_primary: "#8B7FC5",
    },
    progress_bar: true,
    show_back_button: true,
    autosave_ms: 800,
    show_phase_indicator: true,
  },
  screens: [
    // ═══════════════════════════════════════════════════════════
    // PHASE 1: LONGEVITY GOALS & QUALIFY
    // ═══════════════════════════════════════════════════════════
    {
      id: "goals.longevity_focus",
      type: "single_select",
      phase: "qualify",
      title: "What's your primary anti-aging goal?",
      auto_advance: true,
      options: [
        { value: "healthspan", label: "Extend healthy lifespan" },
        { value: "energy_vitality", label: "Boost energy and vitality" },
        { value: "cognitive_health", label: "Maintain cognitive function" },
        { value: "physical_appearance", label: "Improve physical appearance" },
        { value: "disease_prevention", label: "Prevent age-related diseases" },
        { value: "recovery_optimization", label: "Optimize cellular recovery" },
        { value: "hormonal_balance", label: "Restore hormonal balance" },
        { value: "exploring", label: "Still exploring options" },
      ],
      required: true,
      next: "goals.timeline",
    },
    {
      id: "goals.timeline",
      type: "single_select",
      phase: "qualify",
      title: "What's your timeline for seeing results?",
      auto_advance: true,
      options: [
        { value: "1-3_months", label: "1-3 months" },
        { value: "3-6_months", label: "3-6 months" },
        { value: "6-12_months", label: "6-12 months" },
        { value: "long_term", label: "Long-term (1+ years)" },
        { value: "lifelong", label: "Lifelong optimization" },
      ],
      required: true,
      next: "goals.concerns",
    },
    {
      id: "goals.concerns",
      type: "multi_select",
      phase: "qualify",
      title: "What aging-related concerns do you have?",
      help_text:
        "Understanding your concerns helps us personalize your program",
      options: [
        { value: "low_energy", label: "Low energy and fatigue" },
        { value: "poor_sleep", label: "Poor sleep quality" },
        { value: "cognitive_decline", label: "Memory and focus issues" },
        { value: "muscle_loss", label: "Loss of muscle mass" },
        { value: "skin_aging", label: "Skin aging and wrinkles" },
        { value: "slow_recovery", label: "Slower recovery from exercise" },
        { value: "joint_stiffness", label: "Joint pain and stiffness" },
        { value: "weight_gain", label: "Unwanted weight gain" },
        { value: "hormonal_changes", label: "Hormonal changes" },
        { value: "disease_risk", label: "Risk of age-related diseases" },
        { value: "none", label: "None of these" },
        { value: "other", label: "Other" },
      ],
      other_text_id: "concerns_other",
      required: true,
      next: "home_state",
    },
    {
      id: "home_state",
      type: "autocomplete",
      phase: "qualify",
      title: "Which state do you live in?",
      help_text: "This helps us determine treatment availability in your area.",
      options: [],
      required: true,
      next: "demographics.dob",
    },
    {
      id: "demographics.dob",
      type: "text",
      phase: "qualify",
      title: "When were you born?",
      help_text: "We need this to determine if you're eligible for treatment",
      placeholder: "MM/DD/YYYY",
      mask: "##/##/####",
      required: true,
      validation: {
        pattern: "^(0[1-9]|1[0-2])\\/(0[1-9]|[12][0-9]|3[01])\\/(19|20)\\d{2}$",
        error: "Enter date as MM/DD/YYYY",
        min_age: 25,
        max_age: 80,
      },
      calculations: [
        {
          id: "age",
          formula: "AGE(demographics.dob)",
        },
      ],
      next_logic: [
        {
          if: "calc.age < 25",
          go_to: "qualify.age_exclusion",
        },
        {
          if: "calc.age > 80",
          go_to: "qualify.age_exclusion",
        },
        {
          else: "assess.health_baseline",
        },
      ],
    },
    {
      id: "qualify.age_exclusion",
      type: "terminal",
      phase: "qualify",
      status: "warning",
      title: "Age requirements for longevity therapy",
      body: "Our anti-aging program with advanced therapies is designed for adults ages 25-80, where treatments have been thoroughly studied for longevity benefits.\n\nYour doctor can help you find age-appropriate wellness approaches that are right for your current life stage.",
      cta_primary: {
        label: "Learn More",
      },
    },
    {
      id: "assess.health_baseline",
      type: "composite",
      phase: "qualify",
      title: "Tell us about your current health baseline",
      post_screen_note:
        "This helps us understand your starting point for longevity optimization.",
      fields: [
        [
          {
            id: "height_ft",
            type: "number",
            label: "Height (feet)",
            required: true,
            min: 3,
            max: 8,
            width: "half",
            validation: {
              min: 3,
              max: 8,
              error: "Enter height between 3-8 feet",
            },
          },
          {
            id: "height_in",
            type: "number",
            label: "Height (inches)",
            required: true,
            min: 0,
            max: 11,
            width: "half",
            validation: {
              min: 0,
              max: 11,
              error: "Enter inches between 0-11",
            },
          },
        ],
        {
          id: "weight",
          type: "number",
          label: "Current weight (lb)",
          min: 80,
          max: 500,
          required: true,
          validation: {
            min: 80,
            max: 500,
            error: "Enter weight between 80-500 lbs",
          },
        },
        {
          id: "health_status",
          type: "single_select",
          label: "How would you describe your current health?",
          required: true,
          options: [
            {
              value: "excellent",
              label: "Excellent - Very few health concerns",
            },
            {
              value: "good",
              label: "Good - Generally healthy with minor issues",
            },
            { value: "fair", label: "Fair - Some health concerns managed" },
            { value: "poor", label: "Poor - Multiple health issues" },
            {
              value: "declining",
              label: "Declining - Noticeable health changes with age",
            },
          ],
        },
      ],
      calculations: [
        {
          id: "bmi",
          formula: "703 * weight / ((height_ft * 12 + height_in) ** 2)",
        },
      ],
      next: "interstitial.success",
    },
    {
      id: "interstitial.success",
      type: "interstitial",
      phase: "qualify",
      variant: "stat_success",
      next: "capture.email",
    },

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: EARLY EMAIL CAPTURE
    // ═══════════════════════════════════════════════════════════
    {
      id: "capture.email",
      type: "composite",
      phase: "qualify",
      title: "Let's create your personalized longevity plan",
      fields: [
        {
          id: "email",
          type: "email",
          label: "Email address",
          placeholder: "john.doe@zappyhealth.com",
          help_text:
            "We'll send your personalized plan here—no spam, just what matters",
          required: true,
          validation: {
            pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
            error: "Enter a valid email address",
          },
        },
      ],
      next: "transition.health_questions",
    },
    {
      id: "transition.health_questions",
      type: "content",
      phase: "qualify",
      headline: "Great progress! Let's build your health profile",
      body: "Next up: a comprehensive health assessment to ensure we find the safest, most effective longevity treatments for you.\n\nEvery answer helps us personalize your anti-aging plan.",
      cta_primary: {
        label: "Continue",
      },
      next: "assess.sex_birth",
    },

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: COMPREHENSIVE MEDICAL ASSESSMENT
    // ═══════════════════════════════════════════════════════════
    {
      id: "assess.sex_birth",
      type: "single_select",
      phase: "assess_medical",
      field_id: "sex_birth",
      title: "What was your sex assigned at birth?",
      auto_advance: true,
      required: true,
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "intersex", label: "Intersex" },
        { value: "no_say", label: "Prefer not to say" },
      ],
      next: "assess.ethnicity",
    },
    {
      id: "assess.ethnicity",
      type: "single_select",
      phase: "assess_medical",
      field_id: "ethnicity",
      title: "How would you describe your ethnicity?",
      help_text:
        "Optional—helps us understand treatment effects across different backgrounds",
      auto_advance: true,
      options: [
        { value: "asian", label: "Asian" },
        { value: "black", label: "Black or African American" },
        { value: "hispanic", label: "Hispanic or Latino" },
        { value: "indigenous", label: "Indigenous or Native American" },
        { value: "middle_eastern", label: "Middle Eastern" },
        { value: "pacific_islander", label: "Pacific Islander" },
        { value: "white", label: "White" },
        { value: "multiple", label: "Multiple ethnicities" },
        { value: "other", label: "Other" },
        { value: "prefer_not_say", label: "Prefer not to say" },
      ],
      next: "assess.medical_conditions",
    },

    // Medical Conditions (from peptide questionnaire)
    {
      id: "assess.medical_conditions",
      type: "multi_select",
      phase: "assess_medical",
      title: "Do you have any of the following medical conditions?",
      help_text: "Select all that apply (this helps ensure safe treatment)",
      options: [
        { value: "cardiovascular_disease", label: "Cardiovascular disease" },
        { value: "high_cholesterol", label: "High cholesterol" },
        { value: "osteoporosis", label: "Osteoporosis or bone density issues" },
        {
          value: "cognitive_decline",
          label: "Cognitive decline or Alzheimer's",
        },
        { value: "hormonal_imbalance", label: "Hormonal imbalances" },
        { value: "type2_diabetes", label: "Type 2 diabetes" },
        { value: "type1_diabetes", label: "Type 1 Diabetes" },
        { value: "high_blood_pressure", label: "High blood pressure" },
        { value: "obesity", label: "Obesity" },
        { value: "sleep_apnea", label: "Sleep Apnea" },
        { value: "heart_disease", label: "Heart Disease" },
        { value: "stroke", label: "Stroke" },
        { value: "testicular_cancer", label: "Testicular Cancer" },
        { value: "pituitary_disorders", label: "Pituitary Disorders" },
        { value: "chronic_fatigue", label: "Chronic Fatigue Syndrome" },
        { value: "fibromyalgia", label: "Fibromyalgia" },
        { value: "autoimmune", label: "Autoimmune Disorders" },
        { value: "liver_disease", label: "Liver Disease" },
        { value: "kidney_disease", label: "Kidney Disease" },
        { value: "respiratory_disorders", label: "Respiratory Disorders" },
        { value: "cancer_history", label: "Cancer treatment or history" },
        { value: "other_condition", label: "Other (please specify)" },
        { value: "none", label: "None of these" },
      ],
      other_text_id: "medical_conditions_other",
      next: "assess.medications_supplements",
    },

    // Current Medications and Supplements
    {
      id: "assess.medications_supplements",
      type: "single_select",
      phase: "assess_medical",
      title: "Are you currently taking any medications or supplements?",
      auto_advance: true,
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      required: true,
      next_logic: [
        {
          if: "answer == 'yes'",
          go_to: "assess.medications_detail",
        },
        {
          else: "assess.allergies",
        },
      ],
    },
    {
      id: "assess.medications_detail",
      type: "text",
      phase: "assess_medical",
      title: "Please list all medications and supplements",
      help_text:
        "Include medication names, dosages, and frequency if known. Example: 'Lisinopril 10mg daily, Vitamin D 2000IU daily'",
      placeholder: "List medications and supplements with dosages",
      multiline: true,
      rows: 6,
      required: true,
      next: "assess.allergies",
    },

    // Allergies
    {
      id: "assess.allergies",
      type: "single_select",
      phase: "assess_medical",
      field_id: "has_allergies",
      title: "Any medication allergies?",
      auto_advance: true,
      required: true,
      options: [
        { value: "no", label: "No" },
        { value: "yes", label: "Yes" },
      ],
      next_logic: [
        {
          if: "answer == 'yes'",
          go_to: "assess.allergies_detail",
        },
        {
          else: "assess.substance_use_alcohol",
        },
      ],
    },
    {
      id: "assess.allergies_detail",
      type: "text",
      phase: "assess_medical",
      title: "List them with reactions",
      placeholder: "Penicillin (rash), sulfa drugs (hives)",
      multiline: true,
      rows: 4,
      required: true,
      next: "assess.substance_use_alcohol",
    },

    {
      id: "assess.substance_use_alcohol",
      type: "single_select",
      phase: "assess_medical",
      title: "How often do you drink alcohol?",
      auto_advance: true,
      required: true,
      options: [
        { value: "none", label: "I don't drink" },
        { value: "occasional", label: "Occasionally (1-2 drinks/week)" },
        { value: "social", label: "Socially (3-6 drinks/week)" },
        { value: "moderate", label: "Moderate (7-10 drinks/week)" },
        { value: "heavy", label: "Heavy (10+ drinks/week)" },
      ],
      next: "assess.substance_use_tobacco",
    },
    {
      id: "assess.substance_use_tobacco",
      type: "single_select",
      phase: "assess_medical",
      title: "Do you use tobacco or nicotine?",
      auto_advance: true,
      required: true,
      options: [
        { value: "no", label: "No" },
        { value: "cigarettes", label: "Cigarettes" },
        { value: "vaping", label: "Vaping or e-cigarettes" },
        { value: "other", label: "Other tobacco products" },
      ],
      next: "assess.substance_use_recreational",
    },
    {
      id: "assess.substance_use_recreational",
      type: "multi_select",
      phase: "assess_medical",
      title: "Used any of these in the past 6 months?",
      options: [
        { value: "cannabis", label: "Cannabis or marijuana" },
        { value: "cocaine", label: "Cocaine" },
        { value: "opioids", label: "Non-prescribed opioids" },
        {
          value: "stimulants",
          label: "Non-prescribed stimulants (Adderall, etc.)",
        },
        { value: "methamphetamine", label: "Methamphetamine" },
        { value: "none", label: "None of these" },
      ],
      required: true,
      next: "assess.pregnancy_check",
    },

    // Pregnancy Check (for females)
    {
      id: "assess.pregnancy_check",
      type: "single_select",
      phase: "assess_safety",
      title: "Are you pregnant, trying to conceive, or nursing?",
      auto_advance: true,
      options: [
        { value: "no", label: "No" },
        { value: "pregnant", label: "Currently pregnant" },
        { value: "trying", label: "Trying to conceive or planning to soon" },
        { value: "nursing", label: "Currently breastfeeding" },
      ],
      required: true,
      next_logic: [
        {
          if: "sex_birth == 'female' AND answer == 'pregnant'",
          go_to: "assess.pregnancy_exclusion",
        },
        {
          if: "sex_birth == 'female' AND answer == 'trying'",
          go_to: "assess.pregnancy_exclusion",
        },
        {
          if: "sex_birth == 'female' AND answer == 'nursing'",
          go_to: "assess.pregnancy_exclusion",
        },
        {
          else: "assess.safety_screening",
        },
      ],
    },
    {
      id: "assess.pregnancy_exclusion",
      type: "terminal",
      phase: "assess_safety",
      status: "warning",
      title: "We'd love to help you after pregnancy/nursing",
      body: "Anti-aging therapies aren't recommended during pregnancy, when trying to conceive, or while breastfeeding for safety reasons.\n\nWhen you are no longer pregnant or breastfeeding, we'd be happy to work with you. Your healthcare provider can help you explore safe alternatives in the meantime.",
      cta_primary: {
        label: "Return to Zappy Health",
        url: "https://zappyhealth.com",
      },
    },

    // Additional Safety Screening
    {
      id: "assess.safety_screening",
      type: "multi_select",
      phase: "assess_safety",
      title: "Do any of the following apply to you?",
      help_text: "Safety screening for longevity therapies",
      safety_critical: true,
      options: [
        {
          value: "active_cancer",
          label: "Currently have or being treated for cancer",
        },
        { value: "cancer_history", label: "History of cancer (in remission)" },
        {
          value: "severe_heart_disease",
          label: "Severe heart disease or recent heart attack",
        },
        {
          value: "severe_kidney_disease",
          label: "Severe kidney disease or dialysis",
        },
        { value: "severe_liver_disease", label: "Severe liver disease" },
        { value: "blood_clotting_disorder", label: "Blood clotting disorders" },
        {
          value: "hormone_sensitive_cancer",
          label: "History of hormone-sensitive cancers",
        },
        { value: "pituitary_tumor", label: "Pituitary tumor or disorder" },
        { value: "uncontrolled_diabetes", label: "Poorly controlled diabetes" },
        {
          value: "psychiatric_condition",
          label: "Severe psychiatric condition",
        },
        {
          value: "immunocompromised",
          label: "Immunocompromised or on immunosuppressants",
        },
        {
          value: "peptide_allergy",
          label: "Known allergy to peptide medications",
        },
        {
          value: "growth_hormone_contraindication",
          label: "Contraindication to growth hormone therapy",
        },
        { value: "none", label: "None of these apply to me" },
      ],
      required: true,
      next_logic: [
        {
          if: "answer contains 'active_cancer'",
          go_to: "assess.safety_exclusion",
        },
        {
          if: "answer contains 'severe_heart_disease'",
          go_to: "assess.safety_exclusion",
        },
        {
          if: "answer contains 'peptide_allergy'",
          go_to: "assess.safety_exclusion",
        },
        {
          if: "answer contains ['cancer_history','severe_kidney_disease','severe_liver_disease','blood_clotting_disorder','hormone_sensitive_cancer','pituitary_tumor','uncontrolled_diabetes','psychiatric_condition','immunocompromised','growth_hormone_contraindication']",
          go_to: "assess.safety_review_required",
        },
        {
          else: "assess.additional_notes",
        },
      ],
    },
    {
      id: "assess.safety_exclusion",
      type: "terminal",
      phase: "assess_safety",
      status: "warning",
      title: "Safety review required",
      body: "Based on your health profile, longevity therapies may not be appropriate at this time due to safety concerns.\n\nYour primary care physician or specialist can help you explore alternative anti-aging approaches that are safer for your current health status.",
      cta_primary: {
        label: "Learn More",
      },
    },
    {
      id: "assess.safety_review_required",
      type: "content",
      phase: "assess_safety",
      status: "warning",
      headline: "Additional medical review needed",
      body: "Your health history requires extra attention from our medical team. We may need additional records or specialist clearance to ensure your safety.\n\nThis doesn't disqualify you, but helps us provide the safest possible care.",
      cta_primary: {
        label: "Continue",
      },
      next: "assess.additional_notes",
    },
    {
      id: "assess.additional_notes",
      type: "text",
      phase: "assess_medical",
      title: "Anything else we should know?",
      help_text:
        "Share any additional health information, concerns, or longevity goals that would help us provide the best care.",
      placeholder:
        "Additional medical history, health concerns, or anti-aging goals...",
      multiline: true,
      rows: 6,
      required: false,
      next: "transition.treatment_intro",
    },

    // ═══════════════════════════════════════════════════════════
    // PHASE 4: TREATMENT SELECTION & LOGISTICS
    // ═══════════════════════════════════════════════════════════
    {
      id: "transition.treatment_intro",
      type: "content",
      phase: "treatment",
      headline: "Excellent work completing your health assessment!",
      body: "Now let's explore which longevity therapies might work best for you. Our clinicians will review your complete profile to recommend the safest, most effective treatments.",
      cta_primary: {
        label: "Continue",
      },
      next: "treatment.peptide_experience",
    },
    {
      id: "treatment.peptide_experience",
      type: "single_select",
      phase: "treatment",
      title: "Have you used longevity or anti-aging therapies before?",
      help_text:
        "This includes peptides, hormones, or other advanced treatments",
      auto_advance: true,
      required: true,
      options: [
        { value: "never", label: "No, never used these therapies" },
        {
          value: "yes",
          label: "Yes, I have experience with longevity treatments",
        },
      ],
      next_logic: [
        {
          if: "answer == 'yes'",
          go_to: "treatment.therapy_history",
        },
        {
          else: "treatment.medication_preference",
        },
      ],
    },
    {
      id: "treatment.therapy_history",
      type: "text",
      phase: "treatment",
      title: "Tell us about your longevity therapy experience",
      help_text:
        "Include which therapies you've used, for how long, results, and any side effects",
      placeholder:
        "Example: Used NAD+ IV therapy for 6 months, noticed increased energy and better sleep, no side effects",
      multiline: true,
      rows: 6,
      required: true,
      next: "treatment.medication_preference",
    },
    {
      id: "treatment.medication_preference",
      type: "multi_select",
      phase: "treatment",
      title: "Which therapies interest you?",
      help_text: "Select therapies to see availability for your state",
      required: true,
      next: "treatment.plan_selection",
    },
    {
      id: "treatment.plan_selection",
      type: "plan_selection",
      phase: "treatment",
      title: "Choose your anti-aging plan",
      help_text:
        "Plans and pricing are based on your selected therapy and state",
      required: true,
      next: "transition.final_section",
    },
    {
      id: "transition.final_section",
      type: "content",
      phase: "treatment",
      headline: "Almost there!",
      body: "Just need your contact and shipping info, then you're all set. Our medical team will review everything within 24 hours.",
      cta_primary: {
        label: "Finish Up",
      },
      next: "logistics.contact_info",
    },
    {
      id: "logistics.contact_info",
      type: "composite",
      phase: "treatment",
      title: "Where can we reach you?",
      fields: [
        [
          {
            id: "first_name",
            type: "text",
            label: "First name",
            required: true,
            validation: {
              pattern: "^[a-zA-Z\\s\\-']{1,50}$",
              error: "Enter a valid first name",
            },
          },
          {
            id: "last_name",
            type: "text",
            label: "Last name",
            required: true,
            validation: {
              pattern: "^[a-zA-Z\\s\\-']{1,50}$",
              error: "Enter a valid last name",
            },
          },
        ],
        {
          id: "mobile_phone",
          type: "text",
          label: "Phone number",
          placeholder: "(555) 123-4567",
          mask: "(###) ###-####",
          required: true,
          validation: {
            pattern: "^\\(\\d{3}\\) \\d{3}-\\d{4}$",
            error: "Enter a valid phone number",
          },
        },
      ],
      next: "logistics.shipping_address",
    },
    {
      id: "logistics.shipping_address",
      type: "composite",
      phase: "treatment",
      title: "Where should we ship your treatment?",
      fields: [
        {
          id: "address_line1",
          type: "text",
          label: "Street address",
          placeholder: "123 Main Street",
          required: true,
          validation: {
            pattern: "^[a-zA-Z0-9\\s,.-]{5,100}$",
            error: "Enter a valid street address",
          },
        },
        {
          id: "address_line2",
          type: "text",
          label: "Apt, suite, etc. (optional)",
          placeholder: "Apt 4B",
          validation: {
            pattern: "^[a-zA-Z0-9\\s,.-]{0,50}$",
            error: "Enter a valid apartment/suite",
          },
        },
        {
          id: "city",
          type: "text",
          label: "City",
          required: true,
          validation: {
            pattern: "^[a-zA-Z\\s\\-']{2,50}$",
            error: "Enter a valid city",
          },
        },
        [
          {
            id: "state",
            type: "single_select",
            label: "State",
            required: true,
            options: [],
          },
          {
            id: "zip_code",
            type: "text",
            label: "ZIP",
            placeholder: "12345",
            mask: "#####",
            required: true,
            validation: {
              pattern: "^\\d{5}$",
              error: "Enter a valid 5-digit ZIP",
            },
          },
        ],
      ],
      next: "logistics.create_password",
    },
    {
      id: "logistics.create_password",
      type: "composite",
      phase: "treatment",
      title: "Create your account",
      fields: [
        {
          id: "password",
          type: "password",
          label: "Password",
          placeholder: "At least 8 characters",
          required: true,
          validation: {
            pattern: "^.{8,}$",
            error: "Must be at least 8 characters",
          },
        },
        {
          id: "password_confirm",
          type: "password",
          label: "Confirm password",
          placeholder: "Re-enter password",
          required: true,
          validation: {
            matches: "password",
            error: "Passwords don't match",
          },
        },
        {
          id: "all_consents",
          type: "consent_item",
          label:
            "By creating an account, I agree to the Terms of Service, Privacy Policy, Telehealth Consent, and HIPAA Authorization. I understand prescriptions are at provider discretion.",
          links: [
            { label: "Terms of Service", url: "https://hybrid.com/terms" },
            { label: "Privacy Policy", url: "https://hybrid.com/privacy" },
            {
              label: "Telehealth Consent",
              url: "https://hybrid.com/telehealth",
            },
            { label: "HIPAA Authorization", url: "https://hybrid.com/hipaa" },
          ],
          required: true,
        },
        {
          id: "notification_consent",
          type: "consent_item",
          label: "Send me helpful tips and updates",
          required: false,
        },
      ],
      next: "review.summary",
    },
    {
      id: "review.summary",
      type: "review",
      phase: "treatment",
      title: "Does everything look right?",
      help_text:
        "Review your answers before you submit so we can get started right away.",
      next: "complete.success",
    },
    {
      id: "complete.success",
      type: "terminal",
      phase: "treatment",
      status: "success",
      title: "You did it!",
      body: "Thanks for trusting us with your health information. Here's what happens next:",
      next_steps: [
        {
          icon: "✓",
          icon_name: "review",
          label: "Medical review (24 hrs)",
          status: "pending",
        },
        {
          icon: "→",
          icon_name: "plan",
          label: "Treatment plan (48 hrs)",
          status: "pending",
        },
        {
          icon: "→",
          icon_name: "journey",
          label: "Start your longevity journey",
          status: "pending",
        },
      ],
      cta_primary: {
        label: "View Your Dashboard",
      },
      links: [
        { label: "Return to Zappy Health", url: "https://zappyhealth.com" },
        { label: "Back to Home", url: "/" },
      ],
    },
  ],

  eligibility_rules: [
    {
      rule: "age_out_of_range",
      if: "calc.age < 25 OR calc.age > 80",
      action: "flag_no_medication",
      severity: "critical",
    },
    {
      rule: "pregnancy_exclusion",
      if: "assess.pregnancy_check in ['pregnant','trying','nursing']",
      action: "flag_no_medication",
      severity: "critical",
    },
    {
      rule: "active_cancer_exclusion",
      if: "assess.safety_screening contains 'active_cancer'",
      action: "flag_no_medication",
      severity: "critical",
    },
    {
      rule: "severe_cardiac_exclusion",
      if: "assess.safety_screening contains 'severe_heart_disease'",
      action: "flag_no_medication",
      severity: "critical",
    },
    {
      rule: "peptide_allergy_exclusion",
      if: "assess.safety_screening contains 'peptide_allergy'",
      action: "flag_no_medication",
      severity: "critical",
    },
    {
      rule: "high_risk_medical_review",
      if: "assess.safety_screening contains ['cancer_history','severe_kidney_disease','severe_liver_disease','blood_clotting_disorder','hormone_sensitive_cancer','pituitary_tumor','uncontrolled_diabetes','psychiatric_condition','immunocompromised','growth_hormone_contraindication']",
      action: "flag_high_risk_requires_review",
      severity: "high",
    },
  ],

  provider_packet: {
    include_fields: [
      "email",
      "first_name",
      "last_name",
      "phone",
      "demographics.dob",
      "calc.age",
      "demographics.state",
      "sex_birth",
      "ethnicity",
      "goals.longevity_focus",
      "goals.timeline",
      "goals.concerns",
      "concerns_other",
      "height_ft",
      "height_in",
      "weight",
      "calc.bmi",
      "health_status",
      "assess.medical_conditions",
      "medical_conditions_other",
      "assess.medications_supplements",
      "medications_detail",
      "has_allergies",
      "allergies_detail",
      "assess.tobacco",
      "tobacco_detail",
      "assess.alcohol",
      "alcohol_detail",
      "assess.recreational_drugs",
      "recreational_drugs_detail",
      "assess.pregnancy_check",
      "assess.safety_screening",
      "additional_notes",
      "treatment.peptide_experience",
      "therapy_history",
      "treatment.medication_preference",
      "address_line1",
      "address_line2",
      "city",
      "state",
      "zip_code",
    ],
    summary_template:
      "PATIENT: {first_name} {last_name} | DOB: {demographics.dob} (Age {calc.age}) | {sex_birth} | {demographics.state}\n\nGOALS: {goals.longevity_focus} | Timeline: {goals.timeline} | BMI: {calc.bmi:.1f} | Health Status: {health_status}\n\nRED FLAGS: {flags}\n\nMEDICAL CONDITIONS: {assess.medical_conditions}\nCURRENT MEDICATIONS: {medications_detail}\nALLERGIES: {allergies_detail}\nSUBSTANCE USE: Tobacco: {assess.tobacco} | Alcohol: {assess.alcohol} | Recreational: {assess.recreational_drugs}\nSAFETY SCREENING: {assess.safety_screening}\nTHERAPY EXPERIENCE: {treatment.peptide_experience} | History: {therapy_history}\nTREATMENT INTEREST: {treatment.medication_preference}\n\nADDITIONAL NOTES: {additional_notes}",
    risk_stratification: {
      critical: [
        "age_out_of_range",
        "pregnancy_exclusion",
        "active_cancer_exclusion",
        "severe_cardiac_exclusion",
        "peptide_allergy_exclusion",
      ],
      high: ["high_risk_medical_review"],
      medium: [],
      review_required: [],
    },
  },
};

export default formConfig;
