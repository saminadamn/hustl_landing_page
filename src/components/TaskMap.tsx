import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Maximize2, Minimize2, Search, AlertTriangle, Zap } from 'lucide-react';
import { mapsLoader } from '../lib/maps';
import { Location, isWithinUFBounds, validateLocation } from '../lib/locationService';
import { calculateTaskPrice } from '../lib/priceCalculator';
import toast from 'react-hot-toast';

interface TaskMapProps {
  taskLocation?: Location;
  currentLocation?: Location;
  onLocationSelect?: (location: Location) => void;
  onCurrentLocationUpdate?: (location: Location) => void;
  interactive?: boolean;
  height?: string;
}

interface MarkerStyle {
  color: string;
  scale: number;
  opacity: number;
}

const TaskMap: React.FC<TaskMapProps> = ({
  taskLocation,
  currentLocation,
  onLocationSelect,
  onCurrentLocationUpdate,
  interactive = true,
  height = '400px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLInputElement>(null);
  const taskSearchBoxRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [distance, setDistance] = useState<number>(0);
  const [userMarkerStyle, setUserMarkerStyle] = useState<MarkerStyle>({
    color: '#0021A5',
    scale: 8,
    opacity: 1
  });
  const [taskMarkerStyle, setTaskMarkerStyle] = useState<MarkerStyle>({
    color: '#FA4616',
    scale: 2,
    opacity: 1
  });
  const [locationError, setLocationError] = useState<string | null>(null);

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
    if (map) {
      updateMarkers();
      updateDistance();
      initializeSearchBoxes();
    }
  }, [map, taskLocation, currentLocation, userMarkerStyle, taskMarkerStyle]);

  const initializeSearchBoxes = async () => {
    if (!map || !interactive || !searchBoxRef.current || !taskSearchBoxRef.current) return;

    try {
      const { Autocomplete } = await mapsLoader.importLibrary("places");

      // Initialize user location search
      const userSearchBox = new Autocomplete(searchBoxRef.current, {
        bounds: map.getBounds() || undefined,
        componentRestrictions: { country: 'us' },
        fields: ['geometry', 'formatted_address'],
        strictBounds: false // Allow searching outside bounds
      });

      userSearchBox.addListener('place_changed', () => {
        const place = userSearchBox.getPlace();
        if (place.geometry?.location) {
          const newLocation: Location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address
          };
          
          if (!validateLocation(newLocation)) {
            toast.error('Invalid location coordinates');
            return;
          }
          
          onCurrentLocationUpdate?.(newLocation);
          
          // Show warning if outside UF bounds
          if (!isWithinUFBounds(newLocation)) {
            setLocationError('Location is outside UF campus area, but still usable');
          } else {
            setLocationError(null);
          }
        }
      });

      // Initialize task location search
      const taskSearchBox = new Autocomplete(taskSearchBoxRef.current, {
        bounds: map.getBounds() || undefined,
        componentRestrictions: { country: 'us' },
        fields: ['geometry', 'formatted_address'],
        strictBounds: false // Allow searching outside bounds
      });

      taskSearchBox.addListener('place_changed', () => {
        const place = taskSearchBox.getPlace();
        if (place.geometry?.location) {
          const newLocation: Location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address
          };
          
          if (!validateLocation(newLocation)) {
            toast.error('Invalid location coordinates');
            return;
          }
          
          onLocationSelect?.(newLocation);
        }
      });
    } catch (error) {
      console.error('Error initializing search boxes:', error);
    }
  };

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
            onCurrentLocationUpdate?.(newLocation);
            
            // Show warning if outside UF bounds
            if (!isWithinUFBounds(newLocation)) {
              setLocationError('Location is outside UF campus area, but still usable');
            } else {
              setLocationError(null);
            }
          } else {
            onLocationSelect?.(newLocation);
          }

          updateDistance();
        }
      });
    } catch (error) {
      console.error('Error geocoding location:', error);
    }
  };

  const updateDistance = async () => {
    if (taskLocation && currentLocation) {
      try {
        const price = await calculateTaskPrice(
          taskLocation,
          currentLocation,
          'low',
          false
        );
        setDistance(price.distance);
      } catch (error) {
        console.error('Error calculating distance:', error);
      }
    }
  };

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      const { Map } = await mapsLoader.importLibrary('maps');
      
      const mapInstance = new Map(mapRef.current, {
        center: taskLocation || currentLocation || { lat: 29.6516, lng: -82.3490 },
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

      if (interactive) {
        mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng || !onLocationSelect) return;
          
          const newLocation: Location = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
          };
          
          // Reverse geocode to get address
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: newLocation }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
              newLocation.address = results[0].formatted_address;
            }
            
            onLocationSelect(newLocation);
          });
        });
      }

      setMap(mapInstance);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const getTaskMarkerPath = () => {
    // Lightning bolt SVG path
    return 'M12 2L4 12h6v8l8-10h-6z';
  };

  const updateMarkers = () => {
    if (!map) return;

    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    if (currentLocation) {
      const userMarker = new google.maps.Marker({
        position: currentLocation,
        map,
        draggable: interactive,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: userMarkerStyle.scale,
          fillColor: userMarkerStyle.color,
          fillOpacity: userMarkerStyle.opacity,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: interactive ? 'Your Location (Drag to move)' : 'Your Location'
      });

      if (interactive) {
        userMarker.addListener('dragend', () => handleMarkerDragEnd(userMarker, true));
      }
      newMarkers.push(userMarker);
    }

    if (taskLocation) {
      const isHighPriority = taskLocation.isHighPriority;
      const taskMarker = new google.maps.Marker({
        position: taskLocation,
        map,
        draggable: interactive,
        icon: {
          // Use lightning bolt icon for tasks
          path: 'M12 2L4 12h6v8l8-10h-6z', // Lightning bolt path
          scale: taskMarkerStyle.scale,
          fillColor: taskMarkerStyle.color,
          fillOpacity: taskMarkerStyle.opacity,
          strokeColor: '#ffffff',
          strokeWeight: 1,
          anchor: new google.maps.Point(12, 12),
        },
        title: interactive ? 'Task Location (Drag to move)' : 'Task Location'
      });

      if (interactive) {
        taskMarker.addListener('dragend', () => handleMarkerDragEnd(taskMarker, false));
      }
      newMarkers.push(taskMarker);

      if (currentLocation) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(taskLocation);
        bounds.extend(currentLocation);
        map.fitBounds(bounds, { padding: 50 });
      } else {
        map.setCenter(taskLocation);
      }
    } else if (currentLocation) {
      map.setCenter(currentLocation);
    }

    setMarkers(newMarkers);
  };

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />
      
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        {currentLocation && (
          <button
            onClick={() => map?.panTo(currentLocation)}
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

      {interactive && (
        <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg">
          <h2 className="text-sm font-semibold mb-2">Map Settings</h2>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs text-gray-600">Your Location</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={userMarkerStyle.color}
                  onChange={(e) => setUserMarkerStyle(prev => ({
                    ...prev,
                    color: e.target.value
                  }))}
                  className="w-6 h-6 rounded-full overflow-hidden p-0 cursor-pointer"
                  title="Your Location Marker Color"
                />
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1.5 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchBoxRef}
                    type="text"
                    placeholder="Search your location"
                    className="w-full pl-8 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#0021A5]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-600">Task Location</label>
              <div className="flex items-center gap-2">
                <input
                  type="color" 
                  value={taskMarkerStyle.color}
                  onChange={(e) => setTaskMarkerStyle(prev => ({
                    ...prev,
                    color: e.target.value
                  }))}
                  className="w-6 h-6 rounded-full overflow-hidden p-0 cursor-pointer"
                  title="Task Location Marker Color" 
                />
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1.5 w-4 h-4 text-gray-400" />
                  <input
                    ref={taskSearchBoxRef}
                    type="text"
                    placeholder="Search task location"
                    className="w-full pl-8 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#0021A5]"
                  />
                </div>
              </div>
            </div>

            {distance > 0 && (
              <div className="text-xs text-gray-600 pt-1">
                Distance: {distance.toFixed(2)} miles
              </div>
            )}
            
            {locationError && (
              <div className="mt-1 p-2 bg-yellow-50 rounded text-xs flex items-start">
                <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 mr-1 flex-shrink-0" />
                <span className="text-yellow-700">{locationError}</span>
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              Drag markers or search to update locations
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskMap;