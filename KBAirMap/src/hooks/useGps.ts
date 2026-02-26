import { useState, useEffect, useCallback, useRef } from 'react';
import { Geolocation, type Position, type WatchPositionCallback } from '@capacitor/geolocation';
import type { GpsData, AircraftState, LatLng } from '../types';

const GPS_WATCH_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 1000,
  maximumAge: 0,
};

export function useGps() {
  const [gpsData, setGpsData] = useState<GpsData | null>(null);
  const [aircraftState, setAircraftState] = useState<AircraftState | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<string | null>(null);
  const lastPosition = useRef<LatLng | null>(null);
  const lastTimestamp = useRef<number>(0);

  const calculateVerticalSpeed = (
    currentAlt: number,
    previousAlt: number,
    timeDelta: number
  ): number => {
    if (timeDelta === 0) return 0;
    // feet per minute
    return ((currentAlt - previousAlt) / timeDelta) * 60;
  };

  const processPosition = useCallback((position: Position) => {
    const coords = position.coords;
    const timestamp = position.timestamp;

    const newGpsData: GpsData = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      altitude: coords.altitude ?? null,
      accuracy: coords.accuracy,
      heading: coords.heading ?? null,
      speed: coords.speed ?? null,
      timestamp: timestamp,
    };

    setGpsData(newGpsData);

    // Calculate aircraft state
    const currentPos: LatLng = {
      lat: coords.latitude,
      lng: coords.longitude,
    };

    let verticalSpeed = 0;
    if (
      aircraftState &&
      coords.altitude !== null &&
      aircraftState.altitude !== 0
    ) {
      const timeDelta = (timestamp - lastTimestamp.current) / 1000; // seconds
      verticalSpeed = calculateVerticalSpeed(
        coords.altitude,
        aircraftState.altitude,
        timeDelta
      );
    }

    setAircraftState({
      position: currentPos,
      altitude: coords.altitude || 0,
      heading: coords.heading || 0,
      speed: coords.speed || 0,
      verticalSpeed,
      timestamp,
    });

    lastPosition.current = currentPos;
    lastTimestamp.current = timestamp;
  }, [aircraftState]);

  const startTracking = useCallback(async () => {
    try {
      // Request permission
      const permission = await Geolocation.requestPermissions();
      if (permission.location !== 'granted') {
        setError('GPS 권한이 거부되었습니다');
        return;
      }

      // Check if GPS is enabled
      const isAvailable = await Geolocation.checkPermissions();
      if (isAvailable.location !== 'granted') {
        setError('GPS를 사용할 수 없습니다');
        return;
      }

      // Start watching position
      const callback: WatchPositionCallback = (position, err) => {
        if (err) {
          setError(`GPS 오류: ${err.message}`);
          return;
        }
        if (position) {
          processPosition(position);
        }
      };

      const id = await Geolocation.watchPosition(GPS_WATCH_OPTIONS, callback);

      watchId.current = id;
      setIsTracking(true);
      setError(null);
    } catch (err) {
      setError(`GPS 추적 시작 실패: ${err}`);
    }
  }, [processPosition]);

  const stopTracking = useCallback(async () => {
    if (watchId.current) {
      await Geolocation.clearWatch({ id: watchId.current });
      watchId.current = null;
    }
    setIsTracking(false);
  }, []);

  const getCurrentPosition = useCallback(async (): Promise<GpsData | null> => {
    try {
      const position = await Geolocation.getCurrentPosition(GPS_WATCH_OPTIONS);
      processPosition(position);
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude ?? null,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading ?? null,
        speed: position.coords.speed ?? null,
        timestamp: position.timestamp,
      };
    } catch (err) {
      setError(`위치 가져오기 실패: ${err}`);
      return null;
    }
  }, [processPosition]);

  useEffect(() => {
    return () => {
      if (watchId.current) {
        Geolocation.clearWatch({ id: watchId.current });
      }
    };
  }, []);

  return {
    gpsData,
    aircraftState,
    isTracking,
    error,
    startTracking,
    stopTracking,
    getCurrentPosition,
  };
}
