import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, X, Search, AlertTriangle } from 'lucide-react';
import { geocodeAddress, getCurrentLocation, Location, validateLocation, isWithinUFBounds } from '../lib/locationService';
import { mapsLoader } from '../lib/maps';
import toast from 'react-hot-toast';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onLocationChange: (location: Location) => void;
  placeholder?: string;
  required?: boolean;
}

const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  onLocationChange,
  placeholder = "Enter any address",
  required = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    initializeAutocomplete();
  }, []);

  const initializeAutocomplete = async () => {
    if (!inputRef.current) return;

    try {
      const { Autocomplete } = await mapsLoader.importLibrary("places");

      // UF campus bounds with wider area
      const bounds = new google.maps.LatLngBounds(
        { lat: 29.6214, lng: -82.3878 }, // SW - expanded
        { lat: 29.6680, lng: -82.3120 }  // NE - expanded
      );

      const autocomplete = new Autocomplete(inputRef.current, {
        bounds,
        strictBounds: false, // Allow searching outside bounds
        fields: ['address_components', 'geometry', 'formatted_address'],
        types: ['establishment', 'geocode'],
      });

      // Listen for place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry?.location) {
          toast.error('Please select a location from the suggestions');
          return;
        }

        const location: Location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address
        };

        if (!validateLocation(location)) {
          toast.error('Invalid location coordinates');
          return;
        }

        onChange(place.formatted_address || '');
        onLocationChange(location);
        
        // Show warning if outside UF bounds
        if (!isWithinUFBounds(location)) {
          setLocationError('Location is outside UF campus area, but still usable');
        } else {
          setLocationError(null);
        }
      });

      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
      toast.error('Error initializing location search');
    }
  };

  const handleGetCurrentLocation = async () => {
    setLoading(true);
    setLocationError(null);
    try {
      const location = await getCurrentLocation();
      if (!validateLocation(location)) {
        throw new Error('Invalid location coordinates');
      }
      
      onChange(location.address || `${location.lat}, ${location.lng}`);
      onLocationChange(location);
      
      // Show warning if outside UF bounds
      if (!isWithinUFBounds(location)) {
        setLocationError('Location is outside UF campus area, but still usable');
      } else {
        setLocationError(null);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error('Could not get your current location');
    } finally {
      setLoading(false);
    }
  };

  const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      try {
        setLoading(true);
        const location = await geocodeAddress(value);
        if (!validateLocation(location)) {
          throw new Error('Invalid location coordinates');
        }
        onLocationChange(location);
        
        // Show warning if outside UF bounds
        if (!isWithinUFBounds(location)) {
          setLocationError('Location is outside UF campus area, but still usable');
        } else {
          setLocationError(null);
        }
      } catch (error) {
        toast.error('Location not found. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
          required={required}
          className="block w-full pl-10 pr-20 rounded-lg border-gray-300 shadow-sm focus:border-[#0021A5] focus:ring focus:ring-[#0021A5] focus:ring-opacity-50 py-3"
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className={`p-2 text-[#0021A5] hover:text-[#001B8C] transition-colors rounded-full hover:bg-blue-50 ${loading ? 'opacity-50' : ''}`}
            title="Use current location"
          >
            <Navigation className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {locationError && (
        <div className="flex items-start text-xs text-yellow-700 mt-1 bg-yellow-50 p-2 rounded-lg border border-yellow-200">
          <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 mr-1 flex-shrink-0" />
          <span>{locationError}</span>
        </div>
      )}
    </div>
  );
};

export default LocationInput;