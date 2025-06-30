import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Clock, DollarSign, Tag, User, Map as MapIcon, List, AlertCircle, CheckCircle, X as XIcon, Package, PlusCircle, Flame, ArrowRight, MessageSquare, Briefcase, History } from 'lucide-react';
import InteractiveCampusMap from './InteractiveCampusMap';
import TaskDetails from './TaskDetails';
import { Location } from '../lib/locationService';
import toast from 'react-hot-toast';
import { taskService, profileService, notificationService, taskProgressService } from '../lib/database';
import { auth, db } from '../lib/firebase';
import { doc, runTransaction, collection } from 'firebase/firestore';
import TaskStatusUpdate from './TaskStatusUpdate';
import { StarBorder } from './ui/star-border';

interface TaskMarketplaceProps {
  userLocation?: Location | null;
}

const TaskMarketplace: React.FC<TaskMarketplaceProps> = ({ userLocation }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('proximity');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedTaskInitialTab, setSelectedTaskInitialTab] = useState<'details' | 'chat' | 'tracker'>('details');
  const [selectedTaskViewMode, setSelectedTaskViewMode] = useState<'normal' | 'progress-tracking'>('normal');
  const [currentLocation, setCurrentLocation] = useState<Location | null>(userLocation || null);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'accepted' | 'created'>('available');
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCompletedNotification, setShowCompletedNotification] = useState(false);
  const [taskSubscriptions, setTaskSubscriptions] = useState<Map<string, () => void>>(new Map());

  useEffect(() => {
    getCurrentUser();
    
    // If userLocation changes, update currentLocation
    if (userLocation) {
      setCurrentLocation(userLocation);
    }
    
    // Set up real-time subscriptions for each tab
    setupTaskSubscriptions();

    // Listen for create-task event
    const handleCreateTask = () => {
      window.dispatchEvent(new CustomEvent('open-create-task'));
    };
    window.addEventListener('create-task', handleCreateTask);

    // Listen for profile tab change events
    const handleSetProfileTab = (event: any) => {
      if (event.detail && event.detail.tab) {
        console.log('Setting profile tab to:', event.detail.tab);
      }
    };
    window.addEventListener('set-profile-tab', handleSetProfileTab);

    return () => {
      // Clean up all subscriptions
      taskSubscriptions.forEach(unsubscribe => unsubscribe());
      window.removeEventListener('create-task', handleCreateTask);
      window.removeEventListener('set-profile-tab', handleSetProfileTab);
    };
  }, [selectedCategory, sortBy, userLocation, activeTab, currentUser]);

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

  const setupTaskSubscriptions = () => {
    // Clean up existing subscriptions
    taskSubscriptions.forEach(unsubscribe => unsubscribe());
    setTaskSubscriptions(new Map());

    if (!currentUser) return;

    const filters = [];
    
    if (activeTab === 'available') {
      filters.push({ field: 'status', operator: '==', value: 'open' });
      // Don't show user's own tasks in available tab
      filters.push({ field: 'created_by', operator: '!=', value: currentUser.id });
    } else if (activeTab === 'accepted') {
      filters.push({ field: 'accepted_by', operator: '==', value: currentUser.id });
      // Show tasks that are in progress (not open and not completed)
      // Use 'in' operator instead of multiple '!=' filters
      filters.push({ field: 'status', operator: 'in', value: ['accepted', 'picked_up', 'in_progress', 'on_way', 'delivered'] });
    } else if (activeTab === 'created') {
      filters.push({ field: 'created_by', operator: '==', value: currentUser.id });
      // Don't show completed tasks
      filters.push({ field: 'status', operator: '!=', value: 'completed' });
    }

    if (selectedCategory !== 'all') {
      filters.push({ field: 'category', operator: '==', value: selectedCategory });
    }

    // Set up real-time subscription
    const unsubscribe = taskService.subscribeToTasks((tasksData) => {
      enrichAndSetTasks(tasksData || []);
    }, filters);

    // Store the unsubscribe function
    const newSubscriptions = new Map(taskSubscriptions);
    newSubscriptions.set(activeTab, unsubscribe);
    setTaskSubscriptions(newSubscriptions);
  };

  const enrichAndSetTasks = async (tasksData: any[]) => {
    try {
      // Enrich tasks with creator profiles
      const enrichedTasks = await Promise.all(
        tasksData.map(async (task) => {
          try {
            const creatorProfile = await profileService.getProfile(task.created_by);
            return {
              ...task,
              creator: creatorProfile || { id: task.created_by, full_name: 'Unknown User' }
            };
          } catch (error) {
            console.error('Error loading creator profile:', error);
            return {
              ...task,
              creator: { id: task.created_by, full_name: 'Unknown User' }
            };
          }
        })
      );

      let sortedTasks = enrichedTasks;

      if (currentLocation) {
        // Calculate distance for each task
        sortedTasks = enrichedTasks.map(task => ({
          ...task,
          distance: calculateDistance(
            currentLocation,
            task.location_coords || { lat: 0, lng: 0 }
          ),
          urgencyScore: calculateUrgencyScore(task)
        }));

        // Sort tasks based on selected criteria
        if (sortBy === 'proximity') {
          sortedTasks.sort((a, b) => a.distance - b.distance);
        } else if (sortBy === 'urgency') {
          sortedTasks.sort((a, b) => b.urgencyScore - a.urgencyScore);
        } else if (sortBy === 'price-high') {
          sortedTasks.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'price-low') {
          sortedTasks.sort((a, b) => a.price - b.price);
        }
      }

      setTasks(sortedTasks);
      setLoading(false);
    } catch (error) {
      console.error('Error enriching tasks:', error);
      setTasks(tasksData);
      setLoading(false);
    }
  };

  const calculateDistance = (loc1: Location, loc2: Location): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateUrgencyScore = (task: any): number => {
    const createdAt = new Date(task.created_at).getTime();
    const now = new Date().getTime();
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
    return Math.max(0, 100 - hoursSinceCreation); // Higher score for newer tasks
  };

  const handleAcceptTask = async (taskId: string) => {
    try {
      if (!currentUser) {
        toast.error('You must be logged in to accept tasks');
        return;
      }

      // Check if this is the user's own task
      const task = tasks.find(t => t.id === taskId);
      if (task && task.created_by === currentUser.id) {
        toast.error('You cannot accept your own task');
        return;
      }

      setLoading(true);
      
      // Use a transaction to update task and create progress
      await runTransaction(db, async (transaction) => {
        // Update task status and accepted_by
        const taskRef = doc(db, 'tasks', taskId);
        transaction.update(taskRef, {
          status: 'accepted',
          accepted_by: currentUser.id,
          updated_at: new Date()
        });
        
        // Create progress entry
        const progressRef = doc(collection(db, 'task_progress'));
        transaction.set(progressRef, {
          task_id: taskId,
          status: 'accepted',
          notes: 'Task accepted',
          created_at: new Date(),
          updated_at: new Date()
        });
      });

      // Create notification for task creator
      if (task) {
        await notificationService.createNotification({
          user_id: task.created_by,
          type: 'task',
          title: 'Task Accepted',
          content: `Your task "${task.title}" has been accepted`,
          task_id: taskId,
          read: false
        });
      }

      toast.success('Task accepted successfully!');
      
      // Automatically switch to "Tasks You're Doing" tab
      setActiveTab('accepted');
      
      // Open task details to show progress controls
      setTimeout(() => {
        const acceptedTask = tasks.find(t => t.id === taskId);
        if (acceptedTask) {
          setSelectedTask(acceptedTask);
          setSelectedTaskInitialTab('details');
          setSelectedTaskViewMode('normal');
        }
      }, 500);
      
    } catch (error) {
      console.error('Error accepting task:', error);
      toast.error('Error accepting task');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDecline = (taskId: string) => {
    // Just remove from the current view, don't actually delete
    setTasks(tasks.filter(task => task.id !== taskId));
    toast.success('Task removed from view');
  };

  const handleContinueTask = (task: any) => {
    // Open task details with progress controls and chat visible
    setSelectedTask(task);
    setSelectedTaskInitialTab('details');
    setSelectedTaskViewMode('progress-tracking');
  };

  const handleViewTracker = (task: any) => {
    setSelectedTask(task);
    setSelectedTaskInitialTab('tracker');
    setSelectedTaskViewMode('progress-tracking');
  };

  const handleUpdateStatus = (task: any) => {
    // Instead of opening the status update modal, open the task details page
    setSelectedTask(task);
    setSelectedTaskInitialTab('details');
    setSelectedTaskViewMode('progress-tracking');
  };

  const handleStatusUpdateComplete = () => {
    setShowStatusUpdate(false);
    setSelectedTaskForUpdate(null);
    // Refresh the task list
    setupTaskSubscriptions();
  };

  const handleViewTaskHistory = () => {
    // Navigate to task history
    setShowCompletedNotification(false);
    window.dispatchEvent(new CustomEvent('open-profile'));
    // Set the active tab to history in the profile component
    const event = new CustomEvent('set-profile-tab', { detail: { tab: 'history' } });
    window.dispatchEvent(event);
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'delivery', name: 'Delivery' },
    { id: 'coffee_run', name: 'Coffee Run' },
    { id: 'academic_help', name: 'Academic Help' },
    { id: 'pet_care', name: 'Pet Care' },
    { id: 'meal_exchange', name: 'Meal Exchange' },
    { id: 'transportation', name: 'Transportation' },
    { id: 'other', name: 'Other' }
  ];

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)} m`;
    }
    return `${distance.toFixed(1)} mi`;
  };

  const getTabTitle = (tab: 'available' | 'accepted' | 'created') => {
    switch (tab) {
      case 'available':
        return 'Trending Near You';
      case 'accepted':
        return 'Tasks You\'re Doing';
      case 'created':
        return 'Your Posted Tasks';
    }
  };

  const getEmptyStateMessage = () => {
    switch (activeTab) {
      case 'available':
        return "No available tasks found. Try adjusting your search or filters.";
      case 'accepted':
        return "You haven't accepted any tasks yet.";
      case 'created':
        return "You haven't created any tasks yet.";
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatTimeLeft = (task: any) => {
    // This is a simplified version - in a real app you would calculate based on estimated_time
    if (task.estimated_time.includes('min')) {
      return task.estimated_time.replace('minutes', 'min').replace('minute', 'min');
    }
    
    // Try to extract numbers from the estimated time
    const match = task.estimated_time.match(/(\d+)/);
    if (match) {
      const minutes = parseInt(match[1]);
      if (minutes < 60) {
        return `${minutes}m left`;
      } else {
        const hours = Math.floor(minutes / 60);
        return `${hours}h left`;
      }
    }
    
    return task.estimated_time;
  };

  const getTaskStatusBadge = (task: any) => {
    const status = task.status;
    const statusColors = {
      'open': 'bg-blue-100 text-blue-800',
      'accepted': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-orange-100 text-orange-800',
      'on_way': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'completed': 'bg-green-100 text-green-800'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  // Format hourly rate display
  const formatHourlyRate = (task: any) => {
    if (!task.hourly_rate) return null;
    
    const hourlyRate = task.hourly_rate;
    const estimatedHours = task.estimated_hours || 1;
    
    return (
      <div className="flex items-center text-sm text-gray-500">
        <Briefcase className="w-4 h-4 mr-1 text-gray-400" />
        <span>${hourlyRate.toFixed(2)}/hr × {estimatedHours}h</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gray-50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className="flex items-center">
            <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-[#FA4616] mr-2" />
            <h1 className="text-2xl sm:text-3xl font-bold">{getTabTitle(activeTab)}</h1>
          </div>
          {activeTab === 'available' && (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
              Live
            </div>
          )}
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border ${
                viewMode === 'list'
                  ? 'bg-[#0038FF] text-white border-[#0038FF]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg border ${
                viewMode === 'map'
                  ? 'bg-[#0038FF] text-white border-[#0038FF]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'
              }`}
            >
              <MapIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {activeTab === 'available' && (
          <p className="text-gray-500 text-sm hidden md:block">
            Tasks posted in the last hour within walking distance
          </p>
        )}
      </div>

      {/* Task Type Tabs */}
      <div className="mb-6 border-b border-gray-200 overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === 'available' 
                ? 'bg-white text-[#0038FF] border border-b-0 border-gray-200'
                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
            }`}
          >
            Available Tasks
          </button>
          
          <button
            onClick={() => setActiveTab('accepted')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === 'accepted'
                ? 'bg-white text-[#0038FF] border border-b-0 border-gray-200'
                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
            }`}
          >
            Tasks You're Doing
            {tasks.filter(t => t.accepted_by === currentUser?.id && t.status !== 'completed').length > 0 && (
              <span className="ml-2 bg-[#0038FF] text-white text-xs px-2 py-1 rounded-full">
                {tasks.filter(t => t.accepted_by === currentUser?.id && t.status !== 'completed').length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('created')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === 'created'
                ? 'bg-white text-[#0038FF] border border-b-0 border-gray-200'
                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
            }`}
          >
            Your Posted Tasks
          </button>
        </div>
      </div>
      
      {/* Completed Tasks Notification */}
      {showCompletedNotification && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-green-800">Completed tasks are now in your Task History.</p>
          </div>
          <button
            onClick={handleViewTaskHistory}
            className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center"
          >
            <History className="w-4 h-4 mr-1" />
            View History
          </button>
        </div>
      )}
      
      {/* Mobile Search and Filters */}
      <div className="md:hidden mb-4">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF]"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border border-gray-200 rounded-lg bg-white"
          >
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF]"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF]"
              >
                <option value="proximity">Nearest First</option>
                <option value="urgency">Most Urgent</option>
                <option value="price-high">Highest Price</option>
                <option value="price-low">Lowest Price</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Desktop Search and Filters */}
      <div className="hidden md:flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF]"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full md:w-48 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF]"
        >
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full md:w-48 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF]"
        >
          <option value="proximity">Nearest First</option>
          <option value="urgency">Most Urgent</option>
          <option value="price-high">Highest Price</option>
          <option value="price-low">Lowest Price</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0038FF]"></div>
        </div>
      ) : viewMode === 'map' ? (
        <div className="h-[calc(100vh-16rem)] border border-gray-200 rounded-lg overflow-hidden">
          <InteractiveCampusMap
            tasks={filteredTasks}
            currentLocation={currentLocation}
            onTaskSelect={(task) => {
              setSelectedTask(task);
              setSelectedTaskInitialTab('details');
              setSelectedTaskViewMode('normal');
            }}
            onBundleSelect={setSelectedBundle}
            onLocationUpdate={setCurrentLocation}
          />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {getEmptyStateMessage()}
          </p>
          {activeTab === 'created' && (
            <StarBorder color="#FF5A1F" className="mt-4 inline-block">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('create-task'))}
                className="bg-gradient-to-r from-[#FF5A1F] to-[#E63A0B] text-white px-4 py-2 rounded-lg flex items-center mx-auto font-semibold"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Create a New Task
              </button>
            </StarBorder>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="premium-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer transform hover:scale-[1.02]"
              onClick={() => {
                setSelectedTask(task);
                setSelectedTaskInitialTab('details');
                setSelectedTaskViewMode('normal');
              }}
            >
              {/* Task Header - Urgent Badge */}
              {task.urgencyScore > 70 && (
                <div className="bg-gradient-to-r from-red-500 to-orange-500 h-1.5 w-full"></div>
              )}
              
              <div className="p-5">
                {/* Task Title with Status Badge */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900 flex-1 mr-2">{task.title}</h3>
                  <div className="flex flex-col items-end space-y-1">
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0038FF] to-[#0021A5]">${task.price}</span>
                    {activeTab !== 'available' && getTaskStatusBadge(task)}
                  </div>
                </div>
                
                {/* Category */}
                <div className="mb-3">
                  <span className="inline-block bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                    {task.category.replace('_', ' ')}
                  </span>
                </div>
                
                {/* Description */}
                <p className="text-gray-600 mb-4 line-clamp-2">{task.description}</p>
                
                {/* Location and Time */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1 text-gray-400" />
                    <span>{formatTimeLeft(task)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                    <span className="truncate max-w-[150px]">{task.location.split(',')[0]}</span>
                  </div>
                  {formatHourlyRate(task)}
                </div>
                
                {/* User Info and Distance */}
                <div className="flex items-center justify-between mb-4 border-t border-gray-100 pt-3">
                  <div className="flex items-center">
                    {task.creator?.avatar_url ? (
                      <img
                        src={task.creator.avatar_url}
                        alt={task.creator.full_name}
                        className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0038FF] to-[#0021A5] flex items-center justify-center mr-2 text-white">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{task.creator?.full_name || 'Anonymous'}</p>
                      {task.creator?.is_verified && (
                        <span className="text-xs text-green-600 flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {task.distance && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {formatDistance(task.distance)} away
                    </span>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {activeTab === 'available' && (
                    <StarBorder color="#0038FF" className="flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptTask(task.id);
                        }}
                        className="w-full bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Task
                      </button>
                    </StarBorder>
                  )}
                  {activeTab === 'created' && task.status === 'open' && (
                    <button
                      className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition duration-200 shadow-md"
                    >
                      Pending Acceptance
                    </button>
                  )}
                  {activeTab === 'created' && task.status !== 'open' && (
                    <StarBorder color="#0038FF" className="flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTracker(task);
                        }}
                        className="w-full bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Track Progress
                      </button>
                    </StarBorder>
                  )}
                  {activeTab === 'accepted' && (
                    <>
                      <StarBorder color="#0038FF" className="flex-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Direct to task details page instead of status update modal
                            handleContinueTask(task);
                          }}
                          className="w-full bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Update Status
                        </button>
                      </StarBorder>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContinueTask(task);
                        }}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition duration-200 border border-gray-300"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  
                  {activeTab === 'available' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickDecline(task.id);
                      }}
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition duration-200 border border-gray-300"
                    >
                      <XIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onAccept={() => handleAcceptTask(selectedTask.id)}
          onTaskCompleted={() => {
            setSelectedTask(null);
            setShowCompletedNotification(true);
            // Refresh task list
            setupTaskSubscriptions();
          }}
          initialTab={selectedTaskInitialTab}
          viewMode={selectedTaskViewMode}
        />
      )}

      {showStatusUpdate && selectedTaskForUpdate && (
        <TaskStatusUpdate
          task={selectedTaskForUpdate}
          onClose={() => setShowStatusUpdate(false)}
          onStatusUpdated={() => {
            handleStatusUpdateComplete();
            // If the task was completed, show the notification
            if (selectedTaskForUpdate.status === 'completed') {
              setShowCompletedNotification(true);
            }
          }}
        />
      )}

      {selectedBundle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full border border-gray-200 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Accept Task Bundle</h3>
              <button
                onClick={() => setSelectedBundle(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Total Earnings</span>
                  <span className="text-lg font-bold text-[#0038FF]">
                    ${selectedBundle.totalEarnings}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Estimated Time</span>
                  <span>{selectedBundle.totalTime}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  
                  <span>Total Distance</span>
                  <span>{selectedBundle.totalDistance.toFixed(1)}km</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Tasks in this bundle:</h4>
                {selectedBundle.tasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-gray-400 mr-2" />
                      <span>{task.title}</span>
                    </div>
                    <span className="font-medium">${task.price}</span>
                  </div>
                ))}
              </div>

              <StarBorder color="#0038FF">
                <button
                  onClick={() => {
                    // Accept all tasks in the bundle
                    Promise.all(selectedBundle.tasks.map(task => handleAcceptTask(task.id)))
                      .then(() => {
                        setSelectedBundle(null);
                        toast.success('Task bundle accepted successfully!');
                      })
                      .catch(error => {
                        console.error('Error accepting bundle:', error);
                        toast.error('Error accepting task bundle');
                      });
                  }}
                  className="w-full bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Accept All Tasks
                </button>
              </StarBorder>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskMarketplace;