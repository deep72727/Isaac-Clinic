/**
 * @file doctors-data.js
 * @description Centralized doctor-data layer for the ISAAC CLINIC Management Dashboard.
 * Provides structured fictional doctor records and reusable doctor-data operations.
 */

'use strict';

import { validateDoctor } from '../utils/validation.js';
import { getStorageItem, setStorageItem } from '../utils/storage.js';

const STORAGE_KEY = 'isaac_clinic_doctors';

/**
 * Initial fictional doctor dataset for testing and dashboard bootstrap.
 * @type {Array<Object>}
 */
const initialDoctors = [
    {
        id: 'DOC-1001',
        doctorId: 'DOC-1001',
        firstName: 'Robert',
        lastName: 'Chen',
        fullName: 'Dr. Robert Chen',
        gender: 'Male',
        specialization: 'Cardiology',
        department: 'Cardiology',
        qualification: 'MBBS, MD - Cardiology',
        experienceYears: 12,
        phone: '+1-555-0101',
        email: 'robert.chen@isaacclinic.demo',
        consultationFee: 1200,
        availability: {
            monday: ['09:00-13:00', '14:00-17:00'],
            tuesday: ['09:00-13:00'],
            wednesday: ['09:00-13:00', '14:00-17:00'],
            thursday: ['14:00-18:00'],
            friday: ['09:00-14:00'],
            saturday: [],
            sunday: []
        },
        status: 'Active',
        joiningDate: '2020-03-15'
    },
    {
        id: 'DOC-1002',
        doctorId: 'DOC-1002',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        fullName: 'Dr. Sarah Jenkins',
        gender: 'Female',
        specialization: 'Dermatology',
        department: 'Dermatology',
        qualification: 'MBBS, DDVL',
        experienceYears: 8,
        phone: '+1-555-0102',
        email: 'sarah.jenkins@isaacclinic.demo',
        consultationFee: 900,
        availability: {
            monday: ['10:00-15:00'],
            tuesday: ['09:00-13:00', '14:00-16:00'],
            wednesday: ['10:00-15:00'],
            thursday: ['09:00-13:00'],
            friday: ['10:00-14:00'],
            saturday: ['09:00-12:00'],
            sunday: []
        },
        status: 'Active',
        joiningDate: '2021-07-01'
    },
    {
        id: 'DOC-1003',
        doctorId: 'DOC-1003',
        firstName: 'Emily',
        lastName: 'Thorne',
        fullName: 'Dr. Emily Thorne',
        gender: 'Female',
        specialization: 'Pediatrics',
        department: 'Pediatrics',
        qualification: 'MBBS, DCH, MD - Pediatrics',
        experienceYears: 10,
        phone: '+1-555-0103',
        email: 'emily.thorne@isaacclinic.demo',
        consultationFee: 1000,
        availability: {
            monday: ['09:00-14:00'],
            tuesday: ['09:00-14:00'],
            wednesday: ['09:00-14:00'],
            thursday: ['09:00-14:00'],
            friday: ['09:00-13:00'],
            saturday: [],
            sunday: []
        },
        status: 'Active',
        joiningDate: '2019-11-10'
    },
    {
        id: 'DOC-1004',
        doctorId: 'DOC-1004',
        firstName: 'James',
        lastName: 'Wilson',
        fullName: 'Dr. James Wilson',
        gender: 'Male',
        specialization: 'Orthopedics',
        department: 'Orthopedics',
        qualification: 'MBBS, MS - Orthopedics',
        experienceYears: 15,
        phone: '+1-555-0104',
        email: 'james.wilson@isaacclinic.demo',
        consultationFee: 1500,
        availability: {
            monday: ['13:00-18:00'],
            tuesday: ['13:00-18:00'],
            wednesday: ['13:00-18:00'],
            thursday: ['13:00-18:00'],
            friday: ['13:00-17:00'],
            saturday: ['09:00-13:00'],
            sunday: []
        },
        status: 'Active',
        joiningDate: '2018-05-20'
    },
    {
        id: 'DOC-1005',
        doctorId: 'DOC-1005',
        firstName: 'Elena',
        lastName: 'Rostova',
        fullName: 'Dr. Elena Rostova',
        gender: 'Female',
        specialization: 'General Medicine',
        department: 'General Medicine',
        qualification: 'MBBS, MRCP',
        experienceYears: 6,
        phone: '+1-555-0105',
        email: 'elena.rostova@isaacclinic.demo',
        consultationFee: 750,
        availability: {
            monday: ['08:00-12:00', '13:00-16:00'],
            tuesday: ['08:00-12:00', '13:00-16:00'],
            wednesday: ['08:00-12:00', '13:00-16:00'],
            thursday: ['08:00-12:00', '13:00-16:00'],
            friday: ['08:00-12:00'],
            saturday: [],
            sunday: []
        },
        status: 'On Leave',
        joiningDate: '2022-01-15'
    }
];

