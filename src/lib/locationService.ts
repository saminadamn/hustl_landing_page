import { mapsLoader } from './maps';
import { UF_BOUNDS, UF_CENTER } from './maps';
import toast from 'react-hot-toast';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  accuracy?: number;
  timestamp?: number;
  speed?: number;
  heading?: number;
  isHighPriority?: boolean;
}

export const validateLocation = (location: Location): boolean => {
  if (!location || typeof location !== 'object') return false;
  
  const { lat, lng } = location;
  
  // Check if latitude and longitude are numbers
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  
  // Check if latitude is within valid range (-90 to 90)
  if (lat < -90 || lat > 90) return false;
  
  // Check if longitude is within valid range (-180 to 180)
  if (lng < -180 || lng > 180) return false;
  
  return true;
};

export const isWithinUFBounds = (location: Location): boolean => {
  const margin = 0.05; // About 5km margin
  return (
    location.lat <= UF_BOUNDS.north + margin &&
    location.lat >= UF_BOUNDS.south - margin &&
    location.lng <= UF_BOUNDS.east + margin &&
    location.lng >= UF_BOUNDS.west - margin
  );
};

export const geocodeAddress = async (address: string): Promise<Location> => {
  try {
    const { Geocoder } = await mapsLoader.importLibrary("geocoding");
    const geocoder = new Geocoder();
    
    // Add UF campus to the address to improve accuracy
    const fullAddress = `${address}, University of Florida, Gainesville, FL`;
    
    const results = await geocoder.geocode({
      address: fullAddress
    });
    
    if (!results.results?.[0]) {
      throw new Error('No results found');
    }

    const location = results.results[0].geometry.location;
    const coords = {
      lat: location.lat(),
      lng: location.lng(),
      address: results.results[0].formatted_address,
      accuracy: 20, // Geocoding typically accurate to ~20 meters
      timestamp: Date.now()
    };

    if (!validateLocation(coords)) {
      throw new Error('Invalid location coordinates');
    }

    return coords;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to geocode address');
  }
};

export const watchUserLocation = (
  onLocationUpdate: (location: Location) => void,
  onError: (error: string) => void
): (() => void) => {
  let watchId: number | null = null;

  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 60000, // 1 minute timeout
    maximumAge: 0
  };

  const handleSuccess = async (position: GeolocationPosition) => {
    try {
      const coords: Location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined
      };

      if (!validateLocation(coords)) {
        onError('Invalid location data received');
        return;
      }

      // Get address for the coordinates
      try {
        const { Geocoder } = await mapsLoader.importLibrary("geocoding");
        const geocoder = new Geocoder();
        
        const result = await geocoder.geocode({
          location: coords
        });

        if (result.results[0]) {
          coords.address = result.results[0].formatted_address;
        }
      } catch (error) {
        console.warn('Error getting address:', error);
      }

      onLocationUpdate(coords);

      // Only show warning if outside UF bounds
      if (!isWithinUFBounds(coords)) {
        onError('Location is outside UF campus area, but still usable');
      }
    } catch (error) {
      console.error('Error processing location:', error);
      onError('Error processing location data');
    }
  };

  const handleError = (error: GeolocationPositionError) => {
    let errorMessage = 'Unable to get your location.';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Please enable location access in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable. Please check your device settings.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please try again.';
        break;
    }
    
    onError(errorMessage);
  };

  if (!navigator.geolocation) {
    onError('Geolocation is not supported by your browser');
    return () => {};
  }

  // Try high accuracy first
  try {
    watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      (error) => {
        if (error.code === error.TIMEOUT) {
          // If high accuracy times out, try with lower accuracy
          console.log("High accuracy location timed out, trying with lower accuracy");
          watchId = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            { ...options, enableHighAccuracy: false, timeout: 20000 }
          );
        } else {
          handleError(error);
        }
      },
      options
    );
  } catch (e) {
    console.error("Error setting up geolocation watch:", e);
    onError('Failed to initialize location tracking');
  }

  return () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  };
};

