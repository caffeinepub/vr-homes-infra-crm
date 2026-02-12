/**
 * CSV utility functions for exporting data with RFC4180-compliant escaping
 */

/**
 * Escapes a CSV field value according to RFC4180:
 * - Wrap in quotes if contains comma, quote, or newline
 * - Double any quotes inside the value
 */
function escapeCSVField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // Check if field needs quoting (contains comma, quote, newline, or carriage return)
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Escape quotes by doubling them
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return stringValue;
}

/**
 * Converts an array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  headers: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) {
    return headers.map(h => escapeCSVField(h.label)).join(',');
  }
  
  // Create header row
  const headerRow = headers.map(h => escapeCSVField(h.label)).join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(h => escapeCSVField(row[h.key])).join(',');
  });
  
  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * Triggers a browser download of CSV content
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a date-based filename for reports
 */
export function generateReportFilename(reportType: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${reportType}-${year}-${month}-${day}.csv`;
}
