import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Loader, Check, Volume2, Zap, Package, Clock, MapPin, DollarSign, Search, Filter, User } from 'lucide-react';
import { elevenLabsService } from '../lib/elevenLabsService';
import { toast } from 'react-hot-toast';
import { StarBorder } from './ui/star-border';
import { Location } from '../lib/locationService';
import { auth, db } from '../lib/firebase';
import { taskService } from '../lib/database';
import { doc, runTransaction, collection } from 'firebase/firestore';

interface VoiceTaskAcceptorProps {
  onClose: () => void;
  onTaskAccepted: (taskId: string) => void;
  userLocation?: Location | null;
}

const VoiceTaskAcceptor: React.FC<VoiceTaskAcceptorProps> = ({ onClose, onTaskAccepted, userLocation }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [step, setStep] = useState<'search' | 'results' | 'confirmation' | 'processing' | 'success'>('search');
  const recognitionRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

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
    
    // Load available tasks
    loadTasks();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    // Welcome message when component mounts
    const welcomeMessage = "Welcome to voice task search. Tell me what kind of task you're looking for, and I'll find matching tasks for you. You can mention keywords like 'coffee', 'delivery', or 'printing'.";
    speakText(welcomeMessage);
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to browse tasks');
      }
      
      // Get open tasks that weren't created by the current user
      const filters = [
        { field: 'status', operator: '==', value: 'open' },
        { field: 'created_by', operator: '!=', value: user.uid }
      ];
      
      const tasksData = await taskService.getTasks(filters);
      
      // Sort tasks by distance if user location is available
      let sortedTasks = tasksData;
      if (userLocation) {
        sortedTasks = tasksData.map(task => ({
          ...task,
          distance: calculateDistance(
            userLocation,
            task.location_coords || { lat: 0, lng: 0 }
          )
        })).sort((a, b) => a.distance - b.distance);
      }
      
      setTasks(sortedTasks);
      setFilteredTasks(sortedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Error loading tasks');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (loc1: Location, loc2: Location): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

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
      if (step === 'search') {
        searchTasks(transcript);
      } else if (step === 'results') {
        selectTaskByVoice(transcript);
      } else if (step === 'confirmation') {
        handleConfirmation(transcript);
      }
    }
  };

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    await elevenLabsService.speakText(text);
    setIsSpeaking(false);
  };

  const searchTasks = (query: string) => {
    setIsProcessing(true);
    
    try {
      // Extract keywords from the query
      const keywords = extractKeywords(query);
      
      // Filter tasks based on keywords
      const filtered = tasks.filter(task => {
        const taskText = `${task.title} ${task.description} ${task.category} ${task.location}`.toLowerCase();
        return keywords.some(keyword => taskText.includes(keyword));
      });
      
      setFilteredTasks(filtered);
      
      // Move to results step
      setStep('results');
      
      // Speak results
      let resultsMessage = '';
      if (filtered.length === 0) {
        resultsMessage = "I couldn't find any tasks matching your search. Would you like to try a different search?";
      } else {
        resultsMessage = `I found ${filtered.length} tasks that match your search. ${filtered.length > 0 ? "Here's the first one: " + filtered[0].title + ". Would you like to accept this task?" : ""}`;
        
        // Select the first task
        setSelectedTask(filtered[0]);
      }
      
      speakText(resultsMessage);
      
    } catch (error) {
      console.error('Error searching tasks:', error);
      toast.error('Error searching tasks');
      speakText("I'm sorry, I couldn't search for tasks. Please try again.");
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  const extractKeywords = (query: string): string[] => {
    // Remove common words and extract meaningful keywords
    const stopWords = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'find', 'looking', 'need', 'want', 'help', 'task', 'tasks'];
    
    const words = query.toLowerCase().split(/\W+/).filter(word => 
      word.length > 2 && !stopWords.includes(word)
    );
    
    // Add specific categories that might be mentioned
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
    
    // Add category keywords if they're mentioned
    for (const [keyword, category] of Object.entries(categoryKeywords)) {
      if (query.toLowerCase().includes(keyword)) {
        words.push(category);
      }
    }
    
    return words;
  };

  const selectTaskByVoice = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Check if user wants to accept the current task
    if (lowerText.includes('yes') || lowerText.includes('accept') || lowerText.includes('take')) {
      if (selectedTask) {
        // Move to confirmation step
        setStep('confirmation');
        
        // Speak confirmation
        const confirmationMessage = `You're about to accept the task "${selectedTask.title}" for $${selectedTask.price}. Is this correct? Say yes to confirm or no to go back.`;
        speakText(confirmationMessage);
      }
    } 
    // Check if user wants to see the next task
    else if (lowerText.includes('next') || lowerText.includes('another')) {
      const currentIndex = filteredTasks.findIndex(task => task.id === selectedTask?.id);
      if (currentIndex < filteredTasks.length - 1) {
        const nextTask = filteredTasks[currentIndex + 1];
        setSelectedTask(nextTask);
        
        // Speak next task
        const nextTaskMessage = `Here's the next task: ${nextTask.title}. Would you like to accept this task?`;
        speakText(nextTaskMessage);
      } else {
        speakText("That's all the tasks I found. Would you like to try a different search?");
      }
    }
    // Check if user wants to go back to search
    else if (lowerText.includes('back') || lowerText.includes('search') || lowerText.includes('different')) {
      setStep('search');
      setTranscript('');
      speakText("Let's try a different search. What kind of task are you looking for?");
    }
    // If none of the above, assume it's a new search
    else {
      searchTasks(text);
    }
  };

  const handleConfirmation = async (text: string) => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('yes') || lowerText.includes('correct') || lowerText.includes('confirm')) {
      // User confirmed, accept the task
      setStep('processing');
      stopListening();
      
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('You must be logged in to accept tasks');
        }
        
        // Check if this is the user's own task
        if (selectedTask.created_by === user.uid) {
          throw new Error('You cannot accept your own task');
        }
        
        // Use a transaction to update task and create progress
        await runTransaction(db, async (transaction) => {
          // Update task status and accepted_by
          const taskRef = doc(db, 'tasks', selectedTask.id);
          transaction.update(taskRef, {
            status: 'accepted',
            accepted_by: user.uid,
            updated_at: new Date()
          });
          
          // Create progress entry
          const progressRef = doc(collection(db, 'task_progress'));
          transaction.set(progressRef, {
            task_id: selectedTask.id,
            status: 'accepted',
            notes: 'Task accepted via voice assistant',
            created_at: new Date(),
            updated_at: new Date()
          });
        });
        
        setStep('success');
        
        // Speak success message
        await speakText(`Great! You've successfully accepted the task "${selectedTask.title}". You can now communicate with the task creator.`);
        
        // Notify parent component
        onTaskAccepted(selectedTask.id);
        
      } catch (error: any) {
        console.error('Error accepting task:', error);
        toast.error(error.message || 'Error accepting task');
        speakText(`I'm sorry, there was an error accepting the task: ${error.message || 'Please try again'}.`);
        setStep('results');
      }
    } else if (lowerText.includes('no') || lowerText.includes('wrong') || lowerText.includes('incorrect')) {
      // User rejected, go back to results step
      setStep('results');
      setTranscript('');
      speakText("No problem. Would you like to see another task or try a different search?");
    }
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)} meters`;
    }
    return `${distance.toFixed(1)} miles`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#002B7F] to-[#0038FF] text-white">
          <h2 className="text-xl font-bold flex items-center">
            <Search className="w-6 h-6 mr-2" />
            Voice Task Search
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {step === 'search' && (
            <>
              <div className="bg-blue-50 p-4 rounded-xl mb-6">
                <p className="text-gray-700">
                  Tell me what kind of task you're looking for. You can mention:
                </p>
                <ul className="mt-2 space-y-1">
                  <li className="flex items-center text-sm">
                    <Package className="w-4 h-4 text-[#0038FF] mr-2" />
                    <span>Task type (coffee, food, printing, etc.)</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 text-[#0038FF] mr-2" />
                    <span>Location on campus</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 text-[#0038FF] mr-2" />
                    <span>Price range</span>
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
                    : "Click the microphone and describe what you're looking for"}
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">Example: "I'm looking for coffee delivery tasks near the library"</p>
              </div>
            </>
          )}
          
          {step === 'results' && (
            <>
              <div className="mb-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Filter className="w-5 h-5 text-[#0038FF] mr-2" />
                  Search Results
                </h3>
                <p className="text-sm text-gray-600">
                  Found {filteredTasks.length} tasks matching your search
                </p>
              </div>
              
              {selectedTask ? (
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-md mb-6">
                  <h3 className="font-semibold text-lg mb-2">{selectedTask.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{selectedTask.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center text-sm">
                      <Clock className="w-4 h-4 text-[#0038FF] mr-1" />
                      <span>{selectedTask.estimated_time}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <DollarSign className="w-4 h-4 text-[#0038FF] mr-1" />
                      <span className="font-semibold">${selectedTask.price}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 text-[#0038FF] mr-1" />
                      <span className="truncate">{selectedTask.location}</span>
                    </div>
                    {selectedTask.distance !== undefined && (
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 text-[#0038FF] mr-1" />
                        <span>{formatDistance(selectedTask.distance)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-sm">{selectedTask.creator?.full_name || 'Anonymous'}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-xl mb-6 text-center">
                  <p className="text-gray-500">No tasks found matching your search</p>
                </div>
              )}
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6 min-h-[60px]">
                {transcript ? (
                  <p className="text-gray-700">{transcript}</p>
                ) : (
                  <p className="text-gray-500 text-center">
                    {isListening ? "I'm listening..." : selectedTask ? "Say 'yes' to accept this task, 'next' for another task, or 'search' to try again" : "Say 'search' to try a different search"}
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
                {selectedTask ? "Would you like to accept this task?" : "Would you like to try a different search?"}
              </div>
            </>
          )}
          
          {step === 'confirmation' && (
            <>
              <div className="bg-blue-50 p-4 rounded-xl mb-6">
                <h3 className="font-semibold mb-2">Confirm Task Acceptance</h3>
                <p className="text-gray-700 mb-3">
                  You're about to accept the following task:
                </p>
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="font-semibold">{selectedTask.title}</h4>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">{selectedTask.estimated_time}</span>
                    <span className="font-semibold">${selectedTask.price}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6 min-h-[60px]">
                {transcript ? (
                  <p className="text-gray-700">{transcript}</p>
                ) : (
                  <p className="text-gray-500 text-center">
                    {isListening ? "Say 'yes' to confirm or 'no' to go back" : "Click the microphone to confirm"}
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
                Is this correct? Say "yes" to confirm or "no" to go back.
              </div>
            </>
          )}
          
          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader className="w-8 h-8 text-[#0038FF] animate-spin" />
              </div>
              <h3 className="text-xl font-bold mb-2">Accepting Task</h3>
              <p className="text-gray-600">Please wait while we process your request...</p>
            </div>
          )}
          
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Task Accepted!</h3>
              <p className="text-gray-600 mb-6">You've successfully accepted the task.</p>
              
              <StarBorder color="#0038FF">
                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center"
                >
                  <Check className="w-5 h-5 mr-2" />
                  View Task Details
                </button>
              </StarBorder>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceTaskAcceptor;