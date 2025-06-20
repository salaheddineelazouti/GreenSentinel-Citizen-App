import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Supprime le CSS Vite par défaut
import './App.css'

// Vérifie si l'application est en mode développement
const isDev = import.meta.env.DEV

// Le cast 'as HTMLElement' est nécessaire pour le typechecking strict
const rootElement = document.getElementById('root') as HTMLElement

// Création du root React
const root = createRoot(rootElement)

// Rendu de l'application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Log de démarrage
console.log(`GreenSentinel Pro App démarrée en mode ${isDev ? 'développement' : 'production'}`)
