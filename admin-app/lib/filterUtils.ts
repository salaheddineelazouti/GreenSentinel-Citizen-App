/**
 * Utilities for handling filter conversions between different formats
 */

import { IncidentFilters, IncidentState } from './api';
import { Filters, defaultFilters } from './filters';

/**
 * Convert IncidentFilters from API format to Filters format used in export
 * @param incidentFilters API filters format
 * @returns Filters format for export
 */
export function convertToExportFilters(incidentFilters: IncidentFilters = {}): Filters {
  // Start with default filters
  const exportFilters: Filters = { ...defaultFilters };

  // Convert from and to dates
  if (incidentFilters.dateFrom) {
    exportFilters.fromDate = new Date(incidentFilters.dateFrom);
  }

  if (incidentFilters.dateTo) {
    exportFilters.toDate = new Date(incidentFilters.dateTo);
  }

  // Convert status to state if present
  if (incidentFilters.status) {
    // Handle status mapping - this depends on how your app maps between these
    // For now, we'll just use an empty array since status doesn't map directly to states
    exportFilters.states = [];
  }

  // Handle priority mapping to severity if present
  if (incidentFilters.priority) {
    // Map priority to severity: low=1, medium=3, high=5 (example mapping)
    const severityMap: Record<string, number> = {
      'low': 1,
      'medium': 3, 
      'high': 5
    };
    exportFilters.minSeverity = severityMap[incidentFilters.priority] || 1;
  }

  return exportFilters;
}
