import React from 'react';
import { SpinnerIcon } from './Icons';

const Button = ({ onClick, disabled, isLoading, children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "w-full py-4 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none";
  
  const variants = {
    primary: "bg-secondary hover:bg-opacity-90 text-white shadow-secondary/25",
    secondary: "bg-white border border-gray-200 text-charcoal hover:bg-gray-50 hover:text-primary shadow-sm",
    danger: "bg-error-bg hover:bg-error-bg/80 text-error border border-error/20"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />
          Elaborazione...
        </>
      ) : children}
    </button>
  );
};

export default Button;