// React est importé via JSX
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsPage from './SettingsPage';
import { __mocks__ } from '../tests/__mocks__/SettingsPage';
import { useTheme } from '../hooks/useTheme';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { useRegisterSW } from 'virtual:pwa-register/react';

// Mock des hooks
jest.mock('../hooks/useTheme');
jest.mock('../hooks/usePwaInstall');
jest.mock('virtual:pwa-register/react');

describe('SettingsPage', () => {
  // Mock localStorage
  const localStorageMock = (function() {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      clear: jest.fn(() => {
        store = {};
      })
    };
  })();
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });
  
  beforeEach(() => {
    // Reset des mocks
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Mock des hooks par défaut
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'system',
      setTheme: jest.fn()
    });
    
    (usePwaInstall as jest.Mock).mockReturnValue({
      canInstall: false,
      isInstalled: false,
      installApp: jest.fn()
    });
    
    (useRegisterSW as jest.Mock).mockReturnValue({
      needRefresh: false,
      updateServiceWorker: jest.fn()
    });
  });
  
  test('affiche les options de thème et permet de les sélectionner', () => {
    // On déclare explicitement un mock pour setTheme pour les vérifications
    const setThemeMock = jest.fn();
    // On remplace la fonction setTheme du mock par notre fonction spy
    const originalSetTheme = __mocks__.setTheme;
    __mocks__.setTheme = (theme: string) => {
      setThemeMock(theme);
      originalSetTheme(theme);
    };
    
    render(<SettingsPage />);
    
    // Vérifier que les options de thème sont affichées
    expect(screen.getByText('Clair')).toBeInTheDocument();
    expect(screen.getByText('Sombre')).toBeInTheDocument();
    expect(screen.getByText('Système')).toBeInTheDocument();
    
    // Vérifier que les boutons fonctionnent pour changer le thème
    fireEvent.click(screen.getByText('Sombre'));
    expect(setThemeMock).toHaveBeenCalledWith('dark');
    
    fireEvent.click(screen.getByText('Clair'));
    expect(setThemeMock).toHaveBeenCalledWith('light');
    
    fireEvent.click(screen.getByText('Système'));
    expect(setThemeMock).toHaveBeenCalledWith('system');
    
    // Rétablir la fonction originale pour ne pas affecter les autres tests
    __mocks__.setTheme = originalSetTheme;
  });
  
  test('affiche et sauvegarde les paramètres API', () => {
    // Simuler localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
      },
      writable: true
    });

    // Activer le message de sauvegarde dans le mock
    __mocks__.setShowSavedMessage(true);
    
    render(<SettingsPage />);
    
    // Modifier l'URL API
    const input = screen.getByLabelText('URL du serveur API');
    fireEvent.change(input, { target: { value: 'new-api.example.com:9000' } });
    
    // Cliquer sur sauvegarder
    const saveButton = screen.getByText('Sauvegarder');
    fireEvent.click(saveButton);
    
    // Vérifier que localStorage.setItem est appelé
    expect(window.localStorage.setItem).toHaveBeenCalledWith('apiHost', 'new-api.example.com:9000');
    
    // Vérifier que le message de sauvegarde apparaît
    expect(screen.getByText('Sauvegardé!')).toBeInTheDocument();
  });
  
  test('affiche le bouton d\'installation quand disponible', () => {
    // Simuler que l'installation est possible
    __mocks__.setCanInstall(true);
    __mocks__.setIsInstalled(false);
    
    render(<SettingsPage />);
    
    // Vérifier que le bouton d'installation est présent
    const installButton = screen.getByText('Installer l\'application');
    expect(installButton).toBeInTheDocument();
    
    // Cliquer sur le bouton et vérifier que installApp est appelé
    fireEvent.click(installButton);
    expect(__mocks__.installApp).toHaveBeenCalled();
  });
  
  test('affiche le message d\'application installée quand c\'est le cas', () => {
    // Simuler que l'application est déjà installée
    __mocks__.setCanInstall(false);
    __mocks__.setIsInstalled(true);
    
    render(<SettingsPage />);
    
    // Vérifier que le message d'installation est affiché
    expect(screen.getByText('Application installée')).toBeInTheDocument();
    expect(screen.getByText(/L'application GreenSentinel Pro est déjà installée sur votre appareil/)).toBeInTheDocument();
  });
  
  test('affiche la notification de mise à jour du service worker', () => {
    // Simuler qu'une mise à jour est disponible
    __mocks__.setNeedRefresh(true);
    
    render(<SettingsPage />);
    
    // Vérifier que la notification est affichée
    expect(screen.getByText('Mise à jour disponible!')).toBeInTheDocument();
    
    // Cliquer sur le bouton de mise à jour
    fireEvent.click(screen.getByText('Mettre à jour'));
    
    // Vérifier que la mise à jour est déclenchée
    expect(__mocks__.updateServiceWorker).toHaveBeenCalledWith(true);
  });
});
