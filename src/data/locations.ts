/**
 * Country-specific phone number validation rules.
 * Each entry maps an ISO2 country code to the expected digit count range
 * for a LOCAL phone number (excluding the international dial code prefix).
 *
 * Sources: ITU-T E.164 standard and common telecom formats.
 */
export const COUNTRY_PHONE_RULES: Record<string, { min: number; max: number; example: string; dial: string }> = {
  NG: { min: 10, max: 11, example: '0802 977 2375', dial: '234' },
  US: { min: 10, max: 10, example: '202 555 0123', dial: '1' },
  GB: { min: 10, max: 11, example: '07911 123456', dial: '44' },
  GH: { min: 9, max: 10, example: '024 123 4567', dial: '233' },
  KE: { min: 9, max: 10, example: '0712 345678', dial: '254' },
  ZA: { min: 9, max: 10, example: '071 234 5678', dial: '27' },
  CA: { min: 10, max: 10, example: '416 555 0123', dial: '1' },
  AE: { min: 9, max: 9, example: '050 123 4567', dial: '971' },
  FR: { min: 9, max: 10, example: '06 12 34 56 78', dial: '33' },
  DE: { min: 10, max: 11, example: '0151 1234567', dial: '49' },
  IT: { min: 9, max: 11, example: '312 345 6789', dial: '39' },
  ES: { min: 9, max: 9, example: '612 345 678', dial: '34' },
  AU: { min: 9, max: 10, example: '0412 345 678', dial: '61' },
  IN: { min: 10, max: 10, example: '09876 543210', dial: '91' },
  SN: { min: 9, max: 9, example: '77 123 45 67', dial: '221' },
  CI: { min: 8, max: 10, example: '07 12 34 56', dial: '225' },
  CM: { min: 8, max: 9, example: '6 71 23 45 67', dial: '237' },
  EG: { min: 10, max: 11, example: '0100 123 4567', dial: '20' },
  RW: { min: 9, max: 9, example: '078 123 4567', dial: '250' },
  UG: { min: 9, max: 10, example: '0712 345678', dial: '256' },
  TZ: { min: 9, max: 10, example: '0712 345678', dial: '255' },
  ET: { min: 9, max: 10, example: '091 123 4567', dial: '251' },
  SA: { min: 9, max: 10, example: '050 123 4567', dial: '966' },
  QA: { min: 8, max: 8, example: '3312 3456', dial: '974' },
  NL: { min: 9, max: 10, example: '06 1234 5678', dial: '31' },
  BE: { min: 9, max: 10, example: '0470 12 34 56', dial: '32' },
  SE: { min: 9, max: 10, example: '070 123 4567', dial: '46' },
  CH: { min: 9, max: 10, example: '076 123 45 67', dial: '41' },
  IE: { min: 9, max: 10, example: '085 123 4567', dial: '353' },
  BR: { min: 10, max: 11, example: '11 91234 5678', dial: '55' },
  JM: { min: 7, max: 10, example: '876 234 5678', dial: '1876' },
  TT: { min: 7, max: 10, example: '868 234 5678', dial: '1868' },
  BJ: { min: 8, max: 8, example: '90 12 34 56', dial: '229' },
  TG: { min: 8, max: 8, example: '90 12 34 56', dial: '228' },
  LR: { min: 7, max: 9, example: '077 012 3456', dial: '231' },
  SL: { min: 8, max: 8, example: '076 123456', dial: '232' },
  GM: { min: 7, max: 7, example: '301 2345', dial: '220' },
  CN: { min: 11, max: 11, example: '138 0013 8000', dial: '86' },
  JP: { min: 10, max: 11, example: '090 1234 5678', dial: '81' },
  SG: { min: 8, max: 8, example: '8123 4567', dial: '65' },
  MY: { min: 9, max: 10, example: '012 345 6789', dial: '60' },
  NZ: { min: 8, max: 10, example: '021 123 4567', dial: '64' },
  TR: { min: 10, max: 11, example: '0532 123 4567', dial: '90' },
  MX: { min: 10, max: 10, example: '55 1234 5678', dial: '52' },
};

