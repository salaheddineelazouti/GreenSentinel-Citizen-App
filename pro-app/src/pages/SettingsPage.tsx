import React, { useEffect, useState } from 'react';
import { Save, Download, Moon, Sun, MonitorSmartphone, RefreshCw, Bell, BellOff } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useNotifications } from '../hooks/useNotifications';

const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { canInstall, isInstalled, installApp } = usePwaInstall();
  const { enabled, loading, permission, requestEnable, disable } = useNotifications();
  const [apiHost, setApiHost] = useState('');
  const [saved, setSaved] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [notificationToggling, setNotificationToggling] = useState(false);
  
  // Hook du service worker PWA
  const {
    needRefresh,
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error: Error | unknown) {
      console.log('SW registration error', error);
    },
  });

  // Récupérer l'URL de l'API depuis localStorage
  useEffect(() => {
    const storedHost = localStorage.getItem('apiHost') || import.meta.env.VITE_API_HOST || '';
    setApiHost(storedHost);
  }, []);
  
  // Afficher la notification de mise à jour disponible
  useEffect(() => {
    if (needRefresh) {
      setShowUpdateToast(true);
    }
  }, [needRefresh]);

  // Sauvegarder les paramètres et actualiser la page
  const handleSave = () => {
    localStorage.setItem('apiHost', apiHost);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      // Recharger la page pour appliquer les nouveaux paramètres
      if (window.location.href.includes('settings')) {
        window.location.reload();
      }
    }, 2000);
  };
  
  // Mise à jour du service worker
  const handleUpdate = () => {
    updateServiceWorker(true); // Recharge la page après mise à jour
    setShowUpdateToast(false);
  };

  return (
    <div className="container-app py-6">
      <h1 className="mb-6">Paramètres</h1>
      
      {/* Toast de mise à jour */}
      {showUpdateToast && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          <span>Mise à jour disponible!</span>
          <button 
            onClick={handleUpdate}
            className="ml-3 px-2 py-1 bg-white text-blue-500 rounded"
          >
            Mettre à jour
          </button>
        </div>
      )}
      
      <div className="card mb-6">
        <h2 className="mb-4">Thème</h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center py-3 px-4 rounded-lg ${
              theme === 'light' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            <Sun className="h-6 w-6 mb-2" />
            <span>Clair</span>
          </button>
          
          <button
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-center py-3 px-4 rounded-lg ${
              theme === 'dark' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            <Moon className="h-6 w-6 mb-2" />
            <span>Sombre</span>
          </button>
          
          <button
            onClick={() => setTheme('system')}
            className={`flex flex-col items-center py-3 px-4 rounded-lg ${
              theme === 'system' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            <MonitorSmartphone className="h-6 w-6 mb-2" />
            <span>Système</span>
          </button>
        </div>
      </div>
      
      <div className="card mb-6">
        <h2 className="mb-4">Configuration API</h2>
        <div className="mb-4">
          <label htmlFor="apiHost" className="block mb-2 text-sm font-medium">
            URL du serveur API
          </label>
          <input
            type="text"
            id="apiHost"
            value={apiHost}
            onChange={(e) => setApiHost(e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            placeholder="ex: localhost:8000"
          />
          <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
            Format: domaine:port (sans http:// ou https://)
          </p>
        </div>
        
        <button 
          onClick={handleSave}
          className="btn btn-primary flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          <span>{saved ? 'Sauvegardé!' : 'Sauvegarder'}</span>
        </button>
      </div>
      
      <div className="card mb-6">
        <h2 className="mb-4">Notifications</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Recevoir les alertes incendies</p>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {permission === 'granted' ? 'Autorisé' : permission === 'denied' ? 'Bloqué par le navigateur' : 'Non configuré'}
            </span>
          </div>
          
          <div className="flex items-center">
            {loading || notificationToggling ? (
              <div className="w-10 h-5 bg-gray-300 dark:bg-gray-600 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 animate-pulse"></div>
              </div>
            ) : (
              <button
                onClick={async () => {
                  setNotificationToggling(true);
                  try {
                    if (enabled) {
                      await disable();
                    } else {
                      await requestEnable();
                    }
                  } finally {
                    setNotificationToggling(false);
                  }
                }}
                disabled={permission === 'denied'}
                className={`w-12 h-6 rounded-full relative ${enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'} transition-colors ${permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={enabled ? 'Désactiver les notifications' : 'Activer les notifications'}
              >
                <div 
                  className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`}
                >
                  {enabled ? (
                    <Bell className="h-3 w-3 text-primary absolute top-1 left-1" />
                  ) : (
                    <BellOff className="h-3 w-3 text-gray-400 absolute top-1 left-1" />
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
        {permission === 'denied' && (
          <p className="text-xs mt-2 text-red-500">
            Les notifications sont bloquées par votre navigateur. Veuillez les autoriser dans les paramètres du navigateur pour recevoir les alertes incendies.
          </p>
        )}
      </div>
      
      {canInstall && (
        <div className="card">
          <h2 className="mb-4">Installation de l'application</h2>
          <p className="mb-4 text-sm">
            Installez GreenSentinel Pro sur votre appareil pour un accès plus rapide et une utilisation hors ligne.
          </p>
          <button 
            onClick={installApp}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Installer l'application</span>
          </button>
        </div>
      )}
      
      {isInstalled && (
        <div className="card">
          <h2 className="mb-4">Application installée</h2>
          <p className="text-sm">
            L'application GreenSentinel Pro est déjà installée sur votre appareil.
            Vous pouvez y accéder depuis votre écran d'accueil ou votre lanceur d'applications.
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
