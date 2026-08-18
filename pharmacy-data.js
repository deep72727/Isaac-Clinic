/**
 * @file pharmacy-data.js
 * @description Centralized pharmacy-data layer for the ISAAC CLINIC Management Dashboard.
 * Provides structured fictional pharmacy records, stock inventory, and dispensing operations.
 */

'use strict';

import { validateMedicine } from '../utils/validation.js';
import { getStorageItem, setStorageItem } from '../utils/storage.js';

const MEDICINES_STORAGE_KEY = 'isaac_clinic_medicines';
const DISPENSING_STORAGE_KEY = 'isaac_clinic_dispensing';

/**
 * Initial fictional medicine inventory dataset.
 * @type {Array<Object>}
 */
const initialMedicines = [
    {
        id: 'MED-1001',
        medicineId: 'MED-1001',
        name: 'Paracetamol 500mg',
        genericName: 'Paracetamol',
        category: 'Tablets',
        dosageForm: 'Tablet',
        strength: '500mg',
        unit: 'strip',
        manufacturer: 'PharmaCorp Demo',
        batchNumber: 'BT-9081',
        expiryDate: '2028-12-31',
        purchasePrice: 15.00,
        sellingPrice: 25.00,
        stockQuantity: 250,
        reorderLevel: 50,
        status: 'In Stock'
    },
    {
        id: 'MED-1002',
        medicineId: 'MED-1002',
        name: 'Amoxicillin 250mg',
        genericName: 'Amoxicillin',
        category: 'Capsules',
        dosageForm: 'Capsule',
        strength: '250mg',
        unit: 'strip',
        manufacturer: 'BioHealth Labs',
        batchNumber: 'BT-4412',
        expiryDate: '2027-06-15',
        purchasePrice: 45.00,
        sellingPrice: 70.00,
        stockQuantity: 35,
        reorderLevel: 40,
        status: 'Low Stock'
    },
    {
        id: 'MED-1003',
        medicineId: 'MED-1003',
        name: 'Cough Syrup EX',
        genericName: 'Guaifenesin + Dextromethorphan',
        category: 'Syrup',
        dosageForm: 'Liquid',
        strength: '100ml',
        unit: 'bottle',
        manufacturer: 'MediCure Inc.',
        batchNumber: 'BT-1102',
        expiryDate: '2026-09-30',
        purchasePrice: 80.00,
        sellingPrice: 120.00,
        stockQuantity: 0,
        reorderLevel: 20,
        status: 'Out of Stock'
    },
    {
        id: 'MED-1004',
        medicineId: 'MED-1004',
        name: 'Diclofenac Topical Gel',
        genericName: 'Diclofenac Sodium',
        category: 'Cream',
        dosageForm: 'Gel',
        strength: '1%',
        unit: 'tube',
        manufacturer: 'Relief Pharma',
        batchNumber: 'BT-7731',
        expiryDate: '2026-10-15',
        purchasePrice: 60.00,
        sellingPrice: 95.00,
        stockQuantity: 15,
        reorderLevel: 25,
        status: 'Low Stock'
    },
    {
        id: 'MED-1005',
        medicineId: 'MED-1005',
        name: 'Salbutamol Inhaler',
        genericName: 'Albuterol',
        category: 'Inhaler',
        dosageForm: 'Inhaler',
        strength: '100mcg',
        unit: 'piece',
        manufacturer: 'RespiraCare',
        batchNumber: 'BT-3320',
        expiryDate: '2028-03-31',
        purchasePrice: 180.00,
        sellingPrice: 250.00,
        stockQuantity: 110,
        reorderLevel: 30,
        status: 'In Stock'
    }
];

/**
 * Initial fictional dispensing records dataset.
 * @type {Array<Object>}
 */