// Get location from IP address as fallback
const getLocationFromIP = async (): Promise<Location | null> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error(`IP API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.latitude && data.longitude) {
      return {
        lat: parseFloat(data.latitude),
        lng: parseFloat(data.longitude),
        address: `${data.city}, ${data.region}, ${data.country_name}`,
        accuracy: 5000, // IP geolocation is typically accurate to ~5km
        timestamp: Date.now()
      };
    }
  } catch (error) {
    console.warn('IP geolocation failed:', error);
  }
  return null;
};

// Try to get location using Google Maps Geolocation API
const getLocationFromGoogleMaps = async (): Promise<Location | null> => {
  try {
    // Load the Google Maps Geolocation API
    await mapsLoader.load();
    
    // Create a geolocation object
    const { Geocoder } = await mapsLoader.importLibrary("geocoding");
    
    // Try to get the current position using browser geolocation
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location: Location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };
            
            // Try to get address for the coordinates
            try {
              const geocoder = new Geocoder();
              const result = await geocoder.geocode({
                location: { lat: location.lat, lng: location.lng }
              });
              
              if (result.results[0]) {
                location.address = result.results[0].formatted_address;
              }
            } catch (error) {
              console.warn('Error getting address:', error);
            }
            
            resolve(location);
          },
          (error) => {
            console.warn('Browser geolocation error:', error);
            reject(error);
          },
          { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 0 
          }
        );
      } else {
        reject(new Error('Geolocation not supported'));
      }
    });
  } catch (error) {
    console.warn('Google Maps geolocation failed:', error);
    return null;
  }
};

export const getCurrentLocation = async (): Promise<Location> => {
  return new Promise(async (resolve) => {
    let locationResolved = false;
    let finalTimeout: NodeJS.Timeout;

    // Set a timeout to resolve with default location if all attempts fail
    finalTimeout = setTimeout(() => {
      if (!locationResolved) {
        console.warn('All location attempts failed, using default location');
        toast.error('Could not determine your location. Using campus center.');
        locationResolved = true;
        resolve(UF_CENTER);
      }
    }, 60000); // 1 minute total timeout

    // Try Google Maps geolocation first
    try {
      const googleMapsLocation = await getLocationFromGoogleMaps();
      if (googleMapsLocation && validateLocation(googleMapsLocation)) {
        // Show warning if outside UF bounds but still return the location
        if (!isWithinUFBounds(googleMapsLocation)) {
          toast('Your location is outside UF campus area, but still usable', {
            icon: '⚠️',
            duration: 4000,
          });
        }
        
        clearTimeout(finalTimeout);
        locationResolved = true;
        resolve(googleMapsLocation);
        return;
      }
    } catch (error) {
      console.warn('Google Maps geolocation failed:', error);
    }

    // Try browser geolocation as fallback
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            if (locationResolved) return;
            
            const coords: Location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              speed: position.coords.speed || undefined,
              heading: position.coords.heading || undefined
            };

            if (!validateLocation(coords)) {
              throw new Error('Invalid location data received');
            }

            // Get address for the coordinates
            try {
              const { Geocoder } = await mapsLoader.importLibrary("geocoding");
              const geocoder = new Geocoder();
              
              const result = await geocoder.geocode({
                location: coords
              });

              if (result.results[0]) {
                coords.address = result.results[0].formatted_address;
              }
            } catch (error) {
              console.warn('Error getting address:', error);
            }

            // Show warning if outside UF bounds but still return the location
            if (!isWithinUFBounds(coords)) {
              toast('Your location is outside UF campus area, but still usable', {
                icon: '⚠️',
                duration: 4000,
              });
            }

            clearTimeout(finalTimeout);
            locationResolved = true;
            resolve(coords);
          },
          async (error) => {
            console.warn('Browser geolocation error:', error);
            
            // Try IP geolocation as fallback
            try {
              const ipLocation = await getLocationFromIP();
              if (ipLocation && validateLocation(ipLocation)) {
                toast.success('Using approximate location based on your IP address');
                clearTimeout(finalTimeout);
                locationResolved = true;
                resolve(ipLocation);
                return;
              }
            } catch (ipError) {
              console.warn('IP geolocation failed:', ipError);
            }
            
            toast.error('Could not determine your location. Using campus center.');
            clearTimeout(finalTimeout);
            locationResolved = true;
            resolve(UF_CENTER);
          },
          { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 0 
          }
        );
      } else {
        throw new Error('Geolocation not supported');
      }
    } catch (e) {
      console.error("Error getting current position:", e);
      
      // Try IP geolocation as fallback
      try {
        const ipLocation = await getLocationFromIP();
        if (ipLocation && validateLocation(ipLocation)) {
          toast.success('Using approximate location based on your IP address');
          clearTimeout(finalTimeout);
          locationResolved = true;
          resolve(ipLocation);
          return;
        }
      } catch (ipError) {
        console.warn('IP geolocation failed:', ipError);
      }
      
      toast.error('Error accessing location services');
      clearTimeout(finalTimeout);
      locationResolved = true;
      resolve(UF_CENTER);
    }
  });
};