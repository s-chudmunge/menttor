// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@rootComponents/Logo';
import { Menu, X, ArrowRight } from 'lucide-react';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#testimonials', label: 'Testimonials' },
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm h-16' : 'bg-white h-20'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center">
            <Logo />
            <span className="ml-2 text-2xl font-black tracking-tighter text-gray-900 hidden sm:block">
              MENTTOR
            </span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-gray-600 hover:text-primary transition-colors text-sm font-semibold"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <button 
              onClick={() => {
                const element = document.getElementById('generate');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-md hover:shadow-lg flex items-center"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 transition-all duration-300 overflow-hidden ${
        isOpen ? 'max-h-64 py-4' : 'max-h-0'
      }`}>
        <div className="px-4 space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block text-gray-600 hover:text-primary py-2 text-base font-semibold"
            >
              {link.label}
            </a>
          ))}
          <button 
            onClick={() => {
                setIsOpen(false);
                const element = document.getElementById('generate');
                element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full mt-4 bg-primary text-white px-5 py-3 rounded-xl text-base font-bold flex items-center justify-center"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;