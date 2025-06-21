'use client';

import { useState } from 'react';
import useSWR from 'swr';
import dayjs from 'dayjs';
import { apiRequest } from '@/lib/api';

// Types for stats data
export interface DailyStats {
  date: string;
  count: number;
}

export interface ResponseTimeStats {
  bucket: string;
  avg: number;
}

export interface TypeStats {
  type: string;
  count: number;
}

export interface StatsData {
  daily: DailyStats[];
  responseTimes: ResponseTimeStats[];
  byType: TypeStats[];
}

export type PeriodDays = 7 | 30 | 90;

/**
 * Custom hook for fetching and managing incident statistics
 * @param days Number of days to fetch stats for (7, 30, or 90)
 */
export const useStats = (initialDays: PeriodDays = 30) => {
  const [days, setDays] = useState<PeriodDays>(initialDays);
  
  // Calculate date range for query params
  const toDate = dayjs().format('YYYY-MM-DD');
  const fromDate = dayjs().subtract(days, 'day').format('YYYY-MM-DD');
  
  // Build query string
  const query = `from=${fromDate}&to=${toDate}`;
  
  // Fetch stats data using SWR
  const { data, error, isLoading, mutate } = useSWR<StatsData>(
    [`/incidents/stats?${query}`, days],
    ([url]) => apiRequest<StatsData>(url),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );
  
  return {
    data,
    error,
    isLoading,
    days,
    setDays,
    refetch: () => mutate(),
  };
};
