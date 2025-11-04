'use client';

import { forwardRef } from 'react';

export const Input = forwardRef(function Input({ 
  label, 
  error, 
  icon: Icon,
  fullWidth = true,
  className = '',
  ...props 
}, ref) {
  const widthStyle = fullWidth ? 'w-full' : '';
  
  return (
    <div className={widthStyle}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          ref={ref}
          className={`
            block w-full rounded-xl border-2 py-3 px-4
            bg-white
            text-gray-900
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'}
            focus:outline-none focus:ring-2 focus:ring-offset-0
            placeholder:text-gray-400
            transition-colors
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});