const initialDispensingRecords = [
    {
        id: 'DISP-5001',
        dispensingId: 'DISP-5001',
        patientId: 'PAT-501',
        patientName: 'Eleanor Vance',
        medicineId: 'MED-1001',
        medicineName: 'Paracetamol 500mg',
        quantity: 2,
        date: '2026-06-01',
        status: 'Completed'
    },
    {
        id: 'DISP-5002',
        dispensingId: 'DISP-5002',
        patientId: 'PAT-502',
        patientName: 'Marcus Brody',
        medicineId: 'MED-1002',
        medicineName: 'Amoxicillin 250mg',
        quantity: 1,
        date: '2026-06-02',
        status: 'Completed'
    }
];

/**
 * Derives stock status string based on quantity and reorder level.
 * @param {number} quantity 
 * @param {number} reorderLevel 
 * @returns {string} 'Out of Stock' | 'Low Stock' | 'In Stock'
 */
function deriveStockStatus(quantity, reorderLevel) {
    const q = Number(quantity) || 0;
    const r = Number(reorderLevel) || 0;
    if (q === 0) return 'Out of Stock';
    if (q <= r) return 'Low Stock';
    return 'In Stock';
}

/**
 * Loads medicines from storage or initializes with defaults.
 * @returns {Array<Object>}
 */
function loadMedicines() {
    try {
        const stored = getStorageItem(MEDICINES_STORAGE_KEY);
        if (Array.isArray(stored) && stored.length > 0) {
            return stored;
        }
    } catch (e) {
        // Fallback
    }
    saveMedicines(initialMedicines);
    return JSON.parse(JSON.stringify(initialMedicines));
}

/**
 * Persists medicines array to storage.
 * @param {Array<Object>} medicines 
 */
function saveMedicines(medicines) {
    try {
        setStorageItem(MEDICINES_STORAGE_KEY, medicines);
    } catch (e) {
        // Handle storage error
    }
}

/**
 * Loads dispensing records from storage or initializes with defaults.
 * @returns {Array<Object>}
 */
function loadDispensingRecords() {
    try {
        const stored = getStorageItem(DISPENSING_STORAGE_KEY);
        if (Array.isArray(stored)) {
            return stored;
        }
    } catch (e) {
        // Fallback
    }
    saveDispensingRecords(initialDispensingRecords);
    return JSON.parse(JSON.stringify(initialDispensingRecords));
}

/**
 * Persists dispensing records to storage.
 * @param {Array<Object>} records 
 */
function saveDispensingRecords(records) {
    try {
        setStorageItem(DISPENSING_STORAGE_KEY, records);
    } catch (e) {
        // Handle storage error
    }
}

/**
 * Get all medicines.
 * @returns {Array<Object>} Deep copy of all medicine records.
 */
export function getMedicines() {
    return loadMedicines().map(med => ({ ...med }));
}

/**
 * Get a single medicine by ID.
 * @param {string} id 
 * @returns {Object|null} Deep copy of medicine record or null.
 */
export function getMedicineById(id) {
    if (!id) return null;
    const medicines = loadMedicines();
    const found = medicines.find(med => med.id === id || med.medicineId === id);
    return found ? { ...found } : null;
}

/**
 * Add a new medicine record.
 * @param {Object} medicineData 
 * @returns {Object} Created medicine record.
 * @throws {Error} If validation fails or ID is missing/duplicate.
 */
