import React, { useState, useEffect, useRef } from 'react';
import { X, Package, Clock, Truck, Flag, CheckCircle, MessageSquare, ArrowRight, Star, Trophy, Zap, Shield, Volume as VolumeUp } from 'lucide-react';
import { taskService, taskProgressService, notificationService, userStatsService } from '../lib/database';
import { walletService } from '../lib/walletService';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';
import GameChat from './GameChat';
import { StarBorder } from './ui/star-border';
import { elevenLabsService } from '../lib/elevenLabsService';

// Audio manager singleton for TaskStatusUpdate
const taskStatusAudioManager = {
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

interface TaskStatusUpdateProps {
  task: any;
  onClose: () => void;
  onStatusUpdated: () => void;
}

const TaskStatusUpdate: React.FC<TaskStatusUpdateProps> = ({ task, onClose, onStatusUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [statusNote, setStatusNote] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasPlayedAudio, setHasPlayedAudio] = useState<{[key: string]: boolean}>({});
  const [openChatAfterUpdate, setOpenChatAfterUpdate] = useState(false);
  
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUser({ id: user.uid, email: user.email });
      
      // Determine the other user (creator or performer)
      const otherUserId = task.created_by === user.uid ? task.accepted_by : task.created_by;
      if (otherUserId) {
        setOtherUser({ id: otherUserId, full_name: 'Task ' + (task.created_by === user.uid ? 'Performer' : 'Creator') });
      }
    }
    
    // Clean up any playing audio when component unmounts
    return () => {
      taskStatusAudioManager.stopAudio();
    };
  }, [task]);

  const getNextStatus = (currentStatus: string): string => {
    const statusFlow = ['accepted', 'picked_up', 'in_progress', 'on_way', 'delivered', 'completed'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    
    if (currentIndex < 0 || currentIndex >= statusFlow.length - 1) {
      return 'completed'; // Default to completed if status not found or already at the end
    }
    
    return statusFlow[currentIndex + 1];
  };

  const getStatusLabel = (status: string): string => {
    const statusLabels = {
      'accepted': 'Accepted',
      'picked_up': 'Picked Up',
      'in_progress': 'In Progress',
      'on_way': 'On the Way',
      'delivered': 'Delivered',
      'completed': 'Completed'
    };
    
    return statusLabels[status] || status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'picked_up':
        return <Package className="w-6 h-6" />;
      case 'in_progress':
        return <Clock className="w-6 h-6" />;
      case 'on_way':
        return <Truck className="w-6 h-6" />;
      case 'delivered':
        return <Flag className="w-6 h-6" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6" />;
      default:
        return <CheckCircle className="w-6 h-6" />;
    }
  };

  const getStatusDescription = (status: string): string => {
    const descriptions = {
      'picked_up': 'Items have been collected',
      'in_progress': 'Task is being worked on',
      'on_way': 'Helper is heading to delivery location',
      'delivered': 'Task has been delivered',
      'completed': 'Task has been completed and verified'
    };
    
    return descriptions[status] || '';
  };

  const getXpForStatus = (status: string): number => {
    const xpValues = {
      'picked_up': 5,
      'in_progress': 10,
      'on_way': 15,
      'delivered': 20,
      'completed': 50
    };
    
    return xpValues[status] || 0;
  };

  const getStatusAnnouncement = (status: string): string => {
    const announcements = {
      'picked_up': `Great job! You've picked up the items for "${task.title}". Keep up the good work!`,
      'in_progress': `You're now working on "${task.title}". The task creator will be notified of your progress.`,
      'on_way': `You're on your way to deliver "${task.title}". The task creator can now track your location.`,
      'delivered': `You've successfully delivered "${task.title}". Almost done!`,
      'completed': `Congratulations! You've completed "${task.title}" and earned ${getXpForStatus('completed')} XP!`
    };
    
    return announcements[status] || `Status updated to ${getStatusLabel(status)}`;
  };

  const playStatusAnnouncement = async (status: string) => {
    // Check if we've already played this announcement
    const announcementKey = `status_${task.id}_${status}`;
    if (hasPlayedAudio[announcementKey]) {
      return;
    }
    
    setIsPlayingAudio(true);
    try {
      const announcement = getStatusAnnouncement(status);
      await elevenLabsService.speakText(announcement, undefined, taskStatusAudioManager);
      // Mark this announcement as played
      setHasPlayedAudio(prev => ({...prev, [announcementKey]: true}));
    } catch (error) {
      console.warn('Error playing status announcement:', error);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setLoading(true);
      
      // Create progress update
      await taskProgressService.createProgress({
        task_id: task.id,
        status: newStatus,
        notes: statusNote.trim() || `Task status updated to ${getStatusLabel(newStatus)}`,
      });
      
      // Update task status
      await taskService.updateTask(task.id, {
        status: newStatus
      });
      
      // If task is completed, handle completion logic
      if (newStatus === 'completed') {
        await handleTaskCompletion();
      }
      
      // Create notification for task creator
      await notificationService.createNotification({
        user_id: task.created_by,
        type: 'status',
        title: 'Task Status Updated',
        content: `Your task "${task.title}" is now ${newStatus.replace('_', ' ')}`,
        task_id: task.id,
        read: false
      });
      
      // Set XP gained for animation
      const xpGained = getXpForStatus(newStatus);
      setXpGained(xpGained);
      
      // Show confetti animation for completed tasks or significant progress
      if (newStatus === 'completed' || newStatus === 'delivered') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      
      toast.success(`Task status updated to ${getStatusLabel(newStatus)}`);
      
      // Play audio announcement
      await playStatusAnnouncement(newStatus);
      
      // If the user wants to chat, show the chat interface
      if (openChatAfterUpdate) {
        // Keep the modal open but reset the form
        setStatusNote('');
        setShowChat(true);
      } else {
        // Close the modal and notify parent
        onStatusUpdated();
      }
    } catch (error) {
      console.error('Error updating task progress:', error);
      toast.error('Error updating task progress');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCompletion = async () => {
    try {
      // If task has a price and a performer, transfer funds and update stats
      if (task.price > 0 && task.accepted_by) {
        // Transfer funds from creator to performer
        await walletService.transferFunds(
          task.created_by,
          task.accepted_by,
          task.price,
          task.id
        );
        
        // Update performer's stats
        await userStatsService.updateStatsOnTaskCompletion(
          task.accepted_by,
          task.price
        );
        
        // Check if this is the performer's first task for achievement
        const performerStats = await userStatsService.getUserStats(task.accepted_by);
        if (performerStats && performerStats.tasks_completed === 1) {
          // Create achievement notification
          await notificationService.createNotification({
            user_id: task.accepted_by,
            type: 'achievement',
            title: '🏆 First Task Achievement!',
            content: 'Congratulations! You\'ve completed your first task and earned the "First Task" badge!',
            task_id: task.id,
            read: false
          });
          
          toast.success('🏆 Achievement unlocked: First Task completed!', { duration: 5000 });
        }
        
        // Create payment notification for performer
        await notificationService.createNotification({
          user_id: task.accepted_by,
          type: 'payment',
          title: 'Payment Received',
          content: `You received $${task.price} for completing "${task.title}"`,
          task_id: task.id,
          read: false
        });
      }
      
      // Create completion notification for creator
      await notificationService.createNotification({
        user_id: task.created_by,
        type: 'task',
        title: 'Task Completed',
        content: `Your task "${task.title}" has been completed successfully!`,
        task_id: task.id,
        read: false
      });

      // Update task with completion timestamp
      await taskService.updateTask(task.id, {
        completed_at: new Date()
      });
      
    } catch (error) {
      console.error('Error handling task completion:', error);
      // Don't throw error here as the task status update should still succeed
    }
  };

  const nextStatus = getNextStatus(task.status);
  const nextStatusLabel = getStatusLabel(nextStatus);
  const nextStatusIcon = getStatusIcon(nextStatus);
  const nextStatusDescription = getStatusDescription(nextStatus);

  // Confetti animation elements
  const renderConfetti = () => {
    const confettiColors = ['#0038FF', '#FF5A1F', '#FFD700', '#32CD32', '#FF6347'];
    return Array.from({ length: 50 }).map((_, i) => {
      const style = {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        transform: `rotate(${Math.random() * 360}deg)`,
        width: `${Math.random() * 10 + 5}px`,
        height: `${Math.random() * 10 + 5}px`,
        backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        borderRadius: Math.random() > 0.5 ? '50%' : '0%',
        position: 'absolute' as 'absolute',
        animation: `fall ${Math.random() * 3 + 2}s linear forwards`,
      };
      return <div key={i} style={style} />;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {showChat && currentUser && otherUser ? (
          <div className="flex flex-col h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white rounded-t-2xl">
              <h2 className="text-xl font-bold flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Chat with Task {task.created_by === currentUser.id ? 'Performer' : 'Creator'}
              </h2>
              <button onClick={onClose} className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1">
              <GameChat
                taskId={task.id}
                currentUser={currentUser}
                otherUser={otherUser}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 border-b bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white rounded-t-2xl relative overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div 
                    key={i}
                    className="absolute rounded-full bg-white"
                    style={{
                      width: `${Math.random() * 100 + 50}px`,
                      height: `${Math.random() * 100 + 50}px`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      opacity: Math.random() * 0.5,
                    }}
                  />
                ))}
              </div>
              
              <div className="flex justify-between items-center relative z-10">
                <h2 className="text-xl font-bold">Update Task Status</h2>
                <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="mt-2 text-blue-100 relative z-10">
                Keep the task creator updated on your progress
              </p>
            </div>

            <div className="p-6 relative">
              {/* Confetti animation */}
              {showConfetti && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {renderConfetti()}
                </div>
              )}
              
              {/* XP Gained animation */}
              {xpGained > 0 && (
                <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold animate-bounce flex items-center">
                  <Star className="w-4 h-4 mr-1" fill="currentColor" />
                  +{xpGained} XP
                </div>
              )}

              {/* Current Status */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl mb-6 border border-blue-100 shadow-sm">
                <h3 className="text-sm font-medium text-gray-500">Current Status:</h3>
                <p className="text-xl font-bold text-[#0038FF]">
                  {getStatusLabel(task.status)}
                </p>
              </div>

              {/* Next Step */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Zap className="w-5 h-5 text-[#FF5A1F] mr-2" />
                  Next step:
                </h3>
                
                <div className="premium-card p-6 hover:shadow-xl transition-all transform hover:-translate-y-1">
                  <div className="flex items-center mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#0038FF] to-[#0021A5] rounded-full flex items-center justify-center mr-4 text-white shadow-lg">
                      {nextStatusIcon}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">{nextStatusLabel}</h4>
                      <p className="text-gray-600">{nextStatusDescription}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Add a note (optional)
                    </label>
                    <textarea
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Add details about this status update..."
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#0038FF] focus:ring focus:ring-[#0038FF] focus:ring-opacity-50"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center mb-4 bg-blue-50 p-3 rounded-lg">
                    <input
                      type="checkbox"
                      id="openChat"
                      checked={openChatAfterUpdate}
                      onChange={(e) => setOpenChatAfterUpdate(e.target.checked)}
                      className="h-4 w-4 text-[#0038FF] focus:ring-[#0038FF] border-gray-300 rounded"
                    />
                    <label htmlFor="openChat" className="ml-2 block text-sm text-gray-700">
                      Open chat after updating status
                    </label>
                  </div>
                  
                  <div className="flex space-x-2">
                    <StarBorder color="#0038FF">
                      <button
                        onClick={() => handleUpdateStatus(nextStatus)}
                        disabled={loading || isPlayingAudio}
                        className="w-full bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-4 py-4 rounded-lg font-bold flex items-center justify-center"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        ) : (
                          <>
                            {nextStatusIcon}
                            <span className="ml-2">Mark as {nextStatusLabel}</span>
                          </>
                        )}
                      </button>
                    </StarBorder>
                    
                    <button
                      onClick={() => playStatusAnnouncement(nextStatus)}
                      disabled={isPlayingAudio}
                      className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300 flex-shrink-0"
                      title="Preview audio announcement"
                    >
                      <VolumeUp className={`w-6 h-6 ${isPlayingAudio ? 'text-[#0038FF] animate-pulse' : ''}`} />
                    </button>
                  </div>
                  
                  {/* XP indicator */}
                  <div className="mt-2 text-center text-sm text-gray-500 flex items-center justify-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" fill="#FBBF24" />
                    <span>Earn +{getXpForStatus(nextStatus)} XP for this update</span>
                  </div>
                </div>
              </div>

              {/* All Status Options */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Trophy className="w-5 h-5 text-[#FF5A1F] mr-2" />
                  Or select a specific status:
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {['picked_up', 'in_progress', 'on_way', 'delivered'].map((status) => (
                    <div key={status} className="relative">
                      <StarBorder 
                        color={status === task.status ? "#cccccc" : "#0038FF"}
                        className={status === task.status ? "opacity-50" : ""}
                      >
                        <button
                          onClick={() => handleUpdateStatus(status)}
                          disabled={loading || status === task.status || isPlayingAudio}
                          className={`p-4 rounded-lg flex flex-col items-center text-center transition-all w-full ${
                            status === task.status
                              ? 'bg-gray-100 cursor-not-allowed opacity-50'
                              : 'bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2">
                            {getStatusIcon(status)}
                          </div>
                          <p className="font-medium">{getStatusLabel(status)}</p>
                          <p className="text-xs mt-1 flex items-center">
                            <Star className="w-3 h-3 mr-1" fill={status === task.status ? "#cccccc" : "#FBBF24"} />
                            +{getXpForStatus(status)} XP
                          </p>
                        </button>
                      </StarBorder>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Tip */}
              <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-blue-700">
                    Remember to communicate with the task creator about any changes or delays. Clear communication leads to better ratings and more opportunities!
                  </p>
                </div>
              </div>

              {/* Cancel Button */}
              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskStatusUpdate;