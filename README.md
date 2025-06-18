# GreenSentinel Citizen App

Application mobile et web permettant aux citoyens de signaler et suivre des problèmes environnementaux dans leur région.

## À propos du projet

GreenSentinel Citizen App est une application qui permet aux utilisateurs de :
- Signaler des problèmes environnementaux (incendies, pollution, déforestation illégale, etc.)
- Visualiser les signalements sur une carte interactive
- Gagner des points et progresser en niveau en contribuant activement
- Participer à des discussions communautaires sur l'environnement

## Technologies utilisées

- React 18
- React-Leaflet pour la cartographie
- Tailwind CSS pour le style
- Lucide React pour les icônes

## Structure du projet

Ce projet utilise une architecture documentée dans le fichier [architecture.md](architecture.md).

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-nom/GreenSentinel-Citizen-App.git

# Accéder au répertoire
cd GreenSentinel-Citizen-App

# Installer les dépendances
npm install

# Lancer l'application en développement
npm start
```

## Design System

L'application utilise un système de design documenté dans [design-system.md](design-system.md) et implémenté avec des tokens de design dans [design-tokens.json](design-tokens.json).

## Statut du projet

Ce projet est actuellement au stade de prototype frontend. Il manque :
- Une API backend pour la persistance des données
- Un système d'authentification
- Des tests automatisés
- Une intégration CI/CD

## Licence

[MIT](LICENSE)
