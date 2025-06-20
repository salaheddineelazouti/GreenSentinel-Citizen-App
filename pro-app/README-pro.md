# GreenSentinel Pro - Application Pompiers

Application professionnelle PWA pour les pompiers qui permet de recevoir en temps réel les alertes d'incidents via WebSocket.

## Fonctionnalités

- Application Web Progressive (PWA) pour utilisation mobile et desktop
- Connexion WebSocket temps réel aux alertes d'incidents
- Reconnexion automatique en cas de perte de connexion
- Thème clair/sombre (manuel ou synchronisation avec le système)
- Visualisation des incidents (GPS, niveau de confiance)
- Installation en tant qu'application native via PWA
- Notifications de mise à jour du service worker
- Configuration dynamique de l'URL de l'API

## Technologies

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router v6
- WebSockets
- PWA (vite-plugin-pwa)
- Jest + Testing Library
- Lucide React (icônes)

## Prérequis

- Node.js 18+ et npm

## Installation

```bash
# Installation des dépendances
npm install
```

## Développement

```bash
# Lancement du serveur de développement
npm run dev

# Exécution des tests unitaires
npm run test

# Linting du code
npm run lint

# Linting et tests
npm run lint && npm run test
```

## Configuration

Créez un fichier `.env.local` à la racine du projet pour configurer les variables d'environnement :

```
VITE_API_HOST=localhost:8000
```

Alternativement, vous pouvez définir l'URL du serveur dans les paramètres de l'application.

## Build et déploiement

```bash
# Construction pour production
npm run build

# Prévisualisation du build
npm run preview
```

Les fichiers de build seront générés dans le répertoire `dist`, prêts à être déployés sur n'importe quel serveur web statique.

## Structure du projet

```
pro-app/
├── public/            # Ressources statiques et icônes PWA
├── src/
│   ├── assets/        # Images et ressources
│   ├── components/    # Composants React réutilisables
│   ├── hooks/         # Hooks personnalisés (WebSocket, thème)
│   ├── pages/         # Pages de l'application
│   └── tests/         # Configuration des tests
└── ...
```
