// @ts-nocheck
import { auth } from '../firebase/client';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';

// Sign Up
export const signUp = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Sign In
export const signIn = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Sign Out
export const signOut = async () => {
  return firebaseSignOut(auth);
};

// Password Reset
export const resetPassword = async (email) => {
  // Implementation for password reset
};

// Google Sign In
export const googleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

// GitHub Sign In
export const githubSignIn = async () => {
  const provider = new GithubAuthProvider();
  return signInWithPopup(auth, provider);
};

// Phone Sign In
export const setUpRecaptcha = (phoneNumber) => {
  const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {});
  recaptchaVerifier.render();
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
};

// Get Current User
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};
