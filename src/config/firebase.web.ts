import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC0KBVVe_yWjwHU_txw8MaOEtmA5lFKrig',
  authDomain: 'cleanbeach-f9b71.firebaseapp.com',
  projectId: 'cleanbeach-f9b71',
  storageBucket: 'cleanbeach-f9b71.firebasestorage.app',
  messagingSenderId: '742235148967',
  appId: '1:742235148967:web:8820f8a77a6f1c3bb4c182',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
