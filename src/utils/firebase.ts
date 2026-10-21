/**
 * Firebase initialisation.
 *
 * The values below are the *client* config for the Firebase project. They are not
 * secrets (Firebase identifies the project with them; access is controlled by
 * Firestore security rules in /firestore.rules), but they are read from
 * EXPO_PUBLIC_* environment variables so each environment (dev / pilot / main
 * study) can point at its own project. Copy .env.example to .env.local and fill it
 * in from Firebase console → Project settings → Your apps.
 */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'marsh-prosocial-intervention',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth(): Auth {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }
  try {
    // getReactNativePersistence only exists in the React Native build of
    // firebase/auth (Metro picks it automatically); it is missing from the web
    // type definitions, hence the untyped require.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getReactNativePersistence } = require('firebase/auth') as {
      getReactNativePersistence: (storage: unknown) => any;
    };
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // initializeAuth throws if auth was already initialised (fast refresh).
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
