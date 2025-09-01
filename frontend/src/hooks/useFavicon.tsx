'use client';

import { useEffect, useState } from 'react';

export function useFavicon() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const themeFolder = isDark ? 'favicon_io_light' : 'favicon_io_dark';
    
    const updateFavicon = (selector: string, href: string) => {
      const link = document.querySelector(selector) as HTMLLinkElement;
      if (link) {
        link.href = href;
      }
    };

    updateFavicon('link[rel="icon"][type="image/x-icon"]', `/${themeFolder}/favicon.ico`);
    updateFavicon('link[rel="icon"][sizes="16x16"]', `/${themeFolder}/favicon-16x16.png`);
    updateFavicon('link[rel="icon"][sizes="32x32"]', `/${themeFolder}/favicon-32x32.png`);
    updateFavicon('link[rel="apple-touch-icon"]', `/${themeFolder}/apple-touch-icon.png`);
  }, [isDark]);
}