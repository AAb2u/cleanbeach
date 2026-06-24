# CleanBeach

Application mobile React Native (Expo) pour signaler et suivre la pollution sur les plages. Interface entièrement en français.

## Fonctionnalités

- Signalement de plages polluées (photo, GPS, niveau de gravité)
- Carte interactive avec marqueurs colorés
- Communauté : likes, confirmations, commentaires
- Badges et points de contribution
- Mode sombre
- Tableau de bord administrateur
- Notifications push pour les utilisateurs à proximité

## Prérequis

- Node.js 18+
- Compte [Firebase](https://console.firebase.google.com/)
- Expo CLI (`npx expo`)

## Installation

```bash
npm install
npx expo start
```

## Configuration Firebase

### 1. Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur **Ajouter un projet** et suivez les étapes
3. Activez **Authentication** → méthode **Email/Mot de passe**
4. Créez une base **Cloud Firestore** (mode test pour le développement)
5. Activez **Storage** pour les photos

### 2. Configurer l'application

1. Dans Firebase Console → **Paramètres du projet** → **Vos applications**
2. Ajoutez une application **Web** (icône `</>`)
3. Copiez la configuration et remplacez les valeurs dans `src/config/firebase.ts` :

```typescript
const firebaseConfig = {
  apiKey: 'VOTRE_API_KEY',
  authDomain: 'VOTRE_PROJET.firebaseapp.com',
  projectId: 'VOTRE_PROJECT_ID',
  storageBucket: 'VOTRE_PROJET.appspot.com',
  messagingSenderId: 'VOTRE_SENDER_ID',
  appId: 'VOTRE_APP_ID',
};
```

### 3. Règles Firestore (développement)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
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
    match /notifications/{notifId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Règles Storage

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /reports/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Créer un administrateur

Dans Firestore, collection `users`, document `{uid}` :

```json
{ "isAdmin": true }
```

## Structure du projet

```
src/
├── components/     # Composants UI réutilisables
├── config/         # Configuration Firebase
├── constants/      # Thème et labels
├── context/        # Auth et thème
├── navigation/     # Navigateurs React Navigation
├── screens/        # Écrans de l'application
├── services/       # Firestore, Storage, Notifications
├── types/          # Types TypeScript
└── utils/          # Fonctions utilitaires
```

## Technologies

- Expo SDK 56 · React 19 · React Native 0.85
- Firebase (Auth, Firestore, Storage)
- React Navigation · React Native Maps
- Expo Location, Image Picker, Notifications

## Licence

MIT
