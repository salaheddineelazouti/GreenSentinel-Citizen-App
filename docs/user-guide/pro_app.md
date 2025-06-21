# Guide Utilisateur : Application Professionnelle GreenSentinel

## Introduction

L'application Professionnelle GreenSentinel est un outil conçu pour les pompiers et les intervenants sur le terrain. Elle permet de visualiser, gérer et répondre aux incidents environnementaux signalés par les citoyens. Ce guide détaille les principales fonctionnalités de l'application pour les utilisateurs professionnels.

## Prérequis

- **Appareils compatibles** : Tablettes et smartphones iOS 14.0+ / Android 10.0+
- **Navigateur web** : Chrome 92+, Safari 14+, Firefox 90+, Edge 92+
- **Connexion Internet** : Requise (mode hors ligne limité disponible)
- **Compte professionnel** : Fourni par votre organisation (rôle FIREFIGHTER ou ADMIN)
- **GPS** : Activé pour les fonctionnalités de navigation et de mise à jour de position

## Parcours utilisateur

### 1. Connexion et tableau de bord

1. **Accès à l'application**
   - Accédez à `https://pro.greensentinel.org`
   - Alternativement, installer la PWA sur votre appareil

   ![screenshot](./img/pro_access.png)

2. **Authentification**
   - Connectez-vous avec vos identifiants professionnels
   - L'authentification à deux facteurs peut être activée selon votre organisation

   ![screenshot](./img/pro_login.png)

3. **Vue principale du tableau de bord**
   - Carte interactive avec les incidents en cours
   - Liste des incidents classés par priorité et proximité
   - Filtres rapides par type, statut et temporalité

   ![screenshot](./img/pro_dashboard.png)

### 2. Gestion des incidents

1. **Consultation d'un incident**
   - Sélectionnez un incident sur la carte ou dans la liste
   - Visualisez toutes les informations : description, photos, localisation précise
   - Consultez l'historique des actions et l'évaluation de l'IA

   ![screenshot](./img/pro_incident_details.png)

2. **Prise en charge d'un incident**
   - Appuyez sur "Prendre en charge"
   - Votre équipe sera assignée à l'incident
   - Le statut passe à "En déplacement"

   ![screenshot](./img/pro_take_action.png)

3. **Navigation vers le site**
   - Utilisez le bouton "Itinéraire" pour ouvrir l'application de navigation
   - Les coordonnées GPS précises sont automatiquement transmises

   ![screenshot](./img/pro_navigation.png)

4. **Mise à jour du statut**
   - Passez à "Sur site" une fois arrivé
   - Mettez à jour avec "En cours de traitement" pendant l'intervention
   - Finalisez avec "Résolu" ou indiquez si besoin de renforts

   ![screenshot](./img/pro_status_update.png)

### 3. Communication et rapport

1. **Échange avec le signaleur**
   - Utilisez la fonction "Contacter" pour communiquer avec le citoyen ayant signalé l'incident
   - Posez des questions complémentaires ou demandez des précisions

   ![screenshot](./img/pro_contact_reporter.png)

2. **Rapport d'intervention**
   - Complétez le rapport de résolution
   - Ajoutez des photos d'après intervention
   - Renseignez les ressources utilisées et temps d'intervention

   ![screenshot](./img/pro_resolution_report.png)

3. **Mode collaboratif**
   - Partagez l'incident avec d'autres équipes si nécessaire
   - Suivez en temps réel la position des autres intervenants sur la carte

   ![screenshot](./img/pro_collaboration.png)

## FAQ

### Comment prioriser les incidents quand plusieurs sont signalés simultanément ?
Le système attribue automatiquement un score de priorité basé sur le type d'incident, l'analyse IA des images, et la proximité géographique. Vous pouvez toutefois modifier manuellement la priorité selon votre évaluation.

### Que faire si je perds la connexion Internet sur le terrain ?
L'application dispose d'un mode hors ligne qui garde en cache les informations essentielles des incidents que vous avez consultés récemment. Vos mises à jour seront synchronisées dès que la connexion sera rétablie.

### Comment puis-je demander des ressources supplémentaires ?
Utilisez la fonction "Demande de renfort" dans les détails de l'incident. Vous pouvez spécifier le type de ressources nécessaires et l'urgence, ce qui alertera immédiatement le centre de commandement.

### Les citoyens peuvent-ils voir mon identité quand je réponds à leur signalement ?
Non, seul votre statut d'intervenant professionnel et votre équipe sont visibles pour les citoyens. Votre nom et vos informations personnelles restent confidentielles.
