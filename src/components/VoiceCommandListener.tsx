import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { elevenLabsService } from '../lib/elevenLabsService';
import { toast } from 'react-hot-toast';

interface VoiceCommandListenerProps {
  onCommand: (command: string) => void;
}

const VoiceCommandListener: React.FC<VoiceCommandListenerProps> = ({ onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        setTranscript(transcript);
        
        // Check for wake word "Hey Hustl"
        if (transcript.toLowerCase().includes('hey hustl')) {
          const command = transcript.toLowerCase().replace('hey hustl', '').trim();
          if (command) {
            processCommand(command);
          } else {
            elevenLabsService.speakText("How can I help you?");
          }
        }
      };
      
      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }
    
    setIsListening(true);
    recognitionRef.current.start();
    toast.success('Listening for "Hey Hustl" commands');
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    setIsListening(false);
    recognitionRef.current.stop();
    setTranscript('');
  };

  const processCommand = (command: string) => {
    // Process the command and call the onCommand callback
    onCommand(command);
    
    // Reset transcript
    setTranscript('');
  };

  return (
    <div className="fixed bottom-6 left-6 z-30">
      <button
        onClick={toggleListening}
        className={`p-3 rounded-full shadow-lg flex items-center justify-center ${
          isListening 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
        } transition-colors`}
        title={isListening ? 'Stop listening' : 'Start listening for voice commands'}
      >
        {isListening ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </button>
      
      {isListening && (
        <div className="absolute bottom-16 left-0 bg-white p-3 rounded-lg shadow-lg min-w-[200px]">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm font-medium">Listening...</span>
          </div>
          {transcript && (
            <div className="text-xs text-gray-600 max-w-[200px] truncate">
              "{transcript}"
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">
            Say "Hey Hustl" followed by your command
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCommandListener;