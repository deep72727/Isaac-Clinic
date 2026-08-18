/**
 * ISAAC CLINIC Management Dashboard
 * Centralized Reusable Data-Table Component (javascript/components/table.js)
 */

'use strict';

/* ====================================================================
   1. CONSTANTS & SELECTORS
   =================================================================== */

const EVENTS = Object.freeze({
  ACTION: 'isaac:table-action',
  SORT: 'isaac:table-sort',
  SELECT: 'isaac:table-select'
});

const DEFAULT_EMPTY_MESSAGE = 'No records available';
const DEFAULT_LOADING_MESSAGE = 'Loading records...';

/* ====================================================================
   2. TABLE CONTROLLER CLASS
   =================================================================== */

export class TableController {
  /**
   * Create a TableController instance.
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.container = typeof options.container === 'string' 
      ? document.querySelector(options.container) 
      : options.container;

    if (!this.container) {
      console.warn('[Table] Table container element not found. Table running in headless state.');
    }

    this.data = Array.isArray(options.data) ? [...options.data] : [];
    this.columns = Array.isArray(options.columns) ? [...options.columns] : [];
    this.emptyMessage = options.emptyMessage || DEFAULT_EMPTY_MESSAGE;
    this.loadingMessage = options.loadingMessage || DEFAULT_LOADING_MESSAGE;
    
    // Features configuration
    this.selectable = Boolean(options.selectable);
    this.actions = Array.isArray(options.actions) ? options.actions : [];
    
    // State
    this.sortKey = options.sortKey || null;
    this.sortDirection = options.sortDirection || 'asc'; // 'asc' | 'desc'
    this.isLoading = Boolean(options.isLoading);
    this.errorMessage = options.errorMessage || null;
    this.selectedRowIds = new Set();
    this.rowIdKey = options.rowIdKey || 'id';

    this._boundEventHandlers = {};
    this.init();
  }

  /**
   * Set new data source and re-render.
   * @param {Array<Object>} newData 
   */
  setData(newData) {
    this.data = Array.isArray(newData) ? [...newData] : [];
    this._validateSelection();
    this.render();
  }

  /**
   * Set new column definitions and re-render.
   * @param {Array<Object>} newColumns 
   */
  setColumns(newColumns) {
    this.columns = Array.isArray(newColumns) ? [...newColumns] : [];
    this.render();
  }

  /**
   * Set loading state.
   * @param {boolean} state 
   */
  setLoading(state) {
    this.isLoading = Boolean(state);
    if (this.isLoading) {
      this.errorMessage = null;
    }
    this.render();
  }

  /**
   * Set error state.
   * @param {string|null} message 
   */
  setError(message) {
    this.errorMessage = message;
    if (message) {
      this.isLoading = false;
    }
    this.render();
  }

  /**
   * Clear all selected rows.
   */
  clearSelection() {
    this.selectedRowIds.clear();
    this._dispatchSelectEvent();
    this.render();
  }

  /**
   * Get currently selected rows data objects.
   * @returns {Array<Object>}
   */
  getSelectedRows() {
    return this.data.filter(row => {
      const rowId = row[this.rowIdKey] !== undefined ? row[this.rowIdKey] : JSON.stringify(row);
      return this.selectedRowIds.has(rowId);
    });
  }

  /**
   * Ensure selected rows still exist in the current data set.
   */
  _validateSelection() {
    const validIds = new Set(this.data.map(row => row[this.rowIdKey] !== undefined ? row[this.rowIdKey] : JSON.stringify(row)));
    for (const id of this.selectedRowIds) {
      if (!validIds.has(id)) {
        this.selectedRowIds.delete(id);
      }
    }
  }

