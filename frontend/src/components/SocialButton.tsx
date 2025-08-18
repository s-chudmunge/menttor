import React from 'react';

interface SocialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider: 'google' | 'github';
}

const SocialButton: React.FC<SocialButtonProps> = ({ provider, children, ...rest }) => {
  const iconSrc = provider === 'google' ? '/google.svg' : '/github.svg'; // Assuming these SVGs exist in public folder
  const bgColor = provider === 'google' ? 'bg-white' : 'bg-gray-800';
  const textColor = provider === 'google' ? 'text-gray-700' : 'text-white';
  const borderColor = provider === 'google' ? 'border-gray-300' : 'border-gray-600';

  return (
    <button
      className={`flex items-center justify-center w-full py-2 px-4 border ${borderColor} rounded-md shadow-sm text-sm font-medium ${textColor} ${bgColor} hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out`}
      {...rest}
    >
      <img src={iconSrc} alt={`${provider} logo`} className="w-5 h-5 mr-2" />
      {children}
    </button>
  );
};

export default SocialButton;
