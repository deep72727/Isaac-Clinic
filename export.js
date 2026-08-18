/**
 * ISAAC CLINIC Management Dashboard
 * Centralized Export Utility Layer (javascript/utils/export.js)
 */

'use strict';

/* ====================================================================
   1. INTERNAL UTILITIES & HELPERS
   =================================================================== */

/**
 * Safely access a nested object property via dot notation (e.g., 'patient.contact.phone').
 * @param {Object} obj - Source object
 * @param {string} path - Dot-separated property path
 * @returns {any}
 */
function getNestedValue(obj, path) {
  if (!obj || typeof obj !== 'object' || typeof path !== 'string') return '';
  const keys = path.split('.').filter(Boolean);
  let current = obj;

  for (const key of keys) {
    if (current === null || current === typeof undefined || typeof current !== 'object') {
      return '';
    }
    current = current[key];
  }

  return current !== undefined && current !== null ? current : '';
}

/**
 * Sanitize and format a filename, appending today's date if missing.
 * @param {string} baseName - Base file name
 * @param {string} extension - File extension (e.g., 'csv', 'json')
 * @returns {string}
 */
function generateFilename(baseName, extension) {
  const sanitizedBase = (baseName || 'export')
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_');

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const ext = extension.startsWith('.') ? extension.slice(1) : extension;

  if (sanitizedBase.includes(today)) {
    return `${sanitizedBase}.${ext}`;
  }

  return `${sanitizedBase}-${today}.${ext}`;
}

/**
 * Escape a value for standard CSV format.
 * @param {any} value - Value to escape
 * @returns {string}
 */
function escapeCSVValue(value) {
  if (value === null || value === undefined) return '""';
  
  let stringValue = '';
  if (typeof value === 'object') {
    try {
      stringValue = JSON.stringify(value);
    } catch (e) {
      stringValue = String(value);
    }
  } else {
    stringValue = String(value);
  }

  // Escape double quotes by doubling them, then wrap in double quotes
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}


/* ====================================================================
   2. CLIENT-SIDE FILE DOWNLOAD UTILITY
   =================================================================== */

/**
 * Safely trigger a browser file download using a Blob and Object URL.
 * @param {string} content - File content string
 * @param {string} filename - Target filename
 * @param {string} mimeType - MIME type (e.g., 'text/csv;charset=utf-8;')
 * @returns {boolean} Success status
 */
export function downloadFile(content, filename, mimeType = 'text/plain;charset=utf-8;') {
  try {
    if (!content && content !== '') {
      console.warn('[Export] Cannot download empty content.');
      return false;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Clean up DOM and revoke object URL
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 100);

    return true;
  } catch (error) {
    console.error('[Export] Failed to trigger file download:', error);
    return false;
  }
}


/* ====================================================================
   3. CSV CONVERSION & EXPORT
   =================================================================== */

/**
 * Convert an array of data objects into a CSV string based on column definitions.
 * 
 * @param {Array<Object>} data - Array of record objects
 * @param {Array<{key: string, label: string, formatter?: Function}>} columns - Column configuration
 * @returns {string} Formatted CSV string
 */
export function convertToCSV(data, columns) {
  if (!Array.isArray(data) || data.length === 0 || !Array.isArray(columns) || columns.length === 0) {
    return '';
  }

  try {
    const headerRow = columns.map(col => escapeCSVValue(col.label || col.key)).join(',');
    const rows = [headerRow];

    for (const item of data) {
      const rowValues = columns.map(col => {
        let rawValue = getNestedValue(item, col.key);

        if (typeof col.formatter === 'function') {
          try {
            rawValue = col.formatter(rawValue, item);
          } catch (fmtError) {
            console.error(`[Export] Error in column formatter for "${col.key}":`, fmtError);
          }
        }

        return escapeCSVValue(rawValue);
      });

      rows.push(rowValues.join(','));
    }

    return rows.join('\r\n');
  } catch (error) {
    console.error('[Export] Error converting data to CSV:', error);
    return '';
  }
}

/**
 * Export data array directly to a downloadable CSV file.
 * 
 * @param {Array<Object>} data - Array of record objects
 * @param {Array<{key: string, label: string, formatter?: Function}>} columns - Column configuration
 * @param {string} [filename='isaac-report'] - Output filename base
 * @returns {boolean} Success status
 */
export function exportToCSV(data, columns, filename = 'isaac-report') {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('[Export] exportToCSV: No data provided to export.');
    return false;
  }

  const csvContent = convertToCSV(data, columns);
  if (!csvContent) {
    console.warn('[Export] exportToCSV: Generated CSV content was empty.');
    return false;
  }

  const finalFilename = generateFilename(filename, 'csv');
  return downloadFile(csvContent, finalFilename, 'text/csv;charset=utf-8;');
}


/* ====================================================================
   4. JSON EXPORT
   =================================================================== */

/**
 * Export data array or object directly to a downloadable pretty-printed JSON file.
 * 
 * @param {Object|Array} data - Data to export
 * @param {string} [filename='isaac-data'] - Output filename base
 * @returns {boolean} Success status
 */
export function exportToJSON(data, filename = 'isaac-data') {
  if (data === null || data === undefined) {
    console.warn('[Export] exportToJSON: No data provided to export.');
    return false;
  }

  try {
    const jsonString = JSON.stringify(data, null, 2);
    const finalFilename = generateFilename(filename, 'json');
    return downloadFile(jsonString, finalFilename, 'application/json;charset=utf-8;');
  } catch (error) {
    console.error('[Export] Failed to serialize and export JSON:', error);
    return false;
  }
}


/* ====================================================================
   5. PRINT SUPPORT
   =================================================================== */

/**
 * Trigger browser print dialog for a specific HTML element or selector content 
 * without permanently modifying the application DOM layout.
 * 
 * @param {string|HTMLElement} target - CSS selector string or DOM element to print
 * @param {string} [documentTitle='ISAAC CLINIC Report'] - Title for the print view
 * @returns {boolean} Success status
 */
export function printContent(target, documentTitle = 'ISAAC CLINIC Report') {
  let element = null;

  if (typeof target === 'string') {
    element = document.querySelector(target);
  } else if (target instanceof HTMLElement) {
    element = target;
  }

  if (!element) {
    console.warn('[Export] printContent: Target element not found.', target);
    return false;
  }

  try {
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    if (!printWindow) {
      console.warn('[Export] Pop-up blocked. Unable to open print window.');
      return false;
    }

    // Gather existing stylesheets to maintain design consistency in print preview
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${documentTitle}</title>
        ${stylesheets}
        <style>
          body {
            background-color: #ffffff !important;
            color: #111827 !important;
            padding: 24px;
            font-family: inherit;
          }
          /* Hide interactive or unwanted UI elements inside print area if needed */
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${element.outerHTML}
        </div>
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            window.close();
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
    return true;
  } catch (error) {
    console.error('[Export] Error triggering print output:', error);
    return false;
  }
}