/**
 * ISAAC CLINIC Management Dashboard
 * Centralized Reusable Chart/Visualization Component (javascript/components/charts.js)
 */

'use strict';

/* ====================================================================
   1. CONSTANTS & SELECTORS
   =================================================================== */

const CHART_TYPES = Object.freeze({
  LINE: 'line',
  BAR: 'bar',
  DOUGHNUT: 'doughnut',
  PIE: 'pie'
});

const DEFAULT_EMPTY_MESSAGE = 'No data available';
const DEFAULT_LOADING_MESSAGE = 'Loading chart...';

/* ====================================================================
   2. CHART CONTROLLER CLASS
   =================================================================== */

export class ChartController {
  /**
   * Create a ChartController instance.
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;

    if (!this.container) {
      console.warn('[Chart] Chart container element not found. Chart running in headless state.');
    }

    this.type = options.type || CHART_TYPES.BAR;
    this.data = options.data || { labels: [], datasets: [] };
    this.chartOptions = options.options || {};
    this.emptyMessage = options.emptyMessage || DEFAULT_EMPTY_MESSAGE;
    this.loadingMessage = options.loadingMessage || DEFAULT_LOADING_MESSAGE;

    this.isLoading = Boolean(options.isLoading);
    this.errorMessage = options.errorMessage || null;

    this.canvas = null;
    this.chartInstance = null; // Holds external charting library instance (e.g. Chart.js) if available
    this._boundEventHandlers = {};

    this.init();
  }

  /**
   * Detect if a global charting library (e.g., Chart.js) is available on window.
   * @returns {Object|null}
   */
  _getGlobalChartLibrary() {
    if (typeof window !== 'undefined' && typeof window.Chart !== 'undefined') {
      return window.Chart;
    }
    return null;
  }

  /**
   * Set new chart data and update visualization.
   * @param {Object} newData 
   */
  updateData(newData) {
    this.data = newData || { labels: [], datasets: [] };
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
   * Render or update chart view in the container.
   */
  render() {
    if (!this.container) return;

    // Clean up existing chart instance if any
    if (this.chartInstance && typeof this.chartInstance.destroy === 'function') {
      try {
        this.chartInstance.destroy();
      } catch (err) {
        console.error('[Chart] Error destroying previous chart instance:', err);
      }
      this.chartInstance = null;
    }

    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'chart-wrapper';

    if (this.isLoading) {
      const loadingEl = document.createElement('div');
      loadingEl.className = 'chart-state-message chart-loading';
      loadingEl.textContent = this.loadingMessage;
      wrapper.appendChild(loadingEl);
      this.container.appendChild(wrapper);
      return;
    }

    if (this.errorMessage) {
      const errorEl = document.createElement('div');
      errorEl.className = 'chart-state-message chart-error';
      errorEl.textContent = this.errorMessage;
      wrapper.appendChild(errorEl);
      this.container.appendChild(wrapper);
      return;
    }

    // Check if data is empty
    const hasData = this.data && 
                    Array.isArray(this.data.labels) && 
                    this.data.labels.length > 0 && 
                    Array.isArray(this.data.datasets) && 
                    this.data.datasets.length > 0;

    if (!hasData) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'chart-state-message chart-empty';
      emptyEl.textContent = this.emptyMessage;
      wrapper.appendChild(emptyEl);
      this.container.appendChild(wrapper);
      return;
    }

    // Create canvas for charting library
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'chart-canvas';
    wrapper.appendChild(this.canvas);
    this.container.appendChild(wrapper);

    // Initialize charting library if available globally
    const ChartLib = this._getGlobalChartLibrary();
    if (ChartLib) {
      try {
        const defaultResponsiveOptions = {
          responsive: true,
          maintainAspectRatio: false,
          ...this.chartOptions
        };

        this.chartInstance = new ChartLib(this.canvas, {
          type: this.type,
          data: this.data,
          options: defaultResponsiveOptions
        });
      } catch (libError) {
        console.error('[Chart] Failed to initialize chart library instance:', libError);
        this.container.textContent = '[Chart Visualization Unavailable]';
      }
    } else {
      // Fallback fallback representation if no global chart library is loaded yet
      const fallbackNotice = document.createElement('div');
      fallbackNotice.className = 'chart-fallback-notice';
      fallbackNotice.textContent = `[Chart: ${this.type.toUpperCase()} — Ready for data visualization]`;
      wrapper.appendChild(fallbackNotice);
    }
  }

  /**
   * Initialize container and event handling (resize observation if needed).
   */
  init() {
    this.render();

    // Setup ResizeObserver if available to handle container resizes gracefully
    if (typeof ResizeObserver !== 'undefined' && this.container) {
      this._resizeObserver = new ResizeObserver(() => {
        if (this.chartInstance && typeof this.chartInstance.resize === 'function') {
          try {
            this.chartInstance.resize();
          } catch (resizeErr) {
            // Ignore minor resize errors
          }
        }
      });
      this._resizeObserver.observe(this.container);
    }
  }

  /**
   * Clean up chart instance, observers, and DOM references.
   */
  destroy() {
    if (this.chartInstance && typeof this.chartInstance.destroy === 'function') {
      try {
        this.chartInstance.destroy();
      } catch (err) {
        console.error('[Chart] Error during chart destruction:', err);
      }
      this.chartInstance = null;
    }

    if (this._resizeObserver && this.container) {
      try {
        this._resizeObserver.unobserve(this.container);
        this._resizeObserver.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      this._resizeObserver = null;
    }

    if (this.container) {
      this.container.innerHTML = '';
    }

    this.canvas = null;
    this.data = { labels: [], datasets: [] };
  }
}

/* ====================================================================
   3. HELPER INITIALIZATION API
   =================================================================== */

/**
 * Create and initialize a chart controller instance.
 * @param {Object} options - Configuration options
 * @returns {ChartController}
 */
export function createChart(options = {}) {
  try {
    const chartController = new ChartController(options);
    console.info('[Chart] Chart component successfully initialized.');
    return chartController;
  } catch (error) {
    console.error('[Chart] Critical error initializing chart component:', error);
    return null;
  }
}

/**
 * Convenience helper to update an existing chart instance with new data.
 * @param {ChartController} instance 
 * @param {Object} data 
 */
export function updateChart(instance, data) {
  if (instance && typeof instance.updateData === 'function') {
    instance.updateData(data);
  } else {
    console.warn('[Chart] Invalid chart instance provided to updateChart.');
  }
}

/**
 * Convenience helper to destroy an existing chart instance safely.
 * @param {ChartController} instance 
 */
export function destroyChart(instance) {
  if (instance && typeof instance.destroy === 'function') {
    instance.destroy();
  }
}