export function addMedicine(medicineData) {
    if (!medicineData) {
        throw new Error('Invalid medicine data provided.');
    }

    const id = medicineData.id || medicineData.medicineId;
    if (!id) {
        throw new Error('Missing medicine ID.');
    }

    const medicines = loadMedicines();
    if (medicines.some(med => med.id === id || med.medicineId === id)) {
        throw new Error(`Duplicate medicine ID: ${id}`);
    }

    const stockQuantity = Number(medicineData.stockQuantity) || 0;
    const reorderLevel = Number(medicineData.reorderLevel) || 10;
    const purchasePrice = Number(medicineData.purchasePrice) || 0;
    const sellingPrice = Number(medicineData.sellingPrice) || 0;

    if (stockQuantity < 0 || purchasePrice < 0 || sellingPrice < 0) {
        throw new Error('Negative values are not permitted for stock quantity or pricing.');
    }

    const status = deriveStockStatus(stockQuantity, reorderLevel);

    const newMedicine = {
        id,
        medicineId: id,
        name: medicineData.name || 'Unknown Medicine',
        genericName: medicineData.genericName || '',
        category: medicineData.category || 'Tablets',
        dosageForm: medicineData.dosageForm || 'Tablet',
        strength: medicineData.strength || '',
        unit: medicineData.unit || 'strip',
        manufacturer: medicineData.manufacturer || 'Demo Manufacturer',
        batchNumber: medicineData.batchNumber || 'BT-0000',
        expiryDate: medicineData.expiryDate || new Date().toISOString().split('T')[0],
        purchasePrice,
        sellingPrice,
        stockQuantity,
        reorderLevel,
        status
    };

    if (typeof validateMedicine === 'function') {
        const validationResult = validateMedicine(newMedicine);
        if (validationResult && validationResult.isValid === false) {
            throw new Error(`Validation failed: ${validationResult.message || 'Invalid medicine details.'}`);
        }
    }

    medicines.push(newMedicine);
    saveMedicines(medicines);

    return { ...newMedicine };
}

/**
 * Update an existing medicine record.
 * @param {string} id 
 * @param {Object} updates 
 * @returns {Object} Updated medicine record.
 * @throws {Error} If medicine not found or update parameters invalid.
 */
export function updateMedicine(id, updates) {
    if (!id) {
        throw new Error('Missing medicine ID for update.');
    }

    if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid update payload.');
    }

    const medicines = loadMedicines();
    const index = medicines.findIndex(med => med.id === id || med.medicineId === id);

    if (index === -1) {
        throw new Error(`Medicine not found: ${id}`);
    }

    const currentMed = medicines[index];
    const stockQuantity = typeof updates.stockQuantity !== 'undefined' ? Number(updates.stockQuantity) : currentMed.stockQuantity;
    const reorderLevel = typeof updates.reorderLevel !== 'undefined' ? Number(updates.reorderLevel) : currentMed.reorderLevel;

    if (stockQuantity < 0) {
        throw new Error('Stock quantity cannot be negative.');
    }

    const status = deriveStockStatus(stockQuantity, reorderLevel);

    const updatedMed = {
        ...currentMed,
        ...updates,
        id: currentMed.id,
        medicineId: currentMed.medicineId,
        stockQuantity,
        reorderLevel,
        status
    };

    if (typeof validateMedicine === 'function') {
        const validationResult = validateMedicine(updatedMed);
        if (validationResult && validationResult.isValid === false) {
            throw new Error(`Validation failed: ${validationResult.message || 'Invalid update parameters.'}`);
        }
    }

    medicines[index] = updatedMed;
    saveMedicines(medicines);

    return { ...updatedMed };
}

/**
 * Delete a medicine record by ID.
 * @param {string} id 
 * @returns {boolean} True if deleted, false if not found.
 */
export function deleteMedicine(id) {
    if (!id) return false;

    const medicines = loadMedicines();
    const filtered = medicines.filter(med => med.id !== id && med.medicineId !== id);

    if (filtered.length === medicines.length) {
        return false;
    }

    saveMedicines(filtered);
    return true;
}

/**
 * Get all dispensing records.
 * @returns {Array<Object>}
 */
export function getDispensingRecords() {
    return loadDispensingRecords().map(rec => ({ ...rec }));
}

/**
 * Get a single dispensing record by ID.
 * @param {string} id 
 * @returns {Object|null}
 */
export function getDispensingRecordById(id) {
    if (!id) return null;
    const records = loadDispensingRecords();
    const found = records.find(rec => rec.id === id || rec.dispensingId === id);
    return found ? { ...found } : null;
}

/**
 * Search medicines by keyword across relevant fields.
 * @param {string} query 
 * @returns {Array<Object>}
 */
