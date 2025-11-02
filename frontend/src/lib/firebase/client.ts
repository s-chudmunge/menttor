import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
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
