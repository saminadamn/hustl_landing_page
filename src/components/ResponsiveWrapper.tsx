import React, { ReactNode } from 'react';

interface ResponsiveWrapperProps {
  children: ReactNode;
  className?: string;
}

const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default ResponsiveWrapper;