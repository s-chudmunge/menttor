import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, loading, ...rest }) => {
  return (
    <button
      className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      type="submit"
      disabled={loading}
      {...rest}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

export default Button;
