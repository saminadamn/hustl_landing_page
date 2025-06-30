import React, { ReactNode, useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
  showCloseButton = true
}) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`bg-white rounded-lg w-full ${maxWidth} ${isMobile ? 'max-h-[95vh] modal-mobile-full mobile-slide-in' : 'max-h-[90vh]'} overflow-hidden shadow-2xl`}>
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#002B7F] to-[#0038FF] text-white">
          <h2 className="text-xl font-bold">{title}</h2>
          {showCloseButton && (
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors touch-target"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
        
        <div className="overflow-y-auto" style={{ maxHeight: isMobile ? 'calc(95vh - 4rem)' : 'calc(90vh - 4rem)' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveModal;