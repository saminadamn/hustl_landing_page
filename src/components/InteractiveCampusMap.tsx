import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Maximize2, Minimize2, AlertTriangle, Zap } from 'lucide-react';
import { mapsLoader } from '../lib/maps';
import TaskPreview from './TaskPreview';
import { Location, isWithinUFBounds, getCurrentLocation, validateLocation, watchUserLocation } from '../lib/locationService';
import { calculateTaskPrice } from '../lib/priceCalculator';
import toast from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  location: string;
  location_coords?: { lat: number; lng: number };
  estimated_time: string;
  category: string;
  price: number;
  urgency?: string;
}

interface TaskBundle {
  tasks: Task[];
  totalEarnings: number;
  totalTime: string;
  totalDistance: number;
}

interface MarkerStyle {
  color: string;
  scale: number;
  opacity: number;
}

interface InteractiveCampusMapProps {
  tasks: Task[];
  currentLocation: Location | null;
  onTaskSelect: (task: Task) => void;
  onBundleSelect: (bundle: TaskBundle) => void;
  onLocationUpdate?: (location: Location) => void;
}

const InteractiveCampusMap: React.FC<InteractiveCampusMapProps> = ({
  tasks,
  currentLocation,
  onTaskSelect,
  onBundleSelect,
  onLocationUpdate
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [suggestedBundles, setSuggestedBundles] = useState<TaskBundle[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userMarkerStyle] = useState<MarkerStyle>({
    color: '#0021A5',
    scale: 12,
    opacity: 1
  });
  
  const [taskMarkerStyle] = useState<MarkerStyle>({
    color: '#FA4616',
    scale: 2,
    opacity: 1
  });
  const [distance, setDistance] = useState<number>(0);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationWatcherActive, setLocationWatcherActive] = useState(false);

  useEffect(() => {
    initializeMap();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (map) {
        google.maps.event.trigger(map, 'resize');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (map && tasks.length > 0) {
      updateMarkers();
      generateTaskBundles();
    }
  }, [map, tasks, currentLocation, userMarkerStyle, taskMarkerStyle]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const handleMarkerDragEnd = async (marker: google.maps.Marker, isUserMarker: boolean) => {
    const position = marker.getPosition();
    if (!position) return;

    const newLocation: Location = {
      lat: position.lat(),
      lng: position.lng()
    };

    try {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat: newLocation.lat, lng: newLocation.lng } }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          newLocation.address = results[0].formatted_address;
          
          if (isUserMarker) {
            onLocationUpdate?.(newLocation);
            
            // Show warning if outside UF bounds
            if (!isWithinUFBounds(newLocation)) {
              setLocationError('Your location is outside the UF campus area, but still usable');
            } else {
              setLocationError(null);
            }
          } else if (selectedTask) {
            const updatedTask = {
              ...selectedTask,
              location_coords: newLocation
            };
            setSelectedTask(updatedTask);
            onTaskSelect(updatedTask);
          }

          if (currentLocation && selectedTask?.location_coords) {
            calculateTaskPrice(
              selectedTask.location_coords,
              newLocation,
              'low',
              false
            ).then(price => {
              setDistance(price.distance);
            }).catch(error => {
              console.error('Error calculating price:', error);
            });
          }
        }
      });
    } catch (error) {
      console.error('Error geocoding location:', error);
    }
  };

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      const { Map } = await mapsLoader.importLibrary('maps');
      
      const mapInstance = new Map(mapRef.current, {
        center: currentLocation || { lat: 29.6516, lng: -82.3490 },
        zoom: 15,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_RIGHT
        },
        fullscreenControl: false,
        streetViewControl: true,
        streetViewControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        gestureHandling: 'greedy' // Makes it easier to navigate on mobile
      });

      setMap(mapInstance);
      
      // Get initial location if not provided
      if (!currentLocation) {
        getUserLocation(mapInstance);
      }
      
      // Start watching location
      startLocationWatcher(mapInstance);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const getUserLocation = async (mapInstance: google.maps.Map) => {
    setIsLocating(true);
    setLocationError(null);
    
    try {
      const location = await getCurrentLocation();
      
      if (onLocationUpdate) {
        onLocationUpdate(location);
      }
      
      const userPos = new google.maps.LatLng(location.lat, location.lng);
      
      // Create or update user marker
      if (userMarker) {
        userMarker.setPosition(userPos);
      } else {
        const newMarker = new google.maps.Marker({
          position: userPos,
          map: mapInstance,
          draggable: true,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: userMarkerStyle.scale,
            fillColor: userMarkerStyle.color,
            fillOpacity: userMarkerStyle.opacity,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          title: 'Your Location (Drag to move)'
        });
        
        newMarker.addListener('dragend', () => handleMarkerDragEnd(newMarker, true));
        setUserMarker(newMarker);
      }

      // Center map on user location
      mapInstance.panTo(userPos);

      // Show warning if outside UF bounds
      if (!isWithinUFBounds(location)) {
        setLocationError('Your location is outside the UF campus area, but still usable');
      } else {
        setLocationError(null);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Could not get your precise location. Using campus center.');
    } finally {
      setIsLocating(false);
    }
  };

  const startLocationWatcher = (mapInstance: google.maps.Map) => {
    if (locationWatcherActive) return;
    
    setLocationWatcherActive(true);
    
    const clearWatcher = watchUserLocation(
      (location) => {
        // Update location in parent component
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }
        
        // Update user marker position
        const newPos = new google.maps.LatLng(location.lat, location.lng);
        
        if (userMarker) {
          userMarker.setPosition(newPos);
        } else {
          const newMarker = new google.maps.Marker({
            position: newPos,
            map: mapInstance,
            draggable: true,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: userMarkerStyle.scale,
              fillColor: userMarkerStyle.color,
              fillOpacity: userMarkerStyle.opacity,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
            title: 'Your Location (Drag to move)'
          });
          
          newMarker.addListener('dragend', () => handleMarkerDragEnd(newMarker, true));
          setUserMarker(newMarker);
        }
      },
      (error) => {
        console.warn('Location watcher error:', error);
        setLocationError(error);
      }
    );
    
    return () => {
      clearWatcher();
      setLocationWatcherActive(false);
    };
  };

  const getTaskMarkerPath = (task: Task) => {
    // Use lightning bolt icon for all tasks
    return 'M12 2L4 12h6v8l8-10h-6z';
  };

  const updateMarkers = () => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    // Add task markers
    tasks.forEach(task => {
      if (!task.location_coords?.lat || !task.location_coords?.lng) {
        console.warn('Task missing location coordinates:', task.id);
        return;
      }
      
      const marker = new google.maps.Marker({
        position: {
          lat: task.location_coords.lat,
          lng: task.location_coords.lng
        },
        map,
        draggable: false,
        icon: {
          path: getTaskMarkerPath(task),
          scale: taskMarkerStyle.scale,
          fillColor: taskMarkerStyle.color,
          fillOpacity: taskMarkerStyle.opacity,
          strokeColor: '#ffffff',
          strokeWeight: 1,
          anchor: new google.maps.Point(12, 12),
        },
        title: `${task.title} - $${task.price}`
      });

      marker.addListener('click', () => {
        setSelectedTask(task);
        onTaskSelect(task);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // If we have both user location and task markers, fit bounds to include all
    if (currentLocation && newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      
      // Add user location to bounds
      bounds.extend(new google.maps.LatLng(currentLocation.lat, currentLocation.lng));
      
      // Add all task markers to bounds
      newMarkers.forEach(marker => {
        const position = marker.getPosition();
        if (position) bounds.extend(position);
      });
      
      // Fit map to bounds with padding
      map.fitBounds(bounds, { padding: 50 });
    }
  };

  const generateTaskBundles = () => {
    if (!currentLocation || tasks.length < 2) return;

    const validTasks = tasks.filter(task => 
      task.location_coords?.lat && task.location_coords?.lng
    );

    if (validTasks.length < 2) return;

    const bundles: TaskBundle[] = [];
    const maxBundleSize = 3;
    const maxDistanceKm = 2;

    for (let i = 0; i < validTasks.length; i++) {
      const bundle: Task[] = [validTasks[i]];
      let lastLocation = validTasks[i].location_coords;

      for (let j = 0; j < validTasks.length; j++) {
        if (i === j || bundle.length >= maxBundleSize) continue;

        const distance = calculateDistance(lastLocation, validTasks[j].location_coords);
        if (distance <= maxDistanceKm) {
          bundle.push(validTasks[j]);
          lastLocation = validTasks[j].location_coords;
        }
      }

      if (bundle.length > 1) {
        const totalEarnings = bundle.reduce((sum, task) => sum + task.price, 0);
        const totalTimeMinutes = bundle.reduce((sum, task) => {
          const match = task.estimated_time.match(/(\d+)/);
          return sum + (match ? parseInt(match[1]) : 30);
        }, 0);
        const totalDistance = calculateTotalDistance(bundle.map(t => t.location_coords));

        bundles.push({
          tasks: bundle,
          totalEarnings,
          totalTime: `${totalTimeMinutes} minutes`,
          totalDistance
        });
      }
    }

    setSuggestedBundles(bundles.slice(0, 3));
  };

  const calculateDistance = (loc1: any, loc2: any): number => {
    if (!loc1?.lat || !loc1?.lng || !loc2?.lat || !loc2?.lng) return Infinity;

    const R = 6371;
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateTotalDistance = (locations: any[]): number => {
    if (locations.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 0; i < locations.length - 1; i++) {
      totalDistance += calculateDistance(locations[i], locations[i + 1]);
    }
    return totalDistance;
  };

  const setUserLocation = (position: google.maps.LatLng) => {
    const location: Location = {
      lat: position.lat(),
      lng: position.lng()
    };
    onLocationUpdate?.(location);
  };

  const handleRetryLocation = async () => {
    if (!map) return;
    
    setIsLocating(true);
    try {
      const location = await getCurrentLocation();
      if (location && validateLocation(location)) {
        const userPos = new google.maps.LatLng(location.lat, location.lng);
        setUserLocation(userPos);
        map.panTo(userPos);
        
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }
        
        // Update markers
        updateMarkers();
      }
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error('Failed to get your location');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div ref={containerRef} className="relative h-[calc(100vh-4rem)]">
      <div ref={mapRef} className="w-full h-full" />
      
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        {currentLocation && (
          <button
            onClick={() => map?.panTo(new google.maps.LatLng(currentLocation.lat, currentLocation.lng))}
            className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            title="Center on your location"
          >
            <Navigation className="w-6 h-6 text-[#0021A5]" />
          </button>
        )}
        <button
          onClick={toggleFullscreen}
          className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          title="Toggle fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="w-6 h-6 text-[#0021A5]" />
          ) : (
            <Maximize2 className="w-6 h-6 text-[#0021A5]" />
          )}
        </button>
      </div>

      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-sm font-semibold mb-4">Map Legend</h2>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-[#0021A5] mr-2" />
            <span>Your Location</span>
          </div>
          <div className="flex items-center">
            <Zap className="w-6 h-6 text-[#FA4616] mr-2" />
            <span>Task Locations</span>
          </div>
          {distance > 0 && (
            <div className="text-sm text-gray-600 pt-2 border-t">
              Distance: {distance.toFixed(2)} miles
            </div>
          )}
          <div className="text-xs text-gray-500">
            Click on markers to view task details
          </div>
          
          {!currentLocation && !isLocating && (
            <button
              onClick={handleRetryLocation}
              className="mt-2 w-full bg-[#0021A5] text-white px-3 py-1 rounded text-sm"
            >
              Get My Location
            </button>
          )}
          
          {isLocating && (
            <div className="flex items-center justify-center mt-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0021A5]"></div>
              <span className="ml-2 text-xs">Getting location...</span>
            </div>
          )}
          
          {locationError && (
            <div className="mt-2 p-2 bg-yellow-50 rounded text-xs flex items-start">
              <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 mr-1 flex-shrink-0" />
              <span className="text-yellow-700">{locationError}</span>
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <TaskPreview
          task={selectedTask}
          currentLocation={currentLocation}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default InteractiveCampusMap;