import React, { useState, useEffect, useRef } from 'react';
import { Send, User, X, Paperclip, Loader, MessageSquare, ArrowRight, CheckCircle, Package, Clock, Truck, Flag, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { taskService, taskProgressService, messageService, notificationService } from '../lib/database';
import TaskStatusMessage from './TaskStatusMessage';
import { StarBorder } from './ui/star-border';

interface TaskProgressChatProps {
  taskId: string;
  currentUser: any;
  otherUser: any;
  onStatusUpdate?: (status: string) => void;
}

interface Message {
  id: string;
  content: string;
  created_at: any;
  sender_id: string;
  recipient_id?: string;
  image_url?: string;
  is_read?: boolean;
  message_type?: 'text' | 'image' | 'status_update';
  status_update?: {
    status: string;
    notes?: string;
  };
}

const TaskProgressChat: React.FC<TaskProgressChatProps> = ({ taskId, currentUser, otherUser, onStatusUpdate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [taskData, setTaskData] = useState<any>(null);
  const [progressUpdates, setProgressUpdates] = useState<any[]>([]);
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [chatThreadId, setChatThreadId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!taskId || !currentUser?.uid || !otherUser?.id) {
      console.warn('TaskProgressChat missing required props:', { taskId, currentUserUid: currentUser?.uid, otherUserId: otherUser?.id });
      return;
    }
    
    loadTaskData();
    initializeChat();
    loadProgressUpdates();
    
    // Subscribe to task progress updates
    const progressUnsubscribe = taskProgressService.subscribeToTaskProgress(taskId, (progress) => {
      setProgressUpdates(progress);
    });
    
    return () => {
      if (progressUnsubscribe) progressUnsubscribe();
    };
  }, [taskId, currentUser, otherUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      // Find or create a chat thread between the users
      const threadId = await messageService.findOrCreateChatThread(
        currentUser.uid,
        otherUser.id,
        taskId
      );
      setChatThreadId(threadId);
      
      // Now load messages from this thread
      const chatMessages = await messageService.getMessages(threadId);
      setMessages(chatMessages);
      
      // Subscribe to new messages
      const unsubscribe = messageService.subscribeToMessages(threadId, (messageData) => {
        setMessages(messageData);
        scrollToBottom();
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error initializing chat:', error);
      return () => {};
    }
  };

  const loadTaskData = async () => {
    try {
      const task = await taskService.getTaskById(taskId);
      setTaskData(task);
    } catch (error) {
      console.error('Error loading task data:', error);
    }
  };

  const loadProgressUpdates = async () => {
    try {
      const progress = await taskProgressService.getTaskProgress(taskId);
      setProgressUpdates(progress || []);
    } catch (error) {
      console.error('Error loading progress updates:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const removeImagePreview = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      if (!currentUser?.uid) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `chat/${chatThreadId}/${fileName}`;

      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !imageFile) {
      return;
    }
    
    if (!currentUser?.uid || !otherUser?.id || !chatThreadId) {
      toast.error('Missing required information to send message');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        setUploadingImage(true);
        imageUrl = await uploadImage(imageFile);
        setUploadingImage(false);
      }

      const messageData = {
        task_id: taskId, // Include task ID for reference
        sender_id: currentUser.uid,
        recipient_id: otherUser.id,
        content: newMessage.trim() || (imageUrl ? 'Sent an image' : ''),
        image_url: imageUrl || null,
        message_type: imageUrl ? 'image' : 'text',
        is_read: false
      };

      // Use messageService to send the message
      await messageService.sendMessage(chatThreadId, messageData);
      
      setNewMessage('');
      removeImagePreview();
      
      // Show success feedback
      toast.success('Message sent', { duration: 1000 });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error sending message. Please try again.');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const updateTaskStatus = async (status: string) => {
    try {
      setLoading(true);
      
      // Create progress update
      await taskProgressService.createProgress({
        task_id: taskId,
        status,
        notes: statusNote || `Status updated to ${formatStatus(status)}`
      });
      
      // Update task status
      await taskService.updateTask(taskId, {
        status
      });
      
      // Create notification for task creator
      if (taskData) {
        await notificationService.createNotification({
          user_id: taskData.created_by,
          type: 'status',
          title: 'Task Status Updated',
          content: `Your task "${taskData.title}" is now ${formatStatus(status)}`,
          task_id: taskId,
          read: false
        });
      }
      
      // Call the onStatusUpdate callback if provided
      if (onStatusUpdate) {
        onStatusUpdate(status);
      }
      
      toast.success(`Task status updated to ${formatStatus(status)}`);
      setShowStatusOptions(false);
      setStatusNote('');
      
      // Reload progress updates
      loadProgressUpdates();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Error updating task status');
    } finally {
      setLoading(false);
    }
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url.toLowerCase());
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else {
      // Try to parse as ISO string or timestamp
      date = new Date(timestamp);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', timestamp);
      return 'Unknown time';
    }
    
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const formatStatus = (status: string): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'picked_up':
        return <Package className="w-5 h-5 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'on_way':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <Flag className="w-5 h-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const isOwnMessage = (message: Message) => {
    return currentUser?.uid && message.sender_id === currentUser.uid;
  };

  const getNextStatus = () => {
    if (!taskData) return null;
    
    const currentStatus = taskData.status;
    const statusFlow = ['accepted', 'picked_up', 'in_progress', 'on_way', 'delivered', 'completed'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    
    if (currentIndex < 0 || currentIndex >= statusFlow.length - 1) {
      return null;
    }
    
    return statusFlow[currentIndex + 1];
  };

  const isTaskPerformer = currentUser && taskData && taskData.accepted_by === currentUser.uid;

  // Combine messages and progress updates into a single timeline
  const getCombinedTimeline = () => {
    const timeline: (Message | any)[] = [...messages];
    
    // Add progress updates as special messages
    progressUpdates.forEach(update => {
      // Check if we already have this update in the messages
      const existingUpdate = timeline.find(
        item => 
          item.message_type === 'status_update' && 
          item.status_update?.status === update.status &&
          new Date(item.created_at).getTime() === new Date(update.created_at).getTime()
      );
      
      if (!existingUpdate) {
        timeline.push({
          id: `status-${update.id}`,
          content: `Status updated to: ${formatStatus(update.status)}`,
          created_at: update.created_at,
          sender_id: update.user_id || 'system',
          message_type: 'status_update',
          status_update: {
            status: update.status,
            notes: update.notes
          }
        });
      }
    });
    
    // Sort by timestamp
    return timeline.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateA - dateB;
    });
  };

  // Don't render if essential props are missing
  if (!taskId || !currentUser?.uid || !otherUser?.id) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-gray-500">
        <p>Unable to load chat. Please refresh the page.</p>
      </div>
    );
  }

  const timeline = getCombinedTimeline();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Status Update Bar - Only for task performer */}
      {isTaskPerformer && taskData && taskData.status !== 'completed' && taskData.status !== 'cancelled' && (
        <div className="bg-blue-50 p-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getStatusIcon(taskData.status)}
              <span className="ml-2 font-medium text-blue-800">
                Status: {formatStatus(taskData.status)}
              </span>
            </div>
            
            {!showStatusOptions ? (
              <button
                onClick={() => setShowStatusOptions(true)}
                className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center"
              >
                <ArrowRight className="w-4 h-4 mr-1" />
                Update Status
              </button>
            ) : (
              <button
                onClick={() => setShowStatusOptions(false)}
                className="text-blue-500 hover:text-blue-700 px-3 py-1 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
          
          {showStatusOptions && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add a note (optional)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Add details about this status update..."
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 text-sm"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {getNextStatus() && (
                  <StarBorder color="#0038FF">
                    <button
                      onClick={() => updateTaskStatus(getNextStatus()!)}
                      disabled={loading}
                      className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
                    >
                      {getStatusIcon(getNextStatus()!)}
                      <span className="ml-2">Mark as {formatStatus(getNextStatus()!)}</span>
                    </button>
                  </StarBorder>
                )}
                
                {taskData.status !== 'completed' && (
                  <button
                    onClick={() => updateTaskStatus('completed')}
                    disabled={loading}
                    className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Task
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {timeline.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium mb-2">Start the conversation!</p>
            <p className="text-sm">Send a message to {otherUser.full_name} about the task.</p>
          </div>
        ) : (
          timeline.map((item, index) => {
            // Handle status update
            if (item.message_type === 'status_update') {
              return (
                <TaskStatusMessage
                  key={item.id}
                  status={item.status_update?.status || ''}
                  notes={item.status_update?.notes}
                  timestamp={new Date(item.created_at)}
                  userName={item.sender_id === currentUser.uid ? 'You' : otherUser.full_name}
                />
              );
            }
            
            // Handle regular message
            const isOwn = isOwnMessage(item);
            const showAvatar = index === 0 || timeline[index - 1].sender_id !== item.sender_id;
            
            return (
              <div
                key={item.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                  showAvatar ? 'mt-4' : 'mt-1'
                }`}
              >
                <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[70%]`}>
                  {showAvatar && !isOwn && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 flex-shrink-0">
                      {otherUser.avatar_url ? (
                        <img
                          src={otherUser.avatar_url}
                          alt={otherUser.full_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  )}
                  
                  <div
                    className={`rounded-2xl px-4 py-2 max-w-full ${
                      isOwn
                        ? 'bg-[#0038FF] text-white rounded-br-md'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-sm'
                    }`}
                  >
                    {item.image_url && isImage(item.image_url) && (
                      <div className="mb-2">
                        <img 
                          src={item.image_url} 
                          alt="Shared image" 
                          className="rounded-lg max-h-60 w-auto cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(item.image_url, '_blank')}
                        />
                      </div>
                    )}
                    {item.content && (
                      <p className="text-sm break-words">{item.content}</p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs ${
                        isOwn ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {formatTimestamp(item.created_at)}
                      </span>
                      {isOwn && (
                        <span className={`text-xs ml-2 ${
                          item.is_read ? 'text-blue-200' : 'text-blue-300'
                        }`}>
                          {item.is_read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {showAvatar && isOwn && (
                    <div className="w-8 h-8 rounded-full bg-[#0038FF] flex items-center justify-center ml-2 flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="p-4 border-t bg-white">
          <div className="relative inline-block">
            <img 
              src={imagePreview} 
              alt="Upload preview" 
              className="h-20 w-auto rounded-lg border border-gray-200"
            />
            <button 
              onClick={removeImagePreview}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 border-t bg-white">
        <div className="flex items-end space-x-2">
          <button
            type="button"
            onClick={handleImageClick}
            disabled={loading || uploadingImage}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Type a message..."
              className="w-full resize-none rounded-2xl border border-gray-300 px-4 py-2 pr-12 focus:border-[#0038FF] focus:ring-1 focus:ring-[#0038FF] focus:outline-none max-h-32"
              rows={1}
              disabled={loading || uploadingImage}
              style={{
                minHeight: '40px',
                height: 'auto'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
          
          <button
            type="submit"
            disabled={loading || uploadingImage || (!newMessage.trim() && !imageFile)}
            className="p-2 bg-[#0038FF] text-white rounded-full hover:bg-[#0021A5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading || uploadingImage ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskProgressChat;