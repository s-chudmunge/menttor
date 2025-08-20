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
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
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

// Password Reset - Send reset email
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/auth/reset-password`,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Verify password reset code
export const verifyResetCode = async (code) => {
  try {
    const email = await verifyPasswordResetCode(auth, code);
    return { email, valid: true };
  } catch (error) {
    console.error('Error verifying password reset code:', error);
    throw error;
  }
};

// Confirm password reset with new password
export const confirmPasswordResetWithCode = async (code, newPassword) => {
  try {
    await confirmPasswordReset(auth, code, newPassword);
    return { success: true };
  } catch (error) {
    console.error('Error confirming password reset:', error);
    throw error;
  }
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

// Phone Sign In - Set up reCAPTCHA and send OTP
export const setUpRecaptcha = (containerId = 'recaptcha-container') => {
  const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    'size': 'invisible',
    'callback': (response) => {
      // reCAPTCHA solved, allow signInWithPhoneNumber
    }
  });
  return recaptchaVerifier;
};

export const sendOTP = async (phoneNumber, recaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

export const verifyOTP = async (confirmationResult, otp) => {
  try {
    const result = await confirmationResult.confirm(otp);
    return result;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
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
