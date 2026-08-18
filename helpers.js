/**
 * ISAAC CLINIC Management Dashboard
 * Central Utility and Helper Functions (javascript/utils/helpers.js)
 */

'use strict';

/* =================================================================ame
   1. DOM HELPERS
   =================================================================== */

/**
 * Safely query a single DOM element.
 * @param {string} selector - CSS selector
 * @param {ParentNode} [context=document] - Context node to search within
 * @returns {Element|null}
 */
export function qs(selector, context = document) {
  try {
    return context.querySelector(selector);
  } catch (error) {
    console.error(`[Helpers] Invalid selector for qs: "${selector}"`, error);
    return null;
  }
}

/**
 * Safely query multiple DOM elements.
 * @param {string} selector - CSS selector
 * @param {ParentNode} [context=document] - Context node to search within
 * @returns {Element[]} Array of elements
 */
export function qsa(selector, context = document) {
  try {
    return Array.from(context.querySelectorAll(selector));
  } catch (error) {
    console.error(`[Helpers] Invalid selector for qsa: "${selector}"`, error);
    return [];
  }
}

/**
 * Create a new DOM element with optional attributes and classes.
 * @param {string} tagName - HTML tag name
 * @param {Object} [attributes={}] - Key-value pairs of attributes
 * @param {string|string[]} [classes=''] - Class name or array of class names
 * @returns {HTMLElement|null}
 */
export function createElement(tagName, attributes = {}, classes = '') {
  try {
    const el = document.createElement(tagName);
    
    if (classes) {
      const classList = Array.isArray(classes) ? classes : classes.split(/\s+/);
      el.classList.add(...classList.filter(Boolean));
    }

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'text' || key === 'textContent') {
        el.textContent = value;
      } else if (key === 'html' || key === 'innerHTML') {
        el.innerHTML = value;
      } else {
        el.setAttribute(key, value);
      }
    });

    return el;
  } catch (error) {
    console.error(`[Helpers] Error creating element <${tagName}>:`, error);
    return null;
  }
}

/**
 * Check if a DOM element exists.
 * @param {string|Element} target - Selector string or DOM element
 * @returns {boolean}
 */
export function elementExists(target) {
  if (!target) return false;
  if (target instanceof Element) return document.body.contains(target);
  if (typeof target === 'string') return qs(target) !== null;
  return false;
}

/**
 * Safely add one or more classes to an element.
 * @param {Element|string} target - Element or selector
 * @param {...string} classNames - Class names to add
 */
export function addClass(target, ...classNames) {
  const el = typeof target === 'string' ? qs(target) : target;
  if (el && el.classList) {
    el.classList.add(...classNames.filter(Boolean));
  }
}

/**
 * Safely remove one or more classes from an element.
 * @param {Element|string} target - Element or selector
 * @param {...string} classNames - Class names to remove
 */
export function removeClass(target, ...classNames) {
  const el = typeof target === 'string' ? qs(target) : target;
  if (el && el.classList) {
    el.classList.remove(...classNames.filter(Boolean));
  }
}

/**
 * Safely toggle a class on an element.
 * @param {Element|string} target - Element or selector
 * @param {string} className - Class name to toggle
 * @param {boolean} [force] - Force toggle state
 */
export function toggleClass(target, className, force) {
  const el = typeof target === 'string' ? qs(target) : target;
  if (el && el.classList) {
    return el.classList.toggle(className, force);
  }
  return false;
}


/* ====================================================================
   2. FORMATTING HELPERS
   =================================================================== */

/**
 * Format a number as Indian Currency (INR - ₹).
 * @param {number|string} amount - Amount to format
 * @param {boolean} [showSymbol=true] - Whether to include '₹'
 * @returns {string}
 */
export function formatCurrency(amount, showSymbol = true) {
  const num = Number(amount);
  if (isNaN(num)) return showSymbol ? '₹0.00' : '0.00';

  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);

    return showSymbol ? formatted : formatted.replace(/[^\d.,]/g, '').trim();
  } catch (error) {
    const fallback = num.toFixed(2);
    return showSymbol ? `₹${fallback}` : fallback;
  }
}

/**
 * Format a number with standard thousand separators.
 * @param {number|string} value - Value to format
 * @param {number} [decimals=0] - Number of decimal places
 * @returns {string}
 */
export function formatNumber(value, decimals = 0) {
  const num = Number(value);
  if (isNaN(num)) return '0';

  try {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  } catch (error) {
    return num.toFixed(decimals);
  }
}

/**
 * Format a date string or timestamp into a readable date (e.g., 15 Aug 2026).
 * @param {string|number|Date} dateInput - Date value
 * @returns {string}
 */
export function formatDate(dateInput) {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';

  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    return date.toDateString();
  }
}

/**
 * Format a time string or timestamp into readable 12-hour time (e.g., 10:30 AM).
 * @param {string|number|Date} dateInput - Date or time value
 * @returns {string}
 */
