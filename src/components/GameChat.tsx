import React, { useState, useEffect, useRef } from 'react';
import { Send, User, X, Paperclip, Loader, Smile, Star, Award, MapPin, Calendar, MessageSquare, Shield, Trophy, Zap, Info, Eye, Flag, Languages } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import UserProfileModal from './UserProfileModal';
import ReportModal from './ReportModal';
import TranslateButton from './TranslateButton';
import TranslatableText from './TranslatableText';
import { useTranslation } from './TranslationProvider';
import { messageService } from '../lib/database';

interface GameChatProps {
  taskId: string;
  currentUser: any;
  otherUser: any;
  showTypingIndicator?: boolean;
  enableFileSharing?: boolean;
  showUserProfile?: boolean;
  onStatusUpdate?: (status: string) => void;
}

interface Message {
  id: string;
  content: string;
  created_at: any;
  sender_id: string;
  recipient_id?: string;
  image_url?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  is_read?: boolean;
  is_delivered?: boolean;
  reactions?: { [userId: string]: string };
  message_type?: 'text' | 'image' | 'file';
  translated_content?: string;
  task_id?: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  major?: string;
  bio?: string;
  level?: number;
  xp?: number;
  badges?: string[];
  rating?: number;
  total_tasks?: number;
  reviews?: any[];
  contact_details?: {
    phone?: string;
    email?: string;
  };
  activity_status?: 'online' | 'offline' | 'away';
  last_seen?: any;
}

const EMOJI_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '😡'];

// Helper function to safely extract user ID from either Firebase User or custom profile objects
const getUserId = (user: any): string | null => {
  if (!user) return null;
  // Firebase User objects use 'uid', custom profile objects use 'id'
  return user.uid || user.id || null;
};

