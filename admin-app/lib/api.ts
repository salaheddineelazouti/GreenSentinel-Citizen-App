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
  // CORRECTION: /api/v1 est déjà inclus dans API_BASE, donc ne pas préfixer les endpoints
  // Pour les routes comme /users, transformer en /users/ pour correspondre au routing FastAPI
  // FastAPI route est /api/v1/users/ mais API_BASE=http://localhost:8000/api/v1 déjà
  let cleanEndpoint = endpoint;
  
  // 1. Si l'endpoint commence par /, le supprimer car API_BASE se termine déjà par un /
  if (cleanEndpoint.startsWith('/')) {
    cleanEndpoint = cleanEndpoint.substring(1);
  }
  
  // 2. Si l'endpoint ne contient pas de paramètres de requête et ne se termine pas par /
  // ajouter / à la fin (pour FastAPI qui utilise des trailing slashes)
  if (!cleanEndpoint.includes('?') && !cleanEndpoint.endsWith('/') && !cleanEndpoint.includes('/')) {
    cleanEndpoint = `${cleanEndpoint}/`;
  }
  
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${cleanEndpoint}`;

  // Execute the request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle non-2xx responses
  if (!response.ok) {
    // Si c'est une erreur 404 (Not Found), retourner un objet vide ou un tableau vide
    // pour éviter de casser l'interface et les toasts
    if (response.status === 404) {
      console.warn(`API endpoint ${endpoint} not found, returning empty data`);
      
      // Détecter si on attend un tableau ou un objet unique
      // endpoints pluriels comme /users ou /incidents renvoient généralement des tableaux
      const isListEndpoint = endpoint.endsWith('s') && !endpoint.includes('/');
      return (isListEndpoint ? [] : {}) as T;
    }
    
    // Uniquement pour les autres types d'erreurs, générer une erreur
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
 * Incident state type (used for filtering on map)
 */
export type IncidentState = 'validated_fire' | 'travelling' | 'onsite' | 'finished';

/**
 * Interface for incident data
 */
export interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'new' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  // Date fields - snake_case for API compatibility, camelCase for internal use
  createdAt: string;
  updatedAt: string;
  created_at?: string; // Added for map feature compatibility
  updated_at?: string; // Added for map feature compatibility
  // Location data
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  lat?: number; // Added for map feature compatibility
  lng?: number; // Added for map feature compatibility
  // Personnel
  reportedBy?: string;
  assignedTo?: string;
  responseTime?: number;
  // Map feature fields
  severity: number; // Scale 1-5
  state: IncidentState; // Incident states for map filtering
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
