import React, { useState, useEffect } from 'react';
import { Volume2, Mic, X, Settings, Zap, Search, Package, Wallet, User, HelpCircle, Shield } from 'lucide-react';
import { elevenLabsService } from '../lib/elevenLabsService';
import { toast } from 'react-hot-toast';
import { StarBorder } from './ui/star-border';
import VoiceTaskCreator from './VoiceTaskCreator';
import VoiceTaskAcceptor from './VoiceTaskAcceptor';
import VoiceAssistantTutorial from './VoiceAssistantTutorial';
import { Location } from '../lib/locationService';

interface VoiceAssistantManagerProps {
  onClose: () => void;
  userLocation?: Location | null;
  onCreateTask?: () => void;
  onBrowseTasks?: () => void;
  onOpenWallet?: () => void;
  onOpenProfile?: () => void;
  onOpenHelp?: () => void;
  onOpenSafety?: () => void;
}

const VoiceAssistantManager: React.FC<VoiceAssistantManagerProps> = ({
  onClose,
  userLocation,
  onCreateTask,
  onBrowseTasks,
  onOpenWallet,
  onOpenProfile,
  onOpenHelp,
  onOpenSafety
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTaskCreator, setShowTaskCreator] = useState(false);
  const [showTaskAcceptor, setShowTaskAcceptor] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        setTranscript(transcript);
      };
      
      recognition.onend = () => {
        if (isListening) {
          recognition.start();
        }
      };
      
      setRecognitionInstance(recognition);
    }
    
    // Welcome message
    const welcomeMessage = "Hello! I'm your Hustl voice assistant. How can I help you today?";
    speakText(welcomeMessage);
    
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, []);

  useEffect(() => {
    // Check if we should show the tutorial
    const tutorialShown = localStorage.getItem('voiceAssistantTutorialShown');
    if (!tutorialShown) {
      setShowTutorial(true);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (!recognitionInstance) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }
    
    setIsListening(true);
    recognitionInstance.start();
    toast.success('Listening...');
  };

  const stopListening = () => {
    if (!recognitionInstance) return;
    
    setIsListening(false);
    recognitionInstance.stop();
    
    if (transcript.trim()) {
      processCommand(transcript);
    }
  };

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    await elevenLabsService.speakText(text);
    setIsSpeaking(false);
  };

  const processCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Create task commands
    if (lowerCommand.includes('create task') || 
        lowerCommand.includes('new task') || 
        lowerCommand.includes('post task') ||
        lowerCommand.includes('make task')) {
      setResponse("Opening task creator...");
      await speakText("I'll help you create a task. Let me open the task creator.");
      setShowTaskCreator(true);
      return;
    }
    
    // Find/accept task commands
    if (lowerCommand.includes('find task') || 
        lowerCommand.includes('search task') || 
        lowerCommand.includes('browse task') ||
        lowerCommand.includes('accept task')) {
      setResponse("Opening task search...");
      await speakText("I'll help you find tasks to accept. Let me open the task browser.");
      setShowTaskAcceptor(true);
      return;
    }
    
    // Wallet commands
    if (lowerCommand.includes('wallet') || 
        lowerCommand.includes('money') || 
        lowerCommand.includes('balance') ||
        lowerCommand.includes('payment')) {
      setResponse("Opening your wallet...");
      await speakText("Opening your wallet now.");
      onOpenWallet?.();
      return;
    }
    
    // Profile commands
    if (lowerCommand.includes('profile') || 
        lowerCommand.includes('account') || 
        lowerCommand.includes('my info')) {
      setResponse("Opening your profile...");
      await speakText("Opening your profile now.");
      onOpenProfile?.();
      return;
    }
    
    // Help commands
    if (lowerCommand.includes('help') || 
        lowerCommand.includes('support') || 
        lowerCommand.includes('faq')) {
      setResponse("Opening help center...");
      await speakText("Opening the help center now.");
      onOpenHelp?.();
      return;
    }
    
    // Safety commands
    if (lowerCommand.includes('safety') || 
        lowerCommand.includes('security') || 
        lowerCommand.includes('emergency')) {
      setResponse("Opening safety features...");
      await speakText("Opening safety features now.");
      onOpenSafety?.();
      return;
    }
    
    // Tutorial commands
    if (lowerCommand.includes('tutorial') || 
        lowerCommand.includes('guide') || 
        lowerCommand.includes('how to use')) {
      setResponse("Opening tutorial...");
      await speakText("Let me show you how to use the voice assistant.");
      setShowTutorial(true);
      return;
    }
    
    // Close/exit commands
    if (lowerCommand.includes('close') || 
        lowerCommand.includes('exit') || 
        lowerCommand.includes('quit')) {
      setResponse("Closing voice assistant...");
      await speakText("Closing the voice assistant now. Goodbye!");
      onClose();
      return;
    }
    
    // If no specific command is recognized
    setResponse("I'm not sure how to help with that. You can ask me to create a task, find tasks, open your wallet, view your profile, get help, or check safety features.");
    await speakText("I'm not sure how to help with that. You can ask me to create a task, find tasks, open your wallet, view your profile, get help, or check safety features.");
  };

  const handleTaskCreated = (taskId: string) => {
    setShowTaskCreator(false);
    onCreateTask?.();
  };

  const handleTaskAccepted = (taskId: string) => {
    setShowTaskAcceptor(false);
    onBrowseTasks?.();
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem('voiceAssistantTutorialShown', 'true');
  };

  if (showTutorial) {
    return <VoiceAssistantTutorial onClose={handleTutorialComplete} />;
  }

  if (showTaskCreator) {
    return (
      <VoiceTaskCreator 
        onClose={() => setShowTaskCreator(false)} 
        onTaskCreated={handleTaskCreated}
        userLocation={userLocation}
      />
    );
  }

  if (showTaskAcceptor) {
    return (
      <VoiceTaskAcceptor 
        onClose={() => setShowTaskAcceptor(false)} 
        onTaskAccepted={handleTaskAccepted}
        userLocation={userLocation}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#002B7F] to-[#0038FF] text-white">
          <h2 className="text-xl font-bold flex items-center">
            <Volume2 className="w-6 h-6 mr-2" />
            Hustl Voice Assistant
          </h2>
          <div className="flex items-center">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors mr-2"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {showSettings ? (
          <div className="p-6">
            <h3 className="font-semibold mb-4">Voice Assistant Settings</h3>
            
            <div className="space-y-4">
              <button
                onClick={() => setShowTutorial(true)}
                className="w-full bg-blue-50 p-4 rounded-lg text-left hover:bg-blue-100 transition-colors flex items-center"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <HelpCircle className="w-5 h-5 text-[#0038FF]" />
                </div>
                <div>
                  <h4 className="font-medium">Tutorial</h4>
                  <p className="text-sm text-gray-600">Learn how to use the voice assistant</p>
                </div>
              </button>
              
              <div className="pt-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Back to Assistant
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="bg-gray-50 rounded-xl p-4 mb-6 min-h-[200px] max-h-[300px] overflow-y-auto">
              {response ? (
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
                      <Volume2 className="w-4 h-4 text-[#0038FF]" />
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm flex-1">
                      <p className="text-gray-800">{response}</p>
                    </div>
                  </div>
                  
                  {transcript && (
                    <div className="flex items-start justify-end">
                      <div className="bg-[#0038FF] p-3 rounded-lg shadow-sm text-white flex-1 max-w-[80%]">
                        <p>{transcript}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#0038FF] flex items-center justify-center ml-2 flex-shrink-0">
                        <Mic className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Volume2 className="w-8 h-8 text-[#0038FF]" />
                  </div>
                  <p className="text-gray-600 mb-2">How can I help you today?</p>
                  <p className="text-sm text-gray-500">Click the microphone button to start speaking</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => {
                  setShowTaskCreator(true);
                }}
                className="bg-gradient-to-r from-[#FF5A1F] to-[#E63A0B] text-white p-3 rounded-lg flex items-center justify-center hover:opacity-90 transition-colors shadow-md"
              >
                <Package className="w-5 h-5 mr-2" />
                Create Task
              </button>
              
              <button
                onClick={() => {
                  setShowTaskAcceptor(true);
                }}
                className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white p-3 rounded-lg flex items-center justify-center hover:opacity-90 transition-colors shadow-md"
              >
                <Search className="w-5 h-5 mr-2" />
                Find Tasks
              </button>
              
              <button
                onClick={() => {
                  onOpenWallet?.();
                  onClose();
                }}
                className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white p-3 rounded-lg flex items-center justify-center hover:opacity-90 transition-colors shadow-md"
              >
                <Wallet className="w-5 h-5 mr-2" />
                My Wallet
              </button>
              
              <button
                onClick={() => {
                  onOpenProfile?.();
                  onClose();
                }}
                className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white p-3 rounded-lg flex items-center justify-center hover:opacity-90 transition-colors shadow-md"
              >
                <User className="w-5 h-5 mr-2" />
                My Profile
              </button>
            </div>
            
            <div className="flex justify-center mb-6">
              <StarBorder color={isListening ? "#FF5A1F" : "#0038FF"}>
                <button
                  onClick={toggleListening}
                  disabled={isSpeaking}
                  className={`p-4 rounded-full ${
                    isListening 
                      ? 'bg-gradient-to-r from-[#FF5A1F] to-[#E63A0B]' 
                      : 'bg-gradient-to-r from-[#0038FF] to-[#0021A5]'
                  } text-white flex items-center justify-center w-16 h-16 shadow-lg`}
                >
                  {isListening ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </button>
              </StarBorder>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              {isListening 
                ? "I'm listening... Click to stop" 
                : isSpeaking 
                  ? "I'm speaking..."
                  : "Click the microphone and ask me anything"}
            </div>
            
            <div className="mt-4">
              <div className="text-xs text-gray-500 text-center">
                Try saying:
              </div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                <button 
                  onClick={() => processCommand("Create a new task")}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full transition-colors"
                >
                  "Create a new task"
                </button>
                <button 
                  onClick={() => processCommand("Find tasks near me")}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full transition-colors"
                >
                  "Find tasks near me"
                </button>
                <button 
                  onClick={() => processCommand("Open my wallet")}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full transition-colors"
                >
                  "Open my wallet"
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistantManager;