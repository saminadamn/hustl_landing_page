import React, { createContext, useContext, useState, useEffect } from 'react';
import { elevenLabsService } from '../lib/elevenLabsService';

interface VoiceAssistantContextType {
  speak: (text: string) => Promise<void>;
  isListening: boolean;
  isSpeaking: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  lastCommand: string | null;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType>({
  speak: async () => {},
  isListening: false,
  isSpeaking: false,
  startListening: () => {},
  stopListening: () => {},
  transcript: '',
  lastCommand: null
});

export const useVoiceAssistant = () => useContext(VoiceAssistantContext);

interface VoiceAssistantProviderProps {
  children: React.ReactNode;
}

export const VoiceAssistantProvider: React.FC<VoiceAssistantProviderProps> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

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
            setLastCommand(command);
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

  const speak = async (text: string) => {
    if (!text.trim()) return;
    
    setIsSpeaking(true);
    await elevenLabsService.speakText(text);
    setIsSpeaking(false);
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    setIsListening(false);
    recognitionRef.current.stop();
    setTranscript('');
  };

  const value = {
    speak,
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    transcript,
    lastCommand
  };

  return (
    <VoiceAssistantContext.Provider value={value}>
      {children}
    </VoiceAssistantContext.Provider>
  );
};