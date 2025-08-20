'use client';

import React, { useState } from 'react';
import { sendPasswordReset } from '../lib/auth/utils';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
  onBack: () => void;
  onError: (error: string) => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onBack, onError }) => {
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      onError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      onError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setStep('sent');
      onError(''); // Clear any previous errors
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      // Handle specific Firebase errors
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }
      
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    onError('');
  };

  const handleResendEmail = async () => {
    await handleSendReset({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {step === 'email' && (
        <div>
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Reset Password
            </h2>
            <p className="text-blue-200">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          <form onSubmit={handleSendReset} className="space-y-5">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-blue-100 mb-2">
                Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                required
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="flex items-center justify-center gap-2 text-sm text-blue-300 hover:text-white focus:outline-none focus:underline transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </button>
          </div>
        </div>
      )}

      {step === 'sent' && (
        <div>
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Check Your Email
            </h2>
            <p className="text-blue-200 mb-4">
              We've sent a password reset link to
            </p>
            <p className="text-white font-semibold text-lg mb-6">
              {email}
            </p>
            <p className="text-blue-200 text-sm">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-500/20 border border-blue-400/50 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-blue-100 text-sm font-medium">Check your spam folder</p>
                  <p className="text-blue-200 text-xs mt-1">Sometimes reset emails end up in spam or junk folders</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleResendEmail}
              disabled={loading}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/30 text-white font-medium py-3 px-6 rounded-xl hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Resend Email'}
            </button>
          </div>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={handleBackToEmail}
              className="flex items-center justify-center gap-2 text-sm text-blue-300 hover:text-white focus:outline-none focus:underline transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Try different email
            </button>
            <button
              onClick={onBack}
              className="text-sm text-blue-300 hover:text-white focus:outline-none focus:underline transition-colors"
            >
              Back to sign in
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordModal;