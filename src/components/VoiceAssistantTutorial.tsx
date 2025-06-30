import React, { useState } from 'react';
import { X, Volume2, Mic, MessageSquare, Zap, ArrowRight } from 'lucide-react';
import { elevenLabsService } from '../lib/elevenLabsService';
import { StarBorder } from './ui/star-border';

interface VoiceAssistantTutorialProps {
  onClose: () => void;
}

const VoiceAssistantTutorial: React.FC<VoiceAssistantTutorialProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const totalSteps = 3;
  
  const playStepAudio = async (step: number) => {
    setIsPlayingAudio(true);
    
    let message = "";
    switch(step) {
      case 1:
        message = "Welcome to the Hustl Voice Assistant! I'm here to help you navigate the platform using just your voice.";
        break;
      case 2:
        message = "You can ask me to create tasks, browse available tasks, check your wallet, and much more. Just click the microphone button and start speaking.";
        break;
      case 3:
        message = "Try saying commands like 'Create a new task', 'Show me available tasks', or 'Open my wallet'. I'm here to make your Hustl experience even easier!";
        break;
      default:
        message = "Let's get started with Hustl Voice Assistant!";
    }
    
    await elevenLabsService.speakText(message);
    setIsPlayingAudio(false);
  };
  
  const nextStep = () => {
    if (currentStep < totalSteps) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      playStepAudio(newStep);
    } else {
      onClose();
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      playStepAudio(newStep);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#002B7F] to-[#0038FF] text-white">
          <h2 className="text-xl font-bold flex items-center">
            <Volume2 className="w-6 h-6 mr-2" />
            Voice Assistant Tutorial
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          
          {/* Step Content */}
          <div className="mb-8">
            {currentStep === 1 && (
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Volume2 className="w-10 h-10 text-[#0038FF]" />
                </div>
                <h3 className="text-xl font-bold mb-4">Meet Your Voice Assistant</h3>
                <p className="text-gray-600 mb-4">
                  Your personal AI assistant that helps you navigate Hustl using just your voice.
                </p>
                <button
                  onClick={() => playStepAudio(1)}
                  disabled={isPlayingAudio}
                  className="bg-blue-100 text-[#0038FF] px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center mx-auto"
                >
                  <Volume2 className={`w-5 h-5 mr-2 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                  Listen to Introduction
                </button>
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mic className="w-10 h-10 text-[#0038FF]" />
                </div>
                <h3 className="text-xl font-bold mb-4">How It Works</h3>
                <p className="text-gray-600 mb-4">
                  Click the microphone button, speak your command, and let the assistant do the rest.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium mb-2">Example Commands:</h4>
                  <ul className="text-left space-y-2">
                    <li className="flex items-center">
                      <ArrowRight className="w-4 h-4 text-[#0038FF] mr-2" />
                      "Create a new task"
                    </li>
                    <li className="flex items-center">
                      <ArrowRight className="w-4 h-4 text-[#0038FF] mr-2" />
                      "Show me available tasks"
                    </li>
                    <li className="flex items-center">
                      <ArrowRight className="w-4 h-4 text-[#0038FF] mr-2" />
                      "Open my wallet"
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => playStepAudio(2)}
                  disabled={isPlayingAudio}
                  className="bg-blue-100 text-[#0038FF] px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center mx-auto"
                >
                  <Volume2 className={`w-5 h-5 mr-2 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                  Listen to Examples
                </button>
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-10 h-10 text-[#0038FF]" />
                </div>
                <h3 className="text-xl font-bold mb-4">Ready to Try?</h3>
                <p className="text-gray-600 mb-4">
                  Your voice assistant is ready to help you navigate Hustl. Click the floating voice button anytime to get started.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-4">
                  <p className="text-gray-700">
                    The voice assistant button is always available in the bottom right corner of your screen.
                  </p>
                </div>
                <button
                  onClick={() => playStepAudio(3)}
                  disabled={isPlayingAudio}
                  className="bg-blue-100 text-[#0038FF] px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center mx-auto"
                >
                  <Volume2 className={`w-5 h-5 mr-2 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                  Listen to Tips
                </button>
              </div>
            )}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between">
            {currentStep > 1 ? (
              <button
                onClick={prevStep}
                disabled={isPlayingAudio}
                className="text-[#0038FF] hover:text-[#0021A5] font-medium"
              >
                Back
              </button>
            ) : (
              <div></div> // Empty div to maintain layout
            )}
            
            <StarBorder color={currentStep === totalSteps ? "#FF5A1F" : "#0038FF"}>
              <button
                onClick={nextStep}
                disabled={isPlayingAudio}
                className={`px-4 py-2 rounded-lg font-semibold text-white flex items-center ${
                  currentStep === totalSteps
                    ? 'bg-gradient-to-r from-[#FF5A1F] to-[#E63A0B]'
                    : 'bg-gradient-to-r from-[#0038FF] to-[#0021A5]'
                }`}
              >
                {currentStep === totalSteps ? 'Get Started' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </StarBorder>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantTutorial;