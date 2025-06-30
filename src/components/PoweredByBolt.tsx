import React from 'react';

interface PoweredByBoltProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'footer';
}

const PoweredByBolt: React.FC<PoweredByBoltProps> = ({ 
  className = '', 
  position = 'bottom-right' 
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2',
    'footer': 'relative'
  };

  return (
    <a
      href="https://bolt.new"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block transition-all duration-300 hover:opacity-90 ${positionClasses[position]} ${className}`}
    >
      <img 
        src="/black_circle_360x360.png" 
        alt="Powered by Bolt" 
        className="w-12 h-12 rounded-full shadow-md hover:shadow-lg transition-shadow"
      />
    </a>
  );
};

export default PoweredByBolt;