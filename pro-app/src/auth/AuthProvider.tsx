import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded = jwtDecode<User>(token);
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  };

  // Auto-logout when token expires
  useEffect(() => {
    if (user) {
      const timeUntilExpiry = (user.exp * 1000) - Date.now();
      if (timeUntilExpiry > 0) {
        const timeout = setTimeout(() => {
          logout();
        }, timeUntilExpiry);
        return () => clearTimeout(timeout);
      } else {
        logout();
      }
    }
  }, [user]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('access_token');
      if (token && !isTokenExpired(token)) {
        try {
          const decoded = jwtDecode<User>(token);
          setUser(decoded);
        } catch (error) {
          console.error('Error decoding token:', error);
          localStorage.removeItem('access_token');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const apiHost = import.meta.env.VITE_API_HOST || 'http://localhost:8000';
      const response = await axios.post(`${apiHost}/login`, { email, password });
      
      const { access_token } = response.data;
      
      if (access_token) {
        localStorage.setItem('access_token', access_token);
        const decoded = jwtDecode<User>(access_token);
        setUser(decoded);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
