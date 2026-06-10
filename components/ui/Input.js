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
            block w-full rounded-xl border py-3 px-4
            bg-white/80 backdrop-blur-sm
            text-slate-900
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}
            focus:outline-none
            placeholder:text-slate-400
            transition-all duration-200
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