export function formatTime(dateInput) {
  if (!dateInput) return '-';
  
  // Handle simple "HH:mm" or "HH:mm:ss" string inputs
  if (typeof dateInput === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(dateInput)) {
    const [hoursStr, minutesStr] = dateInput.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr || '00';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';

  try {
    return new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch (error) {
    return date.toLocaleTimeString();
  }
}

/**
 * Format a date and time combined.
 * @param {string|number|Date} dateInput - Date input
 * @returns {string}
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';

  return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Capitalize first letter of a string or words.
 * @param {string} str - Input text
 * @returns {string}
 */
export function capitalize(str) {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Format a full name cleanly.
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string}
 */
export function formatName(firstName, lastName) {
  const first = typeof firstName === 'string' ? firstName.trim() : '';
  const last = typeof lastName === 'string' ? lastName.trim() : '';
  return [first, last].filter(Boolean).join(' ') || '-';
}

/**
 * Format status labels into human-readable strings and standard case.
 * @param {string} status - Raw status code/string
 * @returns {string}
 */
export function formatStatusLabel(status) {
  if (!status || typeof status !== 'string') return 'Unknown';
  return status
    .replace(/[-_]/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}


/* ====================================================================
   3. STRING HELPERS
   =================================================================== */

/**
 * Safely trim a string, returning empty string if null/undefined/non-string.
 * @param {any} str - Input
 * @returns {string}
 */
export function safeTrim(str) {
  if (str === null || str === undefined) return '';
  return String(str).trim();
}

/**
 * Convert string to Title Case.
 * @param {string} str - Input string
 * @returns {string}
 */
export function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Safely truncate text to a maximum length with optional ellipsis.
 * @param {string} str - Input string
 * @param {number} [maxLength=50] - Maximum length
 * @param {string} [suffix='...'] - Suffix to append if truncated
 * @returns {string}
 */
export function truncate(str, maxLength = 50, suffix = '...') {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, Math.max(0, maxLength - suffix.length)) + suffix;
}

/**
 * Normalize search text (lowercase, remove extra spaces, strip accents).
 * @param {string} str - Input text
 * @returns {string}
 */
export function normalizeSearchText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Generate a readable label from camelCase or snake_case keys.
 * @param {string} key - Key string
 * @returns {string}
 */
export function keyToLabel(key) {
  if (!key || typeof key !== 'string') return '';
  const formatted = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ');
  return capitalize(formatted);
}


/* ====================================================================
   4. ARRAY HELPERS
   =================================================================== */

/**
 * Remove duplicate items from an array based on an optional key or primitive value.
 * @param {Array} array - Source array
 * @param {string|Function} [iteratee] - Key or mapping function for uniqueness
 * @returns {Array} New unique array
 */
export function uniqueArray(array, iteratee) {
  if (!Array.isArray(array)) return [];
  if (!iteratee) return [...new Set(array)];

  const seen = new Set();
  return array.filter((item) => {
    const value = typeof iteratee === 'function' ? iteratee(item) : item?.[iteratee];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

/**
 * Safely find an item in an array matching a predicate.
 * @param {Array} array - Source array
 * @param {Function} predicate - Match function
 * @param {any} [defaultValue=null] - Default if not found
 * @returns {any}
 */
export function safeFind(array, predicate, defaultValue = null) {
  if (!Array.isArray(array) || typeof predicate !== 'function') return defaultValue;
  const found = array.find(predicate);
  return found !== undefined ? found : defaultValue;
}

/**
 * Group array items by a key or grouping function.
 * @param {Array} array - Source array
 * @param {string|Function} keySelector - Key property name or function
 * @returns {Object} Grouped object dictionary
 */
export function groupBy(array, keySelector) {
  if (!Array.isArray(array)) return {};
  return array.reduce((acc, item) => {
    const key = typeof keySelector === 'function' ? keySelector(item) : item?.[keySelector];
    if (key !== undefined && key !== null) {
      const groupKey = String(key);
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
    }
    return acc;
  }, {});
}

/**
 * Sort an array safely without mutating the original array.
 * @param {Array} array - Source array
 * @param {string|Function} [keySelector] - Key or property to sort by
 * @param {'asc'|'desc'} [direction='asc'] - Sort direction
 * @returns {Array} New sorted array
 */
export function sortArray(array, keySelector, direction = 'asc') {
  if (!Array.isArray(array)) return [];
  const clone = [...array];
  const multiplier = direction.toLowerCase() === 'desc' ? -1 : 1;

  clone.sort((a, b) => {
    let valA = keySelector ? (typeof keySelector === 'function' ? keySelector(a) : a?.[keySelector]) : a;
    let valB = keySelector ? (typeof keySelector === 'function' ? keySelector(b) : b?.[keySelector]) : b;

    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    if (typeof valA === 'string' && typeof valB === 'string') {
      return valA.localeCompare(valB) * multiplier;
    }

    return (valA < valB ? -1 : 1) * multiplier;
  });

  return clone;
}

/**
 * Check if an array is empty or not an array.
 * @param {Array} array - Array to check
 * @returns {boolean}
 */
export function isArrayEmpty(array) {
  return !Array.isArray(array) || array.length === 0;
}

/**
 * Paginate an array.
 * @param {Array} array - Source array
 * @param {number} [page=1] - Current page number (1-indexed)
 * @param {number} [pageSize=10] - Items per page
 * @returns {Object} { data, currentPage, pageSize, totalItems, totalPages }
 */
export function paginateArray(array, page = 1, pageSize = 10) {
  const safeArray = Array.isArray(array) ? array : [];
  const validPageSize = Math.max(1, Number(pageSize) || 10);
  const totalItems = safeArray.length;
  const totalPages = Math.ceil(totalItems / validPageSize) || 1;
  const currentPage = Math.max(1, Math.min(Number(page) || 1, totalPages));

  const startIndex = (currentPage - 1) * validPageSize;
  const endIndex = startIndex + validPageSize;
  const data = safeArray.slice(startIndex, endIndex);

  return {
    data,
    currentPage,
    pageSize: validPageSize,
    totalItems,
    totalPages
  };
}


/* ====================================================================
   5. OBJECT HELPERS
   =================================================================== */

/**
 * Check if an object is empty (has no enumerable keys).
 * @param {Object} obj - Object to check
 * @returns {boolean}
 */
export function isObjectEmpty(obj) {
  if (!obj || typeof obj !== 'object') return true;
  return Object.keys(obj).length === 0;
}

/**
 * Safely read a nested property from an object using dot notation path (e.g., 'patient.address.city').
 * @param {Object} obj - Target object
 * @param {string} path - Dot-separated path
 * @param {any} [defaultValue=null] - Default value if path doesn't exist
 * @returns {any}
 */
export function getNestedValue(obj, path, defaultValue = null) {
  if (!obj || typeof obj !== 'object' || typeof path !== 'string') return defaultValue;
  
  const keys = path.split('.').filter(Boolean);
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined && current !== null ? current : defaultValue;
}

/**
 * Shallow merge multiple objects.
 * @param {...Object} objects - Objects to merge
 * @returns {Object} Merged object
 */
export function mergeObjects(...objects) {
  return objects.reduce((acc, obj) => {
    if (obj && typeof obj === 'object') {
      Object.assign(acc, obj);
    }
    return acc;
  }, {});
}

/**
 * Shallow clone an object or array.
 * @param {Object|Array} target - Target structure
 * @returns {Object|Array} Cloned structure
 */
export function shallowClone(target) {
  if (!target || typeof target !== 'object') return target;
  if (Array.isArray(target)) return [...target];
  return { ...target };
}


/* ====================================================================
   6. VALIDATION HELPERS (Generic)
   =================================================================== */

/**
 * Check if a value is provided (not null, undefined, or empty string/whitespace).
 * @param {any} value - Value to check
 * @returns {boolean}
 */
export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Validate an email address format.
 * @param {string} email - Email string
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate an Indian or general phone number format.
 * @param {string} phone - Phone string
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  // Allows optional country code (+91) and 10 digit numbers
  const phoneRegex = /^(\+91[\-\s]?)?[0]?(?:\d{10}|\d{5}[\-\s]?\d{5})$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Check if a value is a valid finite number.
 * @param {any} value - Value to check
 * @returns {boolean}
 */
export function isNumeric(value) {
  if (value === null || value === undefined || value === '') return false;
  return !isNaN(Number(value)) && isFinite(value);
}

/**
 * Check if a value is a positive number (> 0).
 * @param {any} value - Value to check
 * @returns {boolean}
 */
export function isPositiveNumber(value) {
  return isNumeric(value) && Number(value) > 0;
}

/**
 * Check if a date value is valid.
 * @param {string|number|Date} dateInput - Date input
 * @returns {boolean}
 */
export function isValidDate(dateInput) {
  if (!dateInput) return false;
  const date = new Date(dateInput);
  return !isNaN(date.getTime());
}


/* ====================================================================
   7. ID / UTILITY GENERATION
   =================================================================== */

/**
 * Generate a lightweight unique client-side identifier.
 * @param {string} [prefix='ISAAC'] - Optional prefix string
 * @returns {string} Unique ID string
 */
export function generateId(prefix = 'ISAAC') {
  const randomPart = Math.random().toString(36).substring(2, 9).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}-${randomPart}`;
}


/* ====================================================================
   8. ASYNC HELPERS
   =================================================================== */

/**
 * Delay execution for a specified duration in milliseconds.
 * @param {number} [ms=300] - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safely execute an asynchronous function with error handling and optional fallback.
 * @param {Function} asyncFn - Async function to execute
 * @param {any} [fallbackValue=null] - Fallback value on failure
 * @returns {Promise<any>}
 */
export async function safeAsync(asyncFn, fallbackValue = null) {
  try {
    if (typeof asyncFn !== 'function') return fallbackValue;
    return await asyncFn();
  } catch (error) {
    console.error('[Helpers] Safe async execution failed:', error);
    return fallbackValue;
  }
}