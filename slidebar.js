/**
 * ISAAC CLINIC Management Dashboard
 * Global Sidebar Navigation Component (javascript/components/sidebar.js)
 */

'use strict';

import { localStore, STORAGE_KEYS } from '../utils/storage.js';

/* ====================================================================
   1. CONSTANTS & SELECTORS
   =================================================================== */

const SELECTORS = Object.freeze({
  SIDEBAR: '.sidebar, aside',
  NAV_LINKS: '.sidebar nav a, .sidebar-nav a, [data-sidebar-link]',
  COLLAPSE_TOGGLE: '[data-sidebar-collapse-toggle], .sidebar-collapse-btn',
  NAV_GROUPS: '[data-sidebar-group], .sidebar-nav-group',
  GROUP_TOGGLE: '[data-group-toggle], .sidebar-group-toggle',
  OVERLAY: '.sidebar-overlay, [data-sidebar-overlay]'
});

const CLASSES = Object.freeze({
  COLLAPSED: 'sidebar-collapsed',
  MOBILE_OPEN: 'sidebar-open',
  ACTIVE: 'active',
  OPEN: 'open',
  EXPANDED: 'expanded'
});

const EVENTS = Object.freeze({
  HEADER_TOGGLE: 'isaac:header-toggle',
  SIDEBAR_OPEN: 'isaac:sidebar-open',
  SIDEBAR_CLOSE: 'isaac:sidebar-close',
  SIDEBAR_STATE_CHANGE: 'isaac:sidebar-state-change'
});

let isSidebarInitialized = false;

/* ====================================================================
   2. STATE & STORAGE MANAGEMENT
   =================================================================== */

/**
 * Retrieve saved desktop collapsed state from storage.
 * @returns {boolean}
 */
function getSavedCollapsedState() {
  return localStore.get(STORAGE_KEYS.SIDEBAR_STATE, false);
}

/**
 * Save desktop collapsed state to storage.
 * @param {boolean} isCollapsed 
 */
function saveCollapsedState(isCollapsed) {
  localStore.set(STORAGE_KEYS.SIDEBAR_STATE, isCollapsed);
}

/* ====================================================================
   3. NAVIGATION ACTIVE STATE & ROUTING
   =================================================================== */

/**
 * Detect current page file from window location and highlight matching nav item.
 */
function updateActiveNavLink() {
  try {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    const currentFilename = segments.length > 0 ? segments[segments.length - 1] : 'index.html';
    const normalizedCurrent = currentFilename === '' ? 'index.html' : currentFilename;

    const navLinks = document.querySelectorAll(SELECTORS.NAV_LINKS);
    
    navLinks.forEach(link => {
      link.classList.remove(CLASSES.ACTIVE);
      link.removeAttribute('aria-current');

      const href = link.getAttribute('href');
      if (!href) return;

      const linkFilename = href.split('/').pop();

      if (linkFilename === normalizedCurrent || (normalizedCurrent === 'index.html' && (href === './' || href === '/'))) {
        link.classList.add(CLASSES.ACTIVE);
        link.setAttribute('aria-current', 'page');

        // If link is inside a collapsible group, expand parent group
        const group = link.closest(SELECTORS.NAV_GROUPS);
        if (group) {
          group.classList.add(CLASSES.OPEN, CLASSES.EXPANDED);
          const toggleBtn = group.querySelector(SELECTORS.GROUP_TOGGLE);
          if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', 'true');
          }
        }
      }
    });
  } catch (error) {
    console.error('[Sidebar] Error updating active navigation link:', error);
  }
}

/* ====================================================================
   4. INTERACTION & BEHAVIOR CONTROLLERS
   =================================================================== */

/**
 * Toggle desktop collapsed state.
 * @param {HTMLElement} sidebarEl 
 */
function toggleDesktopCollapse(sidebarEl) {
  if (!sidebarEl) return;
  const isCurrentlyCollapsed = sidebarEl.classList.toggle(CLASSES.COLLAPSED);
  saveCollapsedState(isCurrentlyCollapsed);

  const event = new CustomEvent(EVENTS.SIDEBAR_STATE_CHANGE, {
    bubbles: true,
    detail: { isCollapsed: isCurrentlyCollapsed }
  });
  document.dispatchEvent(event);
}

/**
 * Open mobile sidebar.
 * @param {HTMLElement} sidebarEl 
 * @param {HTMLElement|null} overlayEl 
 */
