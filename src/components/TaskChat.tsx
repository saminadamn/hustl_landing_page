import React, { useState, useEffect, useRef } from 'react';
import { Send, User, X, Paperclip, Loader, Phone, Video, MoreVertical, Clock, CheckCircle, Package, Truck, Flag, AlertTriangle, MessageSquare, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { taskService, taskProgressService, messageService } from '../lib/database';
import { StarBorder } from './ui/star-border';

interface TaskChatProps {
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

const TaskChat: React.FC<TaskChatProps> = ({ taskId, currentUser, otherUser, onStatusUpdate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [taskData, setTaskData] = useState<any>(null);
  const [progressUpdates, setProgressUpdates] = useState<any[]>([]);
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [chatThreadId, setChatThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!taskId || !currentUser?.uid || !otherUser?.id) {
      console.warn('TaskChat component missing required props:', { taskId, currentUserUid: currentUser?.uid, otherUserId: otherUser?.id });
      return;
    }
    
    // Initialize chat thread
    const initializeChat = async () => {
      try {
        const threadId = await messageService.findOrCreateChatThread(
          currentUser.uid,
          otherUser.id,
          taskId
        );
        setChatThreadId(threadId);
        
        // Now load messages from this thread
        const unsubscribe = messageService.subscribeToMessages(threadId, (messageData) => {
          setMessages(messageData);
          
          // Mark messages as read
          markMessagesAsRead(messageData);
          
          scrollToBottom();
          setConnectionStatus('connected');
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Error initializing chat:', error);
        return () => {};
      }
    };
    
    loadTaskData();
    loadProgressUpdates();
    const unsubscribePromise = initializeChat();
    
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [taskId, currentUser, otherUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const markMessagesAsRead = async (messageList: Message[]) => {
    if (!currentUser?.uid || !chatThreadId) return;
    
    const unreadMessages = messageList.filter(
      msg => msg.sender_id !== currentUser.uid && !msg.is_read
    );
    
    for (const message of unreadMessages) {
      try {
        await messageService.markAsRead(chatThreadId, message.id);
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
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

    // Optimistic UI - add message immediately
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      content: newMessage.trim() || (imageFile ? 'Sending image...' : ''),
      created_at: new Date(),
      sender_id: currentUser.uid,
      recipient_id: otherUser.id,
      image_url: imagePreview,
      is_read: false
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    removeImagePreview();
    scrollToBottom();

    setLoading(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        setUploadingImage(true);
        imageUrl = await uploadImage(imageFile);
        setUploadingImage(false);
      }

      const messageData = {
        task_id: taskId,
        sender_id: currentUser.uid,
        recipient_id: otherUser.id,
        content: newMessage.trim() || (imageUrl ? 'Sent an image' : ''),
        image_url: imageUrl || null,
        message_type: imageUrl ? 'image' : 'text',
        is_read: false
      };

      await messageService.sendMessage(chatThreadId, messageData);
      
      // Remove optimistic message since real one will come through subscription
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      
      // Show success feedback
      toast.success('Message sent', { duration: 1000 });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error sending message. Please try again.');
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
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
    
    const date = new Date(timestamp);
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

  const isTaskPerformer = currentUser && taskData && taskData.accepted_by === currentUser.id;

  // Don't render if essential props are missing
  if (!taskId || !currentUser?.uid || !otherUser?.id) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-gray-500">
        <p>Unable to load chat. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="p-4 border-b bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {otherUser.avatar_url ? (
              <img
                src={otherUser.avatar_url}
                alt={otherUser.full_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="ml-3">
              <h3 className="font-medium">{otherUser.full_name}</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></div>
                <p className="text-sm text-gray-500">
                  {connectionStatus === 'connected' ? 'Online' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

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
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium mb-2">Start the conversation!</p>
            <p className="text-sm">Send a message to {otherUser.full_name} about the task.</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = isOwnMessage(message);
            const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
            
            // Handle status update
            if (message.message_type === 'status_update') {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="bg-blue-50 rounded-lg px-4 py-2 inline-flex items-center shadow-sm border border-blue-100">
                    {message.status_update && getStatusIcon(message.status_update.status)}
                    <div className="ml-2">
                      <p className="text-sm font-medium text-blue-800">
                        Status updated to {formatStatus(message.status_update?.status || '')}
                      </p>
                      {message.status_update?.notes && (
                        <p className="text-xs text-blue-600 mt-1">
                          "{message.status_update.notes}"
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
            
            // Render regular message
            return (
              <div
                key={message.id}
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
                    {message.image_url && isImage(message.image_url) && (
                      <div className="mb-2">
                        <img 
                          src={message.image_url} 
                          alt="Shared image" 
                          className="rounded-lg max-h-60 w-auto cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(message.image_url, '_blank')}
                        />
                      </div>
                    )}
                    {message.content && (
                      <p className="text-sm break-words">{message.content}</p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs ${
                        isOwn ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {formatTimestamp(message.created_at)}
                      </span>
                      {isOwn && (
                        <span className={`text-xs ml-2 ${
                          message.is_read ? 'text-blue-200' : 'text-blue-300'
                        }`}>
                          {message.is_read ? '✓✓' : '✓'}
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

export default TaskChat;