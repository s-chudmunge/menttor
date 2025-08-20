import React from 'react';

interface SocialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider: 'google' | 'github' | 'phone';
}

const SocialButton: React.FC<SocialButtonProps> = ({ provider, children, ...rest }) => {
  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          iconSrc: '/google.svg',
          bgColor: 'bg-white/20',
          textColor: 'text-white',
          borderColor: 'border-white/30',
          hoverBg: 'hover:bg-white/30'
        };
      case 'github':
        return {
          iconSrc: '/github.svg',
          bgColor: 'bg-white/20',
          textColor: 'text-white',
          borderColor: 'border-white/30',
          hoverBg: 'hover:bg-white/30'
        };
      case 'phone':
        return {
          iconSrc: null,
          bgColor: 'bg-white/20',
          textColor: 'text-white',
          borderColor: 'border-white/30',
          hoverBg: 'hover:bg-white/30'
        };
      default:
        return {
          iconSrc: null,
          bgColor: 'bg-white/20',
          textColor: 'text-white',
          borderColor: 'border-white/30',
          hoverBg: 'hover:bg-white/30'
        };
    }
  };

  const config = getProviderConfig();

  return (
    <button
      className={`flex items-center justify-center w-full py-3 px-4 backdrop-blur-sm border ${config.borderColor} rounded-xl shadow-sm text-sm font-medium ${config.textColor} ${config.bgColor} ${config.hoverBg} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-50`}
      {...rest}
    >
      {provider === 'phone' ? (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ) : config.iconSrc ? (
        <img src={config.iconSrc} alt={`${provider} logo`} className="w-5 h-5 mr-3" />
      ) : null}
      {children}
    </button>
  );
};

export default SocialButton;
