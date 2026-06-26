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
        console.warn('Geolocation access failed. Trying IP-based geolocation fallback...', error.message);
        fetch('https://ipapi.co/json/')
          .then(res => res.json())
          .then(data => {
            if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
              setState({
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: 10000,
                error: null,
                loading: false,
              });
            } else {
              throw new Error('Invalid IP geolocation data');
            }
          })
          .catch(ipErr => {
            console.error('IP-based geolocation also failed:', ipErr);
            setState(prev => ({
              ...prev,
              error: `Failed to retrieve GPS/IP location. Using default location.`,
              loading: false,
            }));
          });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
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
