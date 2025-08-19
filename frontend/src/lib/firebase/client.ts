import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0319118634.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gen-lang-client-0319118634",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0319118634.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "mock-app-id",
};

// Initialize Firebase only if we have valid configuration
let app: any = null;
let auth: any = null;

try {
  if (!getApps().length && typeof window !== 'undefined') {
    // Only initialize on client side
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } else if (getApps().length > 0) {
    app = getApp();
    auth = getAuth(app);
  }
} catch (error) {
  console.warn('Firebase initialization failed during build. This is expected if environment variables are not set during build time:', error);
  // Create mock objects for build time
  app = { name: 'mock-app' };
  auth = { 
    signOut: () => Promise.resolve(),
    onAuthStateChanged: () => () => {},
    signInWithPopup: () => Promise.reject('Firebase not initialized')
  };
}

export { app, auth };