/**
 * Retrieves internal storage or initializes it with default records.
 * @returns {Array<Object>} Deep copy of doctors array.
 */
function loadDoctors() {
    try {
        const stored = getStorageItem(STORAGE_KEY);
        if (Array.isArray(stored) && stored.length > 0) {
            return stored;
        }
    } catch (e) {
        // Fallback if storage fails
    }
    saveDoctors(initialDoctors);
    return [...initialDoctors];
}

/**
 * Persists doctors array to storage.
 * @param {Array<Object>} doctors 
 */
function saveDoctors(doctors) {
    try {
        setStorageItem(STORAGE_KEY, doctors);
    } catch (e) {
        // Handle storage error silently or allow upper layers to catch
    }
}

/**
 * Get all doctors.
 * @returns {Array<Object>} Deep copy of all doctor records.
 */
export function getDoctors() {
    return loadDoctors().map(doc => ({ ...doc, availability: JSON.parse(JSON.stringify(doc.availability || {})) }));
}

/**
 * Get a single doctor by identifier.
 * @param {string} id 
 * @returns {Object|null} Deep copy of doctor record or null if not found.
 */
export function getDoctorById(id) {
    if (!id) return null;
    const doctors = loadDoctors();
    const found = doctors.find(doc => doc.id === id || doc.doctorId === id);
    if (!found) return null;
    return {
        ...found,
        availability: JSON.parse(JSON.stringify(found.availability || {}))
    };
}

/**
 * Add a new doctor record.
 * @param {Object} doctorData 
 * @returns {Object} Created doctor record.
 * @throws {Error} If validation fails or ID is missing/duplicate.
 */
export function addDoctor(doctorData) {
    if (!doctorData) {
        throw new Error('Invalid doctor data provided.');
    }

    const id = doctorData.id || doctorData.doctorId;
    if (!id) {
        throw new Error('Missing doctor ID.');
    }

    if (typeof doctorData.consultationFee !== 'undefined' && (typeof doctorData.consultationFee !== 'number' || doctorData.consultationFee < 0)) {
        throw new Error('Invalid consultation fee. Must be a non-negative number.');
    }

    const doctors = loadDoctors();
    if (doctors.some(doc => doc.id === id || doc.doctorId === id)) {
        throw new Error(`Duplicate doctor ID: ${id}`);
    }

    const firstName = doctorData.firstName || '';
    const lastName = doctorData.lastName || '';
    const fullName = doctorData.fullName || (firstName && lastName ? `Dr. ${firstName} ${lastName}` : 'Dr. Unknown');

    const newDoctor = {
        id,
        doctorId: id,
        firstName,
        lastName,
        fullName,
        gender: doctorData.gender || 'Not Specified',
        specialization: doctorData.specialization || 'General Medicine',
        department: doctorData.department || 'General Medicine',
        qualification: doctorData.qualification || '',
        experienceYears: typeof doctorData.experienceYears === 'number' ? doctorData.experienceYears : 0,
        phone: doctorData.phone || '',
        email: doctorData.email || '',
        consultationFee: typeof doctorData.consultationFee === 'number' ? doctorData.consultationFee : 500,
        availability: doctorData.availability || {
            monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
        },
        status: doctorData.status || 'Active',
        joiningDate: doctorData.joiningDate || new Date().toISOString().split('T')[0]
    };

    if (typeof validateDoctor === 'function') {
        const validationResult = validateDoctor(newDoctor);
        if (validationResult && validationResult.isValid === false) {
            throw new Error(`Validation failed: ${validationResult.message || 'Invalid doctor details.'}`);
        }
    }

    doctors.push(newDoctor);
    saveDoctors(doctors);

    return {
        ...newDoctor,
        availability: JSON.parse(JSON.stringify(newDoctor.availability))
    };
}

/**
 * Update an existing doctor record.
 * @param {string} id 
 * @param {Object} updates 
 * @returns {Object} Updated doctor record.
 * @throws {Error} If doctor not found or update parameters are invalid.
 */
