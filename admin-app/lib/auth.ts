'use client';

import { setCookie, deleteCookie, getCookie } from 'cookies-next';

const TOKEN_NAME = 'gs_admin_token';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.greensentinel.dev';

export interface LoginResponse {
  access_token: string;
}

/**
 * Login function - sends credentials to API and stores JWT token in cookie
 */
export const login = async (email: string, password: string): Promise<string> => {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const data = await response.json() as LoginResponse;
  const token = data.access_token;

  // Store token in cookie
  setCookie(TOKEN_NAME, token, {
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
    sameSite: 'strict',
    secure: true, // Only HTTPS
    httpOnly: false, // Accessible from JavaScript
  });

  return token;
};

/**
 * Logout function - removes JWT token from cookies
 */
export const logout = (): void => {
  deleteCookie(TOKEN_NAME, { path: '/' });
  window.location.href = '/login';
};

/**
 * Get authentication token from cookies
 */
export const getAuthToken = (): string | null => {
  return getCookie(TOKEN_NAME) as string | null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Get authorization header for API requests
 */
export const getAuthHeader = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
