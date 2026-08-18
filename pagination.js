/**
 * ISAAC CLINIC Management Dashboard
 * Centralized Reusable Pagination Component (javascript/components/pagination.js)
 */

'use strict';

/* ====================================================================
   1. CONSTANTS & SELECTORS
   =================================================================== */

const DEFAULTS = Object.freeze({
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  pageSizeOptions: [10, 25, 50, 100]
});

const EVENTS = Object.freeze({
  CHANGE: 'isaac:pagination-change'
});

const SELECTORS = Object.freeze({
  FIRST_BTN: '[data-pagination-first], .pagination-first',
  PREV_BTN: '[data-pagination-prev], .pagination-prev',
  NEXT_BTN: '[data-pagination-next], .pagination-next',
  LAST_BTN: '[data-pagination-last], .pagination-last',
  PAGE_NUMBERS: '[data-pagination-numbers], .pagination-numbers',
  PAGE_SIZE_SELECT: '[data-pagination-size], .pagination-page-size',
  SUMMARY: '[data-pagination-summary], .pagination-summary'
});

/* ====================================================================
   2. PAGINATION CLASS DEFINITION
   =================================================================== */

export class PaginationController {
  /**
   * Create a PaginationController instance.
   * @param {HTMLElement|string} container - Container element or selector
   * @param {Object} [options={}] - Configuration options
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    
    if (!this.container) {
      console.warn('[Pagination] Container element not found. Pagination controller running in headless state.');
    }

    this.currentPage = Math.max(1, parseInt(options.currentPage, 10) || DEFAULTS.currentPage);
    this.pageSize = parseInt(options.pageSize, 10) || DEFAULTS.pageSize;
    this.totalItems = Math.max(0, parseInt(options.totalItems, 10) || DEFAULTS.totalItems);
    this.pageSizeOptions = Array.isArray(options.pageSizeOptions) ? options.pageSizeOptions : [...DEFAULTS.pageSizeOptions];
    this.onPageChange = typeof options.onPageChange === 'function' ? options.onPageChange : null;

    this._boundEventHandlers = {};
    this.init();
  }

  /**
   * Calculate total number of pages.
   * @returns {number}
   */
  get totalPages() {
    if (this.totalItems <= 0 || this.pageSize <= 0) return 1;
    return Math.ceil(this.totalItems / this.pageSize);
  }

