/**
 * ISAAC CLINIC Management Dashboard
 * Centralized Patient Data Module (javascript/data/patients-data.js)
 */

'use strict';

import { validatePatient, validatePatientUpdates } from '../utils/validation.js';
import { getStorageItem, setStorageItem } from '../utils/storage.js';

/* ====================================================================
   1. CONSTANTS & STORAGE KEYS
   =================================================================== */

const STORAGE_KEY = 'isaac_clinic_patients_data';

const PATIENT_STATUSES = Object.freeze({
  ACTIVE: 'Active',
  INACTIVE: 'Inactive'
});

/* ====================================================================
   2. INITIAL SEED / MOCK DATA (Fictional / Demo Records)
   =================================================================== */

const initialPatientsData = [
  {
    id: 'PT-1001',
    patientId: 'PT-1001',
    firstName: 'Eleanor',
    lastName: 'Vance',
    fullName: 'Eleanor Vance',
    gender: 'Female',
    dateOfBirth: '1988-04-12',
    age: 38,
    phone: '+1-555-0192',
    email: 'eleanor.vance@example.com',
    bloodGroup: 'A+',
    address: '742 Evergreen Terrace',
    city: 'Springfield',
    registrationDate: '2024-01-15',
    status: 'Active',
    emergencyContact: 'Thomas Vance (+1-555-0193)',
    notes: 'Allergic to penicillin. Regular checkups for hypertension.'
  },
  {
    id: 'PT-1002',
    patientId: 'PT-1002',
    firstName: 'Marcus',
    lastName: 'Brody',
    fullName: 'Marcus Brody',
    gender: 'Male',
    dateOfBirth: '1975-09-23',
    age: 50,
    phone: '+1-555-0148',
    email: 'marcus.brody@example.com',
    bloodGroup: 'O+',
    address: '104 West End Avenue',
    city: 'Metropolis',
    registrationDate: '2024-02-10',
    status: 'Active',
    emergencyContact: 'Marion Brody (+1-555-0149)',
    notes: 'History of seasonal asthma. Inhaler prescribed.'
  },
  {
    id: 'PT-1003',
    patientId: 'PT-1003',
    firstName: 'Aisha',
    lastName: 'Patel',
    fullName: 'Aisha Patel',
    gender: 'Female',
    dateOfBirth: '1992-11-05',
    age: 33,
    phone: '+1-555-0185',
    email: 'aisha.patel@example.com',
    bloodGroup: 'B-',
    address: '89 Willow Creek Road',
    city: 'Springfield',
    registrationDate: '2024-03-01',
    status: 'Active',
    emergencyContact: 'Dev Patel (+1-555-0186)',
    notes: 'No known allergies. Annual wellness exam completed.'
  },
  {
    id: 'PT-1004',
    patientId: 'PT-1004',
    firstName: 'Liam',
    lastName: 'O Connor',
    fullName: 'Liam O Connor',
    gender: 'Male',
    dateOfBirth: '1968-07-19',
    age: 57,
    phone: '+1-555-0122',
    email: 'liam.oconnor@example.com',
    bloodGroup: 'AB+',
    address: '45 Clover Lane',
    city: 'Gotham',
    registrationDate: '2023-11-20',
    status: 'Inactive',
    emergencyContact: 'Siobhan O Connor (+1-555-0123)',
    notes: 'Post-knee surgery follow-up completed successfully.'
  },
  {
    id: 'PT-1005',
    patientId: 'PT-1005',
    firstName: 'Sofia',
    lastName: 'Martinez',
    fullName: 'Sofia Martinez',
    gender: 'Female',
    dateOfBirth: '1995-02-14',
    age: 31,
    phone: '+1-555-0177',
    email: 'sofia.martinez@example.com',
    bloodGroup: 'O-',
    address: '320 Maple Drive',
    city: 'Metropolis',
    registrationDate: '2024-04-05',
    status: 'Active',
    emergencyContact: 'Carlos Martinez (+1-555-0178)',
    notes: 'Consultation for dietary counseling.'
  },
  {
    id: 'PT-1006',
    patientId: 'PT-1006',
    firstName: 'Kenji',
    lastName: 'Sato',
    fullName: 'Kenji Sato',
    gender: 'Male',
    dateOfBirth: '1982-12-30',
    age: 43,
    phone: '+1-555-0164',
    email: 'kenji.sato@example.com',
    bloodGroup: 'A-',
    address: '12 Sakura Boulevard',
    city: 'Springfield',
    registrationDate: '2024-05-12',
    status: 'Active',
    emergencyContact: 'Yuki Sato (+1-555-0165)',
    notes: 'Routine lipid panel review.'
  }
];

