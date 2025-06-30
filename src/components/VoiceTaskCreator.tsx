import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Loader, Check, Volume2, Zap, Package, Clock, MapPin, DollarSign, Send } from 'lucide-react';
import { elevenLabsService } from '../lib/elevenLabsService';
import { toast } from 'react-hot-toast';
import { StarBorder } from './ui/star-border';
import { Location, geocodeAddress } from '../lib/locationService';
import { auth } from '../lib/firebase';
import { taskService } from '../lib/database';

interface VoiceTaskCreatorProps {
  onClose: () => void;
  onTaskCreated: (taskId: string) => void;
  userLocation?: Location | null;
}

const VoiceTaskCreator: React.FC<VoiceTaskCreatorProps> = ({ onClose, onTaskCreated, userLocation }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskData, setTaskData] = useState<any>({
    title: '',
    description: '',
    category: 'delivery',
    estimated_time: '30 minutes',
    price: 10,
    location: userLocation?.address || 'University of Florida',
    location_coords: userLocation || null
  });
  const [step, setStep] = useState<'initial' | 'confirmation' | 'processing' | 'success'>('initial');
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

  useEffect(() => {
    // Welcome message when component mounts
    const welcomeMessage = "Welcome to voice task creation. Tell me what task you need help with, and I'll create it for you. You can describe the task, location, and budget.";
    speakText(welcomeMessage);
  }, []);

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
    toast.success('Listening...');
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    setIsListening(false);
    recognitionRef.current.stop();
    
    if (transcript.trim()) {
      processTranscript(transcript);
    }
  };

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    await elevenLabsService.speakText(text);
    setIsSpeaking(false);
  };

  const processTranscript = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Extract task information from the transcript
      const extractedData = extractTaskData(text);
      
      // Update task data with extracted information
      const updatedTaskData = {
        ...taskData,
        ...extractedData
      };
      
      // If location was mentioned but not geocoded, try to geocode it
      if (extractedData.location && !extractedData.location_coords) {
        try {
          const coords = await geocodeAddress(extractedData.location);
          updatedTaskData.location_coords = coords;
        } catch (error) {
          console.error('Error geocoding location:', error);
        }
      }
      
      setTaskData(updatedTaskData);
      
      // Move to confirmation step
      setStep('confirmation');
      
      // Speak confirmation
      const confirmationMessage = `I've created a task titled "${updatedTaskData.title}" with a budget of $${updatedTaskData.price}. The task will take place at ${updatedTaskData.location}. Is this correct? Say yes to confirm or no to try again.`;
      await speakText(confirmationMessage);
      
      // Reset transcript and start listening for confirmation
      setTranscript('');
      startListening();
      
    } catch (error) {
      console.error('Error processing transcript:', error);
      toast.error('Error processing your request');
      speakText("I'm sorry, I couldn't process your task. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const extractTaskData = (text: string): Partial<typeof taskData> => {
    const data: Partial<typeof taskData> = {};
    
    // Extract title - usually the first sentence or the whole text if short
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      data.title = sentences[0].trim();
    } else {
      data.title = text.trim();
    }
    
    // Extract description - the rest of the text
    if (sentences.length > 1) {
      data.description = sentences.slice(1).join('. ').trim();
    } else {
      data.description = text.trim();
    }
    
    // Extract price
    const priceMatch = text.match(/\$(\d+(\.\d{1,2})?)/);
    if (priceMatch) {
      data.price = parseFloat(priceMatch[1]);
    } else {
      // Try to find numbers that might be prices
      const numberMatches = text.match(/(\d+(\.\d{1,2})?) dollars/);
      if (numberMatches) {
        data.price = parseFloat(numberMatches[1]);
      }
    }
    
    // Extract location
    const locationKeywords = ['at', 'in', 'near', 'around', 'by'];
    for (const keyword of locationKeywords) {
      const regex = new RegExp(`${keyword} ([^.!?]+)`, 'i');
      const match = text.match(regex);
      if (match) {
        data.location = match[1].trim();
        break;
      }
    }
    
    // Extract time
    const timeMatches = text.match(/(\d+)\s*(minute|minutes|hour|hours)/i);
    if (timeMatches) {
      const amount = parseInt(timeMatches[1]);
      const unit = timeMatches[2].toLowerCase();
      if (unit.includes('hour')) {
        data.estimated_time = `${amount} hour${amount !== 1 ? 's' : ''}`;
      } else {
        data.estimated_time = `${amount} minute${amount !== 1 ? 's' : ''}`;
      }
    }
    
    // Extract category
    const categoryKeywords = {
      'coffee': 'coffee_run',
      'food': 'delivery',
      'deliver': 'delivery',
      'pickup': 'delivery',
      'print': 'academic_help',
      'study': 'academic_help',
      'notes': 'academic_help',
      'dog': 'pet_care',
      'pet': 'pet_care',
      'cat': 'pet_care',
      'ride': 'transportation',
      'drive': 'transportation',
      'car': 'transportation'
    };
    
    const lowerText = text.toLowerCase();
    for (const [keyword, category] of Object.entries(categoryKeywords)) {
      if (lowerText.includes(keyword)) {
        data.category = category;
        break;
      }
    }
    
    return data;
  };

  const handleConfirmation = async () => {
    const lowerTranscript = transcript.toLowerCase();
    
    if (lowerTranscript.includes('yes') || lowerTranscript.includes('correct') || lowerTranscript.includes('confirm')) {
      // User confirmed, create the task
      setStep('processing');
      stopListening();
      
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('You must be logged in to create a task');
        }
        
        // Create task
        const taskId = await taskService.createTask({
          ...taskData,
          created_by: user.uid,
          status: 'open'
        });
        
        setStep('success');
        
        // Speak success message
        await speakText("Great! Your task has been created successfully. You'll be notified when someone accepts it.");
        
        // Notify parent component
        onTaskCreated(taskId);
        
      } catch (error) {
        console.error('Error creating task:', error);
        toast.error('Error creating task');
        speakText("I'm sorry, there was an error creating your task. Please try again.");
        setStep('initial');
      }
    } else if (lowerTranscript.includes('no') || lowerTranscript.includes('wrong') || lowerTranscript.includes('incorrect')) {
      // User rejected, go back to initial step
      setStep('initial');
      stopListening();
      speakText("Let's try again. Please describe the task you need help with.");
    }
  };

  useEffect(() => {
    if (step === 'confirmation' && transcript) {
      handleConfirmation();
    }
  }, [transcript, step]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#002B7F] to-[#0038FF] text-white">
          <h2 className="text-xl font-bold flex items-center">
            <Zap className="w-6 h-6 mr-2" />
            Voice Task Creator
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {step === 'initial' && (
            <>
              <div className="bg-blue-50 p-4 rounded-xl mb-6">
                <p className="text-gray-700">
                  Describe the task you need help with. Include details like:
                </p>
                <ul className="mt-2 space-y-1">
                  <li className="flex items-center text-sm">
                    <Package className="w-4 h-4 text-[#0038FF] mr-2" />
                    <span>What you need help with</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 text-[#0038FF] mr-2" />
                    <span>Where it needs to be done</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-[#0038FF] mr-2" />
                    <span>How long it might take</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 text-[#0038FF] mr-2" />
                    <span>Your budget (e.g., $10)</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6 min-h-[100px]">
                {transcript ? (
                  <p className="text-gray-700">{transcript}</p>
                ) : (
                  <p className="text-gray-500 text-center">
                    {isListening ? "I'm listening..." : "Click the microphone to start speaking"}
                  </p>
                )}
              </div>
              
              <div className="flex justify-center mb-6">
                <StarBorder color={isListening ? "#FF5A1F" : "#0038FF"}>
                  <button
                    onClick={toggleListening}
                    disabled={isSpeaking || isProcessing}
                    className={`p-4 rounded-full ${
                      isListening 
                        ? 'bg-gradient-to-r from-[#FF5A1F] to-[#E63A0B]' 
                        : 'bg-gradient-to-r from-[#0038FF] to-[#0021A5]'
                    } text-white flex items-center justify-center w-16 h-16 shadow-lg`}
                  >
                    {isProcessing ? (
                      <Loader className="w-6 h-6 animate-spin" />
                    ) : isListening ? (
                      <X className="w-6 h-6" />
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </button>
                </StarBorder>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                {isListening 
                  ? "I'm listening... Click to stop when you're done" 
                  : isSpeaking 
                    ? "I'm speaking..."
                    : "Click the microphone and describe your task"}
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">Example: "I need someone to pick up coffee from Starbucks at Marston Library. My budget is $10 and it should take about 15 minutes."</p>
              </div>
            </>
          )}
          
          {step === 'confirmation' && (
            <>
              <div className="bg-blue-50 p-4 rounded-xl mb-6">
                <h3 className="font-semibold mb-2">Task Summary</h3>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <Package className="w-5 h-5 text-[#0038FF] mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Title</p>
                      <p className="text-gray-700">{taskData.title}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-[#0038FF] mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Estimated Time</p>
                      <p className="text-gray-700">{taskData.estimated_time}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-[#0038FF] mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-gray-700">{taskData.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <DollarSign className="w-5 h-5 text-[#0038FF] mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Budget</p>
                      <p className="text-gray-700">${taskData.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6 min-h-[60px]">
                {transcript ? (
                  <p className="text-gray-700">{transcript}</p>
                ) : (
                  <p className="text-gray-500 text-center">
                    {isListening ? "Say 'yes' to confirm or 'no' to try again" : "Click the microphone to confirm"}
                  </p>
                )}
              </div>
              
              <div className="flex justify-center mb-6">
                <StarBorder color={isListening ? "#FF5A1F" : "#0038FF"}>
                  <button
                    onClick={toggleListening}
                    disabled={isSpeaking || isProcessing}
                    className={`p-4 rounded-full ${
                      isListening 
                        ? 'bg-gradient-to-r from-[#FF5A1F] to-[#E63A0B]' 
                        : 'bg-gradient-to-r from-[#0038FF] to-[#0021A5]'
                    } text-white flex items-center justify-center w-16 h-16 shadow-lg`}
                  >
                    {isProcessing ? (
                      <Loader className="w-6 h-6 animate-spin" />
                    ) : isListening ? (
                      <X className="w-6 h-6" />
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </button>
                </StarBorder>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                Is this correct? Say "yes" to confirm or "no" to try again.
              </div>
            </>
          )}
          
          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader className="w-8 h-8 text-[#0038FF] animate-spin" />
              </div>
              <h3 className="text-xl font-bold mb-2">Creating Your Task</h3>
              <p className="text-gray-600">Please wait while we create your task...</p>
            </div>
          )}
          
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Task Created!</h3>
              <p className="text-gray-600 mb-6">Your task has been created successfully.</p>
              
              <StarBorder color="#0038FF">
                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center"
                >
                  <Send className="w-5 h-5 mr-2" />
                  View My Tasks
                </button>
              </StarBorder>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceTaskCreator;