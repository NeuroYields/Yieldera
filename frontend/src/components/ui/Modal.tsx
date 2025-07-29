import { ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = ({ open, onClose, children, title, size = 'md' }: ModalProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className={`
          bg-cyber-black border-2 border-green-500 rounded-lg w-full ${sizes[size]}
          shadow-2xl shadow-green-500/20 transform transition-all duration-300
        `}>
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-green-500/30">
              <h2 className="text-cyber-green font-retro text-sm text-glow-sm">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-cyber-green hover:text-green-400 transition-colors duration-200 text-xl font-bold"
              >
                ×
              </button>
            </div>
          )}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};