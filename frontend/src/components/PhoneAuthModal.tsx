'use client';

import React, { useState } from 'react';
import { sendOTP, verifyOTP } from '../lib/auth/utils';
import { ArrowLeft } from 'lucide-react';

interface PhoneAuthModalProps {
  onSuccess: (user: any) => void;
  onError: (error: string) => void;
  onBack: () => void;
}

const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({ onSuccess, onError, onBack }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (phone: string) => {
    // Add country code if not present
    if (!phone.startsWith('+')) {
      return `+1${phone}`;
    }
    return phone;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      onError('Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      await sendOTP(formattedPhone);
      setStep('otp');
      onError(''); // Clear any previous errors
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      onError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      onError('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const result = await verifyOTP(formattedPhone, otp);
      onSuccess(result.user);
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      onError(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    onError('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {step === 'phone' && (
        <div>
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Sign in with Phone
            </h2>
            <p className="text-blue-200">
              Enter your phone number to receive a verification code
            </p>
          </div>

          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-blue-100 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                required
              />
              <p className="text-xs text-blue-300 mt-2">
                Include country code (e.g., +1 for US)
              </p>
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
                  Sending Code...
                </span>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="flex items-center justify-center gap-2 text-sm text-blue-300 hover:text-white focus:outline-none focus:underline transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to other options
            </button>
          </div>
        </div>
      )}

      {step === 'otp' && (
        <div>
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Enter Verification Code
            </h2>
            <p className="text-blue-200">
              We sent a 6-digit code to <span className="text-white font-semibold">{phoneNumber}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-blue-100 mb-2">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-center text-xl tracking-widest transition-all"
                required
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify Code'
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={handleBackToPhone}
              className="flex items-center justify-center gap-2 text-sm text-blue-300 hover:text-white focus:outline-none focus:underline transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Change phone number
            </button>
            <button
              onClick={() => handleSendOTP({ preventDefault: () => {} } as React.FormEvent)}
              className="text-sm text-blue-300 hover:text-white focus:outline-none focus:underline transition-colors"
              disabled={loading}
            >
              Didn't receive a code? Resend
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneAuthModal;
