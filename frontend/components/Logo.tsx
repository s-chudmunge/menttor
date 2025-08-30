import React from 'react';
import Link from 'next/link';

const Logo = () => (
  <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
    <img 
      src="/logo.svg" 
      alt="Menttor Logo" 
      className="h-16 w-auto"
    />
  </Link>
);

export default Logo;
