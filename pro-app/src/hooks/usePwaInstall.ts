import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePwaInstall = () => {
  // État pour suivre si l'application peut être installée
  const [canInstall, setCanInstall] = useState<boolean>(false);
  
  // Référence à l'événement beforeinstallprompt
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  
  // État pour suivre si l'application est déjà installée
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Vérification si l'application est déjà installée
    // via le mode d'affichage ou matchMedia
    const checkIsInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches ||
          window.matchMedia('(display-mode: fullscreen)').matches ||
          window.matchMedia('(display-mode: minimal-ui)').matches ||
          // @ts-expect-error - Propriété non standard mais utile pour iOS
          window.navigator.standalone === true) {
        setIsInstalled(true);
      }
    };

    // Écouteur pour l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Empêcher Chrome d'afficher automatiquement la boîte de dialogue d'installation
      e.preventDefault();
      // Stocker l'événement pour l'utiliser plus tard
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mettre à jour l'état pour afficher notre propre bouton d'installation
      setCanInstall(true);
    };

    // Écouteur pour l'événement appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    // Vérifier si l'application est déjà installée
    checkIsInstalled();
    
    // Ajouter les écouteurs d'événements
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Nettoyage
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Fonction pour déclencher l'installation de la PWA
  const installApp = async () => {
    if (!deferredPrompt) {
      console.log('Installation non disponible');
      return;
    }

    // Afficher la boîte de dialogue d'installation
    await deferredPrompt.prompt();

    // Attendre le choix de l'utilisateur
    const choiceResult = await deferredPrompt.userChoice;

    // Réinitialiser deferredPrompt - ne peut être utilisé qu'une seule fois
    setDeferredPrompt(null);
    
    if (choiceResult.outcome === 'accepted') {
      console.log('Utilisateur a accepté l\'installation');
      setCanInstall(false);
    } else {
      console.log('Utilisateur a refusé l\'installation');
      // Si l'utilisateur refuse l'installation, on garde canInstall à true
      // pour lui permettre de réessayer
    }
  };

  return { canInstall, isInstalled, installApp };
};
