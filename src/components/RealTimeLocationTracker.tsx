import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, AlertTriangle, User, Clock, Loader, Route, History, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { mapsLoader } from '../lib/maps';
import { Location, getCurrentLocation, watchUserLocation, validateLocation } from '../lib/locationService';
import { collection, doc, setDoc, onSnapshot, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import toast from 'react-hot-toast';

interface RealTimeLocationTrackerProps {
  taskId: string;
  taskLocation: Location;
  currentUser: any;
  isTaskPerformer: boolean;
  isTaskCreator: boolean;
  otherUser?: any;
}

interface LocationUpdate {
  lat: number;
  lng: number;
  address?: string;
  timestamp: number;
  speed?: number;
  heading?: number;
}

const RealTimeLocationTracker: React.FC<RealTimeLocationTrackerProps> = ({
  taskId,
  taskLocation,
  currentUser,
  isTaskPerformer,
  isTaskCreator,
  otherUser
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  const [taskMarker, setTaskMarker] = useState<google.maps.Marker | null>(null);
  const [performerMarker, setPerformerMarker] = useState<google.maps.Marker | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [performerLocation, setPerformerLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<(() => void) | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationUpdate[]>([]);
  const [showLocationHistory, setShowLocationHistory] = useState(false);
  const [historyPolyline, setHistoryPolyline] = useState<google.maps.Polyline | null>(null);
  const [routePolyline, setRoutePolyline] = useState<google.maps.Polyline | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null);

  useEffect(() => {
    initializeMap();
    
    // Subscribe to performer location updates
    const unsubscribe = subscribeToPerformerLocation();
    
    return () => {
      if (unsubscribe) unsubscribe();
      if (watchId) watchId();
      
      // Clean up map resources
      if (historyPolyline) {
        historyPolyline.setMap(null);
      }
      if (routePolyline) {
        routePolyline.setMap(null);
      }
    };
  }, [taskId]);

  useEffect(() => {
    if (map && taskLocation && performerLocation) {
      updateMapWithLocations();
      calculateRouteAndETA();
      
      if (showLocationHistory && locationHistory.length > 0) {
        drawLocationHistory();
      }
    }
  }, [map, taskLocation, performerLocation, showLocationHistory, locationHistory]);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      const { Map } = await mapsLoader.importLibrary('maps');
      
      const mapInstance = new Map(mapRef.current, {
        center: taskLocation || { lat: 29.6516, lng: -82.3490 },
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
      
      // Add task location marker
      if (taskLocation) {
        const taskMarkerInstance = new google.maps.Marker({
          position: taskLocation,
          map: mapInstance,
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
        setTaskMarker(taskMarkerInstance);
      }
      
    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Error loading map');
    }
  };

  const subscribeToPerformerLocation = () => {
    if (!taskId) return () => {};

    const locationRef = doc(db, 'task_locations', taskId);
    
    const unsubscribe = onSnapshot(locationRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.location && validateLocation(data.location)) {
          setPerformerLocation(data.location);
          setLastUpdate(data.updated_at?.toDate() || new Date());
          
          // Update location history if available
          if (data.history && Array.isArray(data.history)) {
            setLocationHistory(data.history);
          }
          
          setLocationError(null);
        }
      } else {
        setPerformerLocation(null);
        if (performerMarker) {
          performerMarker.setMap(null);
          setPerformerMarker(null);
        }
      }
    }, (error) => {
      console.error('Error subscribing to location updates:', error);
      setLocationError('Error receiving location updates');
    });

    return unsubscribe;
  };

  const updateMapWithLocations = () => {
    if (!map) return;

    // Update task marker if needed
    if (taskLocation && !taskMarker) {
      const newTaskMarker = new google.maps.Marker({
        position: taskLocation,
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
    } else if (taskMarker && taskLocation) {
      taskMarker.setPosition(taskLocation);
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
    if (taskLocation && performerLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(taskLocation);
      bounds.extend(performerLocation);
      map.fitBounds(bounds, { padding: 50 });
    }
  };

  const calculateRouteAndETA = async () => {
    if (!map || !taskLocation || !performerLocation) return;
    
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
        destination: new google.maps.LatLng(taskLocation.lat, taskLocation.lng),
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

  const startLocationSharing = async () => {
    if (!isTaskPerformer) {
      toast.error('Only the task performer can share their location');
      return;
    }

    try {
      setIsTracking(true);
      setLocationError(null);
      
      // Get initial location
      const initialLocation = await getCurrentLocation();
      await updateLocationInFirestore(initialLocation);
      
      // Start watching location
      const clearWatcher = watchUserLocation(
        async (location) => {
          try {
            await updateLocationInFirestore(location);
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
      setIsTracking(false);
    }
  };

  const stopLocationSharing = async () => {
    if (watchId) {
      watchId();
      setWatchId(null);
    }
    
    try {
      // Remove location from Firestore
      await deleteDoc(doc(db, 'task_locations', taskId));
      setIsTracking(false);
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

  const updateLocationInFirestore = async (location: Location) => {
    if (!currentUser?.id || !taskId) return;

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
    
    const locationRef = doc(db, 'task_locations', taskId);
    await setDoc(locationRef, {
      task_id: taskId,
      user_id: currentUser.id,
      location: {
        ...location,
        timestamp: Date.now()
      },
      history: trimmedHistory,
      updated_at: serverTimestamp()
    });
    
    // Update local state
    setLocationHistory(trimmedHistory);
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else {
      return lastUpdate.toLocaleTimeString();
    }
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

  return (
    <div className="h-64 rounded-lg overflow-hidden border border-gray-200 relative">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Location Controls Overlay */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <h4 className="font-medium mb-2 flex items-center">
          <MapPin className="w-4 h-4 mr-1 text-[#0021A5]" />
          Live Location
        </h4>
        
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
            {!isTracking ? (
              <button
                onClick={startLocationSharing}
                className="w-full bg-[#0021A5] text-white px-3 py-2 rounded text-sm hover:bg-[#001B8C] transition-colors flex items-center justify-center"
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
                  onClick={stopLocationSharing}
                  className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors"
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
            {lastUpdate && (
              <p className="text-xs text-gray-500 mt-1">
                Updated {formatLastUpdate()}
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
      
      {/* Location History Toggle */}
      {locationHistory.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
          <button
            onClick={() => setShowLocationHistory(!showLocationHistory)}
            className="flex items-center text-sm font-medium text-[#0021A5]"
          >
            {showLocationHistory ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Hide History
              </>
            ) : (
              <>
                <History className="w-4 h-4 mr-1" />
                Show History
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2">
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
          {showLocationHistory && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#FF5A1F] mr-2" style={{ opacity: 0.6 }}></div>
              <span>Location History</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeLocationTracker;