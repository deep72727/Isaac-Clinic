/**
 * ISAAC CLINIC Management Dashboard
 * Centralized Reusable Dropdown Component (javascript/components/dropdown.js)
 */

'use strict';

/* ====================================================================
   1. CONSTANTS & SELECTORS
   =================================================================== */

const SELECTORS = Object.freeze({
  DROPDOWN: '[data-dropdown], .dropdown',
  TRIGGER: '[data-dropdown-trigger], .dropdown-trigger, .dropdown-toggle',
  MENU: '[data-dropdown-menu], .dropdown-menu',
  OPTION: '[data-dropdown-option], .dropdown-item, .dropdown-option',
  SEARCH: '[data-dropdown-search], .dropdown-search-input'
});

const CLASSES = Object.freeze({
  OPEN: 'open',
  SHOW: 'show',
  ACTIVE: 'active',
  DISABLED: 'disabled',
  NO_RESULTS: 'dropdown-no-results'
});

const EVENTS = Object.freeze({
  CHANGE: 'isaac:dropdown-change',
  OPEN: 'isaac:dropdown-open',
  CLOSE: 'isaac:dropdown-close'
});

// WeakSet to track initialized triggers to prevent duplicate event listeners
const initializedTriggers = new WeakSet();

/* ====================================================================
   2. HELPER UTILITIES
   =================================================================== */

/**
 * Safely toggle aria-expanded attribute.
 * @param {HTMLElement} trigger 
 * @param {boolean} isOpen 
 */
function setAriaExpanded(trigger, isOpen) {
  if (trigger && trigger.hasAttribute('aria-expanded')) {
    trigger.setAttribute('aria-expanded', String(isOpen));
  }
}

/**
 * Check if an element or its children are disabled.
 * @param {HTMLElement} element 
 * @returns {boolean}
 */
function isDisabled(element) {
  if (!element) return true;
  return (
    element.hasAttribute('disabled') ||
    element.getAttribute('aria-disabled') === 'true' ||
    element.classList.contains(CLASSES.DISABLED)
  );
}

/* ====================================================================
   3. CORE DROPDOWN ACTIONS
   =================================================================== */

/**
 * Open a specific dropdown container.
 * @param {HTMLElement} dropdownEl 
 */
export function openDropdown(dropdownEl) {
  if (!dropdownEl || isDisabled(dropdownEl)) return;

  const trigger = dropdownEl.querySelector(SELECTORS.TRIGGER);
  const menu = dropdownEl.querySelector(SELECTORS.MENU);

  if (!menu) return;

  // Optionally close other open dropdowns at the same level or globally
  closeAllDropdowns(dropdownEl);

  dropdownEl.classList.add(CLASSES.OPEN, CLASSES.SHOW);
  if (trigger) {
    trigger.classList.add(CLASSES.ACTIVE);
    setAriaExpanded(trigger, true);
  }

  // Focus search input inside menu if available
  const searchInput = menu.querySelector(SELECTORS.SEARCH);
  if (searchInput) {
    setTimeout(() => searchInput.focus(), 50);
  }

  const openEvent = new CustomEvent(EVENTS.OPEN, {
    bubbles: true,
    detail: { dropdown: dropdownEl }
  });
  dropdownEl.dispatchEvent(openEvent);
}

/**
 * Close a specific dropdown container.
 * @param {HTMLElement} dropdownEl 
 * @param {boolean} [returnFocus=false] 
 */
export function closeDropdown(dropdownEl, returnFocus = false) {
  if (!dropdownEl) return;

  const trigger = dropdownEl.querySelector(SELECTORS.TRIGGER);
  const menu = dropdownEl.querySelector(SELECTORS.MENU);

  dropdownEl.classList.remove(CLASSES.OPEN, CLASSES.SHOW);
  if (trigger) {
    trigger.classList.remove(CLASSES.ACTIVE);
    setAriaExpanded(trigger, false);
    if (returnFocus) {
      trigger.focus();
    }
  }

  const closeEvent = new CustomEvent(EVENTS.CLOSE, {
    bubbles: true,
    detail: { dropdown: dropdownEl }
  });
  dropdownEl.dispatchEvent(closeEvent);
}

/**
 * Toggle a dropdown's open/closed state.
 * @param {HTMLElement} dropdownEl 
 */
export function toggleDropdown(dropdownEl) {
  if (!dropdownEl || isDisabled(dropdownEl)) return;
  const isOpen = dropdownEl.classList.contains(CLASSES.OPEN) || dropdownEl.classList.contains(CLASSES.SHOW);
  if (isOpen) {
    closeDropdown(dropdownEl, true);
  } else {
    openDropdown(dropdownEl);
  }
}

/**
 * Close all dropdowns on the page, optionally excluding one.
 * @param {HTMLElement} [exceptDropdown] 
 */
export function closeAllDropdowns(exceptDropdown = null) {
  const dropdowns = document.querySelectorAll(SELECTORS.DROPDOWN);
  dropdowns.forEach(dropdown => {
    if (dropdown !== exceptDropdown) {
      closeDropdown(dropdown, false);
    }
  });
}

/* ====================================================================
   4. EVENT HANDLERS & SEARCH FILTERING
   =================================================================== */

/**
 * Handle option selection inside a dropdown.
 * @param {HTMLElement} dropdownEl 
 * @param {HTMLElement} optionEl 
 */
