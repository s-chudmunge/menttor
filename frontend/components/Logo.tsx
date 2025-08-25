import React from 'react';
import Link from 'next/link';

const Logo = () => (
  <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
    {/* Modern minimalist icon */}
    <div className="relative">
      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white">
          <path 
            fill="currentColor" 
            d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"
          />
        </svg>
      </div>
      {/* Subtle glow effect */}
      <div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-lg blur-sm opacity-30 -z-10"></div>
    </div>
    
    {/* Clean, modern text */}
    <div className="flex flex-col">
      <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-none">
        Menttor
      </span>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide leading-none mt-0.5">
        Smart Learning
      </span>
    </div>
  </Link>
);

export default Logo;
