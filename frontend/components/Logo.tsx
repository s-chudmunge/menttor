import React, { useEffect, useState } from 'react';
import Link from 'next/link';

// Logo component with updated branding

const Logo = () => {
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

  const themeFolder = isDark ? 'favicon_io_dark' : 'favicon_io_light';

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
