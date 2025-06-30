import React, { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle, Loader, Package, Bike, Flag, User, Navigation, AlertTriangle } from 'lucide-react';
import TaskMap from './TaskMap';
import { Location, getCurrentLocation, watchUserLocation } from '../lib/locationService';
import { taskService, taskProgressService, locationService, profileService } from '../lib/database';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';

interface TaskLiveTrackerProps {
  taskId: string;
  onClose?: () => void;
}

const TaskLiveTracker: React.FC<TaskLiveTrackerProps> = ({ taskId, onClose }) => {
  const [task, setTask] = useState<any>(null);
  const [progressUpdates, setProgressUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [performerLocation, setPerformerLocation] = useState<Location | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<(() => void) | null>(null);

  useEffect(() => {
    getCurrentUser();
    loadTaskData();
    
    // Subscribe to task updates
    const taskUnsubscribe = taskService.subscribeToTasks((tasks) => {
      const updatedTask = tasks.find(t => t.id === taskId);
      if (updatedTask) {
        setTask(updatedTask);
      }
    });
    
    // Subscribe to progress updates
    const progressUnsubscribe = taskProgressService.subscribeToTaskProgress(taskId, (progress) => {
      setProgressUpdates(progress);
    });
    
    // Subscribe to location updates
    const locationUnsubscribe = locationService.subscribeToTaskLocation(taskId, (locationData) => {
      if (locationData && locationData.location) {
        setPerformerLocation(locationData.location);
      }
    });
    
    return () => {
      if (taskUnsubscribe) taskUnsubscribe();
      if (progressUnsubscribe) progressUnsubscribe();
      if (locationUnsubscribe) locationUnsubscribe();
      if (watchId) watchId();
    };
  }, [taskId]);

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

  const loadTaskData = async () => {
    try {
      setLoading(true);
      
      // Load task details
      const taskData = await taskService.getTaskById(taskId);
      if (taskData) {
        setTask(taskData);
        
        // Set task location as current location
        if (taskData.location_coords) {
          setCurrentLocation(taskData.location_coords);
        }
        
        // Load progress updates
        const progress = await taskProgressService.getTaskProgress(taskId);
        setProgressUpdates(progress || []);
        
        // Load existing location data
        const locationData = await locationService.getTaskLocation(taskId);
        if (locationData && locationData.location) {
          setPerformerLocation(locationData.location);
        }
      }
    } catch (error) {
      console.error('Error loading task data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    if (!currentUser || !task) return;
    
    // Only the task performer should share their location
    if (task.accepted_by !== currentUser.id) {
      toast.error('Only the task performer can share their location');
      return;
    }

    try {
      setIsTrackingLocation(true);
      setLocationError(null);
      
      // Get initial location
      const initialLocation = await getCurrentLocation();
      await locationService.updateLocation(taskId, currentUser.id, initialLocation);
      
      // Start watching location
      const clearWatcher = watchUserLocation(
        async (location) => {
          try {
            await locationService.updateLocation(taskId, currentUser.id, location);
            setLocationError(null);
          } catch (error) {
            console.error('Error updating location:', error);
            setLocationError('Failed to update location');
          }
        },
        (error) => {
          console.error('Location tracking error:', error);
          setLocationError(error);
        }
      );
      
      setWatchId(() => clearWatcher);
      toast.success('Location sharing started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      toast.error('Failed to start location sharing');
      setIsTrackingLocation(false);
    }
  };

  const stopLocationTracking = async () => {
    if (watchId) {
      watchId();
      setWatchId(null);
    }
    
    try {
      await locationService.deleteTaskLocation(taskId);
      setIsTrackingLocation(false);
      setPerformerLocation(null);
      toast.success('Location sharing stopped');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
      toast.error('Failed to stop location sharing');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-6 h-6 text-blue-500" />;
      case 'picked_up':
        return <Package className="w-6 h-6 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="w-6 h-6 text-orange-500" />;
      case 'on_way':
        return <Bike className="w-6 h-6 text-purple-500" />;
      case 'delivered':
        return <Flag className="w-6 h-6 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getLatestStatus = () => {
    if (progressUpdates.length === 0) return task?.status || 'open';
    return progressUpdates[progressUpdates.length - 1].status;
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const isTaskPerformer = currentUser && task && task.accepted_by === currentUser.id;
  const isTaskCreator = currentUser && task && task.created_by === currentUser.id;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0021A5]"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Task not found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-[#0021A5] text-white">
        <h2 className="text-xl font-semibold">{task.title}</h2>
        <div className="flex items-center mt-1 text-sm">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{task.location}</span>
        </div>
      </div>

      <div className="p-4">
        {/* Status Banner */}
        <div className="bg-blue-50 p-4 rounded-lg mb-4 flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(getLatestStatus())}
            <div className="ml-3">
              <p className="font-medium">Current Status: {getLatestStatus().replace('_', ' ').charAt(0).toUpperCase() + getLatestStatus().replace('_', ' ').slice(1)}</p>
              {progressUpdates.length > 0 && (
                <p className="text-sm text-gray-600">
                  Last updated: {formatTimestamp(progressUpdates[progressUpdates.length - 1].created_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Location Tracking Controls */}
        {isTaskPerformer && task.status !== 'open' && task.status !== 'completed' && (
          <div className="bg-yellow-50 p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-2 flex items-center">
              <Navigation className="w-5 h-5 mr-2 text-yellow-600" />
              Location Sharing
            </h3>
            {!isTrackingLocation ? (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Share your live location with the task creator so they can track your progress.
                </p>
                <button
                  onClick={startLocationTracking}
                  className="bg-[#0021A5] text-white px-4 py-2 rounded-lg hover:bg-[#001B8C] transition-colors"
                >
                  Start Location Sharing
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-green-600 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Location sharing is active
                </p>
                <button
                  onClick={stopLocationTracking}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Stop Location Sharing
                </button>
              </div>
            )}
            {locationError && (
              <div className="mt-2 p-2 bg-red-50 rounded text-sm flex items-start">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 mr-1 flex-shrink-0" />
                <span className="text-red-700">{locationError}</span>
              </div>
            )}
          </div>
        )}

        {/* Live Location Display */}
        {isTaskCreator && performerLocation && (
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-2 flex items-center">
              <Navigation className="w-5 h-5 mr-2 text-green-600" />
              Live Location
            </h3>
            <p className="text-sm text-green-600">
              Task performer is sharing their live location
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {new Date(performerLocation.timestamp || Date.now()).toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Map */}
        <div className="h-64 rounded-lg overflow-hidden mb-4">
          <TaskMap
            taskLocation={task.location_coords}
            currentLocation={task.status !== 'open' && performerLocation ? performerLocation : currentLocation}
            interactive={false}
            height="100%"
          />
        </div>

        {/* Progress Timeline */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Progress Timeline</h3>
          <div className="space-y-4">
            {progressUpdates.length > 0 ? (
              progressUpdates.map((update, index) => (
                <div key={update.id} className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(update.status)}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">
                      {update.status.replace('_', ' ').charAt(0).toUpperCase() + update.status.replace('_', ' ').slice(1)}
                    </p>
                    {update.notes && <p className="text-sm text-gray-600">{update.notes}</p>}
                    <p className="text-xs text-gray-500">{formatTimestamp(update.created_at)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No progress updates yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Task Details */}
        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium mb-3">Task Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Price</p>
              <p className="font-medium">{task.price === 0 ? 'Free' : `$${task.price}`}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estimated Time</p>
              <p className="font-medium">{task.estimated_time}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium">{task.category.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">{new Date(task.created_at?.toDate ? task.created_at.toDate() : task.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Performer Info */}
        {task.accepted_by && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-3">Task Performer</h3>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="font-medium">Task Performer</p>
                <p className="text-sm text-gray-500">
                  {performerLocation ? 'Sharing live location' : 'Location not shared'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskLiveTracker;