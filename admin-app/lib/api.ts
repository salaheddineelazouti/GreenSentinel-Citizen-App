'use client';

import { getAuthHeader } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.greensentinel.dev';

/**
 * Custom fetch wrapper for API requests with authentication
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // Prepare headers with authentication
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  // Construct full URL if endpoint doesn't start with http
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  // Execute the request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle non-2xx responses
  if (!response.ok) {
    const error = new Error(`API Error: ${response.statusText}`);
    // Try to parse error details
    try {
      const errorData = await response.json();
      (error as any).data = errorData;
    } catch (_) {
      // Ignore JSON parsing errors for error responses
    }
    throw error;
  }

  // Parse JSON response if available
  if (response.headers.get('content-type')?.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return {} as T;
};

/**
 * Interface for incident data
 */
export interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'new' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  reportedBy?: string;
  assignedTo?: string;
  responseTime?: number;
}

/**
 * Interface for incident filter params
 */
export interface IncidentFilters {
  status?: 'new' | 'in_progress' | 'resolved';
  priority?: 'low' | 'medium' | 'high';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Interface for paginated API responses
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Fetch incidents with optional filters
 */
export const getIncidents = async (
  filters?: IncidentFilters
): Promise<PaginatedResponse<Incident>> => {
  // Convert filters to query string
  const queryParams = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const queryString = queryParams.toString();
  const endpoint = `/incidents${queryString ? `?${queryString}` : ''}`;
  
  return await apiRequest<PaginatedResponse<Incident>>(endpoint);
};

/**
 * Fetch a single incident by ID
 */
export const getIncidentById = async (id: string): Promise<Incident> => {
  return await apiRequest<Incident>(`/incidents/${id}`);
};

/**
 * Fetch statistics for incidents
 */
export interface IncidentStats {
  incidentsPerDay: Array<{
    date: string;
    count: number;
  }>;
  averageResponseTime: Array<{
    date: string;
    time: number;
  }>;
}

export const getIncidentStats = async (range: string = '30d'): Promise<IncidentStats> => {
  return await apiRequest<IncidentStats>(`/incidents/stats?range=${range}`);
};

/**
 * Interface for user data
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch users
 */
export const getUsers = async (): Promise<User[]> => {
  return await apiRequest<User[]>('/users');
};

/**
 * Create a new user
 */
export const createUser = async (userData: Partial<User>): Promise<User> => {
  return await apiRequest<User>('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

/**
 * Update a user
 */
export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  return await apiRequest<User>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

/**
 * Delete a user
 */
export const deleteUser = async (id: string): Promise<void> => {
  return await apiRequest<void>(`/users/${id}`, {
    method: 'DELETE',
  });
};
