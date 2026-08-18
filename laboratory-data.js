/**
 * @file laboratory-data.js
 * @description Centralized laboratory-data layer for the ISAAC CLINIC Management Dashboard.
 * Provides structured fictional test catalog and laboratory order tracking.
 */

'use strict';

import { validateLabOrder, validateLabTest } from '../utils/validation.js';
import { getStorageItem, setStorageItem } from '../utils/storage.js';

const TESTS_STORAGE_KEY = 'isaac_clinic_lab_tests';
const ORDERS_STORAGE_KEY = 'isaac_clinic_lab_orders';

/**
 * Initial fictional laboratory test catalog dataset.
 * @type {Array<Object>}
 */
const initialLabTests = [
    {
        id: 'LAB-1001',
        testId: 'LAB-1001',
        name: 'Complete Blood Count (CBC)',
        category: 'Hematology',
        sampleType: 'Whole Blood',
        turnaroundTime: '24 Hours',
        price: 500,
        status: 'Active'
    },
    {
        id: 'LAB-1002',
        testId: 'LAB-1002',
        name: 'Lipid Profile',
        category: 'Biochemistry',
        sampleType: 'Serum',
        turnaroundTime: '24 Hours',
        price: 800,
        status: 'Active'
    },
    {
        id: 'LAB-1003',
        testId: 'LAB-1003',
        name: 'HbA1c (Glycated Hemoglobin)',
        category: 'Biochemistry',
        sampleType: 'Whole Blood',
        turnaroundTime: '48 Hours',
        price: 650,
        status: 'Active'
    },
    {
        id: 'LAB-1004',
        testId: 'LAB-1004',
        name: 'Thyroid Panel (TSH, T3, T4)',
        category: 'Immunology',
        sampleType: 'Serum',
        turnaroundTime: '48 Hours',
        price: 1100,
        status: 'Active'
    },
    {
        id: 'LAB-1005',
        testId: 'LAB-1005',
        name: 'Urinalysis, Routine',
        category: 'Microbiology',
        sampleType: 'Urine',
        turnaroundTime: '12 Hours',
        price: 300,
        status: 'Active'
    }
];

/**
 * Initial fictional laboratory orders dataset.
 * @type {Array<Object>}
 */
const initialLabOrders = [
    {
        id: 'ORD-1001',
        orderId: 'ORD-1001',
        patientId: 'PAT-501',
        patientName: 'Eleanor Vance',
        testId: 'LAB-1002',
        testName: 'Lipid Profile',
        doctorId: 'DOC-1001',
        doctorName: 'Dr. Robert Chen',
        orderDate: '2026-06-01',
        sampleCollectedAt: '2026-06-01 09:30',
        resultDate: '2026-06-02 11:00',
        status: 'Completed',
        priority: 'Routine',
        notes: 'Fast required for 12 hours.',
        result: {
            value: 'Cholesterol: 195 mg/dL',
            unit: 'mg/dL',
            referenceRange: '< 200 mg/dL'
        }
    },
    {
        id: 'ORD-1002',
        orderId: 'ORD-1002',
        patientId: 'PAT-502',
        patientName: 'Marcus Brody',
        testId: 'LAB-1001',
        testName: 'Complete Blood Count (CBC)',
        doctorId: 'DOC-1005',
        doctorName: 'Dr. Elena Rostova',
        orderDate: '2026-06-02',
        sampleCollectedAt: '2026-06-02 10:15',
        resultDate: '',
        status: 'Processing',
        priority: 'Urgent',
        notes: 'Check leukocyte counts.',
        result: null
    },
    {
        id: 'ORD-1003',
        orderId: 'ORD-1003',
        patientId: 'PAT-503',
        patientName: 'Sophia Martinez',
        testId: 'LAB-1003',
        testName: 'HbA1c (Glycated Hemoglobin)',
        doctorId: 'DOC-1003',
        doctorName: 'Dr. Emily Thorne',
        orderDate: '2026-06-03',
        sampleCollectedAt: '',
        resultDate: '',
        status: 'Ordered',
        priority: 'Routine',
        notes: '',
        result: null
    }
];

/**
 * Loads test catalog from storage or initializes with defaults.
 * @returns {Array<Object>}
 */
function loadLabTests() {
    try {
        const stored = getStorageItem(TESTS_STORAGE_KEY);
        if (Array.isArray(stored) && stored.length > 0) {
            return stored;
        }
    } catch (e) {
        // Fallback
    }
    saveLabTests(initialLabTests);
    return JSON.parse(JSON.stringify(initialLabTests));
}

/**
 * Persists test catalog to storage.
 * @param {Array<Object>} tests 
 */
