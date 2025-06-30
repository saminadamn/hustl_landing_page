import React, { useState, useEffect } from 'react';
import { Volume2, X } from 'lucide-react';

interface VoiceCommandTooltipProps {
  onClose: () => void;
}

const VoiceCommandTooltip: React.FC<VoiceCommandTooltipProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow time for exit animation
    }, 8000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div 
      className={`fixed bottom-20 right-6 bg-white rounded-lg shadow-xl p-4 max-w-xs transition-all duration-300 z-20 border border-blue-100 ${
        isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
      }`}
    >
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start mb-2">
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          <Volume2 className="w-5 h-5 text-[#0038FF]" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">Voice Assistant Available</h3>
          <p className="text-sm text-gray-600">Click the button to use voice commands</p>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        Try saying "Hey Hustl, create a task" or "Hey Hustl, show me available tasks"
      </div>
    </div>
  );
};

export default VoiceCommandTooltip;