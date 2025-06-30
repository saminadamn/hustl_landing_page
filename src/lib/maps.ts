import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  throw new Error('Google Maps API key is missing. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
}

export const mapsLoader = new Loader({
  apiKey: GOOGLE_MAPS_API_KEY,
  version: 'weekly',
  libraries: ['places', 'geometry', 'geocoding'],
  region: 'US',
  language: 'en',
  retries: 3,
  retry_interval: 1000,
  authReferrerPolicy: 'origin'
});

// Pre-load the Maps library
mapsLoader.load().catch(error => {
  console.error('Error pre-loading Google Maps:', error);
});

// UF campus bounds - slightly expanded to include nearby areas
export const UF_BOUNDS = {
  north: 29.6680, // Expanded north
  south: 29.6214, // Expanded south
  east: -82.3120, // Expanded east
  west: -82.3878  // Expanded west
};

// UF campus center
export const UF_CENTER = {
  lat: 29.6516, 
  lng: -82.3490
};