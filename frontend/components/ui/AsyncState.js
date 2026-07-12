import React from 'react';
import StatusMessage from './StatusMessage';
import { SpinnerIcon } from './Icons';

const AsyncState = ({
  variant,
  loadingMessage = 'Loading...',
  errorTitle = 'Error',
  errorMessage,
  emptyMessage = 'No items found.',
  action = null,
  className = '',
}) => {
  if (variant === 'loading') {
    return (
      <div className={`flex flex-col items-center justify-center h-64 text-slate ${className}`}>
        <SpinnerIcon className="w-8 h-8 animate-spin mb-2" />
        <p>{loadingMessage}</p>
      </div>
    );
  }

  if (variant === 'error') {
    return (
      <div className={`flex flex-col gap-4 ${className}`}>
        <StatusMessage type="error" title={errorTitle} message={errorMessage} />
        {action && <div className="flex justify-center">{action}</div>}
      </div>
    );
  }

  if (variant === 'empty') {
    return (
      <div className={`text-center py-10 text-slate-400 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return null;
};

export default AsyncState;