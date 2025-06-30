import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, MapPin, Star, Edit, Camera, Save, X, Shield, Award, DollarSign, Clock, Package, CheckSquare, Loader, History, Briefcase, Zap, Crown, MessageSquare } from 'lucide-react';
import { auth, db, storage } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import TaskHistory from './TaskHistory';
import { StarBorder } from './ui/star-border';
import { revenueCatService } from '../lib/revenueCatService';
import SubscriptionPlans from './SubscriptionPlans';
import DirectMessageModal from './DirectMessageModal';

const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<any>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'tasks' | 'stats' | 'history' | 'premium' | 'messages'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [showDirectMessage, setShowDirectMessage] = useState(false);
  
  // New state for hourly rate settings
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [editingRate, setEditingRate] = useState(false);

  useEffect(() => {
    loadUserData();
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Listen for profile tab change events
    const handleSetProfileTab = (event: any) => {
      if (event.detail && event.detail.tab) {
        setActiveTab(event.detail.tab);
      }
    };
    window.addEventListener('set-profile-tab', handleSetProfileTab);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('set-profile-tab', handleSetProfileTab);
    };
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user profile
      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      if (profileDoc.exists()) {
        const profileData = {
          id: profileDoc.id,
          ...profileDoc.data()
        };
        setProfile(profileData);
        setEditedProfile(profileData);
        
        // Set hourly rate if it exists
        if (profileData.hourly_rate) {
          setHourlyRate(profileData.hourly_rate.toString());
        }
      }

      // Get user stats
      const statsDoc = await getDoc(doc(db, 'user_stats', user.uid));
      if (statsDoc.exists()) {
        setStats({
          id: statsDoc.id,
          ...statsDoc.data()
        });
      }

      // Get user tasks
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('created_by', '==', user.uid),
        orderBy('created_at', 'desc')
      );
      
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasksData = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTasks(tasksData);
      
      // Check subscription status
      const subscriptionData = await revenueCatService.getCurrentSubscription(user.uid);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Error loading profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (editing) {
      // Cancel editing
      setEditedProfile(profile);
    }
    setEditing(!editing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const updatedData = {
        ...editedProfile,
        updated_at: new Date()
      };

      await updateDoc(doc(db, 'profiles', user.uid), updatedData);
      
      // Refresh profile data
      setProfile({
        ...profile,
        full_name: editedProfile.full_name,
        major: editedProfile.major
      });
      
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image size should be less than 2MB');
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }

      // Upload to Firebase Storage
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update profile
      await updateDoc(doc(db, 'profiles', user.uid), {
        avatar_url: downloadURL,
        updated_at: new Date()
      });
      
      // Update local state
      setProfile({
        ...profile,
        avatar_url: downloadURL
      });
      
      toast.success('Profile picture updated');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateNewTask = () => {
    // Dispatch the create-task event
    window.dispatchEvent(new CustomEvent('create-task'));
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  // Function to save hourly rate
  const saveHourlyRate = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Validate hourly rate
      const rate = parseFloat(hourlyRate);
      if (isNaN(rate) || rate <= 0) {
        toast.error('Please enter a valid hourly rate');
        return;
      }
      
      // Check if rate is reasonable
      if (rate > 50) {
        toast.error('Hourly rate seems unusually high. Please enter a reasonable amount.');
        return;
      }
      
      // Update profile with hourly rate
      await updateDoc(doc(db, 'profiles', user.uid), {
        hourly_rate: rate,
        updated_at: new Date()
      });
      
      // Update local state
      setProfile({
        ...profile,
        hourly_rate: rate
      });
      
      setEditingRate(false);
      toast.success('Hourly rate updated successfully');
    } catch (error) {
      console.error('Error updating hourly rate:', error);
      toast.error('Error updating hourly rate');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0021A5]"></div>
      </div>
    );
  }

  if (showSubscriptionPlans) {
    return <SubscriptionPlans onClose={() => setShowSubscriptionPlans(false)} />;
  }

  if (showDirectMessage) {
    return <DirectMessageModal onClose={() => setShowDirectMessage(false)} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
        {/* Sidebar - Hidden on mobile when not viewing profile tab */}
        <div className={`${isMobile && activeTab !== 'profile' ? 'hidden' : 'block'} md:w-1/3 lg:w-1/4`}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-[#002B7F] to-[#0038FF] p-6 text-white relative">
              <div className="flex justify-center">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white">
                      <User className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-0 right-0 bg-white text-[#0038FF] p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  >
                    {uploadingImage ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
              <h2 className="text-xl font-bold text-center mt-4">{profile?.full_name}</h2>
              <p className="text-center text-blue-100">{profile?.major || 'No major specified'}</p>
              
              {profile?.is_verified && (
                <div className="flex items-center justify-center mt-2">
                  <Shield className="w-4 h-4 mr-1 text-blue-200" />
                  <span className="text-sm">Verified Student</span>
                </div>
              )}
              
              {/* Subscription Badge */}
              {subscription && (
                <div className="absolute top-4 right-4">
                  <div className="bg-yellow-400 text-[#0038FF] px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                    <Crown className="w-3 h-3 mr-1" />
                    PREMIUM
                  </div>
                </div>
              )}
            </div>
            
            {/* Navigation */}
            <div className="p-4">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center p-3 rounded-lg ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 text-[#0038FF]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-5 h-5 mr-3" />
                  <span>Profile Information</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`flex items-center p-3 rounded-lg ${
                    activeTab === 'tasks'
                      ? 'bg-blue-50 text-[#0038FF]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Package className="w-5 h-5 mr-3" />
                  <span>My Tasks</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center p-3 rounded-lg ${
                    activeTab === 'history'
                      ? 'bg-blue-50 text-[#0038FF]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <History className="w-5 h-5 mr-3" />
                  <span>Task History</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`flex items-center p-3 rounded-lg ${
                    activeTab === 'messages'
                      ? 'bg-blue-50 text-[#0038FF]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="w-5 h-5 mr-3" />
                  <span>Messages</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`flex items-center p-3 rounded-lg ${
                    activeTab === 'stats'
                      ? 'bg-blue-50 text-[#0038FF]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Award className="w-5 h-5 mr-3" />
                  <span>Stats & Achievements</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('premium')}
                  className={`flex items-center p-3 rounded-lg ${
                    activeTab === 'premium'
                      ? 'bg-blue-50 text-[#0038FF]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Zap className="w-5 h-5 mr-3" />
                  <span>Premium</span>
                  {subscription && (
                    <span className="ml-auto bg-yellow-400 text-xs px-2 py-0.5 rounded-full text-[#0038FF] font-bold">
                      ACTIVE
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Tab Navigation */}
        {isMobile && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4 flex justify-between overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeTab === 'profile' ? 'bg-blue-50 text-[#0038FF]' : 'text-gray-600'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeTab === 'tasks' ? 'bg-blue-50 text-[#0038FF]' : 'text-gray-600'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeTab === 'history' ? 'bg-blue-50 text-[#0038FF]' : 'text-gray-600'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeTab === 'messages' ? 'bg-blue-50 text-[#0038FF]' : 'text-gray-600'
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeTab === 'stats' ? 'bg-blue-50 text-[#0038FF]' : 'text-gray-600'
              }`}
            >
              Stats
            </button>
            <button
              onClick={() => setActiveTab('premium')}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeTab === 'premium' ? 'bg-blue-50 text-[#0038FF]' : 'text-gray-600'
              }`}
            >
              Premium
            </button>
          </div>
        )}
        
        {/* Main Content */}
        <div className="md:w-2/3 lg:w-3/4">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold">Profile Information</h2>
                <button
                  onClick={handleEditToggle}
                  className="text-[#0038FF] hover:text-[#0021A5] flex items-center"
                >
                  {editing ? (
                    <>
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </>
                  )}
                </button>
              </div>
              
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={editedProfile.full_name || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-[#0038FF] focus:border-[#0038FF]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Major
                    </label>
                    <input
                      type="text"
                      name="major"
                      value={editedProfile.major || ''}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-[#0038FF] focus:border-[#0038FF]"
                    />
                  </div>
                  
                  <div className="pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="bg-[#0038FF] text-white px-4 py-2 rounded-lg hover:bg-[#0021A5] transition-colors flex items-center"
                    >
                      {loading ? (
                        <Loader className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Save className="w-5 h-5 mr-2" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start">
                    <User className="w-5 h-5 text-gray-400 mt-1 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                      <p className="mt-1">{profile?.full_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-gray-400 mt-1 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <p className="mt-1">{profile?.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Major</h3>
                      <p className="mt-1">{profile?.major || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-gray-400 mt-1 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                      <p className="mt-1">{formatDate(profile?.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-gray-400 mt-1 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Verification Status</h3>
                      <div className="mt-1 flex items-center">
                        {profile?.is_verified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckSquare className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Unverified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Subscription Status */}
                  <div className="flex items-start">
                    <Zap className="w-5 h-5 text-gray-400 mt-1 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Subscription</h3>
                      <div className="mt-1 flex items-center">
                        {subscription ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Free Plan
                          </span>
                        )}
                        <button
                          onClick={() => setShowSubscriptionPlans(true)}
                          className="ml-3 text-[#0038FF] hover:text-[#0021A5] text-sm"
                        >
                          {subscription ? 'Manage' : 'Upgrade'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hourly Rate Section */}
                  <div className="flex items-start">
                    <Briefcase className="w-5 h-5 text-gray-400 mt-1 mr-3" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-500">Default Hourly Rate</h3>
                      {editingRate ? (
                        <div className="mt-2 flex items-center">
                          <div className="relative flex-1 mr-2">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="number"
                              value={hourlyRate}
                              onChange={(e) => setHourlyRate(e.target.value)}
                              min="1"
                              step="0.01"
                              className="block w-full pl-10 rounded-lg border-gray-300 focus:border-[#0038FF] focus:ring focus:ring-[#0038FF] focus:ring-opacity-50 px-4 py-2"
                              placeholder="e.g. 15.00"
                            />
                          </div>
                          <button
                            onClick={saveHourlyRate}
                            disabled={loading}
                            className="bg-[#0038FF] text-white px-3 py-2 rounded-lg hover:bg-[#0021A5] transition-colors"
                          >
                            {loading ? (
                              <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                              <Save className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingRate(false)}
                            className="ml-2 text-gray-500 hover:text-gray-700 p-2"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center">
                          {profile?.hourly_rate ? (
                            <div className="flex items-center">
                              <span className="font-medium text-lg">${profile.hourly_rate.toFixed(2)}</span>
                              <span className="text-sm text-gray-500 ml-2">per hour</span>
                              <button
                                onClick={() => setEditingRate(true)}
                                className="ml-3 text-[#0038FF] hover:text-[#0021A5] p-1"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="text-gray-500">Not set</span>
                              <button
                                onClick={() => setEditingRate(true)}
                                className="ml-3 text-[#0038FF] hover:text-[#0021A5] flex items-center text-sm"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Set Rate
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        This rate will be suggested as the default when creating new tasks
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Premium Achievement */}
              <div className={`p-4 rounded-lg border mt-6 ${
                subscription
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    subscription
                      ? 'bg-yellow-100'
                      : 'bg-gray-100'
                  }`}>
                    <Crown className={`w-6 h-6 ${
                      subscription
                        ? 'text-yellow-600'
                        : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium">Premium Member</h4>
                    <p className="text-sm text-gray-500">Upgrade to Hustl Premium</p>
                    {!subscription && (
                      <button
                        onClick={() => setShowSubscriptionPlans(true)}
                        className="text-xs text-[#0038FF] hover:text-[#0021A5] mt-1"
                      >
                        Upgrade Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'tasks' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold">My Tasks</h2>
                <StarBorder color="#FF5A1F">
                  <button
                    onClick={handleCreateNewTask}
                    className="bg-gradient-to-r from-[#FF5A1F] to-[#E63A0B] text-white px-4 py-2 rounded-lg font-semibold flex items-center"
                  >
                    Create New Task
                  </button>
                </StarBorder>
              </div>
              
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No tasks yet</h3>
                  <p className="mt-2 text-gray-500">
                    You haven't created any tasks yet. Click the button above to create your first task.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.filter(task => task.status !== 'completed').map((task) => (
                    <div
                      key={task.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{task.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.status === 'open' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'accepted' ? 'bg-yellow-100 text-yellow-800' :
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{task.location}</span>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center text-sm">
                          <DollarSign className="w-4 h-4 mr-1 text-[#0038FF]" />
                          <span className="font-medium text-[#0038FF]">${task.price}</span>
                          {task.hourly_rate && (
                            <span className="ml-2 text-gray-500">
                              (${task.hourly_rate}/hr × {task.estimated_hours || 1}h)
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(task.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'history' && (
            <TaskHistory />
          )}
          
          {activeTab === 'messages' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center">
                  <MessageSquare className="w-6 h-6 text-[#0038FF] mr-2" />
                  Messages
                </h2>
                <StarBorder color="#0038FF">
                  <button
                    onClick={() => setShowDirectMessage(true)}
                    className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-4 py-2 rounded-lg font-semibold flex items-center"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    New Message
                  </button>
                </StarBorder>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-blue-800">
                  You can now message anyone you've previously shared a task with, even if you don't currently have a task together.
                </p>
              </div>
              
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">View your messages</h3>
                <p className="mt-2 text-gray-500 mb-6">
                  Go to the Messages tab in the main navigation to see all your conversations
                </p>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('view-messages'))}
                  className="bg-[#0038FF] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#0021A5] transition-colors"
                >
                  View Messages
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'stats' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-6">Stats & Achievements</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500">Tasks Completed</h3>
                    <CheckSquare className="w-5 h-5 text-[#0038FF]" />
                  </div>
                  <p className="text-2xl font-bold mt-2">{stats?.tasks_completed || 0}</p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500">Total Earnings</h3>
                    <DollarSign className="w-5 h-5 text-[#0038FF]" />
                  </div>
                  <p className="text-2xl font-bold mt-2">${stats?.total_earnings?.toFixed(2) || '0.00'}</p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500">Rating</h3>
                    <Star className="w-5 h-5 text-[#0038FF]" />
                  </div>
                  <div className="flex items-center mt-2">
                    <p className="text-2xl font-bold">{stats?.average_rating?.toFixed(1) || '0.0'}</p>
                    <div className="flex ml-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(stats?.average_rating || 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-4">Achievements</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${
                  (stats?.tasks_completed || 0) >= 1
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      (stats?.tasks_completed || 0) >= 1
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }`}>
                      <Award className={`w-6 h-6 ${
                        (stats?.tasks_completed || 0) >= 1
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium">First Task</h4>
                      <p className="text-sm text-gray-500">Complete your first task</p>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border ${
                  (stats?.tasks_completed || 0) >= 5
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      (stats?.tasks_completed || 0) >= 5
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }`}>
                      <Award className={`w-6 h-6 ${
                        (stats?.tasks_completed || 0) >= 5
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium">Task Master</h4>
                      <p className="text-sm text-gray-500">Complete 5 tasks</p>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border ${
                  profile?.is_verified
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      profile?.is_verified
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }`}>
                      <Shield className={`w-6 h-6 ${
                        profile?.is_verified
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium">Verified Student</h4>
                      <p className="text-sm text-gray-500">Verify your student status</p>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border ${
                  (stats?.total_earnings || 0) >= 50
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      (stats?.total_earnings || 0) >= 50
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }`}>
                      <DollarSign className={`w-6 h-6 ${
                        (stats?.total_earnings || 0) >= 50
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium">Money Maker</h4>
                      <p className="text-sm text-gray-500">Earn $50 from tasks</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'premium' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center">
                  <Zap className="w-6 h-6 text-[#0038FF] mr-2" />
                  Hustl Premium
                </h2>
                {!subscription && (
                  <StarBorder color="#0038FF">
                    <button
                      onClick={() => setShowSubscriptionPlans(true)}
                      className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-4 py-2 rounded-lg font-semibold flex items-center"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Upgrade Now
                    </button>
                  </StarBorder>
                )}
              </div>
              
              {subscription ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                  <div className="flex items-start">
                    <div className="bg-yellow-100 p-3 rounded-full mr-4">
                      <Crown className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-yellow-800">Premium Subscription Active</h3>
                      <p className="text-yellow-700 mb-2">
                        You're currently subscribed to {subscription.planName}
                      </p>
                      <p className="text-sm text-yellow-600">
                        Next billing date: {new Date(subscription.expirationDate).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => setShowSubscriptionPlans(true)}
                        className="mt-3 text-[#0038FF] hover:text-[#0021A5] text-sm font-medium"
                      >
                        Manage Subscription
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-6">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <Zap className="w-6 h-6 text-[#0038FF]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-blue-800">Upgrade to Premium</h3>
                      <p className="text-blue-700 mb-2">
                        Unlock all premium features and benefits
                      </p>
                      <p className="text-sm text-blue-600">
                        Starting at just $4.99/month
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <h3 className="text-lg font-semibold mb-4">Premium Benefits</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <DollarSign className="w-5 h-5 text-[#0038FF]" />
                    </div>
                    <h4 className="font-medium">No Service Fees</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Save 15% on every task by eliminating service fees
                  </p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <Zap className="w-5 h-5 text-[#0038FF]" />
                    </div>
                    <h4 className="font-medium">Priority Matching</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Get matched with helpers faster with priority task placement
                  </p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <Award className="w-5 h-5 text-[#0038FF]" />
                    </div>
                    <h4 className="font-medium">Premium Badge</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Stand out with a premium badge on your profile and tasks
                  </p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <Shield className="w-5 h-5 text-[#0038FF]" />
                    </div>
                    <h4 className="font-medium">Premium Support</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Get priority support and dedicated assistance
                  </p>
                </div>
              </div>
              
              {!subscription && (
                <div className="text-center">
                  <StarBorder color="#0038FF">
                    <button
                      onClick={() => setShowSubscriptionPlans(true)}
                      className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center mx-auto"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      View Premium Plans
                    </button>
                  </StarBorder>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;