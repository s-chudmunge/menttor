import React from 'react';
import Link from 'next/link';

// Logo component with updated branding

const Logo = () => (
  <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
    <img 
      src="/logo_final_nobg.svg" 
      alt="Menttor Logo" 
      className="h-42 w-auto"
    />
  </Link>
);

export default Logo;
