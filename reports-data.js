/**
 * @file reports-data.js
 * @description Centralized reporting-data layer for the ISAAC CLINIC Management Dashboard.
 * Provides structured, fictional report-ready datasets and reusable reporting aggregations.
 */

'use strict';

import { getPatients } from './patients-data.js';
import { getAppointments } from './appointments-data.js';
import { getDoctors } from './doctors-data.js';
import { getBills } from './billing-data.js';
import { getMedicines, getDispensingRecords } from './pharmacy-data.js';
import { getLabOrders } from './laboratory-data.js';

/**
 * Report definitions catalog metadata.
 * @type {Array<Object>}
 */
const REPORT_DEFINITIONS = [
    {
        id: 'REP-PATIENT',
        name: 'Patient Summary Report',
        category: 'Patient Reports',
        description: 'Aggregates patient registration, active statuses, and demographic distributions.',
        supportedFilters: ['dateRange', 'status', 'gender']
    },
    {
        id: 'REP-APPOINTMENT',
        name: 'Appointment Activity Report',
        category: 'Appointment Reports',
        description: 'Summarizes appointment statuses, department volumes, and doctor distributions.',
        supportedFilters: ['dateRange', 'department', 'doctorId', 'status']
    },
    {
        id: 'REP-REVENUE',
        name: 'Financial Revenue Report',
        category: 'Revenue Reports',
        description: 'Details total revenue, paid amounts, outstanding balances, and payment methods.',
        supportedFilters: ['dateRange', 'paymentStatus', 'paymentMethod']
    },
    {
        id: 'REP-DOCTOR',
        name: 'Doctor Operational Report',
        category: 'Doctor Reports',
        description: 'Evaluates appointment load and completion metrics across clinical personnel.',
        supportedFilters: ['dateRange', 'doctorId', 'department']
    },
    {
        id: 'REP-PHARMACY',
        name: 'Pharmacy Inventory & Dispensing Report',
        category: 'Pharmacy Reports',
        description: 'Monitors stock levels, low-stock alerts, out-of-stock items, and inventory value.',
        supportedFilters: ['category', 'stockStatus']
    },
    {
        id: 'REP-LABORATORY',
        name: 'Laboratory Orders Report',
        category: 'Laboratory Reports',
        description: 'Summarizes test order volumes, completion rates, and test status progression.',
        supportedFilters: ['dateRange', 'status', 'priority']
    }
];

/**
 * Get all available report definitions.
 * @returns {Array<Object>}
 */
export function getReportDefinitions() {
    return JSON.parse(JSON.stringify(REPORT_DEFINITIONS));
}

/**
 * Helper to check if a date string falls within a specified date range (inclusive).
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {boolean}
 */
function isDateInRange(dateStr, startDate, endDate) {
    if (!dateStr) return false;
    if (startDate && dateStr < startDate) return false;
    if (endDate && dateStr > endDate) return false;
    return true;
}

/**
 * Generates patient report dataset and summaries.
 * @param {Object} filters - { startDate, endDate, status, gender }
 * @returns {Object}
 */
export function getPatientReport(filters = {}) {
    const patients = getPatients();
    const { startDate, endDate, status, gender } = filters;

    const filtered = patients.filter(p => {
        if (status && p.status !== status) return false;
        if (gender && p.gender !== gender) return false;
        if ((startDate || endDate) && p.registrationDate && !isDateInRange(p.registrationDate, startDate, endDate)) {
            return false;
        }
        return true;
    });

    const total = filtered.length;
    const active = filtered.filter(p => p.status === 'Active' || !p.status).length;
    const inactive = filtered.filter(p => p.status === 'Inactive').length;

    // Group by registration date for time-series chart readiness
    const dateMap = {};
    filtered.forEach(p => {
        const d = p.registrationDate || 'Unknown';
        dateMap[d] = (dateMap[d] || 0) + 1;
    });

    const series = Object.keys(dateMap).sort().map(date => ({
        date,
        count: dateMap[date]
    }));

    // Breakdown by gender
    const genderMap = {};
    filtered.forEach(p => {
        const g = p.gender || 'Not Specified';
        genderMap[g] = (genderMap[g] || 0) + 1;
    });

    const breakdown = Object.keys(genderMap).map(gender => ({
        category: gender,
        count: genderMap[gender]
    }));

    return {
        summary: {
            total,
            active,
            inactive
        },
        series,
        breakdown,
        rows: JSON.parse(JSON.stringify(filtered))
    };
}

/**
 * Generates appointment report dataset and summaries.
 * @param {Object} filters - { startDate, endDate, department, doctorId, status }
 * @returns {Object}
 */
