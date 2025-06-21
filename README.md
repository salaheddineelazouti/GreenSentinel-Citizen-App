# GreenSentinel Citizen App

[![CI](https://github.com/salaheddineelazouti/GreenSentinel-Citizen-App/actions/workflows/ci.yml/badge.svg)](https://github.com/salaheddineelazouti/GreenSentinel-Citizen-App/actions/workflows/ci.yml)
[![Release](https://github.com/salaheddineelazouti/GreenSentinel-Citizen-App/actions/workflows/release.yml/badge.svg)](https://github.com/salaheddineelazouti/GreenSentinel-Citizen-App/actions/workflows/release.yml)
[![Deploy](https://github.com/salaheddineelazouti/GreenSentinel-Citizen-App/actions/workflows/deploy.yml/badge.svg)](https://github.com/salaheddineelazouti/GreenSentinel-Citizen-App/actions/workflows/deploy.yml)

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

## 📚 Documentation

### Guides d'utilisation
- [Guide utilisateur Citoyen](docs/user-guide/citizen_app.md) - Application mobile et Web pour signaler des incidents
- [Guide utilisateur Professionnel](docs/user-guide/pro_app.md) - Application pour pompiers et intervenants
- [Guide administrateur](docs/user-guide/admin_dashboard.md) - Dashboard de gestion et supervision

### Déploiement & Architecture
- [Guide de déploiement](docs/deployment.md) - Instructions pour déployer la stack
- [Monitoring et observabilité](docs/monitoring.md) - Prometheus, Grafana et Loki

### Confidentialité & Sécurité
- [RGPD One-Pager](docs/privacy/rgpd_onepager.md) - Conformité et traitement des données
- [Mesures de sécurité](docs/privacy/security_measures.md) - Protection technique des données

### Génération de PDF
Pour générer des versions PDF de la documentation :
```bash
make docs  # Nécessite pandoc et wkhtmltopdf
```

## Statut du projet

Ce projet est actuellement au stade de prototype frontend. Il manque :
- Une API backend pour la persistance des données
- Un système d'authentification
- Des tests automatisés
- Une intégration CI/CD

## Licence

[MIT](LICENSE)
