import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Clock, DollarSign, User, MessageSquare, Shield, AlertTriangle, CheckCircle, Loader, XCircle, Navigation, CreditCard, Package, Truck, Flag, ArrowRight, Trophy, Star, Map, Info, Briefcase, Languages, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import TaskProgress from './TaskProgress';
import GameChat from './GameChat';
import RealTimeLocationTracker from './RealTimeLocationTracker';
import ReportModal from './ReportModal';
import ReviewModal from './ReviewModal';
import ViewReviewsModal from './ViewReviewsModal';
import UnifiedTaskTracker from './UnifiedTaskTracker';
import { taskService, taskProgressService, notificationService, profileService, userStatsService, reviewService, messageService } from '../lib/database';
import { walletService } from '../lib/walletService';
import { auth } from '../lib/firebase';
import { doc, runTransaction, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StarBorder } from './ui/star-border';
import TranslatableText from './TranslatableText';
import TranslateButton from './TranslateButton';
import { useTranslation } from './TranslationProvider';
import TaskStatusUpdate from './TaskStatusUpdate';
import TaskCancelModal from './TaskCancelModal';
import TaskDetailsChat from './TaskDetailsChat';

interface TaskDetailsProps {
  task: any;
  onClose: () => void;
  onAccept?: () => void;
  onTaskCompleted?: () => void;
  initialTab?: 'details' | 'chat' | 'tracker';
  viewMode?: 'normal' | 'progress-tracking';
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ 
  task, 
  onClose, 
  onAccept, 
  onTaskCompleted, 
  initialTab = 'details',
  viewMode = 'normal'
}) => {
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [taskData, setTaskData] = useState<any>(task);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showViewReviews, setShowViewReviews] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [declineLoading, setDeclineLoading] = useState(false);
  const [progressUpdates, setProgressUpdates] = useState<any[]>([]);
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'chat' | 'tracker'>(initialTab);
  const [showStatusUpdateForm, setShowStatusUpdateForm] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);
  const { currentLanguage } = useTranslation();
  const [chatLoading, setChatLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [chatThreadId, setChatThreadId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
    refreshTaskData();
    loadProgressUpdates();
    loadWalletBalance();
    checkReviewStatus();
    
    // Subscribe to task progress updates
    const unsubscribe = taskProgressService.subscribeToTaskProgress(task.id, (progress) => {
      setProgressUpdates(progress);
      refreshTaskData();
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Load chat messages when the chat tab is active
    if (activeTab === 'chat' && taskData && currentUser && otherUserProfile) {
      initializeChat();
    }
  }, [activeTab, taskData, currentUser, otherUserProfile]);

  const getCurrentUser = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const profile = await profileService.getProfile(user.uid);
        setCurrentUser(profile || { id: user.uid, email: user.email });
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const balance = await walletService.getBalance();
      setWalletBalance(balance);
    } catch (error) {
      console.error('Error loading wallet balance:', error);
    }
  };

  const refreshTaskData = async () => {
    try {
      const updatedTask = await taskService.getTaskById(task.id);
      if (updatedTask) {
        setTaskData(updatedTask);
        
        // Load other user profile for accepted tasks
        if (updatedTask.status !== 'open' && currentUser) {
          const otherUserId = updatedTask.created_by === currentUser.id ? 
            updatedTask.accepted_by : updatedTask.created_by;
          
          if (otherUserId) {
            const otherProfile = await profileService.getProfile(otherUserId);
            setOtherUserProfile(otherProfile || { id: otherUserId, full_name: 'User' });
            
            // Auto-show chat for accepted tasks
            if (updatedTask.status === 'accepted' || updatedTask.status === 'in_progress' || updatedTask.status === 'on_way' || updatedTask.status === 'delivered') {
              setShowChat(true);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing task data:', error);
    }
  };

  const initializeChat = async () => {
    if (!taskData || !currentUser || !otherUserProfile) return;
    
    setChatLoading(true);
    try {
      // Find or create a chat thread between the users
      const threadId = await messageService.findOrCreateChatThread(
        currentUser.id,
        otherUserProfile.id,
        taskData.id
      );
      setChatThreadId(threadId);
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Error loading chat');
    } finally {
      setChatLoading(false);
    }
  };

  const checkReviewStatus = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      // Check if the current user has already reviewed this task
      const reviews = await reviewService.getTaskReviews(task.id);
      const userReview = reviews.find(review => review.reviewer_id === user.uid);
      
      setHasReviewed(!!userReview);
    } catch (error) {
      console.error('Error checking review status:', error);
    }
  };

  const loadProgressUpdates = async () => {
    try {
      const progress = await taskProgressService.getTaskProgress(task.id);
      setProgressUpdates(progress || []);
    } catch (error) {
      console.error('Error loading progress updates:', error);
    }
  };

  const handleAcceptTask = async () => {
    try {
      setAcceptLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Check if this is the user's own task
      if (taskData.created_by === user.uid) {
        toast.error('You cannot accept your own task');
        return;
      }

      // If task has a price and is not free, show payment options
      if (taskData.price > 0) {
        setShowPaymentOptions(true);
        return;
      }

      // For free tasks, accept directly
      await acceptTaskDirectly();
    } catch (error) {
      console.error('Error accepting task:', error);
      toast.error('Error accepting task');
    } finally {
      setAcceptLoading(false);
    }
  };

  const acceptTaskDirectly = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Use a transaction to update task and create progress
      await runTransaction(db, async (transaction) => {
        // Update task status and accepted_by
        const taskRef = doc(db, 'tasks', task.id);
        transaction.update(taskRef, {
          status: 'accepted',
          accepted_by: user.uid,
          updated_at: new Date()
        });
        
        // Create progress entry
        const progressRef = doc(collection(db, 'task_progress'));
        transaction.set(progressRef, {
          task_id: task.id,
          status: 'accepted',
          notes: 'Task accepted',
          created_at: new Date(),
          updated_at: new Date()
        });
      });

      // Create notification for task creator
      await notificationService.createNotification({
        user_id: taskData.created_by,
        type: 'task',
        title: 'Task Accepted',
        content: `Your task "${taskData.title}" has been accepted`,
        task_id: task.id,
        read: false
      });

      toast.success('Task accepted successfully!');
      refreshTaskData();
      loadProgressUpdates();
      
      // Call the onAccept callback if provided
      if (onAccept) {
        onAccept();
      }
      
      // Initialize chat with the task creator
      const otherUserId = taskData.created_by;
      if (otherUserId) {
        const otherProfile = await profileService.getProfile(otherUserId);
        setOtherUserProfile(otherProfile || { id: otherUserId, full_name: 'User' });
        
        // Switch to chat tab
        setActiveTab('chat');
      }
    } catch (error) {
      console.error('Error accepting task:', error);
      toast.error('Error accepting task');
    }
  };

  const handlePaymentAndAccept = async (paymentMethod: 'wallet' | 'stripe') => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      if (paymentMethod === 'wallet') {
        // Check wallet balance
        if (walletBalance < taskData.price) {
          toast.error('Insufficient wallet balance');
          return;
        }

        // Process wallet payment and accept task
        await walletService.processTaskPayment(task.id, taskData.price);
        
        // Accept the task
        await acceptTaskDirectly();
        
        toast.success('Payment processed and task accepted!');
      } else {
        // For Stripe payment, you would integrate with Stripe here
        toast.error('Stripe payment integration coming soon!');
      }
      
      setShowPaymentOptions(false);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineTask = () => {
    setDeclineLoading(true);
    // Simply close the modal after a brief delay to simulate processing
    setTimeout(() => {
      setDeclineLoading(false);
      onClose();
      toast.success('Task declined');
    }, 500);
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const handleLeaveReview = () => {
    setShowReviewModal(true);
  };

  const handleViewReviews = () => {
    setShowViewReviews(true);
  };

  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
    setHasReviewed(true);
    toast.success('Review submitted successfully!');
  };

  const updateTaskProgress = async (status: string, notes: string = '') => {
    try {
      setLoading(true);
      
      // Create progress update
      await taskProgressService.createProgress({
        task_id: task.id,
        status,
        notes: notes
      });
      
      // Update task status
      await taskService.updateTask(task.id, {
        status
      });
      
      // If task is completed, handle completion logic
      if (status === 'completed') {
        await handleTaskCompletion();
      }
      
      // Create notification for task creator
      await notificationService.createNotification({
        user_id: taskData.created_by,
        type: 'status',
        title: 'Task Status Updated',
        content: `Your task "${taskData.title}" is now ${status.replace('_', ' ')}`,
        task_id: task.id,
        read: false
      });
      
      toast.success('Task progress updated');
      refreshTaskData();
      loadProgressUpdates();
      setShowStatusUpdateForm(false);
      
      // If task was completed, call the onTaskCompleted callback
      if (status === 'completed' && onTaskCompleted) {
        onTaskCompleted();
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
      if (taskData.price > 0 && taskData.accepted_by) {
        // Transfer funds from creator to performer
        await walletService.transferFunds(
          taskData.created_by,
          taskData.accepted_by,
          taskData.price,
          task.id
        );
        
        // Update performer's stats
        await userStatsService.updateStatsOnTaskCompletion(
          taskData.accepted_by,
          taskData.price
        );
        
        // Check if this is the performer's first task for achievement
        const performerStats = await userStatsService.getUserStats(taskData.accepted_by);
        if (performerStats && performerStats.tasks_completed === 1) {
          // Create achievement notification
          await notificationService.createNotification({
            user_id: taskData.accepted_by,
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
          user_id: taskData.accepted_by,
          type: 'payment',
          title: 'Payment Received',
          content: `You received $${taskData.price} for completing "${taskData.title}"`,
          task_id: task.id,
          read: false
        });
      }
      
      // Create completion notification for creator
      await notificationService.createNotification({
        user_id: taskData.created_by,
        type: 'task',
        title: 'Task Completed',
        content: `Your task "${taskData.title}" has been completed successfully!`,
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

  const handleCancelTask = () => {
    setShowCancelModal(true);
  };

  const handleTaskCancelled = () => {
    setShowCancelModal(false);
    toast.success('Task cancelled successfully');
    onClose();
  };

  const isTaskParticipant = currentUser && (
    taskData.created_by === currentUser.id || taskData.accepted_by === currentUser.id
  );

  const isTaskCreator = currentUser && taskData.created_by === currentUser.id;
  const isTaskPerformer = currentUser && taskData.accepted_by === currentUser.id;

  const getLatestProgressStatus = () => {
    if (progressUpdates.length === 0) return taskData.status;
    return progressUpdates[progressUpdates.length - 1].status;
  };

  const getProgressSteps = () => [
    { 
      key: 'accepted', 
      label: 'Task Accepted', 
      icon: CheckCircle, 
      description: 'Helper has accepted your task',
      action: () => updateTaskProgress('accepted', 'Task accepted')
    },
    { 
      key: 'picked_up', 
      label: 'Picked Up', 
      icon: Package, 
      description: 'Items have been collected',
      action: () => updateTaskProgress('picked_up', 'Items picked up')
    },
    { 
      key: 'in_progress', 
      label: 'In Progress', 
      icon: Clock, 
      description: 'Task is being worked on',
      action: () => updateTaskProgress('in_progress', 'Task in progress')
    },
    { 
      key: 'on_way', 
      label: 'On the Way', 
      icon: Truck, 
      description: 'Helper is heading to delivery location',
      action: () => updateTaskProgress('on_way', 'On the way to delivery')
    },
    { 
      key: 'delivered', 
      label: 'Delivered', 
      icon: Flag, 
      description: 'Task has been delivered',
      action: () => updateTaskProgress('delivered', 'Task delivered')
    },
    { 
      key: 'completed', 
      label: 'Completed', 
      icon: CheckCircle, 
      description: 'Task has been completed and verified',
      action: () => updateTaskProgress('completed', 'Task completed')
    }
  ];

  const getCurrentStepIndex = () => {
    const currentStatus = getLatestProgressStatus();
    return getProgressSteps().findIndex(step => step.key === currentStatus);
  };

  const getNextStep = () => {
    const currentIndex = getCurrentStepIndex();
    const steps = getProgressSteps();
    return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
  };

  // Show unified tracker for in-progress tasks
  const shouldShowUnifiedTracker = () => {
    if (!isTaskParticipant) return false;
    
    const status = getLatestProgressStatus();
    return status !== 'open' && status !== 'completed' && status !== 'cancelled';
  };

  // Format hourly rate display
  const formatHourlyRate = () => {
    if (!taskData.hourly_rate) return null;
    
    const hourlyRate = taskData.hourly_rate;
    const estimatedHours = taskData.estimated_hours || 1;
    
    return (
      <div className="flex items-center">
        <Briefcase className="w-5 h-5 text-[#FF5A1F] mr-2" />
        <div>
          <span className="font-bold">${hourlyRate.toFixed(2)}/hr</span>
          <span className="text-sm text-gray-500 ml-2">× {estimatedHours} {estimatedHours === 1 ? 'hour' : 'hours'}</span>
        </div>
      </div>
    );
  };

  const handleTranslateTitle = (translatedText: string) => {
    setTranslatedTitle(translatedText);
  };

  const handleTranslateDescription = (translatedText: string) => {
    setTranslatedDescription(translatedText);
  };

  const handleStatusUpdate = (status: string) => {
    updateTaskProgress(status);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex shadow-2xl ${activeTab === 'tracker' ? 'flex-col' : ''}`}>
        {activeTab === 'tracker' ? (
          <>
            {/* Full-width tracker view */}
            <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white rounded-t-2xl">
              <div className="flex items-center">
                <h2 className="text-xl font-bold">Live Task Tracking: {taskData.title}</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('details')}
                  className="bg-white/10 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  Back to Details
                </button>
                <button onClick={onClose} className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <UnifiedTaskTracker taskId={task.id} />
            </div>
          </>
        ) : (
          <>
            {/* Split view for details and chat */}
            <div className={`${showChat || activeTab === 'chat' ? 'w-1/2' : 'w-full'} overflow-y-auto border-r flex flex-col`}>
              <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white rounded-tl-2xl">
                <div className="flex items-center">
                  <h2 className="text-xl font-bold">Task Details</h2>
                  {/* Only show tabs in normal view mode, not in progress tracking mode */}
                  {viewMode === 'normal' && isTaskParticipant && (
                    <div className="ml-4 flex space-x-2">
                      <button
                        onClick={() => setActiveTab('details')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === 'details' 
                            ? 'bg-white text-[#0021A5]' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setActiveTab('chat')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === 'chat' 
                            ? 'bg-white text-[#0021A5]' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        Chat
                      </button>
                      {shouldShowUnifiedTracker() && (
                        <button
                          onClick={() => setActiveTab('tracker')}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'tracker' 
                              ? 'bg-white text-[#0021A5]' 
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          Tracker
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={onClose} className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {activeTab === 'details' && (
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                  {/* Task Creator Info and Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0038FF] to-[#FF5A1F] flex items-center justify-center shadow-lg">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-bold">Task Creator</h3>
                        <p className="text-sm text-gray-500">
                          Posted {new Date(taskData.created_at?.toDate ? taskData.created_at.toDate() : taskData.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {/* Cancel Task Button - Added here */}
                      {isTaskParticipant && taskData.status !== 'completed' && taskData.status !== 'cancelled' && (
                        <button
                          onClick={handleCancelTask}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancel Task
                        </button>
                      )}
                      
                      {/* Update Status Button (for task performer) */}
                      {isTaskPerformer && taskData.status !== 'open' && taskData.status !== 'completed' && taskData.status !== 'cancelled' && (
                        <StarBorder color="#0038FF">
                          <button
                            onClick={() => setShowStatusUpdateForm(true)}
                            className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition duration-200 flex items-center justify-center"
                          >
                            <ArrowRight className="w-5 h-5 mr-2" />
                            Update Status
                          </button>
                        </StarBorder>
                      )}
                      
                      {/* Complete Task Button (for task creator) */}
                      {isTaskCreator && taskData.status !== 'open' && taskData.status !== 'completed' && taskData.status !== 'cancelled' && (
                        <StarBorder color="#10B981">
                          <button
                            onClick={() => updateTaskProgress('completed', 'Task completed')}
                            className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition duration-200 flex items-center justify-center"
                          >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Mark Complete
                          </button>
                        </StarBorder>
                      )}
                    </div>
                  </div>

                  {/* Unified Tracker Button - Only show for in-progress tasks */}
                  {shouldShowUnifiedTracker() && (
                    <div className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white rounded-2xl p-4 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg mb-1">Live Task Tracking</h3>
                          <p className="text-blue-100">Track location, chat, and progress in real-time</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('tracker')}
                          className="bg-white text-[#0038FF] px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center"
                        >
                          <Map className="w-5 h-5 mr-2" />
                          Open Tracker
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Task Progress - Always show if task is not open */}
                  {taskData.status !== 'open' && (
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 shadow-md">
                      <h3 className="font-bold text-blue-900 mb-3">Task Progress</h3>
                      <TaskProgress
                        progressUpdates={progressUpdates}
                        taskStatus={taskData.status}
                      />
                    </div>
                  )}

                  {/* Task Details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold">
                        {translatedTitle || taskData.title}
                      </h3>
                      <TranslateButton 
                        text={taskData.title}
                        onTranslated={handleTranslateTitle}
                        className="bg-gray-100 hover:bg-gray-200"
                        targetLanguage={currentLanguage}
                      />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                      {taskData.category}
                    </span>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Description</h4>
                        <TranslateButton 
                          text={taskData.description}
                          onTranslated={handleTranslateDescription}
                          size="sm"
                          className="bg-white"
                          targetLanguage={currentLanguage}
                        />
                      </div>
                      <p className="text-gray-600">
                        {translatedDescription || taskData.description}
                      </p>
                    </div>

                    {/* Real-time Location Tracker - Only show for task participants */}
                    {isTaskParticipant && taskData.status !== 'open' && taskData.location_coords && (
                      <div>
                        <h4 className="font-bold mb-2 flex items-center">
                          <Navigation className="w-4 h-4 mr-1 text-[#0038FF]" />
                          Live Location Tracker
                        </h4>
                        <RealTimeLocationTracker
                          taskId={taskData.id}
                          taskLocation={taskData.location_coords}
                          currentUser={currentUser}
                          isTaskPerformer={isTaskPerformer}
                          isTaskCreator={isTaskCreator}
                          otherUser={otherUserProfile}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 text-[#FF5A1F] mr-2" />
                        <span>{taskData.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-[#FF5A1F] mr-2" />
                        <span>{taskData.estimated_time}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-5 h-5 text-[#FF5A1F] mr-2" />
                        <span className="font-bold">
                          {taskData.price === 0 ? 'Free' : `$${taskData.price}`}
                        </span>
                      </div>
                      {taskData.hourly_rate && (
                        <div className="flex items-center">
                          {formatHourlyRate()}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 text-[#FF5A1F] mr-2" />
                        <span>Verified User</span>
                      </div>
                    </div>

                    {/* Payment Options Modal */}
                    {showPaymentOptions && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                          <h3 className="text-xl font-bold mb-4">Choose Payment Method</h3>
                          <p className="text-gray-600 mb-4">
                            This task costs ${taskData.price}. How would you like to pay?
                          </p>
                          
                          <div className="space-y-3">
                            <button
                              onClick={() => handlePaymentAndAccept('wallet')}
                              disabled={walletBalance < taskData.price}
                              className={`w-full p-4 rounded-xl border flex items-center justify-between ${
                                walletBalance >= taskData.price
                                  ? 'border-[#0038FF] bg-blue-50 hover:bg-blue-100'
                                  : 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <div className="flex items-center">
                                <DollarSign className="w-5 h-5 mr-2" />
                                <div className="text-left">
                                  <p className="font-bold">Wallet Balance</p>
                                  <p className="text-sm text-gray-600">${walletBalance.toFixed(2)} available</p>
                                </div>
                              </div>
                              {walletBalance < taskData.price && (
                                <span className="text-red-600 text-sm">Insufficient</span>
                              )}
                            </button>
                            
                            <button
                              onClick={() => handlePaymentAndAccept('stripe')}
                              className="w-full p-4 rounded-xl border border-gray-300 hover:bg-gray-50 flex items-center"
                            >
                              <CreditCard className="w-5 h-5 mr-2" />
                              <div className="text-left">
                                <p className="font-bold">Credit/Debit Card</p>
                                <p className="text-sm text-gray-600">Pay with Stripe</p>
                              </div>
                            </button>
                          </div>
                          
                          <div className="flex space-x-3 mt-4">
                            <button
                              onClick={() => setShowPaymentOptions(false)}
                              className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Safety Tips */}
                    <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100 shadow-md">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-yellow-800">Safety Tips</h4>
                          <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                            <li>• Meet in a public place</li>
                            <li>• Share your task details with a friend</li>
                            <li>• Use our in-app chat for communication</li>
                            <li>• Report any suspicious behavior</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Review Buttons (for completed tasks) */}
                    {taskData.status === 'completed' && isTaskParticipant && (
                      <div className="space-y-3">
                        {!hasReviewed && (
                          <StarBorder color="#0038FF">
                            <button
                              onClick={handleLeaveReview}
                              className="w-full bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-4 py-3 rounded-lg font-bold hover:opacity-90 transition duration-200 flex items-center justify-center"
                            >
                              <Star className="w-5 h-5 mr-2" />
                              Leave a Review
                            </button>
                          </StarBorder>
                        )}
                        
                        <button
                          onClick={handleViewReviews}
                          className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-bold hover:bg-gray-200 transition duration-200 flex items-center justify-center"
                        >
                          <MessageSquare className="w-5 h-5 mr-2" />
                          View Reviews
                        </button>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {currentUser && !isTaskCreator && taskData.status === 'open' && (
                      <div className="flex space-x-4">
                        <StarBorder color="#0038FF" className="flex-1">
                          <button
                            onClick={handleAcceptTask}
                            disabled={acceptLoading}
                            className="w-full bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-4 py-3 rounded-lg font-bold hover:opacity-90 transition duration-200 flex items-center justify-center"
                          >
                            {acceptLoading ? (
                              <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                {taskData.price > 0 ? `Accept & Pay $${taskData.price}` : 'Accept Task'}
                              </>
                            )}
                          </button>
                        </StarBorder>
                        <button
                          onClick={handleDeclineTask}
                          disabled={declineLoading}
                          className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition duration-200 flex items-center justify-center shadow-sm"
                        >
                          {declineLoading ? (
                            <Loader className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 mr-2" />
                              Decline
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Report Button */}
                    {currentUser && !isTaskCreator && (
                      <button
                        onClick={handleReport}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition duration-200 flex items-center justify-center shadow-sm"
                      >
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Report Task
                      </button>
                    )}

                    {/* Chat Button (for task participants) */}
                    {isTaskParticipant && !showChat && activeTab === 'details' && (
                      <StarBorder color="#0038FF">
                        <button
                          onClick={() => setActiveTab('chat')}
                          className="w-full bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-4 py-3 rounded-lg font-bold hover:opacity-90 transition duration-200 flex items-center justify-center"
                        >
                          <MessageSquare className="w-5 h-5 mr-2" />
                          Open Chat
                        </button>
                      </StarBorder>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'chat' && currentUser && (
                <div className="flex-1 flex flex-col">
                  {chatLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0038FF]"></div>
                    </div>
                  ) : otherUserProfile ? (
                    <TaskDetailsChat
                      taskId={taskData.id}
                      currentUser={currentUser}
                      otherUser={otherUserProfile}
                      progressUpdates={progressUpdates}
                      taskStatus={taskData.status}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Chat will be available once the task is accepted</h3>
                      <p className="text-gray-500 max-w-md">
                        When someone accepts this task, you'll be able to chat with them directly here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat Panel (when not in tab mode) */}
            {showChat && otherUserProfile && currentUser && activeTab === 'details' && (
              <div className="w-1/2 flex flex-col">
                <div className="p-4 border-b bg-gradient-to-r from-[#0021A5] to-[#0038FF] flex justify-between items-center rounded-tr-2xl">
                  <h3 className="font-bold text-white flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Chat with {otherUserProfile.full_name}
                  </h3>
                  <button
                    onClick={() => setShowChat(false)}
                    className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1">
                  <GameChat
                    taskId={taskData.id}
                    currentUser={currentUser}
                    otherUser={otherUserProfile}
                    onStatusUpdate={handleStatusUpdate}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          taskId={taskData.id}
          userId={taskData.created_by}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          task={{
            ...taskData,
            user_role: isTaskCreator ? 'creator' : 'performer',
            performer: otherUserProfile,
            creator: isTaskCreator ? currentUser : otherUserProfile
          }}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReviewSubmitted}
        />
      )}

      {/* View Reviews Modal */}
      {showViewReviews && (
        <ViewReviewsModal
          taskId={taskData.id}
          onClose={() => setShowViewReviews(false)}
        />
      )}

      {/* Status Update Modal */}
      {showStatusUpdateForm && (
        <TaskStatusUpdate
          task={taskData}
          onClose={() => setShowStatusUpdateForm(false)}
          onStatusUpdated={() => {
            setShowStatusUpdateForm(false);
            refreshTaskData();
            loadProgressUpdates();
          }}
        />
      )}

      {/* Cancel Task Modal */}
      {showCancelModal && (
        <TaskCancelModal
          task={taskData}
          onClose={() => setShowCancelModal(false)}
          onCancelled={handleTaskCancelled}
        />
      )}
    </div>
  );
};

export default TaskDetails;