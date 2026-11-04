'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none ' +
      'focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-hidden focus-visible:ring-offset-2 focus-visible:ring-offset-white ' +
      'disabled:opacity-40 disabled:cursor-not-allowed min-h-[42px] active:scale-[0.98]';

    const variantStyles = {
      primary:
        'bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow-sm border border-blue-700 font-bold',
      secondary:
        'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 shadow-xs font-semibold',
      outline:
        'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 shadow-xs font-semibold',
      amber:
        'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs border border-amber-600',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-xs border border-rose-700 font-semibold',
      ghost:
        'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs rounded-lg min-h-[36px]',
      md: 'px-4.5 py-2 text-sm rounded-xl',
      lg: 'px-6 py-3 text-base font-bold min-h-[48px] rounded-xl',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
