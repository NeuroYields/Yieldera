import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-cyber-green font-retro text-xs mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            cyber-input w-full
            ${error ? 'border-red-500 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-red-400 font-retro text-xs">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-green-400/70 font-retro text-xs">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';