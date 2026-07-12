import React from 'react';

const StatusMessage = ({ title, message, type = 'info', icon }) => {
  const styles = {
    info: "bg-info-bg border-info/20",
    warning: "bg-warning-bg border-warning/20",
    error: "bg-error-bg border-error/20",
    success: "bg-success-bg border-success/20"
  };

  const textStyles = {
    info: "text-info",
    warning: "text-warning",
    error: "text-error",
    success: "text-success"
  };

  const defaultIcons = {
    info: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  return (
    <div className={`flex p-4 rounded-xl border ${styles[type]} text-left`}>
      <div className={`${textStyles[type]}`}>
        {icon || defaultIcons[type]}
      </div>
      <div className="ml-3">
        <h3 className={`text-sm font-bold ${textStyles[type]}`}>{title}</h3>
        <div className={`text-sm opacity-80 mt-1 ${textStyles[type]}`}>{message}</div>
      </div>
    </div>
  );
};

export default StatusMessage;