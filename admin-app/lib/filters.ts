/**
 * Incident filter types and query builder utilities
 */

import { IncidentState } from './api';
import dayjs from 'dayjs';

export interface Filters {
  fromDate: Date | null;
  toDate: Date | null;
  states: IncidentState[];
  minSeverity: number;
}

export const defaultFilters: Filters = {
  fromDate: null,
  toDate: null,
  states: [],
  minSeverity: 1,
};

/**
 * Convert a date to YYYY-MM-DD format for API queries
 */
export const formatDateForQuery = (date: Date | null): string | undefined => {
  if (!date) return undefined;
  return dayjs(date).format('YYYY-MM-DD');
};

/**
 * Build query parameters from filter state
 */
export const buildQueryParams = (filters: Filters): Record<string, string> => {
  const params: Record<string, string> = {};

  // Add date range if present
  const from = formatDateForQuery(filters.fromDate);
  const to = formatDateForQuery(filters.toDate);

  if (from) params.from = from;
  if (to) params.to = to;

  // Add states if any are selected
  if (filters.states.length > 0) {
    params.states = filters.states.join(',');
  }

  // Add severity filter if greater than default
  if (filters.minSeverity > 1) {
    params.severity_gte = filters.minSeverity.toString();
  }

  return params;
};

/**
 * Check if filters are active (different from default)
 */
export const hasActiveFilters = (filters: Filters): boolean => {
  return (
    !!filters.fromDate ||
    !!filters.toDate ||
    filters.states.length > 0 ||
    filters.minSeverity > defaultFilters.minSeverity
  );
};

/**
 * Count number of active filters
 */
export const countActiveFilters = (filters: Filters): number => {
  let count = 0;
  if (filters.fromDate) count++;
  if (filters.toDate) count++;
  if (filters.states.length > 0) count++;
  if (filters.minSeverity > defaultFilters.minSeverity) count++;
  return count;
};
