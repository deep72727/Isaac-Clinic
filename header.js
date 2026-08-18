/**
 * ISAAC CLINIC Management Dashboard
 * Global Header Component (javascript/components/header.js)
 */

'use strict';

/* ====================================================================
   1. CONSTANTS & SELECTORS
   =================================================================== */

const SELECTORS = Object.freeze({
  HEADER: '.header, header',
  SIDEBAR_TOGGLE: '[data-sidebar-toggle], #sidebarToggle, .sidebar-toggle',
  SEARCH_INPUT: '[data-global-search], #globalSearch, .global-search-input',
  SEARCH_CLEAR: '[data-search-clear], .search-clear-btn',
  NOTIFICATION_BTN: '[data-notification-toggle], #notificationToggle, .notification-btn',
  NOTIFICATION_PANEL: '[data-notification-panel], .notification-panel',
  PROFILE_BTN: '[data-profile-toggle], #profileToggle, .profile-dropdown-btn',
  PROFILE_MENU: '[data-profile-menu], .profile-dropdown-menu',
  PAGE_TITLE: '[data-page-title], #pageTitle, .page-title'
});

const EVENTS = Object.freeze({
  SIDEBAR_TOGGLE: 'isaac:header-toggle',
  GLOBAL_SEARCH: 'isaac:global-search',
  NOTIFICATION_OPEN: 'isaac:notification-open',
  PROFILE_OPEN: 'isaac:profile-open'
});

// Track initialization state to prevent duplicate listeners
let isHeaderInitialized = false;

/* ====================================================================
   2. HELPER INTERACTION FUNCTIONS
   =================================================================== */

/**
 * Safely toggle aria-expanded attribute on a button/control.
 * @param {HTMLElement} element 
 * @param {boolean} [forceState] 
 */
function setAriaExpanded(element, forceState) {
  if (!element) return;
  const currentState = element.getAttribute('aria-expanded') === 'true';
  const newState = forceState !== undefined ? forceState : !currentState;
  element.setAttribute('aria-expanded', String(newState));
}

/**
 * Close all active dropdown menus and panels inside the header.
 */
function closeAllDropdowns() {
  const dropdowns = document.querySelectorAll(`${SELECTORS.PROFILE_MENU}, ${SELECTORS.NOTIFICATION_PANEL}`);
  dropdowns.forEach(panel => {
    panel.classList.remove('active', 'show', 'open');
  });

  const toggles = document.querySelectorAll(`${SELECTORS.PROFILE_BTN}, ${SELECTORS.NOTIFICATION_BTN}`);
  toggles.forEach(toggle => setAriaExpanded(toggle, false));
}

/* ====================================================================
   3. EVENT HANDLERS & BINDINGS
   =================================================================== */

/**
 * Handle Sidebar Toggle button click.
 */
function handleSidebarToggle(event) {
  event.stopPropagation();
  const toggleEvent = new CustomEvent(EVENTS.SIDEBAR_TOGGLE, {
    bubbles: true,
    detail: { timestamp: Date.now() }
  });
  document.dispatchEvent(toggleEvent);
}

/**
 * Handle Global Search input and clear actions.
 */
function handleGlobalSearch(searchInput, clearBtn) {
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    if (clearBtn) {
      clearBtn.style.display = query.trim().length > 0 ? 'block' : 'none';
    }

    const searchEvent = new CustomEvent(EVENTS.GLOBAL_SEARCH, {
      bubbles: true,
      detail: { query: query.trim() }
    });
    document.dispatchEvent(searchEvent);
  });

  if (clearBtn) {
    clearBtn.style.display = searchInput.value.trim().length > 0 ? 'block' : 'none';
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      searchInput.focus();

      const searchEvent = new CustomEvent(EVENTS.GLOBAL_SEARCH, {
        bubbles: true,
        detail: { query: '' }
      });
      document.dispatchEvent(searchEvent);
    });
  }

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.blur();
    }
  });
}

/**
 * Handle Notification Toggle.
 */