function openMobileSidebar(sidebarEl, overlayEl) {
  if (!sidebarEl) return;
  sidebarEl.classList.add(CLASSES.MOBILE_OPEN);
  if (overlayEl) {
    overlayEl.classList.add(CLASSES.ACTIVE);
  }

  const event = new CustomEvent(EVENTS.SIDEBAR_OPEN, { bubbles: true });
  document.dispatchEvent(event);
}

/**
 * Close mobile sidebar.
 * @param {HTMLElement} sidebarEl 
 * @param {HTMLElement|null} overlayEl 
 */
function closeMobileSidebar(sidebarEl, overlayEl) {
  if (!sidebarEl) return;
  sidebarEl.classList.remove(CLASSES.MOBILE_OPEN);
  if (overlayEl) {
    overlayEl.classList.remove(CLASSES.ACTIVE);
  }

  const event = new CustomEvent(EVENTS.SIDEBAR_CLOSE, { bubbles: true });
  document.dispatchEvent(event);
}

/**
 * Handle navigation group accordion toggles.
 * @param {HTMLElement} groupEl 
 */
function toggleNavGroup(groupEl) {
  if (!groupEl) return;
  const isOpen = groupEl.classList.toggle(CLASSES.OPEN);
  groupEl.classList.toggle(CLASSES.EXPANDED, isOpen);

  const toggleBtn = groupEl.querySelector(SELECTORS.GROUP_TOGGLE);
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
  }
}

/* ====================================================================
   5. PUBLIC API & INITIALIZATION
   =================================================================== */

/**
 * Initialize the global sidebar component.
 */
export function initSidebar() {
  try {
    const sidebarEl = document.querySelector(SELECTORS.SIDEBAR);
    if (!sidebarEl) {
      console.warn('[Sidebar] Sidebar element not found in DOM. Skipping sidebar initialization.');
      return;
    }

    if (isSidebarInitialized) {
      console.info('[Sidebar] Sidebar already initialized.');
      return;
    }

    const overlayEl = document.querySelector(SELECTORS.OVERLAY);

    // 1. Restore saved desktop collapsed state
    const isSavedCollapsed = getSavedCollapsedState();
    if (isSavedCollapsed) {
      sidebarEl.classList.add(CLASSES.COLLAPSED);
    }

    // 2. Highlight active navigation item based on current page
    updateActiveNavLink();

    // 3. Handle Header Toggle Event (Responsive integration)
    document.addEventListener(EVENTS.HEADER_TOGGLE, () => {
      // If mobile view, toggle mobile open/close. If desktop, toggle collapse.
      if (window.innerWidth <= 1024) {
        if (sidebarEl.classList.contains(CLASSES.MOBILE_OPEN)) {
          closeMobileSidebar(sidebarEl, overlayEl);
        } else {
          openMobileSidebar(sidebarEl, overlayEl);
        }
      } else {
        toggleDesktopCollapse(sidebarEl);
      }
    });

    // 4. Handle Collapse Toggle Button if present
    const collapseToggleBtn = document.querySelector(SELECTORS.COLLAPSE_TOGGLE);
    if (collapseToggleBtn) {
      collapseToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDesktopCollapse(sidebarEl);
      });
    }

    // 5. Handle Overlay Click (Close mobile sidebar)
    if (overlayEl) {
      overlayEl.addEventListener('click', () => {
        closeMobileSidebar(sidebarEl, overlayEl);
      });
    }

    // 6. Handle Nav Group Accordion Toggles via Event Delegation
    sidebarEl.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest(SELECTORS.GROUP_TOGGLE);
      if (toggleBtn) {
        e.preventDefault();
        const groupEl = toggleBtn.closest(SELECTORS.NAV_GROUPS);
        if (groupEl) {
          toggleNavGroup(groupEl);
        }
      }
    });

    // 7. Global Keyboard Accessibility (Escape to close mobile sidebar)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (sidebarEl.classList.contains(CLASSES.MOBILE_OPEN)) {
          closeMobileSidebar(sidebarEl, overlayEl);
        }
      }
    });

    isSidebarInitialized = true;
    console.info('[Sidebar] Sidebar component successfully initialized.');
  } catch (error) {
    console.error('[Sidebar] Critical error during sidebar initialization:', error);
  }
}