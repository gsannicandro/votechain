// frontend/components/ui/IconButton.js
import React from 'react';

const IconButton = ({ onClick, isLoading, children, className = '' }) => {
  return (
    <button 
      onClick={onClick}
      disabled={isLoading}
      className={`p-2 bg-bgpage rounded-lg text-slate hover:text-secondary transition-all ${isLoading ? 'animate-spin cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export default IconButton;