/* ====================================================================
   3. INTERNAL STATE & PERSISTENCE HELPERS
   =================================================================== */

/**
 * Retrieve current patients array from storage or initialize with seed data.
 * @returns {Array}
 */
function getStoredPatients() {
  try {
    const stored = getStorageItem(STORAGE_KEY);
    if (Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
  } catch (err) {
    console.error('[PatientsData] Error reading from storage utility:', err);
  }
  // Fallback to initial seed data and persist it
  setStoredPatients(initialPatientsData);
  return [...initialPatientsData];
}

/**
 * Save patients array to storage utility.
 * @param {Array} patients 
 */
function setStoredPatients(patients) {
  try {
    setStorageItem(STORAGE_KEY, patients);
  } catch (err) {
    console.error('[PatientsData] Error writing to storage utility:', err);
  }
}

/**
 * Deep clone / copy patient object to maintain immutability.
 * @param {Object} patient 
 * @returns {Object}
 */
function clonePatient(patient) {
  if (!patient) return null;
  return { ...patient };
}

/* ====================================================================
   4. PUBLIC DATA ACCESS API (Backend-Ready Async Interface)
   =================================================================== */

/**
 * Retrieve all patient records (returns clones).
 * Designed to be safely awaited when transitioning to an asynchronous backend.
 * @returns {Promise<Array>}
 */
export async function getPatients() {
  const patients = getStoredPatients();
  return patients.map(clonePatient);
}

/**
 * Retrieve a single patient record by ID.
 * @param {string} id - Patient ID (e.g., 'PT-1001')
 * @returns {Promise<Object|null>}
 */
export async function getPatientById(id) {
  if (!id) {
    throw new Error('Missing patient ID');
  }
  const patients = getStoredPatients();
  const found = patients.find(p => p.id === id || p.patientId === id);
  if (!found) {
    return null;
  }
  return clonePatient(found);
}

/**
 * Add a new patient record with validation and uniqueness checks.
 * @param {Object} patientData 
 * @returns {Promise<Object>}
 */
export async function addPatient(patientData) {
  if (!patientData || typeof patientData !== 'object') {
    throw new Error('Invalid patient record');
  }

  // Ensure unique ID or generate one if missing
  const patients = getStoredPatients();
  
  if (!patientData.patientId && !patientData.id) {
    const nextIdNum = 1000 + patients.length + 1;
    patientData.patientId = `PT-${nextIdNum}`;
    patientData.id = patientData.patientId;
  } else if (!patientData.id) {
    patientData.id = patientData.patientId;
  } else if (!patientData.patientId) {
    patientData.patientId = patientData.id;
  }

  // Check for duplicate patient ID
  const existingIndex = patients.findIndex(p => p.id === patientData.id || p.patientId === patientData.patientId);
  if (existingIndex !== -1) {
    throw new Error(`Duplicate patient ID: ${patientData.id}`);
  }

  // Construct full name if missing
  if (!patientData.fullName && (patientData.firstName || patientData.lastName)) {
    patientData.fullName = [patientData.firstName, patientData.lastName].filter(Boolean).join(' ');
  }

  // Set default registration date if missing
  if (!patientData.registrationDate) {
    patientData.registrationDate = new Date().toISOString().split('T')[0];
  }

  // Set default status if missing
  if (!patientData.status) {
    patientData.status = PATIENT_STATUSES.ACTIVE;
  }

  // Use centralized validation layer
  const validationResult = validatePatient(patientData);
  if (validationResult && validationResult.isValid === false) {
    throw new Error(`Invalid patient record: ${validationResult.errors ? validationResult.errors.join(', ') : 'Validation failed'}`);
  }

  const newRecord = clonePatient(patientData);
  patients.push(newRecord);
  setStoredPatients(patients);

  return clonePatient(newRecord);
}

/**
 * Update an existing patient record by ID.
 * @param {string} id 
 * @param {Object} updates 
 * @returns {Promise<Object>}
 */
export async function updatePatient(id, updates) {
  if (!id) {
    throw new Error('Missing patient ID');
  }
  if (!updates || typeof updates !== 'object') {
    throw new Error('Invalid updates');
  }

  const patients = getStoredPatients();
  const index = patients.findIndex(p => p.id === id || p.patientId === id);

  if (index === -1) {
    throw new Error(`Patient not found: ${id}`);
  }

  // Validate updates via validation layer
  const updateValidation = validatePatientUpdates(updates);
  if (updateValidation && updateValidation.isValid === false) {
    throw new Error(`Invalid updates: ${updateValidation.errors ? updateValidation.errors.join(', ') : 'Validation failed'}`);
  }

  const currentPatient = patients[index];
  const updatedRecord = {
    ...currentPatient,
    ...updates,
    id: currentPatient.id, // Preserve primary identifier
    patientId: currentPatient.patientId
  };

  // Recalculate fullName if name parts changed
  if (updates.firstName || updates.lastName) {
    updatedRecord.fullName = [updatedRecord.firstName, updatedRecord.lastName].filter(Boolean).join(' ');
  }

  patients[index] = updatedRecord;
  setStoredPatients(patients);

  return clonePatient(updatedRecord);
}

/**
 * Delete a patient record by ID.
 * @param {string} id 
 * @returns {Promise<boolean>}
 */
export async function deletePatient(id) {
  if (!id) {
    throw new Error('Missing patient ID');
  }

  const patients = getStoredPatients();
  const index = patients.findIndex(p => p.id === id || p.patientId === id);

  if (index === -1) {
    throw new Error(`Patient not found: ${id}`);
  }

  patients.splice(index, 1);
  setStoredPatients(patients);

  return true;
}

/* ====================================================================
   5. SEARCH & FILTER UTILITY HELPERS
   =================================================================== */

/**
 * Search patients by query across Patient ID, Name, Phone, and Email.
 * @param {string} query 
 * @returns {Promise<Array>}
 */
export async function searchPatients(query) {
  if (!query || typeof query !== 'string') {
    return getPatients();
  }

  const searchTerm = query.toLowerCase().trim();
  const patients = getStoredPatients();

  const filtered = patients.filter(patient => {
    const pId = (patient.patientId || patient.id || '').toLowerCase();
    const fName = (patient.firstName || '').toLowerCase();
    const lName = (patient.lastName || '').toLowerCase();
    const fullName = (patient.fullName || '').toLowerCase();
    const phone = (patient.phone || '').toLowerCase();
    const email = (patient.email || '').toLowerCase();

    return (
      pId.includes(searchTerm) ||
      fName.includes(searchTerm) ||
      lName.includes(searchTerm) ||
      fullName.includes(searchTerm) ||
      phone.includes(searchTerm) ||
      email.includes(searchTerm)
    );
  });

  return filtered.map(clonePatient);
}

/**
 * Filter patients by criteria (status, gender, bloodGroup, city).
 * @param {Object} filters 
 * @returns {Promise<Array>}
 */
export async function filterPatients(filters = {}) {
  const patients = getStoredPatients();

  const filtered = patients.filter(patient => {
    if (filters.status && patient.status !== filters.status) {
      return false;
    }
    if (filters.gender && patient.gender !== filters.gender) {
      return false;
    }
    if (filters.bloodGroup && patient.bloodGroup !== filters.bloodGroup) {
      return false;
    }
    if (filters.city && patient.city !== filters.city) {
      return false;
    }
    return true;
  });

  return filtered.map(clonePatient);
}