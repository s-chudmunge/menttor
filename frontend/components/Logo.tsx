'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

// Logo component with updated branding

const Logo = () => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (!mounted) {
    return (
      <Link href="/" className="hover:opacity-80 transition-opacity ml-4">
        <img 
          src="/favicon_io_light/android-chrome-192x192.png"
          alt="Menttor" 
          className="h-8 w-8"
        />
      </Link>
    );
  }

  const themeFolder = isDark ? 'favicon_io_light' : 'favicon_io_dark';

  return (
    <Link href="/" className="hover:opacity-80 transition-opacity ml-4">
      <img 
        src={`/${themeFolder}/android-chrome-192x192.png`}
        alt="Menttor" 
        className="h-8 w-8"
      />
    </Link>
  );
};

export default Logo;
