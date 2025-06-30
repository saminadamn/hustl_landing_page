import React, { useState, useEffect } from 'react';
import { CheckCircle, X, Calendar, Clock, Users, MessageSquare, Star, ArrowRight, Sparkles, Volume as VolumeUp } from 'lucide-react';
import { taskService } from '../lib/database';
import { elevenLabsService } from '../lib/elevenLabsService';
import { StarBorder } from './ui/star-border';

interface TaskCreationSuccessProps {
  taskId: string;
  onClose: () => void;
  onViewTask?: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  velocity: { x: number; y: number };
  size: number;
}

const CONFETTI_COLORS = ['#FA4616', '#0F2557', '#FFD700', '#FF69B4', '#00CED1', '#32CD32', '#FF6347'];

// Audio manager singleton for TaskCreationSuccess
const taskCreationAudioManager = {
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
        reject(e);
      };
      
      audio.play().catch(err => {
        this.isPlaying = false;
        this.currentAudio = null;
        reject(err);
      });
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

const TaskCreationSuccess: React.FC<TaskCreationSuccessProps> = ({ taskId, onClose, onViewTask }) => {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [showConfetti, setShowConfetti] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);

  useEffect(() => {
    loadTask();
    createConfetti();
    
    // Stop confetti after 3 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
    
    // Play success message only once
    if (!hasPlayedAudio) {
      playSuccessMessage();
      setHasPlayedAudio(true);
    }

    return () => {
      clearTimeout(timer);
      // Clean up any playing audio
      taskCreationAudioManager.stopAudio();
    };
  }, [taskId]);

  useEffect(() => {
    if (!showConfetti) return;

    const animateConfetti = () => {
      setConfetti(prevConfetti => 
        prevConfetti.map(piece => ({
          ...piece,
          x: piece.x + piece.velocity.x,
          y: piece.y + piece.velocity.y,
          rotation: piece.rotation + 5,
          velocity: {
            x: piece.velocity.x * 0.99,
            y: piece.velocity.y + 0.3 // gravity
          }
        })).filter(piece => piece.y < window.innerHeight + 50)
      );
    };

    const interval = setInterval(animateConfetti, 16);
    return () => clearInterval(interval);
  }, [showConfetti]);

  const createConfetti = () => {
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 100; i++) {
      pieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -50,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        velocity: {
          x: (Math.random() - 0.5) * 10,
          y: Math.random() * 5 + 2
        },
        size: Math.random() * 8 + 4
      });
    }
    setConfetti(pieces);
  };

  const loadTask = async () => {
    try {
      const taskData = await taskService.getTaskById(taskId);
      setTask(taskData);
    } catch (error) {
      console.error('Error loading task:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const playSuccessMessage = async () => {
    // Check if we've already played this message in this session
    const messageKey = `task_creation_${taskId}`;
    if (sessionStorage.getItem(messageKey) === 'played') {
      return;
    }
    
    setIsPlayingAudio(true);
    try {
      await elevenLabsService.speakText(
        "Congratulations! Your task has been created successfully. It's now live and visible to potential helpers. You'll receive notifications when someone accepts your task.",
        undefined,
        taskCreationAudioManager
      );
      // Mark this message as played in this session
      sessionStorage.setItem(messageKey, 'played');
    } catch (error) {
      console.warn('Error playing success message:', error);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const timelineSteps = [
    {
      id: 1,
      title: 'Task Posted',
      description: 'Your task is now live and visible to students',
      status: 'completed',
      icon: <CheckCircle className="w-5 h-5" />,
      time: 'Just now'
    },
    {
      id: 2,
      title: 'Waiting for Helper',
      description: 'Students can now view and accept your task',
      status: 'current',
      icon: <Users className="w-5 h-5" />,
      time: 'In progress'
    },
    {
      id: 3,
      title: 'Task Accepted',
      description: 'A student will accept your task and you can start chatting',
      status: 'pending',
      icon: <MessageSquare className="w-5 h-5" />,
      time: 'Pending'
    },
    {
      id: 4,
      title: 'In Progress',
      description: 'Track your helper\'s progress with live updates',
      status: 'pending',
      icon: <Clock className="w-5 h-5" />,
      time: 'Pending'
    },
    {
      id: 5,
      title: 'Task Completed',
      description: 'Rate your experience and complete the task',
      status: 'pending',
      icon: <Star className="w-5 h-5" />,
      time: 'Pending'
    }
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F2557] mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-60">
          {confetti.map(piece => (
            <div
              key={piece.id}
              className="absolute"
              style={{
                left: piece.x,
                top: piece.y,
                transform: `rotate(${piece.rotation}deg)`,
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '0%'
              }}
            />
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-green-50 to-blue-50 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 shadow-md">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  Task Created Successfully!
                  <Sparkles className="w-6 h-6 text-yellow-500 ml-2 animate-pulse" />
                </h2>
                <p className="text-gray-600 mt-1">Your task is now live and ready for helpers</p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={playSuccessMessage}
                disabled={isPlayingAudio}
                className={`mr-2 p-2 rounded-full ${isPlayingAudio ? 'bg-blue-100 text-[#0038FF]' : 'text-gray-500 hover:text-[#0038FF] hover:bg-blue-50'} transition-colors`}
                aria-label="Play audio message"
              >
                <VolumeUp className={`w-5 h-5 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
              </button>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Task Summary */}
        {task && (
          <div className="p-6 border-b bg-gray-50">
            <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
            <p className="text-gray-600 mb-3">{task.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {task.estimated_time}
              </span>
              <span className="flex items-center font-semibold text-[#0F2557]">
                {task.price === 0 ? 'FREE' : `$${task.price}`}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                {task.status.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-[#0F2557]" />
            What Happens Next
          </h3>
          
          <div className="space-y-4">
            {timelineSteps.map((step, index) => (
              <div key={step.id} className="flex items-start">
                <div className="flex flex-col items-center mr-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.status === 'completed' 
                      ? 'bg-green-100 text-green-600' 
                      : step.status === 'current'
                      ? 'bg-blue-100 text-blue-600 animate-pulse'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.icon}
                  </div>
                  {index < timelineSteps.length - 1 && (
                    <div className={`w-0.5 h-8 mt-2 ${
                      step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
                
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${
                      step.status === 'completed' 
                        ? 'text-green-800' 
                        : step.status === 'current'
                        ? 'text-blue-800'
                        : 'text-gray-600'
                    }`}>
                      {step.title}
                    </h4>
                    <span className="text-xs text-gray-500">{step.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                  {/* Current step indicator */}
                  {step.status === 'current' && (
                    <div className="mt-2 flex items-center text-sm text-[#0021A5] font-medium">
                      <div className="w-2 h-2 bg-[#0021A5] rounded-full mr-2 animate-pulse"></div>
                      Current Status
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="p-6 bg-blue-50 border-t">
          <h4 className="font-semibold text-blue-900 mb-3">💡 Pro Tips for Success</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              Respond quickly to messages from potential helpers
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              Be specific about meeting locations and timing
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              Rate your helper after completion to build community trust
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t bg-white">
          <div className="flex space-x-3">
            <StarBorder color="#0F2557" className="flex-1">
              <button
                onClick={onViewTask}
                className="w-full bg-gradient-to-r from-[#0F2557] to-[#0A1B3D] text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center"
              >
                View My Task
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </StarBorder>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition duration-200"
            >
              Close
            </button>
          </div>
          
          <p className="text-center text-xs text-gray-500 mt-3">
            You'll receive notifications when someone accepts your task
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskCreationSuccess;