import { saveAs } from 'file-saver';
import { Filters, buildQueryParams } from './filters';

/**
 * Export types supported by the API
 */
export type ExportFormat = 'csv' | 'json';

/**
 * Fetches and downloads incident data in the specified format
 * 
 * @param format - The export format (csv or json)
 * @param filters - The filters to apply to the export
 * @returns Promise that resolves when export is completed
 */
export const fetchExport = async (format: ExportFormat, filters: Filters): Promise<void> => {
  try {
    // Build API URL with query parameters
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
    const apiUrl = `${baseUrl}/api/v1/incidents/export`;
    
    // Start with format parameter
    const params = new URLSearchParams({ format });
    
    // Add filter parameters
    const queryParams = buildQueryParams(filters);
    
    // Add from date if present
    if (filters.fromDate) {
      params.append('from', filters.fromDate.toISOString().split('T')[0]);
    }
    
    // Add to date if present
    if (filters.toDate) {
      params.append('to', filters.toDate.toISOString().split('T')[0]);
    }
    
    // Add states if present
    if (filters.states && filters.states.length > 0) {
      filters.states.forEach(state => {
        params.append('state', state);
      });
    }
    
    // Fetch the export file
    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': format === 'csv' ? 'text/csv' : 'application/json',
        // The authorization header will be automatically added by the fetch interceptor
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Error exporting incidents: ${response.statusText}`);
    }
    
    // Get the blob data
    const blob = await response.blob();
    
    // Get filename from Content-Disposition header or generate a default one
    const contentDisposition = response.headers.get('content-disposition');
    let filename = '';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    // Use default filename if extraction failed
    if (!filename) {
      const dateStr = new Date().toISOString().split('T')[0];
      filename = `incidents_${dateStr}.${format}`;
    }
    
    // Download the file
    saveAs(blob, filename);
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};