function saveLabTests(tests) {
    try {
        setStorageItem(TESTS_STORAGE_KEY, tests);
    } catch (e) {
        // Handle storage error
    }
}

/**
 * Loads lab orders from storage or initializes with defaults.
 * @returns {Array<Object>}
 */
function loadLabOrders() {
    try {
        const stored = getStorageItem(ORDERS_STORAGE_KEY);
        if (Array.isArray(stored)) {
            return stored;
        }
    } catch (e) {
        // Fallback
    }
    saveLabOrders(initialLabOrders);
    return JSON.parse(JSON.stringify(initialLabOrders));
}

/**
 * Persists lab orders to storage.
 * @param {Array<Object>} orders 
 */
function saveLabOrders(orders) {
    try {
        setStorageItem(ORDERS_STORAGE_KEY, orders);
    } catch (e) {
        // Handle storage error
    }
}

/**
 * Get all laboratory tests in the catalog.
 * @returns {Array<Object>}
 */
export function getLabTests() {
    return loadLabTests().map(test => ({ ...test }));
}

/**
 * Get a single laboratory test by ID.
 * @param {string} id 
 * @returns {Object|null}
 */
export function getLabTestById(id) {
    if (!id) return null;
    const tests = loadLabTests();
    const found = tests.find(test => test.id === id || test.testId === id);
    return found ? { ...found } : null;
}

/**
 * Get all laboratory orders.
 * @returns {Array<Object>}
 */
export function getLabOrders() {
    return loadLabOrders().map(order => JSON.parse(JSON.stringify(order)));
}

/**
 * Get a single laboratory order by ID.
 * @param {string} id 
 * @returns {Object|null}
 */
export function getLabOrderById(id) {
    if (!id) return null;
    const orders = loadLabOrders();
    const found = orders.find(order => order.id === id || order.orderId === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
}

/**
 * Add a new laboratory order.
 * @param {Object} orderData 
 * @returns {Object} Created lab order record.
 * @throws {Error} If validation fails or ID is missing/duplicate.
 */
export function addLabOrder(orderData) {
    if (!orderData) {
        throw new Error('Invalid lab order data provided.');
    }

    const id = orderData.id || orderData.orderId;
    if (!id) {
        throw new Error('Missing lab order ID.');
    }

    const orders = loadLabOrders();
    if (orders.some(order => order.id === id || order.orderId === id)) {
        throw new Error(`Duplicate lab order ID: ${id}`);
    }

    const newOrder = {
        id,
        orderId: id,
        patientId: orderData.patientId || '',
        patientName: orderData.patientName || 'Unknown Patient',
        testId: orderData.testId || '',
        testName: orderData.testName || 'General Laboratory Test',
        doctorId: orderData.doctorId || '',
        doctorName: orderData.doctorName || 'Attending Physician',
        orderDate: orderData.orderDate || new Date().toISOString().split('T')[0],
        sampleCollectedAt: orderData.sampleCollectedAt || '',
        resultDate: orderData.resultDate || '',
        status: orderData.status || 'Ordered',
        priority: orderData.priority || 'Routine',
        notes: orderData.notes || '',
        result: orderData.result || null
    };

    if (typeof validateLabOrder === 'function') {
        const validationResult = validateLabOrder(newOrder);
        if (validationResult && validationResult.isValid === false) {
            throw new Error(`Validation failed: ${validationResult.message || 'Invalid lab order details.'}`);
        }
    }

    orders.push(newOrder);
    saveLabOrders(orders);

    return JSON.parse(JSON.stringify(newOrder));
}

/**
 * Update an existing laboratory order.
 * @param {string} id 
 * @param {Object} updates 
 * @returns {Object} Updated lab order record.
 * @throws {Error} If order not found or update parameters invalid.
 */
export function updateLabOrder(id, updates) {
    if (!id) {
        throw new Error('Missing lab order ID for update.');
    }

    if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid update payload.');
    }

    const orders = loadLabOrders();
    const index = orders.findIndex(order => order.id === id || order.orderId === id);

    if (index === -1) {
        throw new Error(`Laboratory order not found: ${id}`);
    }

    const currentOrder = orders[index];
    const updatedOrder = {
        ...currentOrder,
        ...updates,
        id: currentOrder.id,
        orderId: currentOrder.orderId
    };

    if (typeof validateLabOrder === 'function') {
        const validationResult = validateLabOrder(updatedOrder);
        if (validationResult && validationResult.isValid === false) {
            throw new Error(`Validation failed: ${validationResult.message || 'Invalid update parameters.'}`);
        }
    }

    orders[index] = updatedOrder;
    saveLabOrders(orders);

    return JSON.parse(JSON.stringify(updatedOrder));
}

