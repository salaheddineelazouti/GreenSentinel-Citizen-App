# GreenSentinel Mobile App

Version mobile de l'application GreenSentinel Citizen pour le signalement de problèmes environnementaux.

## Configuration requise

- Flutter 3.19 ou supérieur
- Dart SDK 3.0.0 ou supérieur
- Android Studio / VS Code avec extensions Flutter et Dart

## Installation

1. Assurez-vous que Flutter est correctement installé :
   ```bash
   flutter doctor
   ```

2. Depuis le répertoire racine du projet, naviguez vers le dossier mobile :
   ```bash
   cd mobile
   ```

3. Installez les dépendances :
   ```bash
   flutter pub get
   ```

4. Exécutez l'application :
   ```bash
   flutter run
   ```

## Architecture

L'application mobile partage le même système de design que l'application web React via le fichier `design-tokens.json` à la racine du projet. Cela garantit une expérience utilisateur cohérente entre les plateformes.

### Partage de tokens de design

Les tokens de design sont définis dans le fichier `design-tokens.json` à la racine du projet. Dans l'application Flutter :

- Les tokens sont chargés dynamiquement depuis ce fichier
- La classe `AppTheme` convertit les valeurs en objets Flutter appropriés
- Les extensions `AppColors` et `AppTextStyles` facilitent l'accès aux tokens

Pour une solution plus robuste en production, envisagez d'implémenter une génération automatique de code Dart à partir des tokens JSON via style-dictionary ou build_runner.

### Principales dépendances

- `flutter_riverpod` : Gestion d'état
- `go_router` : Navigation et routage
- `google_fonts` : Utilisation des polices Google
- `shared_preferences` : Stockage local des préférences

## Développement

Le projet est configuré avec :
- Material 3 (useMaterial3: true)
- Support pour les thèmes clair et sombre
- Architecture extensible pour de futures fonctionnalités

Consultez `lib/theme.dart` pour plus de détails sur l'implémentation du système de design.
