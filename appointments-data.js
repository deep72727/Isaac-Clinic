/**
 * @file appointments-data.js
 * @description Centralized appointment-data layer for the ISAAC CLINIC Management Dashboard.
 * Provides structured fictional appointment data and reusable appointment-data operations.
 */

'use strict';

import { validateAppointment } from '../utils/validation.js';
import { getStorageItem, setStorageItem } from '../utils/storage.js';

const STORAGE_KEY = 'isaac_clinic_appointments';

/**
 * Initial fictional appointment dataset for testing and dashboard bootstrap.
 * @type {Array<Object>}
 */
const initialAppointments = [
    {
        id: 'APT-1001',
        appointmentId: 'APT-1001',
        patientId: 'PAT-501',
        patientName: 'Eleanor Vance',
        doctorId: 'DOC-201',
        doctorName: 'Dr. Robert Chen',
        department: 'Cardiology',
        appointmentDate: '2026-06-01',
        appointmentTime: '09:00',
        duration: 30,
        type: 'Consultation',
        status: 'Confirmed',
        reason: 'Routine cardiac check-up and blood pressure monitoring',
        paymentStatus: 'Paid',
        notes: 'Patient requested morning slot.'
    },
    {
        id: 'APT-1002',
        appointmentId: 'APT-1002',
        patientId: 'PAT-502',
        patientName: 'Marcus Brody',
        doctorId: 'DOC-202',
        doctorName: 'Dr. Sarah Jenkins',
        department: 'Dermatology',
        appointmentDate: '2026-06-01',
        appointmentTime: '10:00',
        duration: 20,
        type: 'Check-up',
        status: 'Scheduled',
        reason: 'Persistent skin rash on right forearm',
        paymentStatus: 'Pending',
        notes: ''
    },
    {
        id: 'APT-1003',
        appointmentId: 'APT-1003',
        patientId: 'PAT-503',
        patientName: 'Sophia Martinez',
        doctorId: 'DOC-203',
        doctorName: 'Dr. Emily Thorne',
        department: 'Pediatrics',
        appointmentDate: '2026-06-02',
        appointmentTime: '11:30',
        duration: 30,
        type: 'Follow-up',
        status: 'Completed',
        reason: 'Post-immunization fever check',
        paymentStatus: 'Paid',
        notes: 'All symptoms resolved.'
    },
    {
        id: 'APT-1004',
        appointmentId: 'APT-1004',
        patientId: 'PAT-504',
        patientName: 'Liam O’Connor',
        doctorId: 'DOC-201',
        doctorName: 'Dr. Robert Chen',
        department: 'Cardiology',
        appointmentDate: '2026-06-03',
        appointmentTime: '14:00',
        duration: 45,
        type: 'Diagnostic',
        status: 'Confirmed',
        reason: 'Echocardiogram review',
        paymentStatus: 'Paid',
        notes: 'Bring previous lab results.'
    },
    {
        id: 'APT-1005',
        appointmentId: 'APT-1005',
        patientId: 'PAT-505',
        patientName: 'Aisha Patel',
        doctorId: 'DOC-204',
        doctorName: 'Dr. James Wilson',
        department: 'Orthopedics',
        appointmentDate: '2026-06-03',
        appointmentTime: '15:15',
        duration: 30,
        type: 'Consultation',
        status: 'Cancelled',
        reason: 'Knee joint pain after running',
        paymentStatus: 'Refunded',
        notes: 'Cancelled by patient.'
    },
    {
        id: 'APT-1006',
        appointmentId: 'APT-1006',
        patientId: 'PAT-506',
        patientName: 'Noah Smith',
        doctorId: 'DOC-202',
        doctorName: 'Dr. Sarah Jenkins',
        department: 'Dermatology',
        appointmentDate: '2026-06-04',
        appointmentTime: '09:30',
        duration: 20,
        type: 'Check-up',
        status: 'No Show',
        reason: 'Annual mole mapping',
        paymentStatus: 'Pending',
        notes: 'Did not arrive or call.'
    }
];

/**
 * Retrieves internal storage or initializes it.
 * @returns {Array<Object>} Deep copy of appointments array.
 */
function loadAppointments() {
    try {
        const stored = getStorageItem(STORAGE_KEY);
        if (Array.isArray(stored) && stored.length > 0) {
            return stored;
        }
    } catch (e) {
        // Fallback if storage fails
    }
    // Initialize storage with defaults if empty
    saveAppointments(initialAppointments);
    return [...initialAppointments];
}

/**
 * Persists appointments to storage.
 * @param {Array<Object>} appointments 
 */
