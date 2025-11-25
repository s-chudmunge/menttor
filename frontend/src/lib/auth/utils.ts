import { supabase } from '../supabase/client';
import type { User, AuthError } from '@supabase/supabase-js';

// Sign Up with Email
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

// Sign In with Email
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

// Sign Out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Password Reset - Send reset email
export const sendPasswordReset = async (email: string) => {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.live';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/reset-password`,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Confirm password reset with new password
export const confirmPasswordResetWithCode = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error confirming password reset:', error);
    throw error;
  }
};

// Get the appropriate redirect URL based on environment
const getRedirectUrl = () => {
  // Use NEXT_PUBLIC_SITE_URL if set, otherwise use production URL
  // Don't fallback to window.location.origin to avoid localhost issues in production
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.live';
  return `${siteUrl}/auth/callback`;
};

// Google Sign In
export const googleSignIn = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getRedirectUrl(),
    },
  });

  if (error) throw error;
  return data;
};

// GitHub Sign In
export const githubSignIn = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: getRedirectUrl(),
    },
  });

  if (error) throw error;
  return data;
};

// Phone Sign In - Supabase handles OTP automatically
export const sendOTP = async (phoneNumber: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

export const verifyOTP = async (phoneNumber: string, token: string) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token,
      type: 'sms',
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

// Get Current User
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper function to get the current session
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Note: Supabase doesn't require reCAPTCHA setup like Firebase
// The setUpRecaptcha function is removed as Supabase handles bot protection internally