function handleNotifications(btn, panel) {
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    
    closeAllDropdowns();

    if (!isExpanded && panel) {
      setAriaExpanded(btn, true);
      panel.classList.add('active', 'show', 'open');
      
      const notifEvent = new CustomEvent(EVENTS.NOTIFICATION_OPEN, {
        bubbles: true,
        detail: { isOpen: true }
      });
      document.dispatchEvent(notifEvent);
    }
  });
}

/**
 * Handle User Profile Menu Toggle.
 */
function handleProfileMenu(btn, menu) {
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';

    closeAllDropdowns();

    if (!isExpanded && menu) {
      setAriaExpanded(btn, true);
      menu.classList.add('active', 'show', 'open');

      const profileEvent = new CustomEvent(EVENTS.PROFILE_OPEN, {
        bubbles: true,
        detail: { isOpen: true }
      });
      document.dispatchEvent(profileEvent);
    }
  });
}

/**
 * Setup global document listeners for outside clicks and Escape key handling.
 */
function setupGlobalDocumentListeners() {
  document.addEventListener('click', (e) => {
    // Close dropdowns if clicking outside header menus
    if (!e.target.closest(SELECTORS.HEADER)) {
      closeAllDropdowns();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
    }
  });
}

/* ====================================================================
   4. PUBLIC API EXPORTS
   =================================================================== */

/**
 * Dynamically update the header page title or breadcrumb.
 * @param {string} title - Title to display
 */
export function setHeaderTitle(title) {
  try {
    const titleEl = document.querySelector(SELECTORS.PAGE_TITLE);
    if (titleEl && title) {
      titleEl.textContent = title;
    }
  } catch (error) {
    console.error('[Header] Failed to set header title:', error);
  }
}

/**
 * Initialize the global header component.
 */
export function initHeader() {
  try {
    const headerEl = document.querySelector(SELECTORS.HEADER);
    if (!headerEl) {
      console.warn('[Header] Header element not found in DOM. Skipping header initialization.');
      return;
    }

    if (isHeaderInitialized) {
      console.info('[Header] Header already initialized.');
      return;
    }

    // 1. Sidebar Toggle
    const sidebarToggleBtn = headerEl.querySelector(SELECTORS.SIDEBAR_TOGGLE);
    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', handleSidebarToggle);
      if (!sidebarToggleBtn.hasAttribute('aria-label')) {
        sidebarToggleBtn.setAttribute('aria-label', 'Toggle Sidebar');
      }
    }

    // 2. Global Search
    const searchInput = headerEl.querySelector(SELECTORS.SEARCH_INPUT);
    const searchClearBtn = headerEl.querySelector(SELECTORS.SEARCH_CLEAR);
    if (searchInput) {
      handleGlobalSearch(searchInput, searchClearBtn);
    }

    // 3. Notifications
    const notificationBtn = headerEl.querySelector(SELECTORS.NOTIFICATION_BTN);
    const notificationPanel = headerEl.querySelector(SELECTORS.NOTIFICATION_PANEL);
    if (notificationBtn) {
      notificationBtn.setAttribute('aria-expanded', 'false');
      if (notificationPanel) {
        notificationBtn.setAttribute('aria-controls', notificationPanel.id || 'notificationPanel');
      }
      handleNotifications(notificationBtn, notificationPanel);
    }

    // 4. Profile Menu
    const profileBtn = headerEl.querySelector(SELECTORS.PROFILE_BTN);
    const profileMenu = headerEl.querySelector(SELECTORS.PROFILE_MENU);
    if (profileBtn) {
      profileBtn.setAttribute('aria-expanded', 'false');
      if (profileMenu) {
        profileBtn.setAttribute('aria-controls', profileMenu.id || 'profileMenu');
      }
      handleProfileMenu(profileBtn, profileMenu);
    }

    // 5. Document-level listeners (outside click, escape key)
    setupGlobalDocumentListeners();

    isHeaderInitialized = true;
    console.info('[Header] Header component successfully initialized.');
  } catch (error) {
    console.error('[Header] Critical error initializing header component:', error);
  }
}