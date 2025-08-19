import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAADChmI1uiXPyQQXBF9WJRmjHrtbhdxKU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "menttor-e904f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "menttor-e904f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "menttor-e904f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "350200752369",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:350200752369:web:441bd61a286f60ee2ca150",
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
