import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Navbar';
import AppRouter from './router';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './auth/AuthProvider';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useAuth } from './auth/useAuth';
import { isFCMRegistered, registerFCM } from './firebase/registerFCM';
import './firebase/firebase'; // Initialize Firebase

function App() {
  const { isAuthenticated } = useAuth();
  
  // Configuration de la mise à jour du service worker pour la PWA
  const {
    needRefresh,
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error: unknown) {
      console.log('SW registration error', error);
    },
  });

  // Mettre à jour le service worker si nécessaire
  useEffect(() => {
    if (needRefresh) {
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);
  
  // Initialiser les notifications Firebase après connexion
  useEffect(() => {
    const setupFCM = async () => {
      if (isAuthenticated) {
        try {
          // Vérifier si FCM est déjà enregistré
          const isRegistered = await isFCMRegistered();
          if (!isRegistered && 'Notification' in window && Notification.permission === 'granted') {
            // Si les permissions sont déjà accordées mais FCM pas encore enregistré
            await registerFCM();
            console.log('FCM registration completed after login');
          }
        } catch (error) {
          console.error('Error during FCM setup:', error);
        }
      }
    };
    
    setupFCM();
  }, [isAuthenticated]);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <AppRouter />
            </main>
            <footer className="bg-gray-100 dark:bg-gray-800 py-3">
              <div className="container-app text-center text-sm text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} GreenSentinel Pro - Application Pompiers
              </div>
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
