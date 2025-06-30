import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, X, Zap, Package, Search, Wallet, User, HelpCircle, Shield } from 'lucide-react';
import { elevenLabsService } from '../lib/elevenLabsService';
import { toast } from 'react-hot-toast';
import { StarBorder } from './ui/star-border';
import { Location } from '../lib/locationService';

interface VoiceAssistantProps {
  onClose: () => void;
  userLocation?: Location | null;
}

// Create a singleton pattern to ensure only one instance can play audio
const audioManager = {
  isPlaying: false,
  currentAudio: null as HTMLAudioElement | null,
  
  async playAudio(audioUrl: string): Promise<void> {
    // If already playing, stop current audio
    if (this.isPlaying && this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    
    this.isPlaying = true;
    
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.isPlaying = false;
        this.currentAudio = null;
        resolve();
      };
      
      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        this.isPlaying = false;
        this.currentAudio = null;
        console.warn('Audio playback error:', e);
        resolve(); // Resolve anyway to prevent blocking
      };
      
      // Use a try-catch block for the play() call
      try {
        const playPromise = audio.play();
        
        // Modern browsers return a promise from play()
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('Audio playback error:', err.message);
            URL.revokeObjectURL(audioUrl);
            this.isPlaying = false;
            this.currentAudio = null;
            resolve(); // Resolve anyway to prevent blocking
          });
        }
      } catch (err) {
        console.warn('Audio playback error:', err);
        URL.revokeObjectURL(audioUrl);
        this.isPlaying = false;
        this.currentAudio = null;
        resolve(); // Resolve anyway to prevent blocking
      }
    });
  },
  
  stopAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }
};

export default function VoiceAssistant({ onClose, userLocation }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setTranscript(finalTranscript);
            processVoiceCommand(finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event) => {
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    } else {
      setError('Speech recognition is not supported in this browser.');
    }

    // Initial welcome message
    const welcomeMessage = "Hi there! I'm your Hustl voice assistant. How can I help you today?";
    speakResponse(welcomeMessage);
    setResponse(welcomeMessage);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // Stop any playing audio when component unmounts
      audioManager.stopAudio();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, response]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setError(null);
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoiceCommand = async (command: string) => {
    setIsProcessing(true);
    
    try {
      // Simple command processing
      const lowerCommand = command.toLowerCase();
      let responseText = '';

      if (lowerCommand.includes('create task') || lowerCommand.includes('new task')) {
        responseText = "I'll help you create a new task. What type of task would you like to create?";
        // Trigger task creation
        window.dispatchEvent(new CustomEvent('create-task'));
        onClose();
      } else if (lowerCommand.includes('find tasks') || lowerCommand.includes('browse tasks')) {
        responseText = "I'll show you available tasks near you.";
        // Trigger task browsing
        window.dispatchEvent(new CustomEvent('view-tasks'));
        onClose();
      } else if (lowerCommand.includes('wallet') || lowerCommand.includes('balance')) {
        responseText = "Opening your wallet now.";
        // Trigger wallet opening
        window.dispatchEvent(new CustomEvent('open-wallet'));
        onClose();
      } else if (lowerCommand.includes('profile') || lowerCommand.includes('account')) {
        responseText = "Taking you to your profile.";
        // Trigger profile opening
        window.dispatchEvent(new CustomEvent('open-profile'));
        onClose();
      } else if (lowerCommand.includes('help') || lowerCommand.includes('support')) {
        responseText = "Opening the help center for you.";
        // Trigger help opening
        window.dispatchEvent(new CustomEvent('open-faq'));
        onClose();
      } else if (lowerCommand.includes('safety') || lowerCommand.includes('security')) {
        responseText = "Opening safety features for you.";
        // Trigger safety features
        window.dispatchEvent(new CustomEvent('open-safety'));
        onClose();
      } else if (lowerCommand.includes('close') || lowerCommand.includes('exit')) {
        responseText = "Closing the voice assistant. Goodbye!";
        await speakResponse(responseText);
        onClose();
        return;
      } else {
        responseText = "I understand you said: " + command + ". How can I help you with that? You can ask me to create tasks, browse tasks, check your wallet, view your profile, get help, or access safety features.";
      }

      setResponse(responseText);
      
      // Speak the response if audio is enabled
      if (isAudioEnabled) {
        await speakResponse(responseText);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      setError('Failed to process voice command');
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = async (text: string) => {
    if (!isAudioEnabled || isSpeaking) return;
    
    setIsSpeaking(true);
    setVoiceError(null);
    
    try {
      // Use the modified ElevenLabs service that uses the audio manager
      await elevenLabsService.speakText(text, undefined, audioManager);
    } catch (error: any) {
      console.warn('Voice synthesis failed:', error.message);
      setVoiceError(error.message);
      // Don't show error to user, just disable audio silently
      setIsAudioEnabled(false);
    } finally {
      setIsSpeaking(false);
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    setVoiceError(null);
    
    // If turning off audio, stop any playing audio
    if (isAudioEnabled) {
      audioManager.stopAudio();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-6 h-6" />
              <h2 className="text-lg font-bold">Voice Assistant</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAudio}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title={isAudioEnabled ? "Disable audio" : "Enable audio"}
              >
                {isAudioEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 h-64 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {response && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start">
                <Volume2 className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  {response}
                </p>
              </div>
            </div>
          )}

          {transcript && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-lg">
              <div className="flex items-start">
                <Mic className="w-5 h-5 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-purple-800">
                  <strong>You said:</strong> {transcript}
                </p>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0038FF] mr-2"></div>
                Processing your request...
              </p>
            </div>
          )}

          {isSpeaking && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg">
              <p className="text-sm text-green-700 flex items-center">
                <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
                Speaking...
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Buttons */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('create-task'));
                onClose();
              }}
              className="flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors"
            >
              <Zap className="w-5 h-5 text-[#FF5A1F] mb-1" />
              <span className="text-xs">Create Task</span>
            </button>
            
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('view-tasks'));
                onClose();
              }}
              className="flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors"
            >
              <Search className="w-5 h-5 text-[#0038FF] mb-1" />
              <span className="text-xs">Find Tasks</span>
            </button>
            
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-wallet'));
                onClose();
              }}
              className="flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors"
            >
              <Wallet className="w-5 h-5 text-[#0038FF] mb-1" />
              <span className="text-xs">Wallet</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t bg-white">
          <div className="flex justify-center">
            <StarBorder color={isListening ? "#FF5A1F" : "#0038FF"}>
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing || isSpeaking}
                className={`p-4 rounded-full ${
                  isListening
                    ? 'bg-gradient-to-r from-[#FF5A1F] to-[#E63A0B] text-white'
                    : 'bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed w-16 h-16 flex items-center justify-center`}
              >
                {isListening ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>
            </StarBorder>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            {isListening ? 'Tap to stop listening' : 'Tap to start speaking'}
          </p>
        </div>
      </div>
    </div>
  );
}