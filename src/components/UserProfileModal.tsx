import React, { useState } from 'react';
import { X, Star, Award, MapPin, Calendar, MessageSquare, Shield, Trophy, Zap, User, Book, CheckCircle, Clock, Mail, Phone, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface UserProfileModalProps {
  user: {
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
  };
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'badges'>('overview');
  const [showContactDetails, setShowContactDetails] = useState(false);

  const getLevelTitle = (level: number): string => {
    if (level >= 20) return 'Campus Legend';
    if (level >= 15) return 'Top Gator';
    if (level >= 10) return 'Campus Hero';
    if (level >= 5) return 'Rising Star';
    return 'New Gator';
  };

  const getXpProgress = (xp: number): number => {
    const currentLevel = Math.floor(xp / 50) + 1;
    const xpForCurrentLevel = (currentLevel - 1) * 50;
    const xpForNextLevel = currentLevel * 50;
    const xpInCurrentLevel = xp - xpForCurrentLevel;
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
    return (xpInCurrentLevel / xpNeededForNextLevel) * 100;
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'First Task':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Top Gator':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'Campus Hero':
        return <Shield className="w-5 h-5 text-blue-500" />;
      case 'Rising Star':
        return <Star className="w-5 h-5 text-purple-500" />;
      case 'Verified':
        return <Shield className="w-5 h-5 text-green-500" />;
      default:
        return <Award className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatLastSeen = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const defaultBadges = ['First Task', 'Verified'];
  const badges = user.badges?.length ? user.badges : defaultBadges;

  // Mock reviews if none provided
  const reviews = user.reviews?.length ? user.reviews : [
    {
      id: '1',
      reviewer_name: 'Sarah M.',
      rating: 5,
      comment: 'Very reliable and friendly. Completed the task quickly!',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      reviewer_name: 'John D.',
      rating: 4,
      comment: 'Good communication throughout the task.',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header with background */}
        <div className="relative h-40 bg-gradient-to-r from-[#0038FF] to-[#FF5A1F] rounded-t-2xl">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Profile picture */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
            <div className="relative">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#0038FF] to-[#FF5A1F] flex items-center justify-center border-4 border-white shadow-xl">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-[#FF5A1F] text-white text-sm px-2 py-1 rounded-full font-bold shadow-lg">
                L{user.level || 1}
              </div>
            </div>
          </div>
        </div>
        
        {/* Profile content */}
        <div className="pt-20 px-6 pb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
            
            <div className="flex items-center justify-center space-x-2 mt-1">
              <div className="bg-gradient-to-r from-[#0038FF] to-[#FF5A1F] text-white text-sm px-3 py-1 rounded-full font-bold">
                {getLevelTitle(user.level || 1)}
              </div>
              
              {user.major && (
                <div className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                  {user.major}
                </div>
              )}
            </div>
            
            {/* Status and Last Seen */}
            <div className="flex items-center justify-center mt-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                user.activity_status === 'online' ? 'bg-green-500' : 
                user.activity_status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
              } mr-1`}></div>
              <span className="text-gray-600">
                {user.activity_status === 'online' ? 'Online' : 
                 user.activity_status === 'away' ? 'Away' : 
                 `Last seen ${formatLastSeen(user.last_seen)}`}
              </span>
            </div>
            
            {/* XP Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">Level {user.level || 1}</span>
                <span className="text-gray-500">{user.xp || 0} XP</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-[#0038FF] to-[#FF5A1F] h-2.5 rounded-full" 
                  style={{ width: `${getXpProgress(user.xp || 0)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {50 - ((user.xp || 0) % 50)} XP until Level {(user.level || 1) + 1}
              </p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 text-center font-medium ${
                activeTab === 'overview' 
                  ? 'text-[#0038FF] border-b-2 border-[#0038FF]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-2 text-center font-medium ${
                activeTab === 'reviews' 
                  ? 'text-[#0038FF] border-b-2 border-[#0038FF]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Reviews
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`flex-1 py-2 text-center font-medium ${
                activeTab === 'badges' 
                  ? 'text-[#0038FF] border-b-2 border-[#0038FF]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Badges
            </button>
          </div>
          
          {activeTab === 'overview' && (
            <div>
              {/* Bio */}
              {user.bio && (
                <div className="bg-gray-50 p-4 rounded-xl mb-6">
                  <p className="text-gray-700">{user.bio}</p>
                </div>
              )}
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-[#0038FF]">{user.total_tasks || 0}</div>
                  <div className="text-sm text-gray-600">Tasks Completed</div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-xl text-center">
                  <div className="flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#FF5A1F] mr-1">{user.rating?.toFixed(1) || '0.0'}</span>
                    <Star className="w-5 h-5 text-[#FF5A1F] fill-[#FF5A1F]" />
                  </div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              </div>
              
              {/* Contact Information */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg flex items-center">
                    <Mail className="w-5 h-5 text-[#0038FF] mr-2" />
                    Contact Information
                  </h3>
                  <button 
                    onClick={() => setShowContactDetails(!showContactDetails)}
                    className="text-[#0038FF] hover:text-[#0021A5] transition-colors"
                  >
                    {showContactDetails ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {showContactDetails ? (
                  <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                    {user.contact_details?.email && (
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-500 mr-2" />
                        <a 
                          href={`mailto:${user.contact_details.email}`}
                          className="text-[#0038FF] hover:underline"
                        >
                          {user.contact_details.email}
                        </a>
                      </div>
                    )}
                    
                    {user.contact_details?.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-500 mr-2" />
                        <a 
                          href={`tel:${user.contact_details.phone}`}
                          className="text-[#0038FF] hover:underline"
                        >
                          {user.contact_details.phone}
                        </a>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      Contact information is only visible to users you're actively working with on tasks.
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-xl text-center">
                    <p className="text-gray-600 text-sm">
                      Click to view contact information
                    </p>
                  </div>
                )}
              </div>
              
              {/* Activity */}
              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center">
                  <Clock className="w-5 h-5 text-[#0038FF] mr-2" />
                  Recent Activity
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span>Completed a task</span>
                    </div>
                    <span className="text-xs text-gray-500">2 days ago</span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-500 mr-2" />
                      <span>Received a 5-star review</span>
                    </div>
                    <span className="text-xs text-gray-500">3 days ago</span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center">
                      <Award className="w-5 h-5 text-purple-500 mr-2" />
                      <span>Earned "Rising Star" badge</span>
                    </div>
                    <span className="text-xs text-gray-500">1 week ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'reviews' && (
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center">
                <MessageSquare className="w-5 h-5 text-[#0038FF] mr-2" />
                Reviews
              </h3>
              
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <span className="ml-2 font-medium">{review.reviewer_name}</span>
                        </div>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {review.date instanceof Date 
                          ? review.date.toLocaleDateString() 
                          : new Date(review.date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-xl">
                  <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No reviews yet</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'badges' && (
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center">
                <Award className="w-5 h-5 text-[#0038FF] mr-2" />
                Badges & Achievements
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {badges.map((badge, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-xl flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                      {getBadgeIcon(badge)}
                    </div>
                    <p className="font-medium">{badge}</p>
                  </div>
                ))}
                
                {/* Locked badges */}
                <div className="bg-gray-50 p-4 rounded-xl flex flex-col items-center text-center opacity-50">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                    <Trophy className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="font-medium">Top Gator</p>
                  <p className="text-xs text-gray-500">Complete 10 tasks</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl flex flex-col items-center text-center opacity-50">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                    <Zap className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="font-medium">Speed Demon</p>
                  <p className="text-xs text-gray-500">Complete 3 tasks in one day</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;