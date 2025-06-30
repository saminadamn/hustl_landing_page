import React from 'react';
import { Volume2 } from 'lucide-react';
import { StarBorder } from './ui/star-border';

interface VoiceAssistantButtonProps {
  onClick: () => void;
}

const VoiceAssistantButton: React.FC<VoiceAssistantButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-6 right-6 z-30">
      <StarBorder color="#0038FF">
        <button
          onClick={onClick}
          className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all"
          title="Voice Assistant"
        >
          <Volume2 className="w-6 h-6" />
        </button>
      </StarBorder>
    </div>
  );
};

export default VoiceAssistantButton;