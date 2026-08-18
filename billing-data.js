/**
 * @file billing-data.js
 * @description Centralized billing and payment data layer for the ISAAC CLINIC Management Dashboard.
 * Provides structured fictional financial records and reliable financial calculations.
 */

'use strict';

import { validateBilling } from '../utils/validation.js';
import { getStorageItem, setStorageItem } from '../utils/storage.js';

const STORAGE_KEY = 'isaac_clinic_billing';

/**
 * Initial fictional billing dataset for testing and dashboard bootstrap.
 * @type {Array<Object>}
 */
const initialBills = [
    {
        id: 'INV-1001',
        invoiceId: 'INV-1001',
        patientId: 'PAT-501',
        patientName: 'Eleanor Vance',
        appointmentId: 'APT-1001',
        invoiceDate: '2026-06-01',
        dueDate: '2026-06-15',
        items: [
            {
                description: 'Cardiology Consultation',
                quantity: 1,
                unitPrice: 1200,
                amount: 1200
            },
            {
                description: 'ECG Screening',
                quantity: 1,
                unitPrice: 500,
                amount: 500
            }
        ],
        subtotal: 1700,
        discount: 100,
        tax: 120,
        total: 1720,
        amountPaid: 1720,
        balanceDue: 0,
        paymentMethod: 'Card',
        paymentStatus: 'Paid',
        invoiceStatus: 'Paid'
    },
    {
        id: 'INV-1002',
        invoiceId: 'INV-1002',
        patientId: 'PAT-502',
        patientName: 'Marcus Brody',
        appointmentId: 'APT-1002',
        invoiceDate: '2026-06-01',
        dueDate: '2026-06-15',
        items: [
            {
                description: 'Dermatology Consultation',
                quantity: 1,
                unitPrice: 900,
                amount: 900
            }
        ],
        subtotal: 900,
        discount: 0,
        tax: 45,
        total: 945,
        amountPaid: 0,
        balanceDue: 945,
        paymentMethod: 'UPI',
        paymentStatus: 'Pending',
        invoiceStatus: 'Issued'
    },
    {
        id: 'INV-1003',
        invoiceId: 'INV-1003',
        patientId: 'PAT-503',
        patientName: 'Sophia Martinez',
        appointmentId: 'APT-1003',
        invoiceDate: '2026-06-02',
        dueDate: '2026-06-16',
        items: [
            {
                description: 'Pediatric Follow-up',
                quantity: 1,
                unitPrice: 1000,
                amount: 1000
            }
        ],
        subtotal: 1000,
        discount: 50,
        tax: 50,
        total: 1000,
        amountPaid: 1000,
        balanceDue: 0,
        paymentMethod: 'Cash',
        paymentStatus: 'Paid',
        invoiceStatus: 'Paid'
    },
    {
        id: 'INV-1004',
        invoiceId: 'INV-1004',
        patientId: 'PAT-504',
        patientName: 'Liam O’Connor',
        appointmentId: 'APT-1004',
        invoiceDate: '2026-06-03',
        dueDate: '2026-06-17',
        items: [
            {
                description: 'Cardiology Diagnostic Review',
                quantity: 1,
                unitPrice: 1500,
                amount: 1500
            },
            {
                description: 'Blood Lipid Panel',
                quantity: 1,
                unitPrice: 600,
                amount: 600
            }
        ],
        subtotal: 2100,
        discount: 0,
        tax: 105,
        total: 2205,
        amountPaid: 1000,
        balanceDue: 1205,
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'Partially Paid',
        invoiceStatus: 'Issued'
    },
    {
        id: 'INV-1005',
        invoiceId: 'INV-1005',
        patientId: 'PAT-505',
        patientName: 'Aisha Patel',
        appointmentId: 'APT-1005',
        invoiceDate: '2026-05-15',
        dueDate: '2026-05-30',
        items: [
            {
                description: 'Orthopedic Consultation',
                quantity: 1,
                unitPrice: 1500,
                amount: 1500
            }
        ],
        subtotal: 1500,
        discount: 0,
        tax: 75,
        total: 1575,
        amountPaid: 0,
        balanceDue: 1575,
        paymentMethod: 'Card',
        paymentStatus: 'Overdue',
        invoiceStatus: 'Issued'
    }
];

/**
 * Retrieves internal storage or initializes it with default records.
 * @returns {Array<Object>} Deep copy of bills array.
 */
function loadBills() {
    try {
        const stored = getStorageItem(STORAGE_KEY);
        if (Array.isArray(stored) && stored.length > 0) {
            return stored;
        }
    } catch (e) {
        // Fallback if storage fails
    }
    saveBills(initialBills);
    return JSON.parse(JSON.stringify(initialBills));
}

/**
 * Persists bills array to storage.
 * @param {Array<Object>} bills 
 */
function saveBills(bills) {
    try {
        setStorageItem(STORAGE_KEY, bills);
    } catch (e) {
        // Handle storage error silently or allow upper layers to catch
    }
}

/**
 * Ensures numbers are safely rounded to 2 decimal places to avoid floating point precision issues.
 * @param {number} num 
 * @returns {number}
 */
function roundCurrency(num) {
    const val = Number(num);
    if (isNaN(val)) return 0;
    return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates subtotal from line items.
 * @param {Array<Object>} items 
 * @returns {number}
 */
export function calculateSubtotal(items = []) {
    if (!Array.isArray(items) || items.length === 0) {
        return 0;
    }
    const sum = items.reduce((acc, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        return acc + (qty * price);
    }, 0);
    return roundCurrency(sum);
}

/**
 * Calculates complete bill totals including subtotal, discount, tax, total, and balance.
 * @param {Array<Object>} items 
 * @param {number} discount 
 * @param {number} tax 
 * @param {number} amountPaid 
 * @returns {Object} Calculated financial metrics.
 */
export function calculateBillTotals(items = [], discount = 0, tax = 0, amountPaid = 0) {
    const subtotal = calculateSubtotal(items);
    const disc = Math.max(0, Number(discount) || 0);
    const taxAmt = Math.max(0, Number(tax) || 0);
    const paid = Math.max(0, Number(amountPaid) || 0);

    const taxableBase = Math.max(0, subtotal - disc);
    // If tax is interpreted as absolute currency amount or percentage depending on convention, 
    // here we treat tax and discount as direct numeric currency modifiers as per standard invoice structures,
    // or evaluate safely.
    const total = roundCurrency(taxableBase + taxAmt);
    const balanceDue = roundCurrency(Math.max(0, total - paid));

    return {
        subtotal: roundCurrency(subtotal),
        discount: roundCurrency(disc),
        tax: roundCurrency(taxAmt),
        total,
        amountPaid: roundCurrency(paid),
        balanceDue
    };
}

/**
 * Calculates remaining balance due.
 * @param {number} total 
 * @param {number} amountPaid 
 * @returns {number}
 */
export function calculateBalance(total, amountPaid) {
    const t = Math.max(0, Number(total) || 0);
    const p = Math.max(0, Number(amountPaid) || 0);
    return roundCurrency(Math.max(0, t - p));
}

/**
 * Get all billing records.
 * @returns {Array<Object>} Deep copy of all bills.
 */
export function getBills() {
    return loadBills().map(bill => JSON.parse(JSON.stringify(bill)));
}

/**
 * Get a single billing record by ID.
 * @param {string} id 
 * @returns {Object|null} Deep copy of bill or null if not found.
 */
export function getBillById(id) {
    if (!id) return null;
    const bills = loadBills();
    const found = bills.find(b => b.id === id || b.invoiceId === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
}

/**
 * Add a new billing record.
 * @param {Object} billData 
 * @returns {Object} Created billing record.
 * @throws {Error} If validation fails or ID is missing/duplicate.
 */
export function addBill(billData) {
    if (!billData) {
        throw new Error('Invalid billing data provided.');
    }

    const id = billData.id || billData.invoiceId;
    if (!id) {
        throw new Error('Missing invoice ID.');
    }

    const bills = loadBills();
    if (bills.some(b => b.id === id || b.invoiceId === id)) {
        throw new Error(`Duplicate invoice ID: ${id}`);
    }

    const items = Array.isArray(billData.items) ? billData.items.map(item => ({
        description: item.description || 'Medical Service',
        quantity: Number(item.quantity) || 1,
        unitPrice: roundCurrency(item.unitPrice || 0),
        amount: roundCurrency((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0))
    })) : [];

    const discount = Number(billData.discount) || 0;
    const tax = Number(billData.tax) || 0;
    const amountPaid = Number(billData.amountPaid) || 0;

    const totals = calculateBillTotals(items, discount, tax, amountPaid);

    const newBill = {
        id,
        invoiceId: id,
        patientId: billData.patientId || '',
        patientName: billData.patientName || 'Unknown Patient',
        appointmentId: billData.appointmentId || '',
        invoiceDate: billData.invoiceDate || new Date().toISOString().split('T')[0],
        dueDate: billData.dueDate || new Date().toISOString().split('T')[0],
        items,
        ...totals,
        paymentMethod: billData.paymentMethod || 'Cash',
        paymentStatus: billData.paymentStatus || (totals.balanceDue === 0 ? 'Paid' : totals.amountPaid > 0 ? 'Partially Paid' : 'Pending'),
        invoiceStatus: billData.invoiceStatus || 'Issued'
    };

    if (typeof validateBilling === 'function') {
        const validationResult = validateBilling(newBill);
        if (validationResult && validationResult.isValid === false) {
            throw new Error(`Validation failed: ${validationResult.message || 'Invalid billing details.'}`);
        }
    }

    bills.push(newBill);
    saveBills(bills);

    return JSON.parse(JSON.stringify(newBill));
}

/**
 * Update an existing billing record.
 * @param {string} id 
 * @param {Object} updates 
 * @returns {Object} Updated billing record.
 * @throws {Error} If bill not found or update parameters are invalid.
 */
export function updateBill(id, updates) {
    if (!id) {
        throw new Error('Missing invoice ID for update.');
    }

    if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid update payload.');
    }

    const bills = loadBills();
    const index = bills.findIndex(b => b.id === id || b.invoiceId === id);

    if (index === -1) {
        throw new Error(`Billing record not found: ${id}`);
    }

    const currentBill = bills[index];

    // If items, discount, tax, or amountPaid are updated, recalculate financial fields safely
    const items = updates.items ? updates.items.map(item => ({
        description: item.description || 'Medical Service',
        quantity: Number(item.quantity) || 1,
        unitPrice: roundCurrency(item.unitPrice || 0),
        amount: roundCurrency((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0))
    })) : currentBill.items;

    const discount = typeof updates.discount !== 'undefined' ? updates.discount : currentBill.discount;
    const tax = typeof updates.tax !== 'undefined' ? updates.tax : currentBill.tax;
    const amountPaid = typeof updates.amountPaid !== 'undefined' ? updates.amountPaid : currentBill.amountPaid;

    const totals = calculateBillTotals(items, discount, tax, amountPaid);

    const updatedBill = {
        ...currentBill,
        ...updates,
        id: currentBill.id,
        invoiceId: currentBill.invoiceId,
        items,
        ...totals
    };

    // Auto-update payment status if not explicitly overridden and balance changes
    if (!updates.paymentStatus) {
        if (updatedBill.balanceDue === 0) {
            updatedBill.paymentStatus = 'Paid';
        } else if (updatedBill.amountPaid > 0) {
            updatedBill.paymentStatus = 'Partially Paid';
        }
    }

    if (typeof validateBilling === 'function') {
        const validationResult = validateBilling(updatedBill);
        if (validationResult && validationResult.isValid === false) {
            throw new Error(`Validation failed: ${validationResult.message || 'Invalid update parameters.'}`);
        }
    }

    bills[index] = updatedBill;
    saveBills(bills);

    return JSON.parse(JSON.stringify(updatedBill));
}

/**
 * Delete a billing record by ID.
 * @param {string} id 
 * @returns {boolean} True if deleted, false if not found.
 */
export function deleteBill(id) {
    if (!id) return false;

    const bills = loadBills();
    const filtered = bills.filter(b => b.id !== id && b.invoiceId !== id);

    if (filtered.length === bills.length) {
        return false;
    }

    saveBills(filtered);
    return true;
}

/**
 * Get bills associated with a specific patient ID.
 * @param {string} patientId 
 * @returns {Array<Object>}
 */
export function getBillsByPatient(patientId) {
    if (!patientId) return [];
    return loadBills()
        .filter(b => b.patientId === patientId)
        .map(b => JSON.parse(JSON.stringify(b)));
}

/**
 * Get bills issued on a specific date (YYYY-MM-DD).
 * @param {string} date 
 * @returns {Array<Object>}
 */
export function getBillsByDate(date) {
    if (!date) return [];
    return loadBills()
        .filter(b => b.invoiceDate === date)
        .map(b => JSON.parse(JSON.stringify(b)));
}

/**
 * Get bills filtered by payment status.
 * @param {string} status 
 * @returns {Array<Object>}
 */
export function getBillsByPaymentStatus(status) {
    if (!status) return [];
    return loadBills()
        .filter(b => b.paymentStatus === status)
        .map(b => JSON.parse(JSON.stringify(b)));
}

/**
 * Search billing records by keyword across relevant fields.
 * @param {string} query 
 * @returns {Array<Object>}
 */
export function searchBills(query) {
    if (!query || typeof query !== 'string') {
        return getBills();
    }

    const lowerQuery = query.toLowerCase().trim();
    const bills = loadBills();

    return bills
        .filter(b => {
            return (
                (b.invoiceId && b.invoiceId.toLowerCase().includes(lowerQuery)) ||
                (b.patientId && b.patientId.toLowerCase().includes(lowerQuery)) ||
                (b.patientName && b.patientName.toLowerCase().includes(lowerQuery)) ||
                (b.appointmentId && b.appointmentId.toLowerCase().includes(lowerQuery)) ||
                (b.paymentStatus && b.paymentStatus.toLowerCase().includes(lowerQuery)) ||
                (b.paymentMethod && b.paymentMethod.toLowerCase().includes(lowerQuery))
            );
        })
        .map(b => JSON.parse(JSON.stringify(b)));
}

/**
 * Generic filter function for billing records.
 * @param {Object} criteria - Filter criteria (paymentStatus, invoiceStatus, paymentMethod, invoiceDate).
 * @returns {Array<Object>}
 */
export function filterBills(criteria = {}) {
    const bills = loadBills();

    return bills
        .filter(b => {
            if (criteria.paymentStatus && b.paymentStatus !== criteria.paymentStatus) return false;
            if (criteria.invoiceStatus && b.invoiceStatus !== criteria.invoiceStatus) return false;
            if (criteria.paymentMethod && b.paymentMethod !== criteria.paymentMethod) return false;
            if (criteria.invoiceDate && b.invoiceDate !== criteria.invoiceDate) return false;
            return true;
        })
        .map(b => JSON.parse(JSON.stringify(b)));
}