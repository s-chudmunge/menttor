// @ts-nocheck
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Activity,
  BookOpen,
  Award,
  Bell,
  HelpCircle,
  Shield
} from 'lucide-react';

interface ProfileDropdownProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export default function ProfileDropdown({ className = '', variant = 'light' }: ProfileDropdownProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/auth/signin');
  };

  const menuItems = [
    {
      icon: <User className="w-4 h-4" />,
      label: 'Profile & Settings',
      action: () => router.push('/profile'),
      description: 'Manage account & preferences'
    },
    {
      icon: <BookOpen className="w-4 h-4" />,
      label: 'My Journey',
      action: () => router.push('/journey'),
      description: 'View your learning paths'
    },
    {
      icon: <Activity className="w-4 h-4" />,
      label: 'Performance',
      action: () => router.push('/performance-analysis'),
      description: 'Track learning progress'
    },
    { type: 'divider' },
    {
      icon: <HelpCircle className="w-4 h-4" />,
      label: 'Help & Support',
      action: () => router.push('/help'),
      description: 'Get assistance'
    },
    {
      icon: <LogOut className="w-4 h-4" />,
      label: 'Sign Out',
      action: handleSignOut,
      description: 'Sign out of account'
    }
  ];

  if (!user) return null;

  const getInitials = (displayName: string | null, email: string | null) => {
    if (displayName) {
      return displayName.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          variant === 'dark' 
            ? 'hover:bg-slate-700 focus:ring-offset-slate-900' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900'
        }`}
      >
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {getInitials(user.displayName, user.email)}
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
          variant === 'dark' ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'
        }`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute right-0 sm:right-0 mt-2 w-screen max-w-xs sm:w-80 mx-4 sm:mx-0 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 ${
          variant === 'dark' 
            ? 'bg-slate-800 border border-slate-700' 
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        }`}
             style={{ right: 'clamp(1rem, 0px, 1rem)' }}>
          {/* User Info Header */}
          <div className={`px-4 py-3 border-b ${
            variant === 'dark' ? 'border-slate-700' : 'border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {getInitials(user.displayName, user.email)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${
                  variant === 'dark' ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>
                  {user.displayName || 'User'}
                </p>
                <p className={`text-xs truncate ${
                  variant === 'dark' ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {user.email}
                </p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {menuItems.map((item, index) => {
              if (item.type === 'divider') {
                return (
                  <div key={index} className={`h-px my-1 ${
                    variant === 'dark' ? 'bg-slate-700' : 'bg-gray-200 dark:bg-gray-700'
                  }`}></div>
                );
              }

              return (
                <button
                  key={index}
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-150 group ${
                    variant === 'dark' 
                      ? 'hover:bg-slate-700' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150 mr-3 ${
                    variant === 'dark'
                      ? 'bg-slate-700 group-hover:bg-blue-900/30'
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
                  }`}>
                    <div className={`transition-colors duration-150 ${
                      variant === 'dark'
                        ? 'text-gray-300 group-hover:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    }`}>
                      {item.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      variant === 'dark' ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>
                      {item.label}
                    </p>
                    <p className={`text-xs truncate ${
                      variant === 'dark' ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}