/**
 * Delete a laboratory order by ID.
 * @param {string} id 
 * @returns {boolean} True if deleted, false if not found.
 */
export function deleteLabOrder(id) {
    if (!id) return false;

    const orders = loadLabOrders();
    const filtered = orders.filter(order => order.id !== id && order.orderId !== id);

    if (filtered.length === orders.length) {
        return false;
    }

    saveLabOrders(filtered);
    return true;
}

/**
 * Search laboratory orders and catalog tests by keyword across relevant fields.
 * @param {string} query 
 * @returns {Array<Object>} Matching lab orders.
 */
export function searchLabOrders(query) {
    if (!query || typeof query !== 'string') {
        return getLabOrders();
    }

    const lowerQuery = query.toLowerCase().trim();
    const orders = loadLabOrders();

    return orders
        .filter(order => {
            return (
                (order.orderId && order.orderId.toLowerCase().includes(lowerQuery)) ||
                (order.testId && order.testId.toLowerCase().includes(lowerQuery)) ||
                (order.testName && order.testName.toLowerCase().includes(lowerQuery)) ||
                (order.patientId && order.patientId.toLowerCase().includes(lowerQuery)) ||
                (order.patientName && order.patientName.toLowerCase().includes(lowerQuery)) ||
                (order.doctorName && order.doctorName.toLowerCase().includes(lowerQuery)) ||
                (order.status && order.status.toLowerCase().includes(lowerQuery))
            );
        })
        .map(order => JSON.parse(JSON.stringify(order)));
}

/**
 * Generic data-level filtering for laboratory orders.
 * @param {Object} criteria - Filter criteria (category, status, priority, orderDate, doctorId).
 * @returns {Array<Object>}
 */
export function filterLabOrders(criteria = {}) {
    const orders = loadLabOrders();

    return orders
        .filter(order => {
            if (criteria.status && order.status !== criteria.status) return false;
            if (criteria.priority && order.priority !== criteria.priority) return false;
            if (criteria.orderDate && order.orderDate !== criteria.orderDate) return false;
            if (criteria.doctorId && order.doctorId !== criteria.doctorId) return false;
            return true;
        })
        .map(order => JSON.parse(JSON.stringify(order)));
}

/**
 * Get pending lab orders (Ordered, Sample Collected, Processing).
 * @returns {Array<Object>}
 */
export function getPendingLabOrders() {
    const pendingStatuses = ['Ordered', 'Sample Collected', 'Processing'];
    return loadLabOrders()
        .filter(order => pendingStatuses.includes(order.status))
        .map(order => JSON.parse(JSON.stringify(order)));
}

/**
 * Get completed lab orders.
 * @returns {Array<Object>}
 */
export function getCompletedLabOrders() {
    return loadLabOrders()
        .filter(order => order.status === 'Completed')
        .map(order => JSON.parse(JSON.stringify(order)));
}

/**
 * Get lab orders by patient ID.
 * @param {string} patientId 
 * @returns {Array<Object>}
 */
export function getLabOrdersByPatient(patientId) {
    if (!patientId) return [];
    return loadLabOrders()
        .filter(order => order.patientId === patientId)
        .map(order => JSON.parse(JSON.stringify(order)));
}

/**
 * Get lab orders by doctor ID.
 * @param {string} doctorId 
 * @returns {Array<Object>}
 */
export function getLabOrdersByDoctor(doctorId) {
    if (!doctorId) return [];
    return loadLabOrders()
        .filter(order => order.doctorId === doctorId)
        .map(order => JSON.parse(JSON.stringify(order)));
}

/**
 * Updates result data for a specific lab order and sets status to Completed.
 * @param {string} orderId 
 * @param {Object} resultData - { value, unit, referenceRange }
 * @returns {Object} Updated lab order record.
 * @throws {Error} If order not found or result data invalid.
 */
export function updateLabResult(orderId, resultData) {
    if (!orderId) {
        throw new Error('Missing lab order ID for result update.');
    }

    if (!resultData || typeof resultData !== 'object') {
        throw new Error('Invalid result data payload.');
    }

    const orders = loadLabOrders();
    const index = orders.findIndex(order => order.id === orderId || order.orderId === orderId);

    if (index === -1) {
        throw new Error(`Laboratory order not found: ${orderId}`);
    }

    const order = orders[index];

    order.result = {
        value: resultData.value || '',
        unit: resultData.unit || '',
        referenceRange: resultData.referenceRange || ''
    };
    order.status = 'Completed';
    if (!order.resultDate) {
        order.resultDate = new Date().toISOString().split('T')[0];
    }

    saveLabOrders(orders);
    return JSON.parse(JSON.stringify(order));
}