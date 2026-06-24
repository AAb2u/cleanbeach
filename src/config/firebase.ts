import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth, Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyC0KBVVe_yWjwHU_txw8MaOEtmA5lFKrig',
  authDomain: 'cleanbeach-f9b71.firebaseapp.com',
  projectId: 'cleanbeach-f9b71',
  storageBucket: 'cleanbeach-f9b71.firebasestorage.app',
  messagingSenderId: '742235148967',
  appId: '1:742235148967:web:8820f8a77a6f1c3bb4c182',
};

export const app = initializeApp(firebaseConfig);
const { getReactNativePersistence } = require('firebase/auth') as {
  getReactNativePersistence: (storage: typeof ReactNativeAsyncStorage) => Persistence;
};

function initializeNativeAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = initializeNativeAuth();
export const db = getFirestore(app);