/**
 * Sanitizes phone input to only allow digits, spaces, and hyphens.
 * Strips any letters, special characters, or script injection attempts.
 */
export const sanitizePhoneInput = (input: string): string => {
  return input.replace(/[^\d\s\-]/g, '');
};

/**
 * Sanitizes street address input to prevent script injection.
 * Strips angle brackets and other potentially dangerous characters.
 */
export const sanitizeAddressInput = (input: string): string => {
  return input.replace(/[<>]/g, '');
};

/**
 * Validates a phone number, optionally with country-specific rules.
 *
 * @param phone The raw local phone number string (without international dial code).
 * @param countryCode Optional ISO2 country code for country-specific validation.
 * @returns Object with `valid` boolean and `message` string.
 */
export const validatePhoneNumber = (
  phone: string,
  countryCode?: string
): { valid: boolean; message: string } => {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, message: 'Phone number is required.' };
  }

  // Extract only digits for length validation
  const digitsOnly = phone.replace(/\D/g, '');

  // Reject if contains any letters (clear sign of bad input)
  if (/[a-zA-Z]/.test(phone)) {
    return { valid: false, message: 'Phone number must not contain letters.' };
  }

  // Generic validation: must have 7-15 digits
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { valid: false, message: 'Phone number must have between 7 and 15 digits.' };
  }

  // Country-specific validation
  if (countryCode) {
    const rules = COUNTRY_PHONE_RULES[countryCode.toUpperCase()];
    if (rules) {
      let localDigits = digitsOnly;
      if (rules.dial && digitsOnly.startsWith(rules.dial)) {
        localDigits = digitsOnly.substring(rules.dial.length);
      }
      if (localDigits.length < rules.min || localDigits.length > rules.max) {
        return {
          valid: false,
          message: `Phone number for this country should have ${rules.min === rules.max ? rules.min : `${rules.min}-${rules.max}`} digits. You entered ${localDigits.length}.`,
        };
      }
    }
  }

  return { valid: true, message: 'Valid phone number.' };
};

/**
 * Returns a human-readable phone format hint for a given country.
 */
export const getPhoneHint = (countryCode: string): string | null => {
  const rules = COUNTRY_PHONE_RULES[countryCode?.toUpperCase()];
  if (!rules) return null;

  const digitLabel = rules.min === rules.max
    ? `${rules.min} digits`
    : `${rules.min}-${rules.max} digits`;

  return `e.g. ${rules.example} (${digitLabel})`;
};

export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters long.' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain an uppercase letter.' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain a lowercase letter.' };
  if (!/\d/.test(password)) return { valid: false, message: 'Password must contain a number.' };
  if (!/[!@#$%^&*(),.?"":{}|<>]/.test(password)) return { valid: false, message: 'Password must contain a special character.' };
  return { valid: true, message: 'Password is strong' };
};

/**
 * Automatically formats local digits as the user types based on standard country pattern shapes.
 */
export const formatPhoneAsYouType = (input: string, countryCode: string): string => {
  // Strip all non-digits
  let digits = input.replace(/\D/g, '');

  // Strip country code if entered inside input
  const rules = COUNTRY_PHONE_RULES[countryCode.toUpperCase()];
  if (rules && rules.dial && digits.startsWith(rules.dial)) {
    digits = digits.substring(rules.dial.length);
  }

  const code = countryCode.toUpperCase();
  if (code === 'NG') {
    // NG format: 0802 977 2375 or 802 977 2375
    if (digits.startsWith('0')) {
      if (digits.length <= 4) return digits;
      if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
    } else {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
    }
  } else if (code === 'US' || code === 'CA') {
    // US/CA format: (xxx) xxx-xxxx
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  } else if (code === 'GB') {
    // GB format: 07911 123456 or 7911 123456
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5, 11)}`;
  } else {
    // Generic spacing every 3-4 digits
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12, 15)}`;
  }
};