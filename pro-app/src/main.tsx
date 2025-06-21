import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'

// Supprime le CSS Vite par défaut
import './App.css'

// Vérifie si l'application est en mode développement
const isDev = import.meta.env.DEV

// Fonction pour gérer les erreurs React de façon plus explicite
const handleRenderError = (error: any) => {
  console.error('ERREUR DE RENDU REACT:', error);
  // Afficher l'erreur directement dans le DOM en cas d'échec de React
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 5px;">
        <h2>Erreur de rendu de l'application</h2>
        <p>${error?.message || 'Erreur inconnue'}</p>
        <pre>${error?.stack || 'Pas de stacktrace disponible'}</pre>
      </div>
    `;
  }
};

try {
  // Le cast 'as HTMLElement' est nécessaire pour le typechecking strict
  const rootElement = document.getElementById('root') as HTMLElement;
  
  if (!rootElement) {
    throw new Error("L'élément root est introuvable dans le DOM");
  }
  
  // Test de rendu simple avant de monter l'application complète
  // Décommenter cette ligne et commenter le reste pour tester si React fonctionne du tout
  // rootElement.innerHTML = '<div style="padding: 20px; background-color: #d4edda;">Test React de base</div>';

  // Création du root React
  const root = createRoot(rootElement);
  
  // Rendu de l'application complète avec ErrorBoundary
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  // Log de démarrage
  console.log(`GreenSentinel Pro App démarrée en mode ${isDev ? 'développement' : 'production'}`);
} catch (error) {
  handleRenderError(error);
}
