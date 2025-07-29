import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glowing?: boolean;
}

export const Card = ({ children, className = '', glowing = false }: CardProps) => {
  return (
    <div className={`
      bg-black/50 border border-green-500 rounded-lg p-6
      ${glowing ? 'shadow-lg shadow-green-500/20' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};