export function updateDoctor(id, updates) {
    if (!id) {
        throw new Error('Missing doctor ID for update.');
    }

    if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid update payload.');
    }

    if (typeof updates.consultationFee !== 'undefined' && (typeof updates.consultationFee !== 'number' || updates.consultationFee < 0)) {
        throw new Error('Invalid consultation fee. Must be a non-negative number.');
    }

    const doctors = loadDoctors();
    const index = doctors.findIndex(doc => doc.id === id || doc.doctorId === id);

    if (index === -1) {
        throw new Error(`Doctor not found: ${id}`);
    }

    const currentDoc = doctors[index];
    const updatedDoc = {
        ...currentDoc,
        ...updates,
        id: currentDoc.id,
        doctorId: currentDoc.doctorId
    };

    // Recalculate fullName if firstName or lastName changes independently
    if (updates.firstName || updates.lastName) {
        const f = updates.firstName || currentDoc.firstName;
        const l = updates.lastName || currentDoc.lastName;
        updatedDoc.fullName = `Dr. ${f} ${l}`;
    }

    if (typeof validateDoctor === 'function') {
        const validationResult = validateDoctor(updatedDoc);
        if (validationResult && validationResult.isValid === false) {
            throw new Error(`Validation failed: ${validationResult.message || 'Invalid update parameters.'}`);
        }
    }

    doctors[index] = updatedDoc;
    saveDoctors(doctors);

    return {
        ...updatedDoc,
        availability: JSON.parse(JSON.stringify(updatedDoc.availability || {}))
    };
}

/**
 * Delete a doctor record by ID.
 * @param {string} id 
 * @returns {boolean} True if deleted, false if not found.
 */
export function deleteDoctor(id) {
    if (!id) return false;

    const doctors = loadDoctors();
    const filtered = doctors.filter(doc => doc.id !== id && doc.doctorId !== id);

    if (filtered.length === doctors.length) {
        return false;
    }

    saveDoctors(filtered);
    return true;
}

/**
 * Search doctors by keyword across relevant fields.
 * @param {string} query 
 * @returns {Array<Object>} Matching doctor records.
 */
export function searchDoctors(query) {
    if (!query || typeof query !== 'string') {
        return getDoctors();
    }

    const lowerQuery = query.toLowerCase().trim();
    const doctors = loadDoctors();

    return doctors
        .filter(doc => {
            return (
                (doc.doctorId && doc.doctorId.toLowerCase().includes(lowerQuery)) ||
                (doc.fullName && doc.fullName.toLowerCase().includes(lowerQuery)) ||
                (doc.firstName && doc.firstName.toLowerCase().includes(lowerQuery)) ||
                (doc.lastName && doc.lastName.toLowerCase().includes(lowerQuery)) ||
                (doc.specialization && doc.specialization.toLowerCase().includes(lowerQuery)) ||
                (doc.department && doc.department.toLowerCase().includes(lowerQuery)) ||
                (doc.qualification && doc.qualification.toLowerCase().includes(lowerQuery))
            );
        })
        .map(doc => ({
            ...doc,
            availability: JSON.parse(JSON.stringify(doc.availability || {}))
        }));
}

/**
 * Generic data-level filtering for doctors.
 * @param {Object} criteria - Filter criteria (specialization, department, status).
 * @returns {Array<Object>} Filtered doctor records.
 */
export function filterDoctors(criteria = {}) {
    const doctors = loadDoctors();

    return doctors
        .filter(doc => {
            if (criteria.specialization && doc.specialization !== criteria.specialization) return false;
            if (criteria.department && doc.department !== criteria.department) return false;
            if (criteria.status && doc.status !== criteria.status) return false;
            return true;
        })
        .map(doc => ({
            ...doc,
            availability: JSON.parse(JSON.stringify(doc.availability || {}))
        }));
}

/**
 * Returns structured availability information for a doctor on a given date.
 * @param {string} doctorId 
 * @param {string} dateStr - Date string in YYYY-MM-DD format.
 * @returns {Object} Availability info containing day of week and time slots.
 */
export function getDoctorAvailability(doctorId, dateStr) {
    const doctor = getDoctorById(doctorId);
    if (!doctor) {
        return { doctorId, date: dateStr, status: 'Not Found', slots: [] };
    }

    if (!dateStr) {
        return { doctorId, date: null, availability: doctor.availability };
    }

    // Determine day of the week from YYYY-MM-DD
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
        return { doctorId, date: dateStr, error: 'Invalid date format', slots: [] };
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dateObj.getDay()];

    const daySlots = doctor.availability && doctor.availability[dayName] ? doctor.availability[dayName] : [];

    return {
        doctorId: doctor.doctorId,
        doctorName: doctor.fullName,
        date: dateStr,
        dayOfWeek: dayName,
        slots: [...daySlots]
    };
}