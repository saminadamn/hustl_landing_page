import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, CheckCircle, Loader, Package, Bike, Flag, User, Navigation, AlertTriangle, MessageSquare, Shield, Mail, Phone } from 'lucide-react';
import { taskService, taskProgressService, locationService, profileService } from '../lib/database';
import { auth } from '../lib/firebase';
import { mapsLoader } from '../lib/maps';
import { Location, getCurrentLocation, watchUserLocation } from '../lib/locationService';
import GameChat from './GameChat';
import toast from 'react-hot-toast';

interface UnifiedTaskTrackerProps {
  taskId: string;
}

const UnifiedTaskTracker: React.FC<UnifiedTaskTrackerProps> = ({ taskId }) => {
  const [task, setTask] = useState<any>(null);
  const [progressUpdates, setProgressUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [performerLocation, setPerformerLocation] = useState<Location | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<(() => void) | null>(null);
  const [routePolyline, setRoutePolyline] = useState<google.maps.Polyline | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null);
  const [locationHistory, setLocationHistory] = useState<any[]>([]);
  const [historyPolyline, setHistoryPolyline] = useState<google.maps.Polyline | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'chat' | 'progress'>('map');
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [taskMarker, setTaskMarker] = useState<google.maps.Marker | null>(null);
  const [performerMarker, setPerformerMarker] = useState<google.maps.Marker | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const supportEmail = 'hustlapp@outlook.com';

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
        
        // Update location history if available
        if (locationData.history && Array.isArray(locationData.history)) {
          setLocationHistory(locationData.history);
        }
      }
    });
    
    return () => {
      if (taskUnsubscribe) taskUnsubscribe();
      if (progressUnsubscribe) progressUnsubscribe();
      if (locationUnsubscribe) locationUnsubscribe();
      if (watchId) watchId();
      
      // Clean up map resources
      if (routePolyline) {
        routePolyline.setMap(null);
      }
      if (historyPolyline) {
        historyPolyline.setMap(null);
      }
    };
  }, [taskId]);

  useEffect(() => {
    if (mapRef.current && !map) {
      initializeMap();
    }
  }, [mapRef.current]);

  useEffect(() => {
    if (map && task?.location_coords && performerLocation) {
      updateMapWithLocations();
      calculateRouteAndETA();
      
      if (locationHistory.length > 0) {
        drawLocationHistory();
      }
    }
  }, [map, task?.location_coords, performerLocation, locationHistory]);

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
          
          if (locationData.history) {
            setLocationHistory(locationData.history);
          }
        }
        
        // Determine other user
        const user = auth.currentUser;
        if (user) {
          const otherUserId = taskData.created_by === user.uid ? taskData.accepted_by : taskData.created_by;
          if (otherUserId) {
            const otherUserProfile = await profileService.getProfile(otherUserId);
            setOtherUser(otherUserProfile);
          }
        }
      }
    } catch (error) {
      console.error('Error loading task data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      const { Map } = await mapsLoader.importLibrary('maps');
      
      const mapInstance = new Map(mapRef.current, {
        center: { lat: 29.6516, lng: -82.3490 }, // UF campus center
        zoom: 15,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: true,
        fullscreenControl: false,
        streetViewControl: true,
        gestureHandling: 'greedy'
      });

      setMap(mapInstance);
    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Error loading map');
    }
  };

  const updateMapWithLocations = () => {
    if (!map || !task?.location_coords) return;

    // Update task marker
    if (taskMarker) {
      taskMarker.setPosition(task.location_coords);
    } else {
      const newTaskMarker = new google.maps.Marker({
        position: task.location_coords,
        map,
        icon: {
          path: 'M12 2L4 12h6v8l8-10h-6z', // Lightning bolt
          scale: 2,
          fillColor: '#FA4616',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1,
          anchor: new google.maps.Point(12, 12),
        },
        title: 'Task Location'
      });
      setTaskMarker(newTaskMarker);
    }

    // Update performer marker
    if (performerLocation) {
      if (performerMarker) {
        performerMarker.setPosition(performerLocation);
      } else {
        const newPerformerMarker = new google.maps.Marker({
          position: performerLocation,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#0021A5',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          title: 'Helper Location'
        });
        
        // Add animation to performer marker
        newPerformerMarker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
          newPerformerMarker.setAnimation(null);
        }, 2000);
        
        setPerformerMarker(newPerformerMarker);
      }
    }

    // Fit bounds to show both markers
    if (task.location_coords && performerLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(task.location_coords);
      bounds.extend(performerLocation);
      map.fitBounds(bounds, { padding: 50 });
    } else if (task.location_coords) {
      map.setCenter(task.location_coords);
    }
  };

  const calculateRouteAndETA = async () => {
    if (!map || !task?.location_coords || !performerLocation) return;
    
    try {
      // Clear existing polyline
      if (routePolyline) {
        routePolyline.setMap(null);
      }
      
      // Create DirectionsService
      const { DirectionsService } = await mapsLoader.importLibrary('routes');
      const directionsService = new DirectionsService();
      
      const result = await directionsService.route({
        origin: new google.maps.LatLng(performerLocation.lat, performerLocation.lng),
        destination: new google.maps.LatLng(task.location_coords.lat, task.location_coords.lng),
        travelMode: google.maps.TravelMode.DRIVING
      });
      
      if (result.status === 'OK' && result.routes && result.routes[0]) {
        const route = result.routes[0];
        
        // Draw the route
        const polyline = new google.maps.Polyline({
          path: route.overview_path,
          geodesic: true,
          strokeColor: '#0038FF',
          strokeOpacity: 0.8,
          strokeWeight: 4
        });
        
        polyline.setMap(map);
        setRoutePolyline(polyline);
        
        // Get distance and duration
        if (route.legs && route.legs[0]) {
          const leg = route.legs[0];
          setDistance(leg.distance?.value || null);
          setDuration(leg.duration?.value || null);
          
          // Calculate ETA
          if (leg.duration?.value) {
            const now = new Date();
            const arrivalTime = new Date(now.getTime() + leg.duration.value * 1000);
            setEstimatedArrival(arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  const drawLocationHistory = () => {
    if (!map || locationHistory.length < 2) return;
    
    // Clear existing polyline
    if (historyPolyline) {
      historyPolyline.setMap(null);
    }
    
    // Create path from location history
    const path = locationHistory.map(point => ({
      lat: point.lat,
      lng: point.lng
    }));
    
    // Create polyline
    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#FF5A1F',
      strokeOpacity: 0.6,
      strokeWeight: 3
    });
    
    polyline.setMap(map);
    setHistoryPolyline(polyline);
  };

  const startLocationTracking = async () => {
    if (!task) return;
    
    // Only the task performer should share their location
    if (task.accepted_by !== currentUser?.id) {
      toast.error('Only the task performer can share their location');
      return;
    }

    try {
      setIsTrackingLocation(true);
      setLocationError(null);
      
      // Get initial location
      const initialLocation = await getCurrentLocation();
      await locationService.updateLocation(taskId, currentUser.id, initialLocation, locationHistory);
      
      // Start watching location
      const clearWatcher = watchUserLocation(
        async (location) => {
          try {
            // Add to location history
            const newHistory = [...locationHistory];
            newHistory.push({
              lat: location.lat,
              lng: location.lng,
              address: location.address,
              timestamp: Date.now(),
              speed: location.speed,
              heading: location.heading
            });
            
            // Keep only the last 100 points to avoid excessive data
            const trimmedHistory = newHistory.slice(-100);
            
            await locationService.updateLocation(taskId, currentUser.id, location, trimmedHistory);
            setLocationHistory(trimmedHistory);
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
      
      if (performerMarker) {
        performerMarker.setMap(null);
        setPerformerMarker(null);
      }
      
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

  const formatDistance = (meters: number | null) => {
    if (meters === null) return 'Unknown';
    if (meters < 1000) return `${meters.toFixed(0)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return 'Unknown';
    if (seconds < 60) return `${seconds} sec`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} hr ${minutes} min`;
  };

  const isTaskPerformer = currentUser && task && task.accepted_by === currentUser.id;
  const isTaskCreator = currentUser && task && task.created_by === currentUser.id;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0021A5]"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Task Not Found</h3>
          <p className="text-gray-600">The task you're looking for could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{task.title}</h2>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="truncate max-w-md">{task.location}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {getLatestStatus().replace('_', ' ').charAt(0).toUpperCase() + getLatestStatus().replace('_', ' ').slice(1)}
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              ${task.price.toFixed(2)}
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex mt-4 border-b">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'map'
                ? 'text-[#0038FF] border-b-2 border-[#0038FF]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Live Tracking
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'chat'
                ? 'text-[#0038FF] border-b-2 border-[#0038FF]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'progress'
                ? 'text-[#0038FF] border-b-2 border-[#0038FF]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'map' && (
          <div className="h-full flex flex-col">
            {/* Map */}
            <div className="flex-1 relative">
              <div ref={mapRef} className="w-full h-full"></div>
              
              {/* Location Controls */}
              <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
                <h3 className="font-medium mb-3 flex items-center">
                  <Navigation className="w-5 h-5 text-[#0038FF] mr-2" />
                  Live Location
                </h3>
                
                {distance !== null && duration !== null && (
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Distance:</span>
                      <span className="font-medium text-sm">{formatDistance(distance)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Travel Time:</span>
                      <span className="font-medium text-sm">{formatDuration(duration)}</span>
                    </div>
                    {estimatedArrival && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Arrival Time:</span>
                        <span className="font-medium text-sm">{estimatedArrival}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {isTaskPerformer && (
                  <div className="space-y-2">
                    {!isTrackingLocation ? (
                      <button
                        onClick={startLocationTracking}
                        className="w-full bg-[#0038FF] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#0021A5] transition-colors flex items-center justify-center"
                      >
                        <Navigation className="w-4 h-4 mr-1" />
                        Share Location
                      </button>
                    ) : (
                      <>
                        <div className="flex items-center text-green-600 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          <span className="text-sm">Sharing your location</span>
                        </div>
                        <button
                          onClick={stopLocationTracking}
                          className="w-full bg-red-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors"
                        >
                          Stop Sharing
                        </button>
                      </>
                    )}
                  </div>
                )}
                
                {isTaskCreator && performerLocation && (
                  <div className="text-sm text-green-600">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Helper is sharing location
                    </div>
                    {performerLocation.timestamp && (
                      <p className="text-xs text-gray-500 mt-1">
                        Updated {new Date(performerLocation.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                )}
                
                {locationError && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs flex items-start">
                    <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 mr-1 flex-shrink-0" />
                    <span className="text-red-700">{locationError}</span>
                  </div>
                )}
              </div>
              
              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3">
                <div className="text-xs space-y-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#FA4616] mr-2"></div>
                    <span>Task Location</span>
                  </div>
                  {performerLocation && (
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-[#0021A5] rounded-full mr-2"></div>
                      <span>Helper Location</span>
                    </div>
                  )}
                  {locationHistory.length > 0 && (
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-[#FF5A1F] mr-2" style={{ opacity: 0.6 }}></div>
                      <span>Location History</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Emergency Contact */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
                <h4 className="text-xs font-medium text-red-600 mb-1">Emergency Contact</h4>
                <div className="flex items-center">
                  <a 
                    href="tel:3523921111"
                    className="text-sm text-[#0038FF] hover:underline flex items-center"
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    (352) 392-1111
                  </a>
                </div>
                <div className="flex items-center mt-1">
                  <a 
                    href={`mailto:${supportEmail}?subject=URGENT: Safety Concern`}
                    className="text-sm text-[#0038FF] hover:underline flex items-center"
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    Email Support
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && currentUser && otherUser && (
          <div className="h-full">
            <GameChat
              taskId={taskId}
              currentUser={currentUser}
              otherUser={otherUser}
              showTypingIndicator={true}
              enableFileSharing={true}
              showUserProfile={true}
            />
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="font-semibold text-lg mb-6 flex items-center">
                <Clock className="w-5 h-5 text-[#0021A5] mr-2" />
                Task Progress Timeline
              </h3>
              
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                {/* Progress Steps */}
                <div className="space-y-8">
                  {progressUpdates.map((update, index) => {
                    const Icon = getStatusIcon(update.status);
                    const date = update.created_at?.toDate?.() || new Date(update.created_at);
                    
                    return (
                      <div key={update.id} className="relative flex items-start">
                        {/* Step Icon */}
                        <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-[#0021A5] flex items-center justify-center z-10">
                          {Icon}
                        </div>

                        {/* Step Content */}
                        <div className="ml-6 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-lg text-[#0021A5]">
                              {update.status.replace('_', ' ').charAt(0).toUpperCase() + update.status.replace('_', ' ').slice(1)}
                            </h4>
                            
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="w-4 h-4 mr-1" />
                              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          
                          {update.notes && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg border-l-4 border-[#0021A5]">
                              <p className="text-sm text-gray-700 italic">
                                "{update.notes}"
                              </p>
                            </div>
                          )}
                          
                          {index === progressUpdates.length - 1 && (
                            <div className="mt-2 flex items-center text-sm text-[#0021A5] font-medium">
                              <div className="w-2 h-2 bg-[#0021A5] rounded-full mr-2 animate-pulse"></div>
                              Current Status
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      Progress Updates: {progressUpdates.length}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {progressUpdates.length > 0 && (
                      <>Last updated: {formatTimestamp(progressUpdates[progressUpdates.length - 1]?.created_at)}</>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <Shield className="w-5 h-5 text-[#0021A5] mr-2" />
                Safety & Support
              </h3>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-blue-600 mr-2" />
                      <a 
                        href={`mailto:${supportEmail}?subject=Task Support: ${taskId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {supportEmail}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-blue-600 mr-2" />
                      <a 
                        href="tel:3523921111"
                        className="text-blue-600 hover:underline"
                      >
                        Campus Police: (352) 392-1111
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Safety Tips
                  </h4>
                  <ul className="space-y-1 text-sm text-yellow-700">
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      Stay in public, well-lit areas
                    </li>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      Share your task details with a friend
                    </li>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      If you feel uncomfortable, end the task and report it
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedTaskTracker;