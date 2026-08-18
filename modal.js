/**
 * ISAAC CLINIC Management Dashboard
 * Centralized Reusable Modal Component (javascript/components/modal.js)
 */

'use strict';

/* ====================================================================
   1. CONSTANTS & SELECTORS
   =================================================================== */

const SELECTORS = Object.freeze({
  MODAL: '[data-modal], .modal, .dialog',
  TRIGGER: '[data-modal-target], [data-modal-toggle], .modal-trigger',
  CLOSE_BTN: '[data-modal-close], .modal-close, .modal-dismiss, [data-dismiss="modal"]',
  FOCUSABLE: 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
});

const CLASSES = Object.freeze({
  OPEN: 'open',
  SHOW: 'show',
  ACTIVE: 'active',
  MODAL_OPEN_BODY: 'modal-open'
});

const EVENTS = Object.freeze({
  OPEN: 'isaac:modal-open',
  CLOSE: 'isaac:modal-close'
});

// Active modal stack to track multiple modals and focus return
const modalStack = [];
let lastFocusedElementBeforeModal = null;
let globalListenersInitialized = false;

/* ====================================================================
   2. HELPER UTILITIES
   =================================================================== */

/**
 * Resolve a modal reference (can be a selector string or DOM element).
 * @param {string|HTMLElement} modalRef 
 * @returns {HTMLElement|null}
 */
function resolveModalElement(modalRef) {
  if (!modalRef) return null;
  if (modalRef instanceof HTMLElement) return modalRef;
  if (typeof modalRef === 'string') {
    return document.querySelector(modalRef);
  }
  return null;
}

/**
 * Get all focusable elements inside a container.
 * @param {HTMLElement} container 
 * @returns {Array<HTMLElement>}
 */
function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(SELECTORS.FOCUSABLE));
}

/**
 * Manage body scroll lock based on open modal count.
 */
function updateBodyScrollState() {
  if (modalStack.length > 0) {
    document.body.classList.add(CLASSES.MODAL_OPEN_BODY);
  } else {
    document.body.classList.remove(CLASSES.MODAL_OPEN_BODY);
  }
}

/* ====================================================================
   3. CORE MODAL ACTIONS
   =================================================================== */

/**
 * Open a specific modal.
 * @param {string|HTMLElement} modalRef 
 * @param {HTMLElement} [triggerEl=null] 
 */
export function openModal(modalRef, triggerEl = null) {
  const modalEl = resolveModalElement(modalRef);
  if (!modalEl) {
    console.warn('[Modal] openModal: Modal element not found.', modalRef);
    return false;
  }

  // If already open in stack, do nothing
  if (modalStack.includes(modalEl)) return true;

  // Save current active element to return focus later if not already saved
  if (modalStack.length === 0) {
    lastFocusedElementBeforeModal = triggerEl || document.activeElement;
  }

  modalEl.classList.add(CLASSES.OPEN, CLASSES.SHOW);
  modalEl.setAttribute('aria-hidden', 'false');
  modalEl.setAttribute('aria-modal', 'true');
  if (!modalEl.hasAttribute('role')) {
    modalEl.setAttribute('role', 'dialog');
  }

  modalStack.push(modalEl);
  updateBodyScrollState();

  // Focus management: focus first focusable element or modal itself
  setTimeout(() => {
    const focusables = getFocusableElements(modalEl);
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      modalEl.setAttribute('tabindex', '-1');
      modalEl.focus();
    }
  }, 50);

  // Dispatch open event
  const openEvent = new CustomEvent(EVENTS.OPEN, {
    bubbles: true,
    detail: { modal: modalEl, trigger: triggerEl, stackDepth: modalStack.length }
  });
  modalEl.dispatchEvent(openEvent);

  return true;
}

/**
 * Close a specific modal.
 * @param {string|HTMLElement} modalRef 
 */
export function closeModal(modalRef) {
  const modalEl = resolveModalElement(modalRef);
  if (!modalEl) return false;

  const index = modalStack.indexOf(modalEl);
  if (index === -1) return false;

  modalEl.classList.remove(CLASSES.OPEN, CLASSES.SHOW);
  modalEl.setAttribute('aria-hidden', 'true');
  modalEl.removeAttribute('aria-modal');

  modalStack.splice(index, 1);
  updateBodyScrollState();

  // Return focus to previous active element if stack is empty
  if (modalStack.length === 0 && lastFocusedElementBeforeModal && typeof lastFocusedElementBeforeModal.focus === 'function') {
    try {
      lastFocusedElementBeforeModal.focus();
    } catch (e) {
      // Ignore focus errors on detached elements
    }
    lastFocusedElementBeforeModal = null;
  }

  // Dispatch close event
  const closeEvent = new CustomEvent(EVENTS.CLOSE, {
    bubbles: true,
    detail: { modal: modalEl, stackDepth: modalStack.length }
  });
  modalEl.dispatchEvent(closeEvent);

  return true;
}

/**
 * Toggle a modal's open/closed state.
 * @param {string|HTMLElement} modalRef 
 * @param {HTMLElement} [triggerEl=null] 
 */
export function toggleModal(modalRef, triggerEl = null) {
  const modalEl = resolveModalElement(modalRef);
  if (!modalEl) return false;

  if (modalStack.includes(modalEl)) {
    return closeModal(modalEl);
  } else {
    return openModal(modalEl, triggerEl);
  }
}

/**
 * Close all currently open modals.
 */
export function closeAllModals() {
  while (modalStack.length > 0) {
    const modalEl = modalStack[modalStack.length - 1];
    closeModal(modalEl);
  }
}

/* ====================================================================
   4. EVENT LISTENERS & GLOBAL HANDLERS
   =================================================================== */

/**
 * Setup global document event listeners for triggers, close buttons, backdrop clicks, and focus traps.
 */
function setupGlobalModalListeners() {
  if (globalListenersInitialized) return;

  // Click delegation for triggers and close buttons
  document.addEventListener('click', (e) => {
    // 1. Check for modal triggers
    const trigger = e.target.closest(SELECTORS.TRIGGER);
    if (trigger) {
      e.preventDefault();
      const targetSelector = trigger.getAttribute('data-modal-target') || trigger.getAttribute('data-modal-toggle') || trigger.getAttribute('href');
      if (targetSelector) {
        openModal(targetSelector, trigger);
      }
      return;
    }

    // 2. Check for close buttons
    const closeBtn = e.target.closest(SELECTORS.CLOSE_BTN);
    if (closeBtn) {
      e.preventDefault();
      const modalEl = closeBtn.closest(SELECTORS.MODAL);
      if (modalEl) {
        closeModal(modalEl);
      }
      return;
    }

    // 3. Check for backdrop clicks (clicking outside modal dialog content)
    if (modalStack.length > 0) {
      const activeModal = modalStack[modalStack.length - 1];
      const isStatic = activeModal.hasAttribute('data-modal-static');
      
      // If click is directly on the modal backdrop container (not inside dialog content)
      if (!isStatic && e.target === activeModal) {
        closeModal(activeModal);
      }
    }
  });

  // Global keydown listeners (Escape key & Focus trap)
  document.addEventListener('keydown', (e) => {
    if (modalStack.length === 0) return;
    const activeModal = modalStack[modalStack.length - 1];

    if (e.key === 'Escape') {
      const isStatic = activeModal.hasAttribute('data-modal-static');
      if (!isStatic) {
        e.preventDefault();
        closeModal(activeModal);
      }
    } else if (e.key === 'Tab') {
      // Focus Trap Implementation
      const focusables = getFocusableElements(activeModal);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const firstFocusable = focusables[0];
      const lastFocusable = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  });

  globalListenersInitialized = true;
}

/* ====================================================================
   5. PUBLIC INITIALIZATION
   =================================================================== */

/**
 * Initialize the global modal component.
 */
export function initModals() {
  try {
    const modals = document.querySelectorAll(SELECTORS.MODAL);
    
    modals.forEach(modalEl => {
      // Ensure baseline accessibility attributes if missing
      if (!modalEl.hasAttribute('aria-hidden')) {
        modalEl.setAttribute('aria-hidden', 'true');
      }
    });

    setupGlobalModalListeners();
    console.info('[Modal] Modal component successfully initialized.');
  } catch (error) {
    console.error('[Modal] Critical error initializing modals:', error);
  }
}