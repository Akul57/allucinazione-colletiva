import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles =
    'py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';

  const variants = {
    primary:
      'bg-gradient-to-r from-neon-purple to-indigo-600 text-white shadow-neon-purple/50 hover:shadow-neon-purple',
    secondary:
      'bg-gray-800 border border-gray-600 text-gray-200 hover:bg-gray-700',
    danger:
      'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-red-500/50',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