const GameChat: React.FC<GameChatProps> = ({ 
  taskId, 
  currentUser, 
  otherUser, 
  showTypingIndicator = true,
  enableFileSharing = true,
  showUserProfile = true,
  onStatusUpdate
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [filePreview, setFilePreview] = useState<{ url: string; name: string; type: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [showReactions, setShowReactions]= useState<string | null>(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<UserProfile | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<{[key: string]: string}>({});
  const [chatThreadId, setChatThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { currentLanguage } = useTranslation();
  
  useEffect(() => {
    const currentUserId = getUserId(currentUser);
    const otherUserId = getUserId(otherUser);
    
    if (!currentUserId || !otherUserId) {
      console.warn('GameChat component missing required user IDs:', { currentUserId, otherUserId });
      return;
    }
    
    console.log('GameChat initializing with:', { 
      taskId, 
      currentUserId, 
      otherUserId 
    });
    
    // Initialize chat thread
    const initializeChat = async () => {
      try {
        setLoading(true);
        console.log('Finding or creating chat thread...');
        
        // Find or create a chat thread between the users
        const threadId = await messageService.findOrCreateChatThread(
          currentUserId,
          otherUserId,
          taskId
        );
        
        console.log('Chat thread ID:', threadId);
        setChatThreadId(threadId);
        
        // Now load messages from this thread
        console.log('Subscribing to messages...');
        const unsubscribe = messageService.subscribeToMessages(threadId, (messageData) => {
          console.log('Received messages:', messageData.length);
          setMessages(messageData);
          
          // Mark messages as read and delivered
          markMessagesAsReadAndDelivered(messageData);
          
          scrollToBottom();
          setConnectionStatus('connected');
          setLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Error initializing chat:', error);
        setLoading(false);
        setConnectionStatus('disconnected');
        toast.error('Error loading chat messages');
        return () => {};
      }
    };
    
    loadOtherUserProfile();
    const unsubscribePromise = initializeChat();
    setConnectionStatus('connected');
    
    // Handle clicks outside the menu
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [currentUser, otherUser, taskId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadOtherUserProfile = async () => {
    try {
      const otherUserId = getUserId(otherUser);
      if (!otherUserId) return;
      
      const profileDoc = await getDoc(doc(db, 'profiles', otherUserId));
      const statsDoc = await getDoc(doc(db, 'user_stats', otherUserId));
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        const statsData = statsDoc.exists() ? statsDoc.data() : {};
        
        setOtherUserProfile({
          id: otherUserId,
          full_name: profileData.full_name || otherUser.full_name,
          avatar_url: profileData.avatar_url || otherUser.avatar_url,
          major: profileData.major,
          bio: profileData.bio,
          level: calculateLevel(statsData.total_earnings || 0),
          xp: statsData.total_earnings || 0,
          badges: profileData.badges || [],
          rating: statsData.average_rating || 0,
          total_tasks: statsData.tasks_completed || 0,
          reviews: [],
          contact_details: {
            email: profileData.email,
            phone: profileData.phone
          },
          activity_status: 'online',
          last_seen: new Date()
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const calculateLevel = (xp: number): number => {
    return Math.floor(xp / 50) + 1; // 1 level per $50 earned
  };

  const getLevelTitle = (level: number): string => {
    if (level >= 20) return 'Campus Legend';
    if (level >= 15) return 'Top Gator';
    if (level >= 10) return 'Campus Hero';
    if (level >= 5) return 'Rising Star';
    return 'New Gator';
  };

  const markMessagesAsReadAndDelivered = async (messageList: Message[]) => {
    const currentUserId = getUserId(currentUser);
    if (!currentUserId || !chatThreadId) return;
    
    const unreadMessages = messageList.filter(
      msg => msg.sender_id !== currentUserId && (!msg.is_read || !msg.is_delivered)
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

  const handleTyping = () => {
    if (!showTypingIndicator) return;
    
    if (!isTyping) {
      setIsTyping(true);
      // In a real implementation, you would send typing indicators to the other user
      // For demo purposes, we'll simulate the other user typing
      setTimeout(() => {
        setOtherUserTyping(true);
        setTimeout(() => setOtherUserTyping(false), 3000);
      }, 1000);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleFileClick = () => {
    if (!enableFileSharing) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreview({
        url: previewUrl,
        name: file.name,
        type: 'image'
      });
    } else {
      // For non-image files, just show the name
      setFilePreview({
        url: '',
        name: file.name,
        type: 'file'
      });
    }
  };

  const removeFilePreview = () => {
    if (filePreview?.url && filePreview.type === 'image') {
      URL.revokeObjectURL(filePreview.url);
    }
    setFilePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File): Promise<{url: string, name: string, type: string}> => {
    try {
      const currentUserId = getUserId(currentUser);
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `chat/${chatThreadId}/${fileName}`;

      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      
      const downloadURL = await getDownloadURL(storageRef);
      return {
        url: downloadURL,
        name: file.name,
        type: file.type
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !selectedFile) {
      return;
    }
    
    const currentUserId = getUserId(currentUser);
    const otherUserId = getUserId(otherUser);
    
    if (!currentUserId || !otherUserId || !chatThreadId) {
      toast.error('Missing required information to send message');
      return;
    }

    // Optimistic UI - add message immediately
    const optimisticId = `temp-${Date.now()}`;
    const now = new Date();
    const optimisticMessage: Message = {
      id: optimisticId,
      sender_id: currentUserId,
      recipient_id: otherUserId,
      content: newMessage.trim() || (selectedFile ? `Sending ${selectedFile.name}...` : ''),
      image_url: filePreview?.type === 'image' ? filePreview.url : undefined,
      file_url: filePreview?.type === 'file' ? 'pending' : undefined,
      file_name: filePreview?.type === 'file' ? filePreview.name : undefined,
      file_type: filePreview?.type === 'file' ? 'file' : undefined,
      is_read: false,
      is_delivered: false,
      created_at: now,
      reactions: {},
      message_type: filePreview?.type === 'image' ? 'image' : filePreview?.type === 'file' ? 'file' : 'text',
      task_id: taskId
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    removeFilePreview();
    scrollToBottom();

    setLoading(true);
    try {
      let fileData = null;
      if (selectedFile) {
        setUploadingFile(true);
        fileData = await uploadFile(selectedFile);
        setUploadingFile(false);
      }

      const messageData: any = {
        sender_id: currentUserId,
        recipient_id: otherUserId,
        content: newMessage.trim() || (fileData ? `Sent ${fileData.name}` : ''),
        is_read: false,
        is_delivered: true,
        reactions: {},
        task_id: taskId
      };

      // Add file data if present
      if (fileData) {
        if (fileData.type.startsWith('image/')) {
          messageData.image_url = fileData.url;
          messageData.message_type = 'image';
        } else {
          messageData.file_url = fileData.url;
          messageData.file_name = fileData.name;
          messageData.file_type = fileData.type;
          messageData.message_type = 'file';
        }
      } else {
        messageData.message_type = 'text';
      }

      // Send the message using the messageService
      await messageService.sendMessage(chatThreadId, messageData);

      // Remove optimistic message since real one will come through subscription
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error sending message. Please try again.');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
    } finally {
      setLoading(false);
      setUploadingFile(false);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const currentUserId = getUserId(currentUser);
      if (!chatThreadId || !currentUserId) return;
      await messageService.addReaction(chatThreadId, messageId, currentUserId, emoji);
      setShowReactions(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Error adding reaction');
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
      return 'Invalid date';
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

  const isOwnMessage = (message: Message) => {
    const currentUserId = getUserId(currentUser);
    return currentUserId && message.sender_id === currentUserId;
  };

  const getMessageStatus = (message: Message) => {
    if (isOwnMessage(message)) {
      if (message.is_read) return '✓✓';
      if (message.is_delivered) return '✓';
      return '⏳';
    }
    return '';
  };

  const getMessageStatusColor = (message: Message) => {
    if (isOwnMessage(message)) {
      if (message.is_read) return 'text-blue-400';
      if (message.is_delivered) return 'text-gray-400';
      return 'text-yellow-400';
    }
    return '';
  };

  const handleTranslateMessage = (messageId: string, translatedText: string) => {
    setTranslatedMessages(prev => ({
      ...prev,
      [messageId]: translatedText
    }));
  };

  const renderReactions = (reactions: { [userId: string]: string } = {}) => {
    const reactionCounts: { [emoji: string]: number } = {};
    Object.values(reactions).forEach(emoji => {
      reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
    });

    if (Object.keys(reactionCounts).length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <button
            key={emoji}
            onClick={() => addReaction(messages.find(m => m.reactions === reactions)?.id || '', emoji)}
            className={`px-2 py-1 rounded-full text-xs flex items-center space-x-1 transition-colors ${
              reactions[getUserId(currentUser) || ''] === emoji
                ? 'bg-[#0038FF] text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span>{emoji}</span>
            <span>{count}</span>
          </button>
        ))}
      </div>
    );
  };

  const handleViewProfile = () => {
    setShowUserProfileModal(true);
    setShowMenu(false);
  };

  const handleReportIssue = () => {
    setShowReportModal(true);
    setShowMenu(false);
  };

  // Don't render if essential props are missing
  const currentUserId = getUserId(currentUser);
  const otherUserId = getUserId(otherUser);
  
  if (!currentUserId || !otherUserId) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-gray-500">
        <p>Unable to load chat. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Chat Header */}
      <div className="p-4 border-b bg-white shadow-lg rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="relative mr-3 flex-shrink-0 cursor-pointer" onClick={handleViewProfile}>
            {otherUserProfile?.avatar_url ? (
              <img
                src={otherUserProfile.avatar_url}
                alt={otherUserProfile.full_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#0038FF]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0038FF] to-[#FF5A1F] flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-[#FF5A1F] text-white text-xs px-1 py-0.5 rounded-full font-bold text-[10px]">
              L{otherUserProfile?.level || 1}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-gray-900">{otherUserProfile?.full_name}</h3>
              <div className="bg-gradient-to-r from-[#0038FF] to-[#FF5A1F] text-white text-xs px-2 py-1 rounded-full font-bold">
                {getLevelTitle(otherUserProfile?.level || 1)}
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></div>
              <p className="text-sm text-gray-500">
                {connectionStatus === 'connected' ? 'Online' : 
                 connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
              </p>
              {otherUserProfile?.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-gray-600">{otherUserProfile.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Info className="w-5 h-5" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-10 border border-gray-200">
                  <button
                    onClick={handleViewProfile}
                    className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Profile
                  </button>
                  <button
                    onClick={handleReportIssue}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Report Issue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0038FF]"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#0038FF] to-[#FF5A1F] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <p className="text-lg font-bold mb-2">Start the conversation!</p>
            <p className="text-sm">Send a message to {otherUserProfile?.full_name}.</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = isOwnMessage(message);
            const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
            const isTranslated = !!translatedMessages[message.id];
            const displayContent = isTranslated ? translatedMessages[message.id] : message.content;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                  showAvatar ? 'mt-6' : 'mt-2'
                }`}
              >
                <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[75%]`}>
                  {showAvatar && !isOwn && (
                    <div className="relative mr-3 flex-shrink-0">
                      {otherUserProfile?.avatar_url ? (
                        <img
                          src={otherUserProfile.avatar_url}
                          alt={otherUserProfile.full_name}
                          className="w-8 h-8 rounded-full object-cover border-2 border-[#0038FF]"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0038FF] to-[#FF5A1F] flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-[#FF5A1F] text-white text-xs px-1 py-0.5 rounded-full font-bold text-[10px]">
                        L{otherUserProfile?.level || 1}
                      </div>
                    </div>
                  )}
                  
                  <div className="relative group">
                    <div
                      className={`rounded-2xl px-4 py-3 max-w-full shadow-lg ${
                        isOwn
                          ? 'bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white rounded-br-lg'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-lg'
                      }`}
                    >
                      {message.image_url && isImage(message.image_url) && (
                        <div className="mb-2">
                          <img 
                            src={message.image_url} 
                            alt="Shared image" 
                            className="rounded-xl max-h-60 w-auto cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                            onClick={() => window.open(message.image_url, '_blank')}
                          />
                        </div>
                      )}
                      
                      {message.file_url && message.file_name && (
                        <div className="mb-2 bg-gray-100 rounded-lg p-3 flex items-center">
                          <div className="bg-blue-100 p-2 rounded-lg mr-3">
                            <Paperclip className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate">{message.file_name}</p>
                            <a 
                              href={message.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {message.content && (
                        <div className="text-sm break-words leading-relaxed">
                          {displayContent}
                          
                          {/* Translation indicator */}
                          {isTranslated && (
                            <div className="text-xs mt-1 opacity-70 flex items-center">
                              <Languages className="w-3 h-3 mr-1" />
                              Translated
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Reactions */}
                      {renderReactions(message.reactions)}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span 
                          className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity ${
                            isOwn ? 'text-blue-200' : 'text-gray-500'
                          }`}
                          title={formatTimestamp(message.created_at)}
                        >
                          {formatTimestamp(message.created_at)}
                        </span>
                        {isOwn && (
                          <span className={`text-xs ml-2 ${getMessageStatusColor(message)}`}>
                            {getMessageStatus(message)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Translation Button */}
                    {message.content && currentLanguage !== 'en' && !isOwn && (
                      <div className="absolute -top-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TranslateButton 
                          text={message.content}
                          onTranslated={(translatedText) => handleTranslateMessage(message.id, translatedText)}
                          size="sm"
                          className="bg-white shadow-md text-blue-600 hover:text-blue-800"
                          targetLanguage={currentLanguage}
                        />
                      </div>
                    )}
                    
                    {/* Reaction Button */}
                    <button
                      onClick={() => setShowReactions(showReactions === message.id ? null : message.id)}
                      className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 bg-white border border-gray-200 rounded-full p-1 shadow-lg hover:bg-gray-50 transition-all"
                    >
                      <Smile className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    {/* Reaction Picker */}
                    {showReactions === message.id && (
                      <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 flex space-x-1 z-10">
                        {EMOJI_REACTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(message.id, emoji)}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {showAvatar && isOwn && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0038FF] to-[#0021A5] flex items-center justify-center ml-3 flex-shrink-0 shadow-lg">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        
        {otherUserTyping && showTypingIndicator && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-3 rounded-bl-lg shadow-lg border border-gray-200">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[#0038FF] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#0038FF] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[#0038FF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {filePreview && (
        <div className="p-4 border-t bg-white">
          <div className="relative inline-block">
            {filePreview.type === 'image' ? (
              <img 
                src={filePreview.url} 
                alt="Upload preview" 
                className="h-20 w-auto rounded-xl border border-gray-200 shadow-md"
              />
            ) : (
              <div className="h-20 px-4 rounded-xl border border-gray-200 shadow-md bg-gray-50 flex items-center">
                <Paperclip className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-gray-700 truncate max-w-[200px]">{filePreview.name}</span>
              </div>
            )}
            <button 
              onClick={removeFilePreview}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 border-t bg-white rounded-b-2xl">
        <div className="flex items-end space-x-3">
          <button
            type="button"
            onClick={handleFileClick}
            disabled={loading || uploadingFile}
            className="p-3 text-[#0038FF] hover:text-[#0021A5] hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 shadow-sm"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Type a message..."
              className="w-full resize-none rounded-2xl border-2 border-gray-200 px-4 py-3 pr-12 focus:border-[#0038FF] focus:ring-2 focus:ring-[#0038FF] focus:ring-opacity-20 focus:outline-none max-h-32 shadow-sm"
              rows={1}
              disabled={loading || uploadingFile}
              style={{
                minHeight: '48px',
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
            onChange={handleFileChange}
            accept="*/*"
            className="hidden"
          />
          
          <button
            type="submit"
            disabled={loading || uploadingFile || (!newMessage.trim() && !selectedFile)}
            className="p-3 bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white rounded-full hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
          >
            {loading || uploadingFile ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {/* User Profile Modal */}
      {showUserProfileModal && otherUserProfile && showUserProfile && (
        <UserProfileModal
          user={otherUserProfile}
          onClose={() => setShowUserProfileModal(false)}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          taskId={taskId}
          userId={getUserId(otherUser) || ''}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

// Helper function to get connection status color
const getConnectionStatusColor = () => {
  return 'bg-green-500'; // Always show as connected for demo
};

export default GameChat;