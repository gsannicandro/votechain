// frontend/components/ui/Badge.js
import React from 'react';

const variants = {
  success: "bg-success-bg text-success border-success/10",
  warning: "bg-warning-bg text-warning border-warning/10",
  error:   "bg-error-bg text-error border-error/10",
  info:    "bg-info-bg text-info border-info/10",
  default: "bg-gray-100 text-gray-600 border-gray-200"
};

const Badge = ({ variant = 'default', children, icon }) => {
  const className = variants[variant] || variants.default;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${className}`}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;