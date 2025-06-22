import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

// Définir un nom constant pour le stockage du token pour éviter les erreurs de frappe
const TOKEN_STORAGE_KEY = 'green_sentinel_pro_auth_token';

interface User {
  id: string;
  email: string;
  exp: number;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Fonction utilitaire pour obtenir le token stocké
 */
const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

/**
 * Fonction utilitaire pour définir le token
 */
const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

/**
 * Fonction utilitaire pour supprimer le token
 */
const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

/**
 * Permet de décoder un token, qu'il soit au format JWT ou au format personnalisé
 * @param token Le token à décoder
 * @returns Un objet User avec les données du token ou null si invalide
 */
const decodeToken = (token: string): User | null => {
  try {
    // Tentative de décodage comme JWT standard
    const decoded = jwtDecode<User>(token);
    return decoded;
  } catch (jwtError) {
    console.log('🔐 Token non-JWT, tentative de format personnalisé...', token);
    
    // Format personnalisé: email.timestamp.other (ex: firefighter@example.com.1750519678.32343.2)
    try {
      // Vérifier si le token ressemble au format attendu
      if (token.includes('@') && token.includes('.')) {
        // Diviser le token en parties séparées par des points
        const parts = token.split('.');
        
        console.log('🔐 Parties du token:', parts);
        
        // Trouver l'index où l'email se termine en cherchant la première partie qui ressemble à un timestamp
        // Un timestamp est un grand nombre (plus de 10 chiffres)
        let emailEndIndex = -1;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          // Si c'est un nombre avec plus de 10 chiffres, c'est probablement un timestamp
          if (/^\d{10,}$/.test(part)) {
            emailEndIndex = i;
            break;
          }
        }
        
        if (emailEndIndex > 0) {
          // Reconstituer l'email en joignant toutes les parties avant le timestamp
          const emailPart = parts.slice(0, emailEndIndex).join('.');
          // Le timestamp est la partie trouvée
          const expTimestamp = parseFloat(parts[emailEndIndex]);
          
          console.log('🔐 Analyse du token personnalisé:', { 
            emailPart, 
            expTimestamp, 
            emailEndIndex,
            allParts: parts 
          });
          
          // Vérifier que nous avons un email et un timestamp valide
          if (emailPart && emailPart.includes('@') && !isNaN(expTimestamp)) {
            // Créer un objet utilisateur similaire à celui attendu par l'application
            const user: User = {
              id: emailPart,
              email: emailPart,
              exp: expTimestamp
            };
            
            console.log('🔐 Token personnalisé décodé avec succès:', user);
            return user;
          }
        }
      }
      
      console.error('🔐 Format de token personnalisé invalide');
      return null;
    } catch (customError) {
      console.error('🔐 Erreur lors du décodage du token personnalisé', customError);
      return null;
    }
  }
};

/**
 * Vérifie si un token est expiré
 */
const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    console.log('🔐 Token invalid ou sans champ exp');
    return true;
  }
  
  // Pour les JWT classiques et nos tokens personnalisés, l'expiration est en secondes depuis epoch
  const now = Math.floor(Date.now() / 1000);
  const isExpired = now >= decoded.exp;
  
  console.log('🔐 Vérification d\'expiration:', {
    maintenant: new Date(now * 1000).toLocaleString(),
    expiration: new Date(decoded.exp * 1000).toLocaleString(),
    expiré: isExpired
  });
  
  return isExpired;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenCheckComplete, setTokenCheckComplete] = useState(false);

  // Auto-logout when token expires
  useEffect(() => {
    if (user && user.exp) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = Math.max(0, (user.exp - now) * 1000); // Conversion en millisecondes
      
      console.log(`Auto-logout prévu dans ${timeUntilExpiry/1000} secondes`);
      
      const timeout = setTimeout(() => {
        console.log('Auto-logout: Token expiré');
        logout();
      }, timeUntilExpiry);
      
      return () => clearTimeout(timeout);
    }
  }, [user]);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      console.log('🔐 Initialisation de l\'authentification...');
      setIsLoading(true);
      
      const token = getStoredToken();
      console.log(`🔐 Token trouvé: ${token ? 'Oui' : 'Non'}`);
      
      if (!token) {
        console.log('🔐 Aucun token, utilisateur non authentifié');
        setUser(null);
        setIsLoading(false);
        setTokenCheckComplete(true);
        return;
      }
      
      if (isTokenExpired(token)) {
        console.log('🔐 Token expiré, suppression');
        removeStoredToken();
        setUser(null);
        setIsLoading(false);
        setTokenCheckComplete(true);
        return;
      }
      
      const decodedUser = decodeToken(token);
      console.log('🔐 Token valide, utilisateur authentifié', decodedUser);
      
      if (decodedUser) {
        setUser(decodedUser);
      } else {
        console.error('🔐 Token décodé invalide');
        removeStoredToken();
      }
      
      setIsLoading(false);
      setTokenCheckComplete(true);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const apiHost = import.meta.env.VITE_API_HOST || 'http://localhost:8000';
      console.log(`🔐 Tentative de connexion: ${apiHost}/api/v1/auth/login`);
      
      const response = await axios.post(`${apiHost}/api/v1/auth/login`, { email, password });
      console.log('🔐 Réponse d\'authentification:', response.data);
      
      const { access_token } = response.data;
      
      if (!access_token) {
        console.error('🔐 Pas de token dans la réponse');
        setIsLoading(false);
        return false;
      }
      
      // Stocker le token avant de tenter de le décoder
      setStoredToken(access_token);
      
      const decodedUser = decodeToken(access_token);
      
      if (!decodedUser) {
        console.error('🔐 Token invalide ou non décodable');
        setIsLoading(false);
        return false;
      }
      
      console.log('🔐 Utilisateur authentifié:', decodedUser);
      setUser(decodedUser);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('🔐 Erreur de connexion:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    console.log('🔐 Déconnexion');
    removeStoredToken();
    setUser(null);
  };
  
  const getToken = (): string | null => {
    return getStoredToken();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    getToken
  };

  // Attendre que la vérification du token soit terminée avant de rendre les enfants
  if (!tokenCheckComplete) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};