function saveAppointments(appointments) {
    try {
        setStorageItem(STORAGE_KEY, appointments);
    } catch (e) {
        // Handle storage error silently or let upper layers handle
    }
}

/**
 * Helper to convert time string (HH:mm) into total minutes from midnight.
 * @param {string} timeStr 
 * @returns {number}
 */
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
}

/**
 * Checks if two time intervals overlap.
 * @param {string} time1 
 * @param {number} duration1 
 * @param {string} time2 
 * @param {number} duration2 
 * @returns {boolean}
 */
function timesOverlap(time1, duration1, time2, duration2) {
    const start1 = timeToMinutes(time1);
    const end1 = start1 + (duration1 || 30);
    const start2 = timeToMinutes(time2);
    const end2 = start2 + (duration2 || 30);

    return Math.max(start1, start2) < Math.min(end1, end2);
}

/**
 * Get all appointments.
 * @returns {Array<Object>} Deep copy of all appointments.
 */
export function getAppointments() {
    return loadAppointments().map(apt => ({ ...apt }));
}

/**
 * Get a single appointment by its unique identifier.
 * @param {string} id 
 * @returns {Object|null} Deep copy of the appointment or null if not found.
 */
export function getAppointmentById(id) {
    if (!id) return null;
    const appointments = loadAppointments();
    const found = appointments.find(apt => apt.id === id || apt.appointmentId === id);
    return found ? { ...found } : null;
}

/**
 * Add a new appointment record.
 * @param {Object} appointmentData 
 * @returns {Object} The created appointment object.
 * @throws {Error} If validation fails or ID is duplicate/missing.
 */
export function addAppointment(appointmentData) {
    if (!appointmentData) {
        throw new Error('Invalid appointment data provided.');
    }

    if (!appointmentData.id && !appointmentData.appointmentId) {
        throw new Error('Missing appointment ID.');
    }

    const id = appointmentData.id || appointmentData.appointmentId;
    const appointments = loadAppointments();

    if (appointments.some(apt => apt.id === id || apt.appointmentId === id)) {
        throw new Error(`Duplicate appointment ID: ${id}`);
    }

    // Prepare complete object
    const newAppointment = {
        id,
        appointmentId: id,
        patientId: appointmentData.patientId || '',
        patientName: appointmentData.patientName || 'Unknown Patient',
        doctorId: appointmentData.doctorId || '',
        doctorName: appointmentData.doctorName || 'Unknown Doctor',
        department: appointmentData.department || 'General',
        appointmentDate: appointmentData.appointmentDate || '',
        appointmentTime: appointmentData.appointmentTime || '',
        duration: appointmentData.duration || 30,
        type: appointmentData.type || 'Consultation',
        status: appointmentData.status || 'Scheduled',
        reason: appointmentData.reason || '',
        paymentStatus: appointmentData.paymentStatus || 'Pending',
        notes: appointmentData.notes || ''
    };

    // Centralized validation if utility is available
    if (typeof validateAppointment === 'function') {
        const validationResult = validateAppointment(newAppointment);
        if (validationResult && validationResult.isValid === false) {
            throw new Error(`Validation failed: ${validationResult.message || 'Invalid appointment details.'}`);
        }
    }

    appointments.push(newAppointment);
    saveAppointments(appointments);

    return { ...newAppointment };
}

/**
 * Update an existing appointment.
 * @param {string} id 
 * @param {Object} updates 
 * @returns {Object} The updated appointment object.
 * @throws {Error} If appointment not found or update is invalid.
 */
export function updateAppointment(id, updates) {
    if (!id) {
        throw new Error('Missing appointment ID for update.');
    }

    if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid update payload.');
    }

    const appointments = loadAppointments();
    const index = appointments.findIndex(apt => apt.id === id || apt.appointmentId === id);

    if (index === -1) {
        throw new Error(`Appointment not found: ${id}`);
    }

    const currentApt = appointments[index];
    const updatedApt = {
        ...currentApt,
        ...updates,
        id: currentApt.id, // Preserve primary identifier
        appointmentId: currentApt.appointmentId
    };

    if (typeof validateAppointment === 'function') {
        const validationResult = validateAppointment(updatedApt);
        if (validationResult && validationResult.isValid === false) {
            throw new Error(`Validation failed: ${validationResult.message || 'Invalid update parameters.'}`);
        }
    }

    appointments[index] = updatedApt;
    saveAppointments(appointments);

    return { ...updatedApt };
}

/**
 * Delete an appointment by ID.
 * @param {string} id 
 * @returns {boolean} True if deleted successfully, false otherwise.
 */
