// @ts-nocheck
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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
  Shield,
  Sun,
  Moon
} from 'lucide-react';

interface ProfileDropdownProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export default function ProfileDropdown({ className = '', variant = 'light' }: ProfileDropdownProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
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
      icon: theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      description: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`
    },
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
        className={`flex items-center space-x-1 p-1 rounded-full transition-colors duration-200 focus:outline-none ${
          variant === 'dark' 
            ? 'hover:bg-black' 
            : 'hover:bg-gray-100 dark:hover:bg-black'
        }`}
      >
        <div className="relative">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
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
        <div className={`absolute left-0 mt-1 w-56 rounded-lg shadow-xl py-1 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 ${
          variant === 'dark' 
            ? 'bg-black border border-gray-800' 
            : 'bg-white dark:bg-black border border-gray-200 dark:border-gray-800'
        }`}>
          {/* User Info Header */}
          <div className={`px-3 py-2 border-b ${
            variant === 'dark' ? 'border-gray-800' : 'border-gray-200 dark:border-gray-800'
          }`}>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {getInitials(user.displayName, user.email)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  variant === 'dark' ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>
                  {user.displayName || 'User'}
                </p>
                <p className={`text-xs truncate ${
                  variant === 'dark' ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {user.email}
                </p>
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
                  className={`w-full flex items-center px-3 py-2 text-left transition-colors duration-150 group ${
                    variant === 'dark' 
                      ? 'hover:bg-gray-900' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  <div className={`flex items-center justify-center w-4 h-4 mr-2 ${
                    variant === 'dark'
                      ? 'text-gray-400 group-hover:text-white'
                      : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      variant === 'dark' ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>
                      {item.label}
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