import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Search, User, ChevronRight, Clock, Eye, Info, Flag, MoreVertical } from 'lucide-react';
import GameChat from './GameChat';
import { db } from '../lib/firebase';
import { taskService, messageService, profileService } from '../lib/database';
import UserProfileModal from './UserProfileModal';
import ReportModal from './ReportModal';
import toast from 'react-hot-toast';

interface ChatListProps {
  userId: string;
  currentUser?: any;
}

interface ChatItem {
  id: string;
  task_id?: string;
  other_user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  last_message?: {
    content: string;
    created_at: any;
    image_url?: string;
  };
}

const ChatList: React.FC<ChatListProps> = ({ userId, currentUser }) => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [unsubscribeFunction, setUnsubscribeFunction] = useState<(() => void) | null>(null);
  const [selectedChatData, setSelectedChatData] = useState<ChatItem | null>(null);
  
  useEffect(() => {
    loadChats();
    
    // Handle clicks outside the menu
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(null);
      }
    };
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('mousedown', handleClickOutside);
      if (unsubscribeFunction) {
        unsubscribeFunction();
      }
    };
  }, [userId]);

  const loadChats = async () => {
    try {
      setLoading(true);
      
      // Unsubscribe from previous subscription if exists
      if (unsubscribeFunction) {
        unsubscribeFunction();
      }
      
      if (!userId) {
        console.warn('No user ID provided to ChatList');
        setLoading(false);
        return;
      }
      
      console.log('Loading chats for user:', userId);
      
      // Subscribe to user chat threads
      const unsubscribe = messageService.subscribeToUserChatThreads(userId, (chatThreads) => {
        console.log('Received chat threads:', chatThreads.length);
        
        // Process chat threads to get the right format
        const chatItems: ChatItem[] = chatThreads.map(thread => {
          return {
            id: thread.id,
            task_id: thread.last_task_id, // Use the last task ID if available
            other_user: {
              id: thread.other_user?.id || 'unknown',
              full_name: thread.other_user?.full_name || 'Unknown User',
              avatar_url: thread.other_user?.avatar_url
            },
            last_message: thread.last_message ? {
              content: thread.last_message,
              created_at: thread.last_message_time
            } : undefined
          };
        });
        
        // Sort by last message time (most recent first)
        chatItems.sort((a, b) => {
          if (!a.last_message && !b.last_message) return 0;
          if (!a.last_message) return 1;
          if (!b.last_message) return -1;
          
          const aTime = a.last_message.created_at ? new Date(a.last_message.created_at).getTime() : 0;
          const bTime = b.last_message.created_at ? new Date(b.last_message.created_at).getTime() : 0;
          
          return bTime - aTime;
        });
        
        setChats(chatItems);
        setLoading(false);
      });
      
      setUnsubscribeFunction(() => unsubscribe);
      
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Error loading chat list');
      setLoading(false);
    }
  };

  const handleViewProfile = (chat: ChatItem) => {
    setSelectedUser(chat.other_user);
    setShowUserProfile(true);
    setShowMenu(null);
  };

  const handleReportIssue = (chat: ChatItem) => {
    setSelectedUser(chat.other_user);
    setSelectedTaskId(chat.task_id || null);
    setShowReportModal(true);
    setShowMenu(null);
  };

  const filteredChats = chats.filter(chat =>
    chat.other_user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      return 'Unknown';
    }
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getMessagePreview = (message?: ChatItem['last_message']) => {
    if (!message) return 'No messages yet';
    if (message.image_url) {
      return '📷 Image';
    }
    return message.content || 'No messages yet';
  };

  const handleSelectChat = (chat: ChatItem) => {
    setSelectedChat(chat.id);
    setSelectedChatData(chat);
  };

  const handleBackToList = () => {
    setSelectedChat(null);
    setSelectedChatData(null);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row">
      {/* Chat List Sidebar - Hidden on mobile when a chat is selected */}
      <div className={`${isMobile && selectedChat ? 'hidden' : 'block'} w-full md:w-80 border-r bg-white flex flex-col`}>
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold mb-4">Messages</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0021A5]"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0021A5]"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <MessageSquare className="w-12 h-12 mb-2" />
              <p>No messages yet</p>
              <p className="text-sm text-center px-4">
                Accept a task or have someone accept your task to start chatting
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div key={chat.id} className="relative">
                <button
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full p-4 border-b hover:bg-gray-50 transition-colors flex items-start text-left ${
                    selectedChat === chat.id ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    {chat.other_user.avatar_url ? (
                      <img
                        src={chat.other_user.avatar_url}
                        alt={chat.other_user.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {chat.other_user.full_name}
                      </h3>
                      {chat.last_message && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(chat.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{getMessagePreview(chat.last_message)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                </button>
                
                <button 
                  onClick={() => setShowMenu(showMenu === chat.id ? null : chat.id)}
                  className="absolute top-4 right-10 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {showMenu === chat.id && (
                  <div 
                    ref={menuRef}
                    className="absolute right-10 top-10 w-48 bg-white rounded-lg shadow-lg py-2 z-10 border border-gray-200"
                  >
                    <button
                      onClick={() => handleViewProfile(chat)}
                      className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Profile
                    </button>
                    <button
                      className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                    >
                      <Info className="w-4 h-4 mr-2" />
                      Task Details
                    </button>
                    <button
                      onClick={() => handleReportIssue(chat)}
                      className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Report Issue
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window - Full width on mobile when a chat is selected */}
      <div className={`${isMobile && !selectedChat ? 'hidden' : 'flex'} flex-1 flex-col bg-gray-50`}>
        {selectedChat && selectedChatData && currentUser ? (
          <>
            {/* Mobile back button */}
            {isMobile && (
              <div className="bg-white p-2 border-b">
                <button 
                  onClick={handleBackToList}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ChevronRight className="w-5 h-5 transform rotate-180 mr-1" />
                  <span>Back to messages</span>
                </button>
              </div>
            )}
            <GameChat
              taskId={selectedChatData.task_id || selectedChat}
              otherUser={selectedChatData.other_user}
              currentUser={currentUser}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-gray-500 p-4">
            <div>
              <MessageSquare className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a chat to start messaging</h3>
              <p>Choose a conversation from the list to view messages</p>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {showUserProfile && selectedUser && (
        <UserProfileModal
          user={{
            id: selectedUser.id,
            full_name: selectedUser.full_name,
            avatar_url: selectedUser.avatar_url,
            level: 3, // Mock data
            badges: ['First Task', 'Verified'],
            rating: 4.8,
            total_tasks: 12,
            activity_status: 'online'
          }}
          onClose={() => setShowUserProfile(false)}
        />
      )}

      {/* Report Modal */}
      {showReportModal && selectedUser && (
        <ReportModal
          taskId={selectedTaskId || ''}
          userId={selectedUser.id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

export default ChatList;