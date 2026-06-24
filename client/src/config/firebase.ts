import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Since the user will update the .env or service account later, 
// we use fallback credentials that connect to a default project
// or support local emulator settings.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyFakeKeyForLocalScaffoldOnly",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "community-hero-scaffold.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "community-hero-scaffold",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "community-hero-scaffold.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "12345678",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:12345678:web:abc123def456"
};

let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Fail-soft mock app container
  app = {} as any;
}

export const isMockFirebase = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === "AIzaSyFakeKeyForLocalScaffoldOnly";

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
