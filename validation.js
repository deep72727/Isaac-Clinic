/**
 * ISAAC CLINIC Management Dashboard
 * Centralized Validation Layer (javascript/utils/validation.js)
 * 
 * SECURITY NOTICE:
 * Frontend validation is solely for immediate user feedback and UX enhancement.
 * Robust server-side / backend validation is mandatory once an API is connected.
 */

'use strict';

// -----------------------------------------------------------------------------
// CONSTANTS & REGEX PATTERNS
// -----------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Indian mobile number support: optional +91, optional 0, 10 digits starting with 6-9
const INDIAN_PHONE_REGEX = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
const TIME_24_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// -----------------------------------------------------------------------------
# CORE PRIMITIVE VALIDATORS
// -----------------------------------------------------------------------------

/**
 * Check if a value is provided (not null, undefined, or empty string/whitespace).
 * @param {any} value 
 * @returns {boolean}
 */
export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Check string minimum length.
 * @param {string} value 
 * @param {number} min 
 * @returns {boolean}
 */
export function minLength(value, min) {
  if (value === null || value === undefined) return false;
  return String(value).trim().length >= min;
}

/**
 * Check string maximum length.
 * @param {string} value 
 * @param {number} max 
 * @returns {boolean}
 */
export function maxLength(value, max) {
  if (value === null || value === undefined) return true;
  return String(value).trim().length <= max;
}

/**
 * Check string length range.
 * @param {string} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {boolean}
 */
export function rangeLength(value, min, max) {
  return minLength(value, min) && maxLength(value, max);
}

// -----------------------------------------------------------------------------
// NUMERIC VALIDATORS
// -----------------------------------------------------------------------------

/**
 * Check if value is a valid finite number.
 * @param {any} value 
 * @returns {boolean}
 */
export function isNumeric(value) {
  if (value === null || value === undefined || value === '') return false;
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
}

/**
 * Check if value is an integer.
 * @param {any} value 
 * @returns {boolean}
 */
export function isInteger(value) {
  return isNumeric(value) && Number.isInteger(Number(value));
}

/**
 * Check if value is a positive number (> 0).
 * @param {any} value 
 * @returns {boolean}
 */
export function isPositiveNumber(value) {
  return isNumeric(value) && Number(value) > 0;
}

/**
 * Check if value is a non-negative number (>= 0).
 * @param {any} value 
 * @returns {boolean}
 */
export function isNonNegativeNumber(value) {
  return isNumeric(value) && Number(value) >= 0;
}

/**
 * Check if numeric value falls within a range.
 * @param {any} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {boolean}
 */
export function rangeNumber(value, min, max) {
  if (!isNumeric(value)) return false;
  const num = Number(value);
  return num >= min && num <= max;
}

// -----------------------------------------------------------------------------
// SPECIFIC FORMAT VALIDATORS
// -----------------------------------------------------------------------------

/**
 * Validate email format.
 * @param {string} email 
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate Indian phone number format.
 * @param {string} phone 
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return INDIAN_PHONE_REGEX.test(phone.trim().replace(/\s+/g, ''));
}

/**
 * Validate date format and validity.
 * @param {string|number|Date} dateInput 
 * @returns {boolean}
 */
export function isValidDate(dateInput) {
  if (!dateInput) return false;
  const date = new Date(dateInput);
  return !isNaN(date.getTime());
}

/**
 * Check if a date is in the future.
 * @param {string|number|Date} dateInput 
 * @returns {boolean}
 */
export function isFutureDate(dateInput) {
  if (!isValidDate(dateInput)) return false;
  const date = new Date(dateInput);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() >= today.getTime();
}

/**
 * Check if a date is in the past.
 * @param {string|number|Date} dateInput 
 * @returns {boolean}
 */
export function isPastDate(dateInput) {
  if (!isValidDate(dateInput)) return false;
  const date = new Date(dateInput);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() <= today.getTime();
}

/**
 * Validate clinic time format (HH:mm in 24-hour format).
 * @param {string} timeStr 
 * @returns {boolean}
 */
export function isValidTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return false;
  return TIME_24_REGEX.test(timeStr.trim());
}

/**
 * Validate regex pattern match.
 * @param {string} value 
 * @param {RegExp} pattern 
 * @returns {boolean}
 */
export function matchesPattern(value, pattern) {
  if (value === null || value === undefined || !(pattern instanceof RegExp)) return false;
  return pattern.test(String(value));
}

// -----------------------------------------------------------------------------
// CLINIC-SPECIFIC GENERIC FIELD VALIDATORS
// -----------------------------------------------------------------------------

