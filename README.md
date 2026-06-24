# CleanBeach

Application mobile React Native avec Expo pour signaler, suivre et nettoyer les plages polluees.

## Fonctionnalites

- Authentification email/mot de passe avec Firebase Auth
- Creation de signalements avec GPS, niveau de pollution et photos
- Upload des photos via Cloudinary
- Carte interactive avec les signalements
- Liste des signalements avec filtres
- Detail d'un signalement avec photos, commentaires, likes et confirmations
- Modification ou suppression de ses propres signalements
- Changement d'etat communautaire : polluee, nettoyage en cours, nettoyee
- Ajout de photos de preuve pour confirmer un nettoyage
- Profil utilisateur, points et badges
- Mode sombre

## Prerequis

- Node.js 18 ou plus
- npm
- Expo Go sur telephone, ou un emulateur Android/iOS
- Un projet Firebase
- Un compte Cloudinary

## Installation

```bash
npm install
```

Copier le fichier d'exemple d'environnement :

```bash
cp .env.example .env
```

Sur PowerShell Windows :

```powershell
Copy-Item .env.example .env
```

## Variables d'environnement

Le fichier `.env` n'est pas versionne par Git. Il doit rester local.

```env
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=votre_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=votre_unsigned_upload_preset
```

Exemple avec le preset utilise pendant le developpement :

```env
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dirt5b4s2
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=cleanbeach_unsigned
```

Ne jamais mettre de secret Cloudinary dans l'application mobile, surtout pas `API Secret`.

## Configuration Cloudinary

L'application utilise Cloudinary pour stocker les photos. Firebase Storage n'est pas necessaire.

1. Creer un compte Cloudinary.
2. Aller dans le Dashboard Cloudinary.
3. Copier le `Cloud name` dans `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`.
4. Aller dans `Settings > Upload > Upload presets`.
5. Creer un preset en mode `Unsigned`.
6. Copier le nom du preset dans `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.

Pour tester l'upload photo sur telephone, relancer toujours Expo avec le cache vide apres modification du `.env`.

## Configuration Firebase

Dans Firebase Console :

1. Creer un projet Firebase.
2. Activer Authentication avec la methode Email/Mot de passe.
3. Creer une base Cloud Firestore.
4. Copier la configuration Firebase dans `src/config/firebase.ts` si vous utilisez un autre projet.

Exemple de regles Firestore pour le developpement :

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /reports/{reportId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;

      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null;
      }
    }

    match /notifications/{notificationId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Ces regles sont pratiques pour le developpement. Pour la production, il faut les durcir.

## Lancer le projet

Demarrer Expo :

```bash
npx expo start -c
```

Si le telephone n'est pas sur le meme reseau Wi-Fi que l'ordinateur :

```bash
npx expo start --tunnel -c
```

Pour le web :

```bash
npx expo start --web
```

## Tester avant un push

```bash
npx tsc --noEmit
npx expo export --platform web --output-dir .expo-web-test
```

Le dossier `.expo-web-test` est ignore par Git.

## Notes Expo Go

`expo-notifications` et certaines fonctions natives peuvent etre limitees dans Expo Go. Pour les notifications push Android en production, utiliser un development build Expo.

Les photos sont selectionnees avec `expo-image-picker` puis envoyees a Cloudinary. Sur mobile, l'app utilise une version base64 pour rendre l'upload plus fiable dans Expo Go.

## Fichiers ignores par Git

Le projet ignore notamment :

- `.env` et les variantes `.env.*`
- `node_modules`
- `.expo`
- exports web et builds mobiles
- fichiers natifs generes `android/` et `ios/`
- cles Firebase, Google, EAS et certificats
- dossiers locaux d'IDE et d'outils agents

Garder `.env.example` dans le repo pour documenter les variables attendues.

## Structure du projet

```text
src/
  components/     Composants UI reutilisables
  config/         Configuration Firebase et Cloudinary
  constants/      Theme, images et labels
  context/        Authentification et theme
  navigation/     Navigation principale
  screens/        Ecrans de l'application
  services/       Firestore, upload photo, notifications
  types/          Types TypeScript
  utils/          Fonctions utilitaires
```

## Technologies

- Expo SDK 56
- React 19
- React Native 0.85
- Firebase Auth et Firestore
- Cloudinary
- React Navigation
- Expo Location
- Expo Image Picker
- Expo Notifications

## Licence

MIT
