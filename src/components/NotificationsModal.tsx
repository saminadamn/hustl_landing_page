import React, { useState, useEffect } from 'react';
import { X, Bell, Check, AlertTriangle, MessageSquare, DollarSign, Star, Shield, Calendar, Clock } from 'lucide-react';
import { notificationService } from '../lib/database';
import { auth } from '../lib/firebase';

interface NotificationsModalProps {
  onClose: () => void;
}

interface Notification {
  id: string;
  type: 'task' | 'message' | 'payment' | 'status' | 'review' | 'achievement';
  title: string;
  content: string;
  read: boolean;
  created_at: any;
  task_id?: string;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
    markNotificationsAsRead();
  }, []);

  const loadNotifications = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const notificationsList = await notificationService.getUserNotifications(user.uid);
      setNotifications(notificationsList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setLoading(false);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const unreadNotifications = await notificationService.getUserNotifications(user.uid);
      const unreadIds = unreadNotifications
        .filter(notification => !notification.read)
        .map(notification => notification.id);
      
      // Mark each notification as read
      for (const id of unreadIds) {
        await notificationService.markAsRead(id);
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <Check className="w-6 h-6 text-green-500" />;
      case 'message':
        return <MessageSquare className="w-6 h-6 text-blue-500" />;
      case 'payment':
        return <DollarSign className="w-6 h-6 text-yellow-500" />;
      case 'status':
        return <Clock className="w-6 h-6 text-purple-500" />;
      case 'review':
        return <Star className="w-6 h-6 text-orange-500" />;
      case 'achievement':
        return <Shield className="w-6 h-6 text-indigo-500" />;
      default:
        return <Bell className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(notification => !notification.read);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <Bell className="w-5 h-5 text-[#0021A5] mr-2" />
            Notifications
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'all'
                  ? 'text-[#0021A5] border-b-2 border-[#0021A5]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'unread'
                  ? 'text-[#0021A5] border-b-2 border-[#0021A5]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Unread
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="ml-2 bg-[#FA4616] text-white text-xs px-2 py-1 rounded-full">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0021A5]"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Bell className="w-8 h-8 mb-2" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(notification.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {notification.content}
                      </p>
                      {notification.task_id && (
                        <button 
                          className="mt-2 text-xs text-[#0021A5] hover:text-[#001B8C] font-medium"
                          onClick={() => {
                            // Dispatch event to view task
                            window.dispatchEvent(new CustomEvent('view-task', { 
                              detail: { taskId: notification.task_id } 
                            }));
                            onClose();
                          }}
                        >
                          View Task
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-[#0021A5] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#001B8C] transition duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;