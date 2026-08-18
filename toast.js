/**
 * ISAAC CLINIC Management Dashboard
 * Centralized Notification/Feedback System (javascript/components/toast.js)
 */

'use strict';

/* ====================================================================
   1. CONSTANTS & SELECTORS
   =================================================================== */

const SELECTORS = Object.freeze({
  CONTAINER: '#toast-container, .toast-container'
});

const TOAST_TYPES = Object.freeze({
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
});

const DEFAULT_OPTIONS = Object.freeze({
  duration: 4000, // 4 seconds
  dismissible: true,
  title: '',
  dedupe: false
});

const EVENTS = Object.freeze({
  SHOW: 'isaac:toast-show',
  HIDE: 'isaac:toast-hide'
});

// State
let toastContainer = null;
let activeToasts = new Map(); // id -> { element, timerId }
let toastCounter = 0;

/* ====================================================================
   2. CONTAINER & DOM UTILITIES
   =================================================================== */

/**
 * Safely get or create the toast container in the DOM.
 * @returns {HTMLElement}
 */
function getOrCreateToastContainer() {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }

  toastContainer = document.querySelector(SELECTORS.CONTAINER);
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toastContainer);
  }

  return toastContainer;
}

/**
 * Generate a lightweight unique toast identifier.
 * @returns {string}
 */
function generateToastId() {
  toastCounter += 1;
  return `toast-${Date.now()}-${toastCounter}`;
}

/* ====================================================================
   3. CORE TOAST ACTIONS
   =================================================================== */

/**
 * Dismiss and remove a specific toast by its unique ID.
 * @param {string} id 
 */
export function removeToast(id) {
  if (!activeToasts.has(id)) return;

  const toastData = activeToasts.get(id);
  const { element, timerId } = toastData;

  if (timerId) {
    clearTimeout(timerId);
  }

  if (element && document.body.contains(element)) {
    element.classList.remove('show', 'active');
    element.classList.add('hide');

    // Allow CSS transition to finish before removing from DOM
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 300);
  }

  activeToasts.delete(id);

  const hideEvent = new CustomEvent(EVENTS.HIDE, {
    bubbles: true,
    detail: { toastId: id }
  });
  document.dispatchEvent(hideEvent);
}

/**
 * Show a toast notification with message and options.
 * 
 * @param {string} message - Message text
 * @param {string} [type='info'] - Type: success, error, warning, info
 * @param {Object} [options={}] - Configuration options (duration, title, dismissible, dedupe)
 * @returns {string|null} Unique toast ID or null if failed
 */
export function showToast(message, type = TOAST_TYPES.INFO, options = {}) {
  try {
    if (!message || typeof message !== 'string') {
      console.warn('[Toast] Cannot show toast with empty or invalid message.');
      return null;
    }

    const config = { ...DEFAULT_OPTIONS, ...options };
    const container = getOrCreateToastContainer();

    // Handle deduplication if requested
    if (config.dedupe) {
      for (const [existingId, data] of activeToasts.entries()) {
        if (data.message === message && data.type === type) {
          return existingId; // Return existing ID instead of creating duplicate
        }
      }
    }

    const toastId = generateToastId();
    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    toastEl.setAttribute('role', type === TOAST_TYPES.ERROR ? 'alert' : 'status');
    if (type === TOAST_TYPES.ERROR) {
      toastEl.setAttribute('aria-live', 'assertive');
    } else {
      toastEl.setAttribute('aria-live', 'polite');
    }

    // Build internal structure safely using textContent to prevent XSS
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'toast-content';

    if (config.title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'toast-title';
      titleEl.textContent = config.title;
      contentWrapper.appendChild(titleEl);
    }

    const messageEl = document.createElement('div');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    contentWrapper.appendChild(messageEl);

    toastEl.appendChild(contentWrapper);

    // Optional Close Button
    if (config.dismissible) {
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'toast-close';
      closeBtn.setAttribute('aria-label', 'Close notification');
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', () => {
        removeToast(toastId);
      });
      toastEl.appendChild(closeBtn);
    }

    // Append to container
    container.appendChild(toastEl);

    // Trigger reflow for CSS entry animation
    void toastEl.offsetHeight;
    toastEl.classList.add('show', 'active');

    // Setup auto-dismiss timer
    let timerId = null;
    if (config.duration > 0) {
      timerId = setTimeout(() => {
        removeToast(toastId);
      }, config.duration);
    }

    // Track active toast
    activeToasts.set(toastId, {
      element: toastEl,
      timerId,
      message,
      type
    });

    // Dispatch show event
    const showEvent = new CustomEvent(EVENTS.SHOW, {
      bubbles: true,
      detail: { toastId: id, type, message }
    });
    document.dispatchEvent(showEvent);

    return toastId;
  } catch (error) {
    console.error('[Toast] Failed to display toast notification:', error);
    return null;
  }
}

/* ====================================================================
   4. CONVENIENCE API WRAPPERS
   =================================================================== */

export const toast = {
  success: (message, options) => showToast(message, TOAST_TYPES.SUCCESS, options),
  error: (message, options) => showToast(message, TOAST_TYPES.ERROR, options),
  warning: (message, options) => showToast(message, TOAST_TYPES.WARNING, options),
  info: (message, options) => showToast(message, TOAST_TYPES.INFO, options),
  custom: (message, type, options) => showToast(message, type || TOAST_TYPES.INFO, options),
  dismiss: (id) => removeToast(id)
};

/* ====================================================================
   5. INITIALIZATION
   =================================================================== */

/**
 * Initialize the toast notification system.
 */
export function initToast() {
  try {
    getOrCreateToastContainer();
    console.info('[Toast] Toast notification system successfully initialized.');
  } catch (error) {
    console.error('[Toast] Critical error during toast initialization:', error);
  }
}