export function deleteAppointment(id) {
    if (!id) return false;

    const appointments = loadAppointments();
    const filtered = appointments.filter(apt => apt.id !== id && apt.appointmentId !== id);

    if (filtered.length === appointments.length) {
        return false; // Not found
    }

    saveAppointments(filtered);
    return true;
}

/**
 * Get appointments filtered by specific date (YYYY-MM-DD).
 * @param {string} date 
 * @returns {Array<Object>}
 */
export function getAppointmentsByDate(date) {
    if (!date) return [];
    return loadAppointments()
        .filter(apt => apt.appointmentDate === date)
        .map(apt => ({ ...apt }));
}

/**
 * Get appointments assigned to a specific doctor ID.
 * @param {string} doctorId 
 * @returns {Array<Object>}
 */
export function getAppointmentsByDoctor(doctorId) {
    if (!doctorId) return [];
    return loadAppointments()
        .filter(apt => apt.doctorId === doctorId)
        .map(apt => ({ ...apt }));
}

/**
 * Get appointments associated with a specific patient ID.
 * @param {string} patientId 
 * @returns {Array<Object>}
 */
export function getAppointmentsByPatient(patientId) {
    if (!patientId) return [];
    return loadAppointments()
        .filter(apt => apt.patientId === patientId)
        .map(apt => ({ ...apt }));
}

/**
 * Search appointments by keyword across multiple fields.
 * @param {string} query 
 * @returns {Array<Object>}
 */
export function searchAppointments(query) {
    if (!query || typeof query !== 'string') {
        return getAppointments();
    }

    const lowerQuery = query.toLowerCase().trim();
    const appointments = loadAppointments();

    return appointments
        .filter(apt => {
            return (
                (apt.appointmentId && apt.appointmentId.toLowerCase().includes(lowerQuery)) ||
                (apt.patientId && apt.patientId.toLowerCase().includes(lowerQuery)) ||
                (apt.patientName && apt.patientName.toLowerCase().includes(lowerQuery)) ||
                (apt.doctorName && apt.doctorName.toLowerCase().includes(lowerQuery)) ||
                (apt.type && apt.type.toLowerCase().includes(lowerQuery)) ||
                (apt.status && apt.status.toLowerCase().includes(lowerQuery)) ||
                (apt.department && apt.department.toLowerCase().includes(lowerQuery))
            );
        })
        .map(apt => ({ ...apt }));
}

/**
 * Generic filter function for appointments.
 * @param {Object} criteria - Filter criteria object (status, doctorId, department, type, appointmentDate).
 * @returns {Array<Object>}
 */
export function filterAppointments(criteria = {}) {
    const appointments = loadAppointments();

    return appointments
        .filter(apt => {
            if (criteria.status && apt.status !== criteria.status) return false;
            if (criteria.doctorId && apt.doctorId !== criteria.doctorId) return false;
            if (criteria.department && apt.department !== criteria.department) return false;
            if (criteria.type && apt.type !== criteria.type) return false;
            if (criteria.appointmentDate && apt.appointmentDate !== criteria.appointmentDate) return false;
            return true;
        })
        .map(apt => ({ ...apt }));
}

/**
 * Lightweight scheduling conflict detection mechanism.
 * Checks if a doctor has an overlapping appointment at the same date and time.
 * @param {Object} appointmentData 
 * @returns {Array<Object>} List of conflicting appointment records.
 */
export function checkSchedulingConflicts(appointmentData) {
    if (!appointmentData || !appointmentData.doctorId || !appointmentData.appointmentDate || !appointmentData.appointmentTime) {
        return [];
    }

    const appointments = loadAppointments();
    const targetDate = appointmentData.appointmentDate;
    const targetDoctor = appointmentData.doctorId;
    const targetTime = appointmentData.appointmentTime;
    const targetDuration = appointmentData.duration || 30;
    const excludeId = appointmentData.id || appointmentData.appointmentId;

    return appointments
        .filter(apt => {
            // Exclude self when updating
            if (excludeId && (apt.id === excludeId || apt.appointmentId === excludeId)) {
                return false;
            }
            // Match same doctor and date
            if (apt.doctorId !== targetDoctor || apt.appointmentDate !== targetDate) {
                return false;
            }
            // Exclude cancelled appointments from conflict logic
            if (apt.status === 'Cancelled') {
                return false;
            }

            // Check time overlap
            return timesOverlap(targetTime, targetDuration, apt.appointmentTime, apt.duration || 30);
        })
        .map(apt => ({ ...apt }));
}