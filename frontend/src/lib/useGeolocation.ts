import { useState, useEffect, useCallback } from 'react';

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GeolocationState {
  coords: GeolocationCoords | null;
  isLoading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    isLoading: true,
    error: null,
    permissionDenied: false,
  });

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      },
      isLoading: false,
      error: null,
      permissionDenied: false,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    const permissionDenied = error.code === GeolocationPositionError.PERMISSION_DENIED;
    setState({
      coords: null,
      isLoading: false,
      error: permissionDenied
        ? 'Location permission denied. Please allow location access to use proximity alerts.'
        : error.message || 'Unable to retrieve your location.',
      permissionDenied,
    });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        coords: null,
        isLoading: false,
        error: 'Geolocation is not supported by your browser.',
        permissionDenied: false,
      });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [handleSuccess, handleError]);

  return state;
}
