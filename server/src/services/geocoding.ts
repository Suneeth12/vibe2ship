import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const fallbackAddress = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  
  if (!env.GOOGLE_MAPS_SERVER_KEY || env.GOOGLE_MAPS_SERVER_KEY === 'PLACEHOLDER') {
    logger.warn('Google Maps Server Key is placeholder. Using fallback geocoding.');
    return fallbackAddress;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${env.GOOGLE_MAPS_SERVER_KEY}`;
    const response = await axios.get(url);
    
    if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }
    
    logger.warn({ status: response.data.status }, 'Reverse geocoding returned non-OK status');
    return fallbackAddress;
  } catch (error) {
    logger.error({ error }, 'Reverse geocoding request failed');
    return fallbackAddress;
  }
}
