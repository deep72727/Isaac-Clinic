/**
 * @file settings-data.js
 * @description Centralized application settings and configuration data layer for the ISAAC CLINIC dashboard.
 * Provides default configurations, nested setting accessors, update handlers, storage persistence, and validation.
 */

'use strict';

import { validateSettings } from '../utils/validation.js';
import { getStorageItem, setStorageItem } from '../utils/storage.js';

const STORAGE_KEY = 'isaac_clinic_settings';

/**
 * Default application settings configuration.
 * @type {Object}
 */
const defaultSettings = {
    clinic: {
        name: 'Isaac Medical Clinic',
        phone: '+1-555-9000',
        email: 'contact@isaacclinic.demo',
        address: '123 Health Avenue, Suite 400',
        city: 'Metropolis',
        country: 'United States',
        timezone: 'UTC-5',
        currency: 'USD'
    },
    general: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '12h',
        firstDayOfWeek: 'Monday',
        defaultLanguage: 'English',
        defaultTimezone: 'UTC-5',
        currency: 'USD'
    },
    appointments: {
        defaultDuration: 30, // minutes
        bufferTime: 10, // minutes
        allowCancellation: true,
        cancellationWindow: 24, // hours before appointment
        reminderEnabled: true
    },
    billing: {
        currency: 'USD',
        taxEnabled: true,
        defaultTaxRate: 5.0, // percentage
        invoicePrefix: 'INV-',
        paymentMethods: ['Cash', 'Card', 'UPI', 'Bank Transfer']
    },
    pharmacy: {
        lowStockThreshold: 20,
        expiryAlertDays: 90,
        stockTrackingEnabled: true
    },
    laboratory: {
        defaultTurnaroundUnit: 'Hours',
        resultWorkflowEnabled: true,
        notificationEnabled: true
    },
    notifications: {
        toastEnabled: true,
        appointmentReminders: true,
        billingNotifications: true,
        stockAlerts: true,
        laboratoryAlerts: true
    },
    dashboard: {
        defaultDateRange: 'This Month',
        showRevenue: true,
        showAppointments: true,
        showPatients: true,
        showInventory: true,
        showLaboratory: true
    }
};

/**
 * Deep clones an object to prevent source mutation.
 * @param {Object} obj 
 * @returns {Object}
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Loads settings from storage or falls back to defaults.
 * @returns {Object}
 */
function loadSettings() {
    try {
        const stored = getStorageItem(STORAGE_KEY);
        if (stored && typeof stored === 'object') {
            // Merge with defaults to ensure missing keys are populated
            return mergeWithDefaults(deepClone(defaultSettings), stored);
        }
    } catch (e) {
        // Fallback
    }
    const initial = deepClone(defaultSettings);
    saveSettings(initial);
    return initial;
}

/**
 * Persists settings to storage.
 * @param {Object} settings 
 */
function saveSettings(settings) {
    try {
        setStorageItem(STORAGE_KEY, settings);
    } catch (e) {
        // Handle storage error
    }
}

/**
 * Recursively merges stored settings into default settings structure.
 * @param {Object} defaults 
 * @param {Object} stored 
 * @returns {Object}
 */
function mergeWithDefaults(defaults, stored) {
    for (const key of Object.keys(defaults)) {
        if (stored[key] !== undefined) {
            if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key])) {
                if (typeof stored[key] === 'object' && stored[key] !== null && !Array.isArray(stored[key])) {
                    mergeWithDefaults(defaults[key], stored[key]);
                }
            } else {
                defaults[key] = stored[key];
            }
        }
    }
    return defaults;
}

/**
 * Safely dispatches a custom settings change event.
 * @param {string} path 
 * @param {*} newValue 
 * @param {*} oldValue 
 */
function dispatchSettingsChangeEvent(path, newValue, oldValue) {
    try {
        if (typeof window !== 'undefined' && typeof CustomEvent === 'function') {
            const event = new CustomEvent('isaac:settings-change', {
                detail: { path, newValue, oldValue }
            });
            window.dispatchEvent(event);
        }
    } catch (e) {
        // Ignore event dispatch failure in non-browser or test environments
    }
}

/**
 * Get all current application settings.
 * @returns {Object} Deep copy of all settings.
 */
export function getSettings() {
    return deepClone(loadSettings());
}

/**
 * Get a specific setting by dot-notation path (e.g., 'appointments.defaultDuration').
 * @param {string} path 
 * @returns {*} Setting value or undefined if not found.
 */
export function getSetting(path) {
    if (!path || typeof path !== 'string') {
        return undefined;
    }

    const settings = loadSettings();
    const parts = path.split('.');
    let current = settings;

    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
        } else {
            return undefined;
        }
    }

    return typeof current === 'object' && current !== null ? deepClone(current) : current;
}

/**
 * Update a specific setting by dot-notation path.
 * @param {string} path 
 * @param {*} value 
 * @returns {*} Updated value.
 * @throws {Error} If path is invalid or validation fails.
 */
export function updateSetting(path, value) {
    if (!path || typeof path !== 'string') {
        throw new Error('Invalid setting path provided.');
    }

    const settings = loadSettings();
    const parts = path.split('.');
    const lastKey = parts.pop();
    let current = settings;

    for (const part of parts) {
        if (!current[part] || typeof current[part] !== 'object') {
            current[part] = {};
        }
        current = current[part];
    }

    const oldValue = current[lastKey];

    // Validate value through validation utility if available
    if (typeof validateSettings === 'function') {
        const testSettings = deepClone(settings);
        let testCurrent = testSettings;
        for (const part of parts) {
            testCurrent = testCurrent[part];
        }
        testCurrent[lastKey] = value;

        const validationResult = validateSettings(testSettings);
        if (validationResult && validationResult.isValid === false) {
            throw new Error(`Validation failed: ${validationResult.message || 'Invalid setting value.'}`);
        }
    }

    current[lastKey] = value;
    saveSettings(settings);

    dispatchSettingsChangeEvent(path, value, oldValue);

    return typeof value === 'object' && value !== null ? deepClone(value) : value;
}

/**
 * Update multiple settings using a flat or nested update object.
 * @param {Object} updates 
 * @returns {Object} Updated complete settings object.
 * @throws {Error} If updates object is invalid.
 */
export function updateSettings(updates) {
    if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid updates payload provided.');
    }

    const settings = loadSettings();

    // Helper to recursively apply updates
    function applyRecursive(target, source) {
        for (const key of Object.keys(source)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key] || typeof target[key] !== 'object') {
                    target[key] = {};
                }
                applyRecursive(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }

    const testSettings = deepClone(settings);
    applyRecursive(testSettings, updates);

    if (typeof validateSettings === 'function') {
        const validationResult = validateSettings(testSettings);
        if (validationResult && validationResult.isValid === false) {
            throw new Error(`Validation failed: ${validationResult.message || 'Invalid settings updates.'}`);
        }
    }

    const oldSettings = deepClone(settings);
    applyRecursive(settings, updates);
    saveSettings(settings);

    dispatchSettingsChangeEvent('*', settings, oldSettings);

    return deepClone(settings);
}

/**
 * Resets all settings to their default values.
 * @returns {Object} Default settings object.
 */
export function resetSettings() {
    const defaults = deepClone(defaultSettings);
    saveSettings(defaults);
    dispatchSettingsChangeEvent('*', defaults, null);
    return defaults;
}