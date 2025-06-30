import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Location } from '../lib/locationService';
import { mapsLoader } from '../lib/maps';

// UF campus center coordinates as default
const DEFAULT_LOCATION: Location = { lat: 29.6516, lng: -82.3490 };

interface GeolocationState {
  location: Location | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation(options?: {
  timeout?: number;
  enableHighAccuracy?: boolean;
  maximumAge?: number;
}) {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;
    const geoOptions: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 6000, // 6 seconds timeout by default
      maximumAge: options?.maximumAge ?? 0
    };

    // Function to get location from IP
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

    // Function to get location from Google Maps
    const getLocationFromGoogleMaps = async (): Promise<Location | null> => {
      try {
        await mapsLoader.load();
        
        const { Geocoder } = await mapsLoader.importLibrary("geocoding");
        const geocoder = new Geocoder();
        
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
                
                try {
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
                console.warn('Google Maps geolocation error:', error);
                reject(error);
              },
              geoOptions
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

    // Try browser geolocation first
    const tryBrowserGeolocation = () => {
      if (!navigator.geolocation) {
        if (isMounted) {
          setState(prev => ({
            ...prev,
            error: 'Geolocation is not supported by your browser',
            loading: false
          }));
        }
        return false;
      }

      navigator.geolocation.getCurrentPosition(
        // Success handler
        (position) => {
          if (isMounted) {
            const location: Location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              speed: position.coords.speed || undefined,
              heading: position.coords.heading || undefined
            };
            
            setState({
              location,
              loading: false,
              error: null
            });
          }
        },
        // Error handler
        async (error) => {
          console.warn('Browser geolocation error:', error.message);
          
          // Try Google Maps geolocation first
          try {
            const googleLocation = await getLocationFromGoogleMaps();
            
            if (googleLocation && isMounted) {
              toast.info('Using Google Maps for location services');
              setState({
                location: googleLocation,
                loading: false,
                error: null
              });
              return;
            }
          } catch (googleError) {
            console.warn('Google Maps geolocation failed:', googleError);
          }
          
          // Try IP geolocation as fallback
          try {
            const ipLocation = await getLocationFromIP();
            
            if (ipLocation && isMounted) {
              toast.info('Using approximate location based on your IP address');
              setState({
                location: ipLocation,
                loading: false,
                error: null
              });
              return;
            }
          } catch (ipError) {
            console.warn('IP geolocation failed:', ipError);
          }
          
          // Use default location as last resort
          if (isMounted) {
            toast.error('Could not determine your location. Using campus center.');
            setState({
              location: DEFAULT_LOCATION,
              loading: false,
              error: 'Failed to get precise location'
            });
          }
        },
        geoOptions
      );
      
      return true;
    };

    // Start the location detection process
    const geolocationStarted = tryBrowserGeolocation();
    
    // If geolocation is not supported, try Google Maps then IP geolocation
    if (!geolocationStarted) {
      const tryAlternativeMethods = async () => {
        // Try Google Maps geolocation first
        try {
          const googleLocation = await getLocationFromGoogleMaps();
          
          if (googleLocation && isMounted) {
            toast.info('Using Google Maps for location services');
            setState({
              location: googleLocation,
              loading: false,
              error: null
            });
            return;
          }
        } catch (googleError) {
          console.warn('Google Maps geolocation failed:', googleError);
        }
        
        // Try IP geolocation as fallback
        try {
          const ipLocation = await getLocationFromIP();
          
          if (ipLocation && isMounted) {
            toast.info('Using approximate location based on your IP address');
            setState({
              location: ipLocation,
              loading: false,
              error: null
            });
            return;
          }
        } catch (ipError) {
          console.warn('IP geolocation failed:', ipError);
        }
        
        // Use default location as last resort
        if (isMounted) {
          toast.error('Could not determine your location. Using campus center.');
          setState({
            location: DEFAULT_LOCATION,
            loading: false,
            error: 'Failed to get location'
          });
        }
      };
      
      tryAlternativeMethods();
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [options?.enableHighAccuracy, options?.timeout, options?.maximumAge]);

  return state;
}