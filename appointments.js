/**
 * ISAAC CLINIC — Premium Clinic Management Dashboard
 * Page Module: Appointments (javascript/pages/appointments.js)
 * 
 * Handles all interactive behavior specifically related to the Appointments page,
 * including initialization, list rendering, searching/filtering, creation, editing,
 * cancellation, rescheduling, status updates, detail views, and statistics.
 */

export default class AppointmentsPage {
  constructor() {
    this.initialized = false;
    this.appointments = [];
    this.patients = [];
    this.doctors = [];
    this.currentFilters = {
      search: '',
      date: '',
      doctor: '',
      status: ''
    };
    this.selectedAppointmentId = null;
    this.boundEventListeners = [];
  }

  /**
   * Initialize the Appointments page module.
   */
  init() {
    if (this.initialized) return;

    // Check if the appointments page container/element exists in the DOM
    const pageContainer = document.getElementById('appointments-page') || document.querySelector('.appointments-container');
    if (!pageContainer) return;

    this.cacheDomElements();
    this.loadInitialData();
    this.bindEvents();
    this.initialized = true;
  }

  /**
   * Cache required DOM elements safely.
   */
  cacheDomElements() {
    this.container = document.getElementById('appointments-page') || document.querySelector('.appointments-container');
    this.tableBody = document.getElementById('appointments-table-body') || this.container.querySelector('.appointments-table-body');
    this.searchInput = document.getElementById('appointment-search') || this.container.querySelector('#appointment-search');
    this.dateFilterInput = document.getElementById('filter-date') || this.container.querySelector('#filter-date');
    this.doctorFilterSelect = document.getElementById('filter-doctor') || this.container.querySelector('#filter-doctor');
    this.statusFilterSelect = document.getElementById('filter-status') || this.container.querySelector('#filter-status');
    this.clearFiltersBtn = document.getElementById('clear-filters-btn') || this.container.querySelector('#clear-filters-btn');
    this.addAppointmentBtn = document.getElementById('add-appointment-btn') || this.container.querySelector('#add-appointment-btn');
    
    // Modals
    this.modal = document.getElementById('appointment-modal') || document.getElementById('appointmentModal');
    this.modalForm = document.getElementById('appointment-form') || document.getElementById('appointmentForm');
    this.detailsModal = document.getElementById('appointment-details-modal') || document.getElementById('appointmentDetailsModal');
    this.cancelModal = document.getElementById('appointment-cancel-modal') || document.getElementById('appointmentCancelModal');

    // Statistics elements
    this.stats = {
      total: document.getElementById('stat-total-appointments') || this.container.querySelector('.stat-total'),
      today: document.getElementById('stat-today-appointments') || this.container.querySelector('.stat-today'),
      confirmed: document.getElementById('stat-confirmed-appointments') || this.container.querySelector('.stat-confirmed'),
      pending: document.getElementById('stat-pending-appointments') || this.container.querySelector('.stat-pending'),
      completed: document.getElementById('stat-completed-appointments') || this.container.querySelector('.stat-completed'),
      cancelled: document.getElementById('stat-cancelled-appointments') || this.container.querySelector('.stat-cancelled'),
      noShow: document.getElementById('stat-noshow-appointments') || this.container.querySelector('.stat-noshow')
    };
  }

  /**
   * Load initial data from application state or window globals.
   */
  loadInitialData() {
    try {
      if (window.IsaacApp && typeof window.IsaacApp.getAppointments === 'function') {
        this.appointments = window.IsaacApp.getAppointments() || [];
        this.patients = window.IsaacApp.getPatients ? window.IsaacApp.getPatients() : [];
        this.doctors = window.IsaacApp.getDoctors ? window.IsaacApp.getDoctors() : [];
      } else {
        // Fallback to localStorage or mock data structure if app state isn't directly bound
        const storedAppointments = localStorage.getItem('isaac_appointments');
        this.appointments = storedAppointments ? JSON.parse(storedAppointments) : [];
        this.patients = window.isaacPatients || [];
        this.doctors = window.isaacDoctors || [];
      }
    } catch (error) {
      console.error('Failed to load appointment data:', error);
      this.appointments = [];
      this.showNotification('Error loading appointments data.', 'error');
    }

    this.populateDropdownOptions();
    this.render();
  }

