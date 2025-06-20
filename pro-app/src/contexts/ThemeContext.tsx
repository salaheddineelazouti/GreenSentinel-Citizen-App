import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useTheme as useThemeHook } from '../hooks/useTheme';

// Définir le type du contexte de thème
type ThemeContextType = {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
};

// Créer le contexte avec des valeurs par défaut
const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
});

// Props pour le ThemeProvider
type ThemeProviderProps = {
  children: ReactNode;
};

// Créer le provider de thème
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const themeValue = useThemeHook();

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte de thème
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return context;
};
