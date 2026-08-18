/**
 * ISAAC CLINIC Management Dashboard
 * Centralized Client-Side Storage Layer (javascript/utils/storage.js)
 * 
 * SECURITY WARNING:
 * Do NOT store sensitive patient medical records (PHI), passwords, 
 * authentication tokens, or encryption secrets in local/session storage.
 * This module is intended for application state, preferences, and non-sensitive data.
 */

'use strict';

// -----------------------------------------------------------------------------
// CONFIGURATION & CONSTANTS
// -----------------------------------------------------------------------------

const NAMESPACE = 'ISAAC_CLINIC_';

/**
 * Centralized storage keys to avoid magic strings and collisions.
 * Expand this object as new features are added.
 */
export const STORAGE_KEYS = Object.freeze({
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  DOCTORS: 'doctors',
  BILLING: 'billing',
  PHARMACY: 'pharmacy',
  LABORATORY: 'laboratory',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  THEME: 'theme',
  SIDEBAR_STATE: 'sidebar_state',
  DASHBOARD_PREFS: 'dashboard_prefs',
  UI_FILTERS: 'ui_filters' // Often used in sessionStorage
});

// -----------------------------------------------------------------------------
// INTERNAL UTILITIES
// -----------------------------------------------------------------------------

/**
 * Safely check if a specific storage type is available and enabled in the browser.
 * @param {'localStorage' | 'sessionStorage'} type 
 * @returns {boolean}
 */
function isStorageAvailable(type) {
  try {
    const storage = window[type];
    const testKey = `__${NAMESPACE}test__`;
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return e instanceof DOMException && (
      // Firefox
      e.code === 22 ||
      // Chrome
      e.code === 1014 ||
      // Test name field too, because code might not be present
      e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // Acknowledge QuotaExceededError only if there's something already stored
      (window[type] && window[type].length !== 0);
  }
}

/**
 * Generate a namespaced key.
 * @param {string} key 
 * @returns {string}
 */
function getNamespacedKey(key) {
  if (!key || typeof key !== 'string') {
    throw new Error('[Storage] Invalid key provided.');
  }
  return `${NAMESPACE}${key}`;
}

// -----------------------------------------------------------------------------
// STORAGE CLASS
// -----------------------------------------------------------------------------

/**
 * Generic Storage Wrapper to handle both Local and Session storage.
 */
class AppStorage {
  /**
   * @param {'localStorage' | 'sessionStorage'} storageType 
   */
  constructor(storageType) {
    this.type = storageType;
    this.isAvailable = isStorageAvailable(storageType);
    this.storage = this.isAvailable ? window[storageType] : null;
  }

  /**
   * Save data to storage. Automatically handles JSON serialization.
   * @param {string} key - The storage key (from STORAGE_KEYS preferred).
   * @param {any} value - The data to store.
   * @returns {boolean} - True if successful, false if failed.
   */
  set(key, value) {
    if (!this.isAvailable) {
      console.warn(`[Storage] ${this.type} is not available. Cannot save key: ${key}`);
      return false;
    }

    try {
      const namespacedKey = getNamespacedKey(key);
      const serializedValue = JSON.stringify(value);
      this.storage.setItem(namespacedKey, serializedValue);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.error(`[Storage] Quota exceeded in ${this.type}. Cannot save key: ${key}`);
      } else {
        console.error(`[Storage] Failed to serialize or save data for key: ${key}`, error);
      }
      return false;
    }
  }

  /**
   * Retrieve data from storage. Automatically handles JSON parsing.
   * @param {string} key - The storage key.
   * @param {any} [defaultValue=null] - Value to return if key doesn't exist or parsing fails.
   * @returns {any}
   */
  get(key, defaultValue = null) {
    if (!this.isAvailable) return defaultValue;

    try {
      const namespacedKey = getNamespacedKey(key);
      const item = this.storage.getItem(namespacedKey);

      if (item === null) return defaultValue;

      return JSON.parse(item);
    } catch (error) {
      console.error(`[Storage] Failed to read or parse data for key: ${key}. Returning default.`, error);
      return defaultValue;
    }
  }

  /**
   * Remove a specific key from storage.
   * @param {string} key 
   * @returns {boolean}
   */
  remove(key) {
    if (!this.isAvailable) return false;

    try {
      const namespacedKey = getNamespacedKey(key);
      this.storage.removeItem(namespacedKey);
      return true;
    } catch (error) {
      console.error(`[Storage] Failed to remove key: ${key}`, error);
      return false;
    }
  }

  /**
   * Check if a key exists in storage.
   * @param {string} key 
   * @returns {boolean}
   */
  exists(key) {
    if (!this.isAvailable) return false;
    try {
      return this.storage.getItem(getNamespacedKey(key)) !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear ONLY ISAAC CLINIC data from this storage. 
   * Leaves other domain storage untouched.
   * @returns {boolean}
   */
  clear() {
    if (!this.isAvailable) return false;

    try {
      const keysToRemove = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(NAMESPACE)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => this.storage.removeItem(key));
      return true;
    } catch (error) {
      console.error(`[Storage] Failed to clear ${this.type}`, error);
      return false;
    }
  }

  /**
   * Get all namespaced data as a single dictionary object.
   * @returns {Object}
   */
  getAll() {
    if (!this.isAvailable) return {};

    const allData = {};
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const rawKey = this.storage.key(i);
        if (rawKey && rawKey.startsWith(NAMESPACE)) {
          const originalKey = rawKey.slice(NAMESPACE.length);
          allData[originalKey] = this.get(originalKey);
        }
      }
    } catch (error) {
      console.error(`[Storage] Failed to retrieve all data from ${this.type}`, error);
    }
    return allData;
  }

  /**
   * Get approximate size of stored namespaced data in Kilobytes (KB).
   * @returns {number} Size in KB (approximate).
   */
  size() {
    if (!this.isAvailable) return 0;

    try {
      let totalBytes = 0;
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(NAMESPACE)) {
          const value = this.storage.getItem(key) || '';
          // JS strings are UTF-16, so roughly 2 bytes per character
          totalBytes += (key.length + value.length) * 2;
        }
      }
      return parseFloat((totalBytes / 1024).toFixed(2));
    } catch (error) {
      console.error(`[Storage] Failed to calculate size for ${this.type}`, error);
      return 0;
    }
  }
}

// -----------------------------------------------------------------------------
// EXPORTS
// -----------------------------------------------------------------------------

/**
 * Persistent Storage (localStorage). 
 * Use for data that should persist across browser sessions.
 */
export const localStore = new AppStorage('localStorage');

/**
 * Temporary Storage (sessionStorage).
 * Use for data that should be cleared when the tab/browser is closed.
 */
export const sessionStore = new AppStorage('sessionStorage');