  /**
   * Sort dataset based on current sortKey and sortDirection.
   * @returns {Array<Object>}
   */
  _getSortedData() {
    if (!this.sortKey) return this.data;

    const col = this.columns.find(c => c.key === this.sortKey);
    const sorted = [...this.data];

    sorted.sort((a, b) => {
      let valA = a[this.sortKey];
      let valB = b[this.sortKey];

      // Handle null/undefined safely
      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      // Numeric comparison
      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      // Date comparison if valid date objects or parseable date strings
      const dateA = Date.parse(valA);
      const dateB = Date.parse(valB);
      if (!isNaN(dateA) && !isNaN(dateB) && (typeof valA === 'string' || valA instanceof Date) && (typeof valB === 'string' || valB instanceof Date)) {
        return this.sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // Default string comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return this.sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  /**
   * Dispatch row selection change event.
   */
  _dispatchSelectEvent() {
    if (!this.container) return;
    const event = new CustomEvent(EVENTS.SELECT, {
      bubbles: true,
      detail: {
        selectedRows: this.getSelectedRows(),
        selectedIds: Array.from(this.selectedRowIds),
        tableInstance: this
      }
    });
    this.container.dispatchEvent(event);
  }

  /**
   * Render table markup safely using DOM APIs.
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'table-responsive-wrapper';

    const table = document.createElement('table');
    table.className = 'table isaac-data-table';

    // 1. Render Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // Selection checkbox header
    if (this.selectable) {
      const thSelect = document.createElement('th');
      thSelect.className = 'table-col-checkbox';
      thSelect.style.width = '40px';
      
      const selectAllCheckbox = document.createElement('input');
      selectAllCheckbox.type = 'checkbox';
      selectAllCheckbox.className = 'table-select-all';
      selectAllCheckbox.setAttribute('aria-label', 'Select all rows');

      const sortedData = this._getSortedData();
      const allSelected = sortedData.length > 0 && sortedData.every(row => {
        const id = row[this.rowIdKey] !== undefined ? row[this.rowIdKey] : JSON.stringify(row);
        return this.selectedRowIds.has(id);
      });
      const someSelected = this.selectedRowIds.size > 0 && !allSelected;

      selectAllCheckbox.checked = allSelected;
      selectAllCheckbox.indeterminate = someSelected;

      thSelect.appendChild(selectAllCheckbox);
      headerRow.appendChild(thSelect);
    }

    // Column headers
    this.columns.forEach(col => {
      if (col.hidden) return;

      const th = document.createElement('th');
      th.className = `table-col-${col.key} ${col.className || ''}`;
      if (col.width) th.style.width = col.width;
      if (col.align) th.style.textAlign = col.align;

      if (col.sortable) {
        th.classList.add('sortable');
        th.setAttribute('tabindex', '0');
        th.setAttribute('role', 'columnheader');
        th.setAttribute('data-sort-key', col.key);

        const isCurrentSort = this.sortKey === col.key;
        if (isCurrentSort) {
          th.setAttribute('aria-sort', this.sortDirection === 'asc' ? 'ascending' : 'descending');
        } else {
          th.setAttribute('aria-sort', 'none');
        }
      }

      th.scope = 'col';

      const labelSpan = document.createElement('span');
      labelSpan.className = 'th-label';
      labelSpan.textContent = col.label || col.key;
      th.appendChild(labelSpan);

      if (col.sortable) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'sort-indicator';
        iconSpan.setAttribute('aria-hidden', 'true');
        iconSpan.textContent = this.sortKey === col.key ? (this.sortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕';
        th.appendChild(iconSpan);
      }

      headerRow.appendChild(th);
    });

    // Actions header if configured
    if (this.actions.length > 0) {
      const thActions = document.createElement('th');
      thActions.className = 'table-col-actions';
      thActions.scope = 'col';
      thActions.textContent = 'Actions';
      headerRow.appendChild(thActions);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // 2. Render Body
    const tbody = document.createElement('tbody');

    if (this.isLoading) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = this.columns.length + (this.selectable ? 1 : 0) + (this.actions.length > 0 ? 1 : 0);
      td.className = 'table-state-cell table-loading';
      td.textContent = this.loadingMessage;
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else if (this.errorMessage) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = this.columns.length + (this.selectable ? 1 : 0) + (this.actions.length > 0 ? 1 : 0);
      td.className = 'table-state-cell table-error';
      td.textContent = this.errorMessage;
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      const sortedData = this._getSortedData();

      if (sortedData.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = this.columns.length + (this.selectable ? 1 : 0) + (this.actions.length > 0 ? 1 : 0);
        td.className = 'table-state-cell table-empty';
        td.textContent = this.emptyMessage;
        tr.appendChild(td);
        tbody.appendChild(tr);
      } else {
        sortedData.forEach((row, rowIndex) => {
          const tr = document.createElement('tr');
          tr.className = 'table-row';
          const rowId = row[this.rowIdKey] !== undefined ? row[this.rowIdKey] : JSON.stringify(row);
          tr.setAttribute('data-row-id', rowId);
          tr.setAttribute('data-row-index', String(rowIndex));

          const isSelected = this.selectedRowIds.has(rowId);
          if (isSelected) {
            tr.classList.add('selected');
          }

          // Row checkbox
          if (this.selectable) {
            const tdSelect = document.createElement('td');
            tdSelect.className = 'table-col-checkbox';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'table-row-checkbox';
            checkbox.checked = isSelected;
            checkbox.setAttribute('aria-label', `Select row ${rowIndex + 1}`);

            tdSelect.appendChild(checkbox);
            tr.appendChild(tdSelect);
          }

          // Data cells
          this.columns.forEach(col => {
            if (col.hidden) return;

            const td = document.createElement('td');
            td.className = `table-col-${col.key} ${col.className || ''}`;
            if (col.align) td.style.textAlign = col.align;

            let rawValue = row[col.key];

            // Custom renderer or formatter support
            if (typeof col.render === 'function') {
              try {
                const rendered = col.render(rawValue, row, rowIndex);
                if (rendered instanceof HTMLElement) {
                  td.appendChild(rendered);
                } else {
                  td.textContent = rendered !== undefined && rendered !== null ? String(rendered) : '—';
                }
              } catch (renderError) {
                console.error(`[Table] Error in column render for "${col.key}":`, renderError);
                td.textContent = '—';
              }
            } else {
              if (typeof col.formatter === 'function') {
                try {
                  rawValue = col.formatter(rawValue, row, rowIndex);
                } catch (fmtError) {
                  console.error(`[Table] Error in column formatter for "${col.key}":`, fmtError);
                }
              }

              td.textContent = rawValue !== undefined && rawValue !== null && rawValue !== '' ? String(rawValue) : '—';
            }

            tr.appendChild(td);
          });

          // Actions cell
          if (this.actions.length > 0) {
            const tdActions = document.createElement('td');
            tdActions.className = 'table-col-actions';

            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'table-actions-group';

            this.actions.forEach(actionConfig => {
              const actionBtn = document.createElement('button');
              actionBtn.type = 'button';
              actionBtn.className = `table-action-btn action-${actionConfig.action || 'default'} ${actionConfig.className || ''}`;
              actionBtn.textContent = actionConfig.label || actionConfig.action;
              actionBtn.setAttribute('data-action', actionConfig.action);
              if (actionConfig.title) {
                actionBtn.title = actionConfig.title;
              }
              actionsContainer.appendChild(actionBtn);
            });

            tdActions.appendChild(actionsContainer);
            tr.appendChild(tdActions);
          }

          tbody.appendChild(tr);
        });
      }
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);
    this.container.appendChild(wrapper);
  }

  /**
   * Setup event delegation listeners on the container.
   */
  init() {
    if (!this.container) return;

    // 1. Click handling (Sorting, Selection, Row Actions)
    this._boundEventHandlers.click = (e) => {
      // Sort click
      const th = e.target.closest('th[data-sort-key]');
      if (th) {
        const key = th.getAttribute('data-sort-key');
        if (this.sortKey === key) {
          if (this.sortDirection === 'asc') {
            this.sortDirection = 'desc';
          } else {
            // Reset neutral sorting
            this.sortKey = null;
            this.sortDirection = 'asc';
          }
        } else {
          this.sortKey = key;
          this.sortDirection = 'asc';
        }

        const sortEvent = new CustomEvent(EVENTS.SORT, {
          bubbles: true,
          detail: { sortKey: this.sortKey, sortDirection: this.sortDirection, tableInstance: this }
        });
        this.container.dispatchEvent(sortEvent);
        this.render();
        return;
      }

      // Select All click
      const selectAll = e.target.closest('.table-select-all');
      if (selectAll) {
        const isChecked = selectAll.checked;
        const sortedData = this._getSortedData();

        sortedData.forEach(row => {
          const id = row[this.rowIdKey] !== undefined ? row[this.rowIdKey] : JSON.stringify(row);
          if (isChecked) {
            this.selectedRowIds.add(id);
          } else {
            this.selectedRowIds.delete(id);
          }
        });

        this._dispatchSelectEvent();
        this.render();
        return;
      }

      // Single Row Checkbox click
      const rowCheckbox = e.target.closest('.table-row-checkbox');
      if (rowCheckbox) {
        const tr = rowCheckbox.closest('.table-row');
        if (tr) {
          const rowId = tr.getAttribute('data-row-id');
          if (rowCheckbox.checked) {
            this.selectedRowIds.add(rowId);
          } else {
            this.selectedRowIds.delete(rowId);
          }

          this._dispatchSelectEvent();
          this.render();
        }
        return;
      }

      // Row Action click
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const actionType = actionBtn.getAttribute('data-action');
        const tr = actionBtn.closest('.table-row');
        if (tr) {
          const rowIndex = parseInt(tr.getAttribute('data-row-index'), 10);
          const sortedData = this._getSortedData();
          const rowData = sortedData[rowIndex];

          const actionEvent = new CustomEvent(EVENTS.ACTION, {
            bubbles: true,
            detail: {
              action: actionType,
              row: rowData,
              rowIndex,
              tableInstance: this
            }
          });
          this.container.dispatchEvent(actionEvent);
        }
      }
    };

    // Keyboard accessibility for sorting via Enter/Space
    this._boundEventHandlers.keydown = (e) => {
      const th = e.target.closest('th[data-sort-key]');
      if (th && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        th.click();
      }
    };

    this.container.addEventListener('click', this._boundEventHandlers.click);
    this.container.addEventListener('keydown', this._boundEventHandlers.keydown);

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
      if (this._boundEventHandlers.keydown) {
        this.container.removeEventListener('keydown', this._boundEventHandlers.keydown);
      }
      this.container.innerHTML = '';
    }
    this.data = [];
    this.columns = [];
    this.selectedRowIds.clear();
    this._boundEventHandlers = {};
  }
}

/* ====================================================================
   3. HELPER INITIALIZATION API
   =================================================================== */

/**
 * Create and initialize a data table controller instance.
 * @param {Object} options - Configuration options
 * @returns {TableController}
 */
export function createTable(options = {}) {
  try {
    const tableController = new TableController(options);
    console.info('[Table] Data-table component successfully initialized.');
    return tableController;
  } catch (error) {
    console.error('[Table] Critical error initializing data table:', error);
    return null;
  }
}