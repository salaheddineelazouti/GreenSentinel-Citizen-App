import React from 'react';

// Variables globales pour permettre aux tests de manipuler l'état
let _isInstalled = false;
let _canInstall = true;
let _needRefresh = true;
let _showSavedMessage = false;
let _theme = 'light'; // 'light', 'dark', 'system'

// Mock des fonctions pour les tests
const updateServiceWorker = jest.fn();
const installApp = jest.fn();
const setTheme = jest.fn();

// Exporter les variables pour les tests
export const __mocks__ = {
  setIsInstalled: (value: boolean) => {
    _isInstalled = value;
  },
  setCanInstall: (value: boolean) => {
    _canInstall = value;
  },
  setNeedRefresh: (value: boolean) => {
    _needRefresh = value;
  },
  setTheme: (theme: string) => {
    _theme = theme;
    setTheme(theme);
  },
  setShowSavedMessage: (value: boolean) => {
    _showSavedMessage = value;
  },
  installApp,
  updateServiceWorker
};

// Mock complet de SettingsPage pour les tests
export default function SettingsPage() {
  // État local du formulaire
  const [apiUrl, setApiUrl] = React.useState('api.example.com:8000');
  const [savedApiMessage, setSavedApiMessage] = React.useState(false);
  
  // Fonction pour sauvegarder les paramètres API
  const saveApiSettings = () => {
    window.localStorage.setItem('apiHost', apiUrl);
    setSavedApiMessage(true);
    setTimeout(() => setSavedApiMessage(false), 2000);
  };
  
  React.useEffect(() => {
    // Simuler le chargement depuis localStorage
    const storedApi = window.localStorage.getItem('apiHost');
    if (storedApi) {
      setApiUrl(storedApi);
    }
  }, []);

  return (
    <div>
      <h1 data-testid="settings-title">Paramètres</h1>
      
      {/* Section thème */}
      <div data-testid="toggle-theme-btn">
        <h2>Thème</h2>
        <div>
          <button 
            className={_theme === 'light' ? 'active' : ''}
            onClick={() => __mocks__.setTheme('light')}
          >
            Clair
          </button>
          <button 
            className={_theme === 'dark' ? 'active' : ''} 
            onClick={() => __mocks__.setTheme('dark')}
          >
            Sombre
          </button>
          <button 
            className={_theme === 'system' ? 'active' : ''} 
            onClick={() => __mocks__.setTheme('system')}
          >
            Système
          </button>
        </div>
      </div>
      
      {/* Section API */}
      <div>
        <h2>Serveur API</h2>
        <label htmlFor="api-url">URL du serveur API</label>
        <input 
          id="api-url" 
          type="text" 
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
        />
        <button onClick={saveApiSettings}>Sauvegarder</button>
        {(savedApiMessage || _showSavedMessage) && <p>Sauvegardé!</p>}
      </div>
      
      {/* Section mise à jour */}
      <div>
        <h2>Mise à jour</h2>
        <div data-testid="check-update-btn">Vérifier les mises à jour</div>
        
        {_needRefresh && (
          <div>
            <p>Mise à jour disponible!</p>
            <button onClick={() => updateServiceWorker(true)}>Mettre à jour</button>
          </div>
        )}
      </div>
      
      {/* Section installation */}
      <div>
        <h2>Installation</h2>
        {!_isInstalled && _canInstall && (
          <div data-testid="install-pwa-btn" onClick={() => installApp()}>Installer l'application</div>
        )}
        
        {_isInstalled && (
          <div>
            <p>Application installée</p>
            <p>L'application GreenSentinel Pro est déjà installée sur votre appareil</p>
          </div>
        )}
      </div>
    </div>
  );
}