export function searchMedicines(query) {
    if (!query || typeof query !== 'string') {
        return getMedicines();
    }

    const lowerQuery = query.toLowerCase().trim();
    const medicines = loadMedicines();

    return medicines
        .filter(med => {
            return (
                (med.medicineId && med.medicineId.toLowerCase().includes(lowerQuery)) ||
                (med.name && med.name.toLowerCase().includes(lowerQuery)) ||
                (med.genericName && med.genericName.toLowerCase().includes(lowerQuery)) ||
                (med.category && med.category.toLowerCase().includes(lowerQuery)) ||
                (med.manufacturer && med.manufacturer.toLowerCase().includes(lowerQuery)) ||
                (med.batchNumber && med.batchNumber.toLowerCase().includes(lowerQuery))
            );
        })
        .map(med => ({ ...med }));
}

/**
 * Generic data-level filtering for medicines.
 * @param {Object} criteria - Filter criteria (category, status, manufacturer).
 * @returns {Array<Object>}
 */
export function filterMedicines(criteria = {}) {
    const medicines = loadMedicines();

    return medicines
        .filter(med => {
            if (criteria.category && med.category !== criteria.category) return false;
            if (criteria.status && med.status !== criteria.status) return false;
            if (criteria.manufacturer && med.manufacturer !== criteria.manufacturer) return false;
            return true;
        })
        .map(med => ({ ...med }));
}

/**
 * Get medicines that are running low on stock.
 * @returns {Array<Object>}
 */
export function getLowStockMedicines() {
    return loadMedicines()
        .filter(med => med.status === 'Low Stock')
        .map(med => ({ ...med }));
}

/**
 * Get medicines that are completely out of stock.
 * @returns {Array<Object>}
 */
export function getOutOfStockMedicines() {
    return loadMedicines()
        .filter(med => med.status === 'Out of Stock')
        .map(med => ({ ...med }));
}

/**
 * Get medicines expiring within a specified number of days relative to a reference date.
 * @param {number} days - Threshold number of days.
 * @param {string} [referenceDateStr] - Optional reference date (YYYY-MM-DD). Defaults to current date.
 * @returns {Array<Object>}
 */
export function getExpiringMedicines(days = 90, referenceDateStr) {
    const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
    if (isNaN(refDate.getTime())) return [];

    const thresholdTime = refDate.getTime() + (Number(days) || 90) * 24 * 60 * 60 * 1000;

    return loadMedicines()
        .filter(med => {
            if (!med.expiryDate) return false;
            const expTime = new Date(med.expiryDate).getTime();
            return !isNaN(expTime) && expTime >= refDate.getTime() && expTime <= thresholdTime;
        })
        .map(med => ({ ...med }));
}

/**
 * Updates stock quantity by a given change amount (positive for restock, negative for reduction).
 * @param {string} medicineId 
 * @param {number} quantityChange 
 * @returns {Object} Updated medicine record.
 * @throws {Error} If medicine not found or resulting stock is invalid.
 */
export function updateStock(medicineId, quantityChange) {
    if (!medicineId) {
        throw new Error('Missing medicine ID for stock update.');
    }

    const change = Number(quantityChange);
    if (isNaN(change)) {
        throw new Error('Invalid quantity change value.');
    }

    const medicines = loadMedicines();
    const index = medicines.findIndex(med => med.id === medicineId || med.medicineId === medicineId);

    if (index === -1) {
        throw new Error(`Medicine not found: ${medicineId}`);
    }

    const med = medicines[index];
    const newQuantity = med.stockQuantity + change;

    if (newQuantity < 0) {
        throw new Error(`Stock update failed: Insufficient stock for ${med.name}. Available: ${med.stockQuantity}, Requested change: ${change}`);
    }

    med.stockQuantity = newQuantity;
    med.status = deriveStockStatus(med.stockQuantity, med.reorderLevel);

    saveMedicines(medicines);
    return { ...med };
}