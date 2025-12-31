import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, className }) => {
  const [show, setShow] = React.useState(false);

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
          <div
            className={`absolute bottom-full mb-2 z-50
              min-w-max px-3 py-2 bg-gray-800 text-white text-xs rounded-md shadow-lg
              ${className || ''}
            `}
          >
            {content}
          </div>
        )}
    </div>
  );
};

export default Tooltip;