function handleOptionSelect(dropdownEl, optionEl) {
  if (isDisabled(optionEl)) return;

  const value = optionEl.getAttribute('data-value') || optionEl.textContent.trim();
  const label = optionEl.textContent.trim();
  const isMulti = dropdownEl.hasAttribute('data-multiselect');

  const trigger = dropdownEl.querySelector(SELECTORS.TRIGGER);

  if (isMulti) {
    optionEl.classList.toggle('selected');
    const isSelected = optionEl.classList.contains('selected');
    optionEl.setAttribute('aria-selected', String(isSelected));
    // Multi-select typically stays open
  } else {
    // Single select: update active class on options
    const options = dropdownEl.querySelectorAll(SELECTORS.OPTION);
    options.forEach(opt => {
      opt.classList.remove('selected', CLASSES.ACTIVE);
      opt.removeAttribute('aria-selected');
    });

    optionEl.classList.add('selected', CLASSES.ACTIVE);
    optionEl.setAttribute('aria-selected', 'true');

    // Update trigger label if trigger has placeholder/label container
    const labelContainer = trigger ? trigger.querySelector('[data-dropdown-label]') || trigger : null;
    if (labelContainer && !trigger.hasAttribute('data-keep-trigger-text')) {
      labelContainer.textContent = label;
    }

    closeDropdown(dropdownEl, true);
  }

  // Dispatch custom selection change event
  const changeEvent = new CustomEvent(EVENTS.CHANGE, {
    bubbles: true,
    detail: {
      dropdown: dropdownEl,
      value,
      label,
      optionElement: optionEl
    }
  });
  dropdownEl.dispatchEvent(changeEvent);
}

/**
 * Handle search filtering inside searchable dropdowns.
 * @param {HTMLElement} dropdownEl 
 * @param {HTMLInputElement} searchInput 
 */
function setupDropdownSearch(dropdownEl, searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const options = dropdownEl.querySelectorAll(SELECTORS.OPTION);
    let visibleCount = 0;

    options.forEach(opt => {
      const text = opt.textContent.toLowerCase();
      const matches = text.includes(query);
      opt.style.display = matches ? '' : 'none';
      if (matches) visibleCount++;
    });

    // Handle no results state
    const menu = dropdownEl.querySelector(SELECTORS.MENU);
    let noResultsEl = menu.querySelector(`.${CLASSES.NO_RESULTS}`);

    if (visibleCount === 0) {
      if (!noResultsEl && menu) {
        noResultsEl = document.createElement('div');
        noResultsEl.className = CLASSES.NO_RESULTS;
        noResultsEl.textContent = 'No matching options found';
        noResultsEl.style.padding = '8px 12px';
        noResultsEl.style.color = '#6b7280';
        noResultsEl.style.fontSize = '0.875rem';
        menu.appendChild(noResultsEl);
      }
    } else if (noResultsEl) {
      noResultsEl.remove();
    }
  });

  searchInput.addEventListener('click', (e) => e.stopPropagation());
}

/* ====================================================================
   5. INITIALIZATION & GLOBAL LISTENERS
   =================================================================== */

/**
 * Initialize all dropdown components in the document.
 */
export function initDropdowns() {
  try {
    const dropdowns = document.querySelectorAll(SELECTORS.DROPDOWN);

    dropdowns.forEach(dropdownEl => {
      const trigger = dropdownEl.querySelector(SELECTORS.TRIGGER);
      const menu = dropdownEl.querySelector(SELECTORS.MENU);

      if (!trigger || !menu) return;

      // Ensure ARIA attributes
      if (!trigger.hasAttribute('aria-haspopup')) {
        trigger.setAttribute('aria-haspopup', 'true');
      }
      if (!trigger.hasAttribute('aria-expanded')) {
        trigger.setAttribute('aria-expanded', 'false');
      }

      // Attach event listener to trigger only once per element
      if (!initializedTriggers.has(trigger)) {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleDropdown(dropdownEl);
        });

        // Keyboard accessibility on trigger
        trigger.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            openDropdown(dropdownEl);
          } else if (e.key === 'Escape') {
            closeDropdown(dropdownEl, true);
          }
        });

        initializedTriggers.add(trigger);
      }

      // Setup option selection via event delegation on menu
      if (!menu.dataset.listenersAttached) {
        menu.addEventListener('click', (e) => {
          const option = e.target.closest(SELECTORS.OPTION);
          if (option && dropdownEl.contains(option)) {
            e.stopPropagation();
            handleOptionSelect(dropdownEl, option);
          }
        });

        // Setup search if present
        const searchInput = menu.querySelector(SELECTORS.SEARCH);
        if (searchInput) {
          setupDropdownSearch(dropdownEl, searchInput);
        }

        menu.dataset.listenersAttached = 'true';
      }
    });

    // Global document listeners (click outside & escape key)
    if (!window.__isaacDropdownGlobalListeners) {
      document.addEventListener('click', (e) => {
        if (!e.target.closest(SELECTORS.DROPDOWN)) {
          closeAllDropdowns();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeAllDropdowns();
        }
      });

      window.__isaacDropdownGlobalListeners = true;
    }

    console.info('[Dropdown] Dropdown component initialized successfully.');
  } catch (error) {
    console.error('[Dropdown] Critical error initializing dropdowns:', error);
  }
}