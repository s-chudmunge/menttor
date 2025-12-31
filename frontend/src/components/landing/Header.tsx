// @ts-nocheck
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Logo from '@rootComponents/Logo';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#testimonials', label: 'Testimonials' },
  ];

  return (
    <header className="bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex-shrink-0">
            <Logo />
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            {!loading && (
              user ? (
                <Link
                  href="/"
                  className="hidden md:inline-block bg-black text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Home
                </Link>
              ) : (
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="hidden md:inline-block bg-black text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </button>
              )
            )}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black"
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-gray-200 pt-4">
              {!loading && (
                user ? (
                  <Link
                    href="/"
                    className="bg-black text-white block w-full text-center px-4 py-2 rounded-md text-base font-medium"
                  >
                    Home
                  </Link>
                ) : (
                  <button
                    onClick={() => router.push('/auth/signin')}
                    className="bg-black text-white block w-full text-center px-4 py-2 rounded-md text-base font-medium"
                  >
                    Sign In
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