  /**
   * Populate patient and doctor selection dropdowns in forms and filters.
   */
  populateDropdownOptions() {
    if (this.doctorFilterSelect) {
      // Preserve first "All Doctors" option
      const defaultOptionHtml = '<option value="">All Doctors</option>';
      const doctorOptions = this.doctors.map(doc => `<option value="${doc.id}">${doc.name}</option>`).join('');
      this.doctorFilterSelect.innerHTML = defaultOptionHtml + doctorOptions;
    }

    // Populate modal doctor & patient selects if form exists
    if (this.modalForm) {
      const patientSelect = this.modalForm.querySelector('#appointment-patient-id') || this.modalForm.querySelector('[name="patientId"]');
      const doctorSelect = this.modalForm.querySelector('#appointment-doctor-id') || this.modalForm.querySelector('[name="doctorId"]');

      if (patientSelect) {
        patientSelect.innerHTML = '<option value="">Select Patient</option>' + 
          this.patients.map(p => `<option value="${p.id}">${p.name} (${p.contact || p.phone || 'N/A'})</option>`).join('');
      }

      if (doctorSelect) {
        doctorSelect.innerHTML = '<option value="">Select Doctor</option>' + 
          this.doctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty || ''}</option>`).join('');
      }
    }
  }

  /**
   * Bind all necessary DOM event listeners using delegation where appropriate.
   */
  bindEvents() {
    if (!this.container) return;

    // Search input event
    if (this.searchInput) {
      const handleSearch = (e) => {
        this.currentFilters.search = e.target.value.trim().toLowerCase();
        this.render();
      };
      this.searchInput.addEventListener('input', handleSearch);
      this.boundEventListeners.push({ element: this.searchInput, event: 'input', handler: handleSearch });
    }

    // Date filter event
    if (this.dateFilterInput) {
      const handleDateFilter = (e) => {
        this.currentFilters.date = e.target.value;
        this.render();
      };
      this.dateFilterInput.addEventListener('change', handleDateFilter);
      this.boundEventListeners.push({ element: this.dateFilterInput, event: 'change', handler: handleDateFilter });
    }

    // Doctor filter event
    if (this.doctorFilterSelect) {
      const handleDoctorFilter = (e) => {
        this.currentFilters.doctor = e.target.value;
        this.render();
      };
      this.doctorFilterSelect.addEventListener('change', handleDoctorFilter);
      this.boundEventListeners.push({ element: this.doctorFilterSelect, event: 'change', handler: handleDoctorFilter });
    }

    // Status filter event
    if (this.statusFilterSelect) {
      const handleStatusFilter = (e) => {
        this.currentFilters.status = e.target.value;
        this.render();
      };
      this.statusFilterSelect.addEventListener('change', handleStatusFilter);
      this.boundEventListeners.push({ element: this.statusFilterSelect, event: 'change', handler: handleStatusFilter });
    }

    // Clear filters button
    if (this.clearFiltersBtn) {
      const handleClear = () => {
        this.currentFilters = { search: '', date: '', doctor: '', status: '' };
        if (this.searchInput) this.searchInput.value = '';
        if (this.dateFilterInput) this.dateFilterInput.value = '';
        if (this.doctorFilterSelect) this.doctorFilterSelect.value = '';
        if (this.statusFilterSelect) this.statusFilterSelect.value = '';
        this.render();
      };
      this.clearFiltersBtn.addEventListener('click', handleClear);
      this.boundEventListeners.push({ element: this.clearFiltersBtn, event: 'click', handler: handleClear });
    }

    // Add appointment button
    if (this.addAppointmentBtn) {
      const handleAddClick = () => {
        this.openAppointmentModal();
      };
      this.addAppointmentBtn.addEventListener('click', handleAddClick);
      this.boundEventListeners.push({ element: this.addAppointmentBtn, event: 'click', handler: handleAddClick });
    }

    // Table actions event delegation
    if (this.container) {
      const handleTableClick = (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.getAttribute('data-action');
        const appointmentId = target.getAttribute('data-id') || target.closest('tr')?.getAttribute('data-id');

        if (!appointmentId) return;

        switch (action) {
          case 'view':
            this.viewAppointmentDetails(appointmentId);
            break;
          case 'edit':
            this.openAppointmentModal(appointmentId);
            break;
          case 'confirm':
            this.updateAppointmentStatus(appointmentId, 'Confirmed');
            break;
          case 'check-in':
            this.updateAppointmentStatus(appointmentId, 'Checked In');
            break;
          case 'start-progress':
            this.updateAppointmentStatus(appointmentId, 'In Progress');
            break;
          case 'complete':
            this.updateAppointmentStatus(appointmentId, 'Completed');
            break;
          case 'reschedule':
            this.openRescheduleModal(appointmentId);
            break;
          case 'cancel':
            this.promptCancelAppointment(appointmentId);
            break;
          default:
            break;
        }
      };
      this.container.addEventListener('click', handleTableClick);
      this.boundEventListeners.push({ element: this.container, event: 'click', handler: handleTableClick });
    }

    // Modal form submit handler
    if (this.modalForm) {
      const handleFormSubmit = (e) => {
        e.preventDefault();
        this.saveAppointmentForm();
      };
      this.modalForm.addEventListener('submit', handleFormSubmit);
      this.boundEventListeners.push({ element: this.modalForm, event: 'submit', handler: handleFormSubmit });
    }
  }

  /**
   * Filter appointments based on current active filters.
   */
  getFilteredAppointments() {
    return this.appointments.filter(app => {
      // Search term filter (Patient name or Appointment ID)
      if (this.currentFilters.search) {
        const query = this.currentFilters.search;
        const patientMatch = (app.patientName || '').toLowerCase().includes(query);
        const idMatch = (app.id || '').toLowerCase().includes(query);
        const doctorMatch = (app.doctorName || '').toLowerCase().includes(query);
        if (!patientMatch && !idMatch && !doctorMatch) return false;
      }

      // Date filter
      if (this.currentFilters.date && app.date !== this.currentFilters.date) {
        return false;
      }

      // Doctor filter
      if (this.currentFilters.doctor && app.doctorId !== this.currentFilters.doctor) {
        return false;
      }

      // Status filter
      if (this.currentFilters.status && app.status !== this.currentFilters.status) {
        return false;
      }

      return true;
    });
  }

  /**
   * Render appointments list/table and statistics.
   */
  render() {
    this.renderStatistics();
    this.renderTable();
  }

  /**
   * Calculate and update dashboard statistics.
   */
  renderStatistics() {
    const total = this.appointments.length;
    const todayStr = new Date().toISOString().split('T')[0];
    
    let todayCount = 0;
    let confirmedCount = 0;
    let pendingCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let noShowCount = 0;

    this.appointments.forEach(app => {
      if (app.date === todayStr) todayCount++;
      
      switch (app.status) {
        case 'Confirmed':
          confirmedCount++;
          break;
        case 'Scheduled':
        case 'Pending':
          pendingCount++;
          break;
        case 'Completed':
          completedCount++;
          break;
        case 'Cancelled':
          cancelledCount++;
          break;
        case 'No Show':
          noShowCount++;
          break;
        default:
          break;
      }
    });

    if (this.stats.total) this.stats.total.textContent = total;
    if (this.stats.today) this.stats.today.textContent = todayCount;
    if (this.stats.confirmed) this.stats.confirmed.textContent = confirmedCount;
    if (this.stats.pending) this.stats.pending.textContent = pendingCount;
    if (this.stats.completed) this.stats.completed.textContent = completedCount;
    if (this.stats.cancelled) this.stats.cancelled.textContent = cancelledCount;
    if (this.stats.noShow) this.stats.noShow.textContent = noShowCount;
  }

  /**
   * Render the appointments table with filtered results and empty/loading states.
   */
  renderTable() {
    if (!this.tableBody) return;

    const filtered = this.getFilteredAppointments();

    if (filtered.length === 0) {
      this.tableBody.innerHTML = `
        <tr class="empty-state-row">
          <td colspan="7" class="text-center py-5 text-muted">
            <div class="empty-state-content">
              <i class="fas fa-calendar-times fa-2x mb-2"></i>
              <p>No appointments found matching your criteria.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    this.tableBody.innerHTML = filtered.map(app => {
      const statusClass = this.getStatusBadgeClass(app.status);
      const actionButtons = this.getActionButtonsForStatus(app.status, app.id);

      return `
        <tr data-id="${app.id}">
          <td><strong>#${app.id}</strong></td>
          <td>
            <div class="patient-info">
              <span class="patient-name font-weight-medium">${this.escapeHtml(app.patientName || 'Unknown')}</span>
              ${app.contact ? `<small class="d-block text-muted">${this.escapeHtml(app.contact)}</small>` : ''}
            </div>
          </td>
          <td>${this.escapeHtml(app.doctorName || 'Not Assigned')}</td>
          <td>
            <div>${app.date}</div>
            <small class="text-muted">${app.time}</small>
          </td>
          <td>
            <span class="badge ${statusClass}">${app.status}</span>
          </td>
          <td>${this.escapeHtml(app.type || 'Consultation')}</td>
          <td class="text-right">
            <div class="action-buttons dropdown">
              ${actionButtons}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Get CSS class for status badges.
   */
  getStatusBadgeClass(status) {
    switch (status) {
      case 'Confirmed': return 'badge-success bg-success text-white';
      case 'Scheduled': return 'badge-primary bg-primary text-white';
      case 'Checked In': return 'badge-info bg-info text-white';
      case 'In Progress': return 'badge-warning bg-warning text-dark';
      case 'Completed': return 'badge-secondary bg-secondary text-white';
      case 'Cancelled': return 'badge-danger bg-danger text-white';
      case 'No Show': return 'badge-dark bg-dark text-white';
      default: return 'badge-light bg-light text-dark';
    }
  }

  /**
   * Generate appropriate action buttons according to current appointment status.
   */
  getActionButtonsForStatus(status, id) {
    let actions = `<button class="btn btn-sm btn-outline-primary" data-action="view" data-id="${id}" title="View Details"><i class="fas fa-eye"></i></button> `;

    switch (status) {
      case 'Scheduled':
        actions += `
          <button class="btn btn-sm btn-outline-success" data-action="confirm" data-id="${id}" title="Confirm"><i class="fas fa-check"></i></button>
          <button class="btn btn-sm btn-outline-secondary" data-action="edit" data-id="${id}" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-outline-info" data-action="reschedule" data-id="${id}" title="Reschedule"><i class="fas fa-calendar-alt"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-action="cancel" data-id="${id}" title="Cancel"><i class="fas fa-times"></i></button>
        `;
        break;
      case 'Confirmed':
        actions += `
          <button class="btn btn-sm btn-outline-info" data-action="check-in" data-id="${id}" title="Check In"><i class="fas fa-sign-in-alt"></i></button>
          <button class="btn btn-sm btn-outline-secondary" data-action="edit" data-id="${id}" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-outline-info" data-action="reschedule" data-id="${id}" title="Reschedule"><i class="fas fa-calendar-alt"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-action="cancel" data-id="${id}" title="Cancel"><i class="fas fa-times"></i></button>
        `;
        break;
      case 'Checked In':
        actions += `
          <button class="btn btn-sm btn-outline-warning" data-action="start-progress" data-id="${id}" title="Start In Progress"><i class="fas fa-play"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-action="cancel" data-id="${id}" title="Cancel"><i class="fas fa-times"></i></button>
        `;
        break;
      case 'In Progress':
        actions += `
          <button class="btn btn-sm btn-outline-success" data-action="complete" data-id="${id}" title="Mark Completed"><i class="fas fa-check-double"></i></button>
        `;
        break;
      case 'Completed':
      case 'Cancelled':
      case 'No Show':
      default:
        // View details is already included
        break;
    }

    return actions;
  }

  /**
   * Open the appointment creation/editing modal.
   */
  openAppointmentModal(appointmentId = null) {
    if (!this.modalForm) return;

    this.modalForm.reset();
    const modalTitle = this.modal?.querySelector('.modal-title') || this.modal?.querySelector('h3');

    if (appointmentId) {
      const app = this.appointments.find(a => a.id === appointmentId);
      if (!app) return;

      if (modalTitle) modalTitle.textContent = 'Edit Appointment';
      
      // Populate fields
      this.setFormValue('appointment-id', app.id);
      this.setFormValue('appointment-patient-id', app.patientId);
      this.setFormValue('appointment-doctor-id', app.doctorId);
      this.setFormValue('appointment-date', app.date);
      this.setFormValue('appointment-time', app.time);
      this.setFormValue('appointment-type', app.type);
      this.setFormValue('appointment-reason', app.reason);
      this.setFormValue('appointment-notes', app.notes);
    } else {
      if (modalTitle) modalTitle.textContent = 'New Appointment';
      this.setFormValue('appointment-id', '');
      // Set default date to today
      const todayStr = new Date().toISOString().split('T')[0];
      this.setFormValue('appointment-date', todayStr);
    }

    // Show modal using existing global modal mechanism or Bootstrap toggle
    if (window.jQuery && $(this.modal).modal) {
      $(this.modal).modal('show');
    } else if (this.modal) {
      this.modal.classList.add('show', 'active');
      this.modal.style.display = 'block';
      document.body.classList.add('modal-open');
    }
  }

  /**
   * Helper to set form input values safely.
   */
  setFormValue(idOrName, value) {
    const el = this.modalForm.querySelector(`#${idOrName}`) || this.modalForm.querySelector(`[name="${idOrName}"]`);
    if (el) el.value = value || '';
  }

  /**
   * Save appointment from modal form (Create or Update).
   */
  saveAppointmentForm() {
    const idField = this.modalForm.querySelector('#appointment-id') || this.modalForm.querySelector('[name="id"]');
    const patientSelect = this.modalForm.querySelector('#appointment-patient-id') || this.modalForm.querySelector('[name="patientId"]');
    const doctorSelect = this.modalForm.querySelector('#appointment-doctor-id') || this.modalForm.querySelector('[name="doctorId"]');
    const dateInput = this.modalForm.querySelector('#appointment-date') || this.modalForm.querySelector('[name="date"]');
    const timeInput = this.modalForm.querySelector('#appointment-time') || this.modalForm.querySelector('[name="time"]');
    const typeSelect = this.modalForm.querySelector('#appointment-type') || this.modalForm.querySelector('[name="type"]');
    const reasonInput = this.modalForm.querySelector('#appointment-reason') || this.modalForm.querySelector('[name="reason"]');
    const notesInput = this.modalForm.querySelector('#appointment-notes') || this.modalForm.querySelector('[name="notes"]');

    const appointmentId = idField ? idField.value : null;
    const patientId = patientSelect ? patientSelect.value : '';
    const doctorId = doctorSelect ? doctorSelect.value : '';
    const date = dateInput ? dateInput.value : '';
    const time = timeInput ? timeInput.value : '';
    const type = typeSelect ? typeSelect.value : 'Consultation';
    const reason = reasonInput ? reasonInput.value : '';
    const notes = notesInput ? notesInput.value : '';

    // Validation
    if (!patientId || !doctorId || !date || !time) {
      this.showNotification('Please fill in all required fields (Patient, Doctor, Date, Time).', 'error');
      return;
    }

    // Resolve Names
    const patient = this.patients.find(p => p.id === patientId);
    const doctor = this.doctors.find(d => d.id === doctorId);
    const patientName = patient ? patient.name : 'Unknown Patient';
    const doctorName = doctor ? doctor.name : 'Unknown Doctor';
    const contact = patient ? (patient.contact || patient.phone || '') : '';

    // Conflict Check (Prevent duplicate appointment at same date/time for same doctor)
    const conflict = this.appointments.find(a => 
      a.doctorId === doctorId && 
      a.date === date && 
      a.time === time && 
      a.id !== appointmentId && 
      a.status !== 'Cancelled'
    );

    if (conflict) {
      this.showNotification('Conflict error: Doctor already has an appointment at this date and time.', 'error');
      return;
    }

    const now = new Date().toISOString();

    if (appointmentId) {
      // Update existing appointment
      const index = this.appointments.findIndex(a => a.id === appointmentId);
      if (index !== -1) {
        this.appointments[index] = {
          ...this.appointments[index],
          patientId,
          patientName,
          doctorId,
          doctorName,
          date,
          time,
          type,
          reason,
          notes,
          contact,
          updatedAt: now
        };
        this.showNotification('Appointment successfully updated.', 'success');
      }
    } else {
      // Create new appointment
      const newApp = {
        id: 'APT-' + Math.floor(100000 + Math.random() * 900000),
        patientId,
        patientName,
        doctorId,
        doctorName,
        date,
        time,
        type,
        reason,
        notes,
        contact,
        status: 'Scheduled',
        createdAt: now,
        updatedAt: now
      };
      this.appointments.unshift(newApp);
      this.showNotification('Appointment successfully created.', 'success');
    }

    this.persistData();
    this.closeModal();
    this.render();
  }

  /**
   * Update appointment status.
   */
  updateAppointmentStatus(appointmentId, newStatus) {
    const app = this.appointments.find(a => a.id === appointmentId);
    if (!app) return;

    app.status = newStatus;
    app.updatedAt = new Date().toISOString();

    this.persistData();
    this.render();
    this.showNotification(`Appointment #${app.id} status updated to ${newStatus}.`, 'success');
  }

  /**
   * Prompt confirmation before cancelling an appointment.
   */
  promptCancelAppointment(appointmentId) {
    const app = this.appointments.find(a => a.id === appointmentId);
    if (!app) return;

    if (confirm(`Are you sure you want to cancel appointment #${app.id} for ${app.patientName}?`)) {
      this.updateAppointmentStatus(appointmentId, 'Cancelled');
    }
  }

  /**
   * Open reschedule modal or prompt.
   */
  openRescheduleModal(appointmentId) {
    const app = this.appointments.find(a => a.id === appointmentId);
    if (!app) return;

    const newDate = prompt('Enter new appointment date (YYYY-MM-DD):', app.date);
    if (!newDate) return;

    const newTime = prompt('Enter new appointment time (HH:MM):', app.time);
    if (!newTime) return;

    // Validate date/time
    if (!this.isValidDate(newDate) || !newTime) {
      this.showNotification('Invalid date or time format provided.', 'error');
      return;
    }

    // Conflict check
    const conflict = this.appointments.find(a => 
      a.doctorId === app.doctorId && 
      a.date === newDate && 
      a.time === newTime && 
      a.id !== appointmentId && 
      a.status !== 'Cancelled'
    );

    if (conflict) {
      this.showNotification('Conflict error: Doctor is booked at this new date and time.', 'error');
      return;
    }

    app.date = newDate;
    app.time = newTime;
    app.status = 'Rescheduled' in app ? app.status : 'Scheduled';
    app.updatedAt = new Date().toISOString();

    this.persistData();
    this.render();
    this.showNotification(`Appointment #${app.id} successfully rescheduled to ${newDate} ${newTime}.`, 'success');
  }

  /**
   * View appointment details in modal or drawer.
   */
  viewAppointmentDetails(appointmentId) {
    const app = this.appointments.find(a => a.id === appointmentId);
    if (!app) return;

    if (this.detailsModal) {
      const contentEl = this.detailsModal.querySelector('.appointment-details-content') || this.detailsModal.querySelector('.modal-body');
      if (contentEl) {
        contentEl.innerHTML = `
          <div class="appointment-details-grid">
            <p><strong>Appointment ID:</strong> #${app.id}</p>
            <p><strong>Patient Name:</strong> ${this.escapeHtml(app.patientName)}</p>
            <p><strong>Contact:</strong> ${this.escapeHtml(app.contact || 'N/A')}</p>
            <p><strong>Doctor:</strong> ${this.escapeHtml(app.doctorName)}</p>
            <p><strong>Date & Time:</strong> ${app.date} at ${app.time}</p>
            <p><strong>Type:</strong> ${this.escapeHtml(app.type || 'Consultation')}</p>
            <p><strong>Status:</strong> <span class="badge ${this.getStatusBadgeClass(app.status)}">${app.status}</span></p>
            <p><strong>Reason/Purpose:</strong> ${this.escapeHtml(app.reason || 'None specified')}</p>
            <p><strong>Notes:</strong> ${this.escapeHtml(app.notes || 'No notes available')}</p>
            <p><strong>Created At:</strong> ${app.createdAt ? new Date(app.createdAt).toLocaleString() : 'N/A'}</p>
          </div>
        `;
      }

      if (window.jQuery && $(this.detailsModal).modal) {
        $(this.detailsModal).modal('show');
      } else {
        this.detailsModal.classList.add('show', 'active');
        this.detailsModal.style.display = 'block';
        document.body.classList.add('modal-open');
      }
    } else {
      // Fallback alert / details view if modal template not present
      alert(`Appointment Details:\n\nID: #${app.id}\nPatient: ${app.patientName}\nDoctor: ${app.doctorName}\nDate/Time: ${app.date} ${app.time}\nStatus: ${app.status}\nReason: ${app.reason || 'N/A'}`);
    }
  }

  /**
   * Close active modals.
   */
  closeModal() {
    if (window.jQuery && $(this.modal).modal) {
      $(this.modal).modal('hide');
    } else if (this.modal) {
      this.modal.classList.remove('show', 'active');
      this.modal.style.display = 'none';
      document.body.classList.remove('modal-open');
    }
  }

  /**
   * Persist appointments to app state and/or storage.
   */
  persistData() {
    try {
      if (window.IsaacApp && typeof window.IsaacApp.saveAppointments === 'function') {
        window.IsaacApp.saveAppointments(this.appointments);
      } else {
        localStorage.setItem('isaac_appointments', JSON.stringify(this.appointments));
      }
    } catch (error) {
      console.error('Failed to persist appointments data:', error);
    }
  }

  /**
   * Helper utility for notifications using existing global toast/notification system.
   */
  showNotification(message, type = 'success') {
    if (window.IsaacApp && typeof window.IsaacApp.showNotification === 'function') {
      window.IsaacApp.showNotification(message, type);
    } else if (window.showToast) {
      window.showToast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Basic date validation helper.
   */
  isValidDate(dateString) {
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regEx)) return false;
    const d = new Date(dateString);
    const dNum = d.getTime();
    if (!dNum && dNum !== 0) return false;
    return d.toISOString().slice(0, 10) === dateString;
  }

  /**
   * HTML escape helper to prevent XSS.
   */
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Clean up listeners and state when destroying/unmounting module.
   */
  destroy() {
    this.boundEventListeners.forEach(({ element, event, handler }) => {
      if (element && typeof element.removeEventListener === 'function') {
        element.removeEventListener(event, handler);
      }
    });
    this.boundEventListeners = [];
    this.initialized = false;
  }
}