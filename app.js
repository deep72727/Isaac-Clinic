/**
 * ISAAC CLINIC Management Dashboard
 * Central Application Entry Point & Bootstrap Layer (javascript/app.js)
 */

'use strict';

import { initHeader } from './components/header.js';
import { initSidebar } from './components/sidebar.js';
import { initDropdowns } from './components/dropdown.js';
import { initToasts } from './components/toast.js';
import { initModals } from './components/modal.js';

import { initDashboard } from './pages/dashboard.js';
import { initPatients } from './pages/patients.js';
import { initAppointments } from './pages/appointments.js';
import { initDoctors } from './pages/doctors.js';
import { initBilling } from './pages/billing.js';
import { initPharmacy } from './pages/pharmacy.js';
import { initLaboratory } from './pages/laboratory.js';
import { initReports } from './pages/reports.js';
import { initSettings } from './pages/settings.js';

const PAGE_MODULES = Object.freeze({
  'index.html': initDashboard,
  'patients.html': initPatients,
  'appointments.html': initAppointments,
  'doctors.html': initDoctors,
  'billing.html': initBilling,
  'pharmacy.html': initPharmacy,
  'laboratory.html': initLaboratory,
  'reports.html': initReports,
  'settings.html': initSettings
});

const DEFAULT_PAGE = 'index.html';

class App {
  constructor() {
    this.currentPage = null;
    this.isInitialized = false;
  }

  detectCurrentPage() {
    try {
      const path = window.location.pathname;
      const segments = path.split('/').filter(Boolean);
      const filename = segments.length > 0 ? segments[segments.length - 1] : DEFAULT_PAGE;
      
      if (PAGE_MODULES.hasOwnProperty(filename)) {
        return filename;
      }
      
      // Fallback for root or unrecognized paths
      if (filename === '' || filename === '/') {
        return DEFAULT_PAGE;
      }

      console.warn(`[App] Unrecognized page route: "${filename}". Falling back to default.`);
      return DEFAULT_PAGE;
    } catch (error) {
      console.error('[App] Error detecting current page:', error);
      return DEFAULT_PAGE;
    }
  }

  safeExecute(name, fn, ...args) {
    try {
      if (typeof fn === 'function') {
        return fn(...args);
      }
    } catch (error) {
      console.error(`[App] Error initializing ${name}:`, error);
    }
    return null;
  }

  initComponents() {
    this.safeExecute('Header', initHeader);
    this.safeExecute('Sidebar', initSidebar);
    this.safeExecute('Dropdowns', initDropdowns);
    this.safeExecute('Toasts', initToasts);
    this.safeExecute('Modals', initModals);
  }

  async initPageModule(pageKey) {
    const pageInitializer = PAGE_MODULES[pageKey];
    if (pageInitializer) {
      console.info(`[App] Initializing page module for: ${pageKey}`);
      await this.safeExecute(`Page Module (${pageKey})`, pageInitializer);
    } else {
      console.warn(`[App] No page module found registered for: ${pageKey}`);
    }
  }

  attachGlobalEvents() {
    try {
      // Global error handling or window level events can go here
      window.addEventListener('unhandledrejection', (event) => {
        console.error('[App] Unhandled Promise Rejection:', event.reason);
      });
    } catch (error) {
      console.error('[App] Error attaching global events:', error);
    }
  }

  async start() {
    if (this.isInitialized) {
      console.warn('[App] Application already initialized.');
      return;
    }

    const runBootstrap = async () => {
      try {
        console.info('[App] Starting ISAAC CLINIC Dashboard bootstrap...');
        
        this.currentPage = this.detectCurrentPage();
        
        // Initialize shared framework components
        this.initComponents();
        
        // Initialize page-specific logic asynchronously if supported
        await this.initPageModule(this.currentPage);
        
        // Attach application-level event listeners
        this.attachGlobalEvents();
        
        this.isInitialized = true;
        console.info('[App] Application successfully initialized and ready.');
      } catch (error) {
        console.error('[App] Critical error during application startup:', error);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runBootstrap, { once: true });
    } else {
      await runBootstrap();
    }
  }
}

// Instantiate and start application
const app = new App();
app.start();

export default app;