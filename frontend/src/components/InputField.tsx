import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, id, error, ...rest }) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
        {label}
      </label>
      <input
        id={id}
        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
        {...rest}
      />
      {error && <p className="text-red-500 text-xs italic mt-1">{error}</p>}
    </div>
  );
};

export default InputField;