export function getAppointmentReport(filters = {}) {
    const appointments = getAppointments();
    const { startDate, endDate, department, doctorId, status } = filters;

    const filtered = appointments.filter(a => {
        if (status && a.status !== status) return false;
        if (doctorId && a.doctorId !== doctorId) return false;
        if (department && a.department !== department) return false;
        if ((startDate || endDate) && a.date && !isDateInRange(a.date, startDate, endDate)) {
            return false;
        }
        return true;
    });

    const total = filtered.length;
    const completed = filtered.filter(a => a.status === 'Completed').length;
    const scheduled = filtered.filter(a => a.status === 'Scheduled' || a.status === 'Confirmed').length;
    const cancelled = filtered.filter(a => a.status === 'Cancelled').length;
    const noShow = filtered.filter(a => a.status === 'No-Show').length;

    // Series by date
    const dateMap = {};
    filtered.forEach(a => {
        const d = a.date || 'Unknown';
        dateMap[d] = (dateMap[d] || 0) + 1;
    });

    const series = Object.keys(dateMap).sort().map(date => ({
        date,
        count: dateMap[date]
    }));

    // Breakdown by department
    const deptMap = {};
    filtered.forEach(a => {
        const dept = a.department || 'General';
        deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    const breakdown = Object.keys(deptMap).map(department => ({
        category: department,
        count: deptMap[department]
    }));

    return {
        summary: {
            total,
            completed,
            scheduled,
            cancelled,
            noShow
        },
        series,
        breakdown,
        rows: JSON.parse(JSON.stringify(filtered))
    };
}

/**
 * Generates financial revenue report dataset and summaries.
 * @param {Object} filters - { startDate, endDate, paymentStatus, paymentMethod }
 * @returns {Object}
 */
export function getRevenueReport(filters = {}) {
    const bills = getBills();
    const { startDate, endDate, paymentStatus, paymentMethod } = filters;

    const filtered = bills.filter(b => {
        if (paymentStatus && b.paymentStatus !== paymentStatus) return false;
        if (paymentMethod && b.paymentMethod !== paymentMethod) return false;
        if ((startDate || endDate) && b.invoiceDate && !isDateInRange(b.invoiceDate, startDate, endDate)) {
            return false;
        }
        return true;
    });

    let totalRevenue = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalBalanceDue = 0;

    filtered.forEach(b => {
        totalRevenue += Number(b.total) || 0;
        totalPaid += Number(b.amountPaid) || 0;
        totalBalanceDue += Number(b.balanceDue) || 0;
        if (b.paymentStatus === 'Pending' || b.paymentStatus === 'Overdue') {
            totalPending += Number(b.balanceDue) || Number(b.total) || 0;
        }
    });

    // Series by invoiceDate
    const dateMap = {};
    filtered.forEach(b => {
        const d = b.invoiceDate || 'Unknown';
        dateMap[d] = (dateMap[d] || 0) + (Number(b.total) || 0);
    });

    const series = Object.keys(dateMap).sort().map(date => ({
        date,
        revenue: Math.round((dateMap[date] + Number.EPSILON) * 100) / 100
    }));

    // Breakdown by paymentMethod
    const methodMap = {};
    filtered.forEach(b => {
        const m = b.paymentMethod || 'Cash';
        methodMap[m] = (methodMap[m] || 0) + (Number(b.total) || 0);
    });

    const breakdown = Object.keys(methodMap).map(method => ({
        category: method,
        amount: Math.round((methodMap[method] + Number.EPSILON) * 100) / 100
    }));

    return {
        summary: {
            totalInvoices: filtered.length,
            totalRevenue: Math.round((totalRevenue + Number.EPSILON) * 100) / 100,
            totalPaid: Math.round((totalPaid + Number.EPSILON) * 100) / 100,
            totalPending: Math.round((totalPending + Number.EPSILON) * 100) / 100,
            totalBalanceDue: Math.round((totalBalanceDue + Number.EPSILON) * 100) / 100
        },
        series,
        breakdown,
        rows: JSON.parse(JSON.stringify(filtered))
    };
}

/**
 * Generates doctor operational report dataset and summaries.
 * @param {Object} filters - { startDate, endDate, doctorId, department }
 * @returns {Object}
 */
export function getDoctorReport(filters = {}) {
    const doctors = getDoctors();
    const appointments = getAppointments();
    const { startDate, endDate, doctorId, department } = filters;

    const filteredDoctors = doctors.filter(doc => {
        if (doctorId && doc.id !== doctorId && doc.doctorId !== doctorId) return false;
        if (department && doc.department !== department) return false;
        return true;
    });

    const breakdown = filteredDoctors.map(doc => {
        const docAppts = appointments.filter(a => {
            if (a.doctorId !== doc.id && a.doctorId !== doc.doctorId) return false;
            if ((startDate || endDate) && a.date && !isDateInRange(a.date, startDate, endDate)) {
                return false;
            }
            return true;
        });

        const totalAppts = docAppts.length;
        const completedAppts = docAppts.filter(a => a.status === 'Completed').length;
        const cancelledAppts = docAppts.filter(a => a.status === 'Cancelled').length;

        return {
            doctorId: doc.doctorId || doc.id,
            doctorName: doc.fullName,
            specialization: doc.specialization,
            department: doc.department,
            totalAppointments: totalAppts,
            completedAppointments: completedAppts,
            cancelledAppointments: cancelledAppts
        };
    });

    const totalAppointmentsAll = breakdown.reduce((acc, curr) => acc + curr.totalAppointments, 0);
    const totalCompletedAll = breakdown.reduce((acc, curr) => acc + curr.completedAppointments, 0);

    return {
        summary: {
            totalDoctors: filteredDoctors.length,
            totalAppointments: totalAppointmentsAll,
            completedAppointments: totalCompletedAll
        },
        series: [],
        breakdown,
        rows: breakdown
    };
}

/**
 * Generates pharmacy report dataset and summaries.
 * @param {Object} filters - { category, stockStatus }
 * @returns {Object}
 */
export function getPharmacyReport(filters = {}) {
    const medicines = getMedicines();
    const dispensing = getDispensingRecords();
    const { category, stockStatus } = filters;

    const filteredMeds = medicines.filter(m => {
        if (category && m.category !== category) return false;
        if (stockStatus && m.status !== stockStatus) return false;
        return true;
    });

    const totalMedicines = filteredMeds.length;
    const lowStockCount = filteredMeds.filter(m => m.status === 'Low Stock').length;
    const outOfStockCount = filteredMeds.filter(m => m.status === 'Out of Stock').length;

    let totalInventoryValue = 0;
    filteredMeds.forEach(m => {
        totalInventoryValue += (Number(m.stockQuantity) || 0) * (Number(m.purchasePrice) || 0);
    });

    // Breakdown by category
    const catMap = {};
    filteredMeds.forEach(m => {
        const cat = m.category || 'Tablets';
        catMap[cat] = (catMap[cat] || 0) + (Number(m.stockQuantity) || 0);
    });

    const breakdown = Object.keys(catMap).map(cat => ({
        category: cat,
        totalStock: catMap[cat]
    }));

    return {
        summary: {
            totalMedicines,
            lowStockCount,
            outOfStockCount,
            totalInventoryValue: Math.round((totalInventoryValue + Number.EPSILON) * 100) / 100,
            totalDispensingRecords: dispensing.length
        },
        series: [],
        breakdown,
        rows: JSON.parse(JSON.stringify(filteredMeds))
    };
}

/**
 * Generates laboratory report dataset and summaries.
 * @param {Object} filters - { startDate, endDate, status, priority }
 * @returns {Object}
 */
export function getLaboratoryReport(filters = {}) {
    const labOrders = getLabOrders();
    const { startDate, endDate, status, priority } = filters;

    const filtered = labOrders.filter(o => {
        if (status && o.status !== status) return false;
        if (priority && o.priority !== priority) return false;
        if ((startDate || endDate) && o.orderDate && !isDateInRange(o.orderDate, startDate, endDate)) {
            return false;
        }
        return true;
    });

    const totalOrders = filtered.length;
    const completedOrders = filtered.filter(o => o.status === 'Completed').length;
    const pendingOrders = filtered.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length;
    const cancelledOrders = filtered.filter(o => o.status === 'Cancelled').length;

    // Breakdown by testName / category
    const testMap = {};
    filtered.forEach(o => {
        const testName = o.testName || 'General Test';
        testMap[testName] = (testMap[testName] || 0) + 1;
    });

    const breakdown = Object.keys(testMap).map(testName => ({
        category: testName,
        count: testMap[testName]
    }));

    // Series by orderDate
    const dateMap = {};
    filtered.forEach(o => {
        const d = o.orderDate || 'Unknown';
        dateMap[d] = (dateMap[d] || 0) + 1;
    });

    const series = Object.keys(dateMap).sort().map(date => ({
        date,
        count: dateMap[date]
    }));

    return {
        summary: {
            totalOrders,
            completedOrders,
            pendingOrders,
            cancelledOrders
        },
        series,
        breakdown,
        rows: JSON.parse(JSON.stringify(filtered))
    };
}