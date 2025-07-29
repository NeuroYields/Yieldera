import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  loading = false,
  className = '',
  disabled,
  ...props 
}: ButtonProps) => {
  const baseClasses = 'font-retro uppercase tracking-wider transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-transparent border-2 border-green-500 text-cyber-green hover:bg-green-500/20 hover:shadow-lg hover:shadow-green-500/50',
    secondary: 'bg-green-500/20 border border-green-500 text-cyber-green hover:bg-green-500/30',
    outline: 'bg-transparent border border-green-400 text-green-400 hover:bg-green-400/10',
    ghost: 'bg-transparent text-cyber-green hover:bg-green-500/10'
  };

  const sizes = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-xs',
    lg: 'px-6 py-3 text-sm'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-cyber-green border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};