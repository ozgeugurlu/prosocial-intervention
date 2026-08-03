import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDE2_-yWndriKT5xYw9UFHADA-ZynqS_a0",
  authDomain: "marsh-prosocial-intervention.firebaseapp.com",
  projectId: "marsh-prosocial-intervention",
  storageBucket: "marsh-prosocial-intervention.firebasestorage.app",
  messagingSenderId: "549338577789",
  appId: "1:549338577789:web:1e809508f63da667a5ea14",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