export const fieldValidators = {
  patientName(name) {
    if (!isRequired(name)) return { valid: false, message: 'Patient name is required.' };
    if (!rangeLength(name, 2, 100)) return { valid: false, message: 'Patient name must be between 2 and 100 characters.' };
    return { valid: true, message: '' };
  },

  patientId(id) {
    if (!isRequired(id)) return { valid: false, message: 'Patient ID is required.' };
    return { valid: true, message: '' };
  },

  age(ageVal) {
    if (!isRequired(ageVal)) return { valid: false, message: 'Age is required.' };
    if (!isInteger(ageVal) || !rangeNumber(ageVal, 0, 120)) {
      return { valid: false, message: 'Age must be a valid integer between 0 and 120.' };
    }
    return { valid: true, message: '' };
  },

  phone(phoneVal) {
    if (!isRequired(phoneVal)) return { valid: false, message: 'Phone number is required.' };
    if (!isValidPhone(phoneVal)) return { valid: false, message: 'Please enter a valid 10-digit Indian mobile number.' };
    return { valid: true, message: '' };
  },

  email(emailVal) {
    if (isRequired(emailVal) && !isValidEmail(emailVal)) {
      return { valid: false, message: 'Please enter a valid email address.' };
    }
    return { valid: true, message: '' };
  },

  doctorName(name) {
    if (!isRequired(name)) return { valid: false, message: 'Doctor name is required.' };
    if (!rangeLength(name, 2, 100)) return { valid: false, message: 'Doctor name must be between 2 and 100 characters.' };
    return { valid: true, message: '' };
  },

  specialization(spec) {
    if (!isRequired(spec)) return { valid: false, message: 'Specialization is required.' };
    return { valid: true, message: '' };
  },

  appointmentDate(dateVal) {
    if (!isRequired(dateVal)) return { valid: false, message: 'Appointment date is required.' };
    if (!isValidDate(dateVal)) return { valid: false, message: 'Please enter a valid appointment date.' };
    return { valid: true, message: '' };
  },

  appointmentTime(timeVal) {
    if (!isRequired(timeVal)) return { valid: false, message: 'Appointment time is required.' };
    if (!isValidTime(timeVal)) return { valid: false, message: 'Please enter a valid time in HH:mm format.' };
    return { valid: true, message: '' };
  },

  amount(amountVal) {
    if (!isRequired(amountVal)) return { valid: false, message: 'Amount is required.' };
    if (!isPositiveNumber(amountVal)) return { valid: false, message: 'Amount must be a positive number.' };
    return { valid: true, message: '' };
  },

  invoiceNumber(invNum) {
    if (!isRequired(invNum)) return { valid: false, message: 'Invoice number is required.' };
    return { valid: true, message: '' };
  },

  medicineName(medName) {
    if (!isRequired(medName)) return { valid: false, message: 'Medicine name is required.' };
    return { valid: true, message: '' };
  },

  quantity(qty) {
    if (!isRequired(qty)) return { valid: false, message: 'Quantity is required.' };
    if (!isInteger(qty) || Number(qty) <= 0) return { valid: false, message: 'Quantity must be a positive integer.' };
    return { valid: true, message: '' };
  },

  testName(test) {
    if (!isRequired(test)) return { valid: false, message: 'Test name is required.' };
    return { valid: true, message: '' };
  }
};

// -----------------------------------------------------------------------------
// FORM VALIDATION ENGINE
// -----------------------------------------------------------------------------

/**
 * Validate a data object against a rule mapping.
 * 
 * @param {Object} data - Key-value data object to validate
 * @param {Object} rules - Map of field keys to validation functions or rule arrays
 * @returns {Object} { valid: boolean, errors: Object }
 * 
 * Example rules:
 * {
 *   name: [isRequired, (val) => minLength(val, 3)],
 *   phone: fieldValidators.phone
 * }
 */
export function validateForm(data, rules) {
  const errors = {};
  let isValid = true;

  if (!data || typeof data !== 'object' || !rules || typeof rules !== 'object') {
    return { valid: true, errors: {} };
  }

  for (const [field, validatorList] of Object.entries(rules)) {
    const value = data[field];
    const validators = Array.isArray(validatorList) ? validatorList : [validatorList];

    for (const validator of validators) {
      if (typeof validator === 'function') {
        const result = validator(value, data);

        // Support both boolean return and structured object return { valid, message }
        if (typeof result === 'boolean') {
          if (!result) {
            errors[field] = `${field} is invalid.`;
            isValid = false;
            break;
          }
        } else if (result && typeof result === 'object' && 'valid' in result) {
          if (!result.valid) {
            errors[field] = result.message || `${field} is invalid.`;
            isValid = false;
            break;
          }
        }
      }
    }
  }

  return {
    valid: isValid,
    errors
  };
}

// -----------------------------------------------------------------------------
// SANITIZATION & NORMALIZATION HELPERS
// -----------------------------------------------------------------------------

/**
 * Safely sanitize and trim basic string input.
 * @param {any} value 
 * @returns {string}
 */
export function sanitizeInput(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().replace(/\s+/g, ' ');
}