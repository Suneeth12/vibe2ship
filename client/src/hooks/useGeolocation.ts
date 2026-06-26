import { useState, useEffect } from 'react';

export interface GeolocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  isFallback: boolean;
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
    isFallback: false,
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

    let ipFallbackAttempted = false;

    // Use watchPosition to continuously update coordinates when they change or become available
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          isFallback: false, // Successfully got real browser geolocation
        });
      },
      (error) => {
        console.warn('Geolocation access failed or timed out. Trying IP-based geolocation fallback...', error.message);
        
        // If we already attempted IP fallback, don't spam the API on subsequent errors
        if (ipFallbackAttempted) return;
        ipFallbackAttempted = true;

        fetch('https://ipapi.co/json/')
          .then(res => res.json())
          .then(data => {
            if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
              setState(prev => {
                // If a success callback already fired in the meantime, don't overwrite it
                if (!prev.isFallback && prev.accuracy !== null && prev.accuracy < 5000) {
                  return prev;
                }
                return {
                  latitude: data.latitude,
                  longitude: data.longitude,
                  accuracy: 10000, // Approximate accuracy for IP-based
                  error: null,
                  loading: false,
                  isFallback: true,
                };
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

    return watchId;
  };

  useEffect(() => {
    const watchId = getPosition();
    return () => {
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  return {
    ...state,
    refresh: getPosition,
  };
}
