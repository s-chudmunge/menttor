import React from 'react';
import Link from 'next/link';

// Logo component with updated branding

const Logo = () => (
  <Link href="/" className="hover:opacity-80 transition-opacity ml-4">
    <img 
      src="/favicon_io (2)/android-chrome-192x192.png" 
      alt="Menttor" 
      className="h-8 w-8"
    />
  </Link>
);

export default Logo;
