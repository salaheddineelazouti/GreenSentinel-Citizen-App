'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { Incident, getIncidents } from '@/lib/api';
import { Filters, buildQueryParams } from '@/lib/filters';
import { getIncidentWebSocket } from '@/lib/ws';
import { isClient } from '@/lib/utils';

/**
 * Custom hook to fetch and filter incidents based on provided filters
 * Also handles WebSocket updates if the incident matches the current filter criteria
 */
export const useIncidentsFiltered = (filters: Filters) => {
  const queryParams = useMemo(() => buildQueryParams(filters), [filters]);
  
  // Use SWR for data fetching with filters
  const { data, error, isLoading, mutate } = useSWR(
    ['incidents', queryParams],
    () => getIncidents(queryParams),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const [totalCount, setTotalCount] = useState(0);

  // Update total count whenever data changes
  useEffect(() => {
    if (data) {
      setTotalCount(data.total);
    }
  }, [data]);

  // Helper function to check if an incident matches current filters
  const matchesFilters = useCallback((incident: Incident): boolean => {
    // Check severity
    if (incident.severity < filters.minSeverity) {
      return false;
    }

    // Check states
    if (filters.states.length > 0 && !filters.states.includes(incident.state)) {
      return false;
    }

    // Check date range (if set)
    if (filters.fromDate) {
      // Try to get a valid date from either created_at or createdAt
      let incidentDate: Date;
      if (incident.created_at) {
        incidentDate = new Date(incident.created_at);
      } else if (incident.createdAt) {
        incidentDate = new Date(incident.createdAt);
      } else {
        // If no date is available, default to now (will pass filter)
        incidentDate = new Date();
      }
      
      if (incidentDate < filters.fromDate) {
        return false;
      }
    }

    if (filters.toDate) {
      // Try to get a valid date from either created_at or createdAt
      let incidentDate: Date;
      if (incident.created_at) {
        incidentDate = new Date(incident.created_at);
      } else if (incident.createdAt) {
        incidentDate = new Date(incident.createdAt);
      } else {
        // If no date is available, default to now (will pass filter)
        incidentDate = new Date();
      }
      
      if (incidentDate > filters.toDate) {
        return false;
      }
    }

    return true;
  }, [filters]);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    if (!isClient) return;

    const ws = getIncidentWebSocket();
    if (!ws) return;

    // Connect to WebSocket
    ws.connect();

    // Handle new incident
    const handleCreate = (event: any) => {
      const newIncident = event.payload;
      
      // Check if the new incident matches our filters
      if (matchesFilters(newIncident)) {
        // Update the count and trigger a revalidation
        setTotalCount(prev => prev + 1);
        mutate();
      }
    };

    // Handle updated incident
    const handleUpdate = (event: any) => {
      const updatedIncident = event.payload;
      
      // We need to revalidate regardless of filter match
      // because an incident could have been updated to now match
      // or no longer match our filters
      mutate();
    };

    // Handle deleted incident
    const handleDelete = (event: any) => {
      const deletedIncident = event.payload;
      
      // If the deleted incident matched our filters, decrease count
      if (matchesFilters(deletedIncident)) {
        setTotalCount(prev => Math.max(0, prev - 1));
      }
      mutate();
    };

    // Register event handlers
    ws.on('create', handleCreate);
    ws.on('update', handleUpdate);
    ws.on('delete', handleDelete);

    return () => {
      // Clean up event listeners when component unmounts or filters change
      if (ws) {
        ws.off('create', handleCreate);
        ws.off('update', handleUpdate);
        ws.off('delete', handleDelete);
      }
    };
  }, [mutate, matchesFilters]);

  return {
    incidents: data?.data || [],
    totalCount,
    currentFilters: filters, // Expose the current filters
    error,
    isLoading,
    refetch: () => mutate(),
  };
};
