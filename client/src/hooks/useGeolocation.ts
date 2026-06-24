import { useState, useEffect } from 'react';

export interface GeolocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

// Default to Seattle city center (matching ARCHITECTURE.md examples)
const DEFAULT_COORDINATES = {
  latitude: 47.6062,
  longitude: -122.3321,
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: DEFAULT_COORDINATES.latitude,
    longitude: DEFAULT_COORDINATES.longitude,
    accuracy: null,
    error: null,
    loading: true,
  });

  const getPosition = () => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
        loading: false,
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (error) => {
        console.warn('Geolocation access failed. Using Seattle default coordinates.', error.message);
        setState(prev => ({
          ...prev,
          error: `Failed to retrieve GPS location: ${error.message}. Using default location.`,
          loading: false,
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    getPosition();
  }, []);

  return {
    ...state,
    refresh: getPosition,
  };
}