  /**
   * Validate and clamp current page within valid bounds.
   */
  _validateState() {
    const total = this.totalPages;
    if (this.currentPage > total) {
      this.currentPage = Math.max(1, total);
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  /**
   * Get start and end index slice for array data.
   * @returns {{startIndex: number, endIndex: number}}
   */
  getRange() {
    this._validateState();
    if (this.totalItems === 0) {
      return { startIndex: 0, endIndex: 0 };
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.totalItems);
    return { startIndex, endIndex };
  }

  /**
   * Slice a dataset array based on current pagination state.
   * @param {Array} data - Source dataset array
   * @returns {Array} Sliced subset
   */
  getPageSlice(data) {
    if (!Array.isArray(data)) return [];
    const { startIndex, endIndex } = this.getRange();
    return data.slice(startIndex, endIndex);
  }

  /**
   * Get comprehensive state object.
   * @returns {Object}
   */
  getState() {
    this._validateState();
    const { startIndex, endIndex } = this.getRange();
    return {
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      totalItems: this.totalItems,
      totalPages: this.totalPages,
      startIndex: this.totalItems > 0 ? startIndex + 1 : 0,
      endIndex,
      hasPrev: this.currentPage > 1,
      hasNext: this.currentPage < this.totalPages
    };
  }

  /**
   * Navigate to a specific page number.
   * @param {number} pageNum 
   * @returns {boolean} Success status
   */
  goToPage(pageNum) {
    const target = parseInt(pageNum, 10);
    if (isNaN(target)) return false;

    this._validateState();
    const total = this.totalPages;

    if (target < 1 || target > total || target === this.currentPage) {
      return false;
    }

    this.currentPage = target;
    this.render();
    this._dispatchChange();
    return true;
  }

  goToFirst() {
    return this.goToPage(1);
  }

  goToPrev() {
    return this.goToPage(this.currentPage - 1);
  }

  goToNext() {
    return this.goToPage(this.currentPage + 1);
  }

  goToLast() {
    return this.goToPage(this.totalPages);
  }

  /**
   * Update total items count (e.g. after search or deletion).
   * @param {number} newTotal 
   */
  setTotalItems(newTotal) {
    this.totalItems = Math.max(0, parseInt(newTotal, 10) || 0);
    this._validateState();
    this.render();
  }

  /**
   * Change items per page size.
   * @param {number} newPageSize 
   */
  setPageSize(newPageSize) {
    const size = parseInt(newPageSize, 10);
    if (isNaN(size) || size <= 0 || size === this.pageSize) return;

    this.pageSize = size;
    this.currentPage = 1; // Reset to first page on page size change
    this.render();
    this._dispatchChange();
  }

  /**
   * Dispatch change callback and namespaced custom event.
   */
  _dispatchChange() {
    const state = this.getState();

    if (typeof this.onPageChange === 'function') {
      try {
        this.onPageChange(state);
      } catch (error) {
        console.error('[Pagination] Error in onPageChange callback:', error);
      }
    }

    if (this.container) {
      const event = new CustomEvent(EVENTS.CHANGE, {
        bubbles: true,
        detail: state
      });
      this.container.dispatchEvent(event);
    }
  }

  /**
   * Render or update DOM controls if container is present.
   */
  render() {
    if (!this.container) return;

    this._validateState();
    const state = this.getState();

    // 1. Update First / Prev / Next / Last button disabled states
    const firstBtn = this.container.querySelector(SELECTORS.FIRST_BTN);
    const prevBtn = this.container.querySelector(SELECTORS.PREV_BTN);
    const nextBtn = this.container.querySelector(SELECTORS.NEXT_BTN);
    const lastBtn = this.container.querySelector(SELECTORS.LAST_BTN);

    if (firstBtn) {
      firstBtn.disabled = !state.hasPrev;
      firstBtn.setAttribute('aria-disabled', String(!state.hasPrev));
    }
    if (prevBtn) {
      prevBtn.disabled = !state.hasPrev;
      prevBtn.setAttribute('aria-disabled', String(!state.hasPrev));
    }
    if (nextBtn) {
      nextBtn.disabled = !state.hasNext;
      nextBtn.setAttribute('aria-disabled', String(!state.hasNext));
    }
    if (lastBtn) {
      lastBtn.disabled = !state.hasNext;
      lastBtn.setAttribute('aria-disabled', String(!state.hasNext));
    }

    // 2. Render Page Number Buttons (Compact Intelligent Range)
    const numbersContainer = this.container.querySelector(SELECTORS.PAGE_NUMBERS);
    if (numbersContainer) {
      numbersContainer.innerHTML = '';
      const pages = this._calculatePageRange(state.currentPage, state.totalPages);

      pages.forEach(p => {
        if (p === '...') {
          const ellipsis = document.createElement('span');
          ellipsis.className = 'pagination-ellipsis';
          ellipsis.textContent = '…';
          ellipsis.setAttribute('aria-hidden', 'true');
          numbersContainer.appendChild(ellipsis);
        } else {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `pagination-page-btn ${p === state.currentPage ? 'active' : ''}`;
          btn.textContent = String(p);
          btn.setAttribute('aria-label', `Go to page ${p}`);
          if (p === state.currentPage) {
            btn.setAttribute('aria-current', 'page');
          }
          btn.addEventListener('click', () => this.goToPage(p));
          numbersContainer.appendChild(btn);
        }
      });
    }

    // 3. Update Summary Text (e.g., "Showing 1–10 of 248")
    const summaryEl = this.container.querySelector(SELECTORS.SUMMARY);
    if (summaryEl) {
      if (state.totalItems === 0) {
        summaryEl.textContent = 'Showing 0 of 0 entries';
      } else {
        summaryEl.textContent = `Showing ${state.startIndex}–${state.endIndex} of ${state.totalItems} entries`;
      }
    }

    // 4. Update Page Size Selector if present
    const sizeSelect = this.container.querySelector(SELECTORS.PAGE_SIZE_SELECT);
    if (sizeSelect && sizeSelect.value !== String(this.pageSize)) {
      sizeSelect.value = String(this.pageSize);
    }
  }

  /**
   * Calculate intelligent compact page range with ellipses.
   * @param {number} current 
   * @param {number} total 
   * @returns {Array<number|string>}
   */
  _calculatePageRange(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [];
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', total);
    } else if (current >= total - 3) {
      pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return pages;
  }

  /**
   * Setup event listeners on the container.
   */
  init() {
    if (!this.container) return;

    // Event delegation for static container controls
    this._boundEventHandlers.click = (e) => {
      if (e.target.closest(SELECTORS.FIRST_BTN)) {
        e.preventDefault();
        this.goToFirst();
      } else if (e.target.closest(SELECTORS.PREV_BTN)) {
        e.preventDefault();
        this.goToPrev();
      } else if (e.target.closest(SELECTORS.NEXT_BTN)) {
        e.preventDefault();
        this.goToNext();
      } else if (e.target.closest(SELECTORS.LAST_BTN)) {
        e.preventDefault();
        this.goToLast();
      }
    };

    this._boundEventHandlers.change = (e) => {
      const sizeSelect = e.target.closest(SELECTORS.PAGE_SIZE_SELECT);
      if (sizeSelect) {
        this.setPageSize(sizeSelect.value);
      }
    };

    this.container.addEventListener('click', this._boundEventHandlers.click);
    this.container.addEventListener('change', this._boundEventHandlers.change);

    this.render();
  }

  /**
   * Clean up event listeners and references.
   */
  destroy() {
    if (this.container) {
      if (this._boundEventHandlers.click) {
        this.container.removeEventListener('click', this._boundEventHandlers.click);
      }
      if (this._boundEventHandlers.change) {
        this.container.removeEventListener('change', this._boundEventHandlers.change);
      }
      this.container.innerHTML = '';
    }
    this.onPageChange = null;
    this._boundEventHandlers = {};
  }
}

/* ====================================================================
   3. HELPER INITIALIZATION API
   =================================================================== */

/**
 * Initialize a pagination controller instance.
 * @param {Object} options - Configuration options
 * @returns {PaginationController}
 */
export function initPagination(options = {}) {
  try {
    const controller = new PaginationController(options.container || null, options);
    console.info('[Pagination] Pagination controller successfully initialized.');
    return controller;
  } catch (error) {
    console.error('[Pagination] Critical error initializing pagination:', error);
    return null;
  }
}