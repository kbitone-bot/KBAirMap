import { useState, useEffect, useCallback, useRef } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import type { GpsData, AircraftState } from '../types';
import { calculateDistance, calculateBearing } from '../utils/geo';

const isCapacitor = Capacitor.isNativePlatform();

// Native GPS (Android via Capacitor)
export function useGps() {
  const [gpsData, setGpsData] = useState<GpsData | null>(null);
  const [aircraftState, setAircraftState] = useState<AircraftState | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const watchIdRef = useRef<string | null>(null);
  const prevPositionRef = useRef<{ lat: number; lng: number; alt: number | null; timestamp: number } | null>(null);

  const startTracking = useCallback(async () => {
    if (!isCapacitor) {
      console.log('Native GPS requires Capacitor/Android');
      return;
    }

    if (watchIdRef.current) return;

    try {
      // Request permissions
      const permStatus = await Geolocation.checkPermissions();
      if (permStatus.location !== 'granted') {
        const reqResult = await Geolocation.requestPermissions();
        if (reqResult.location !== 'granted') {
          setPermissionDenied(true);
          console.warn('GPS permission denied');
          return;
        }
      }

      setPermissionDenied(false);
      setIsTracking(true);

      // Start watching position
      const id = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
        (position, err) => {
          if (err) {
            console.error('GPS error:', err);
            return;
          }
          if (!position) return;

          const { latitude, longitude, altitude, accuracy, heading, speed } = position.coords;
          const timestamp = position.timestamp;

          // Calculate heading/speed from consecutive positions if native values are null
          let calcHeading = heading;
          let calcSpeed = speed;
          const prev = prevPositionRef.current;

          if (prev) {
            const dt = (timestamp - prev.timestamp) / 1000; // seconds
            if (dt > 0) {
              // Calculate heading from movement if not provided
              if (calcHeading === null || calcHeading === undefined || calcHeading < 0) {
                if (Math.abs(latitude - prev.lat) > 1e-7 || Math.abs(longitude - prev.lng) > 1e-7) {
                  calcHeading = calculateBearing(prev.lat, prev.lng, latitude, longitude);
                }
              }

              // Calculate speed from movement if not provided
              if (calcSpeed === null || calcSpeed === undefined || calcSpeed < 0) {
                const dist = calculateDistance(prev.lat, prev.lng, latitude, longitude);
                calcSpeed = dist / dt;
              }
            }
          }

          // Calculate vertical speed
          let verticalSpeed = 0;
          if (prev && altitude !== null && prev.alt !== null) {
            const dt = (timestamp - prev.timestamp) / 1000;
            if (dt > 0) {
              verticalSpeed = ((altitude - prev.alt) / dt) * 60; // meters per minute
            }
          }

          // Store current position for next calculation
          prevPositionRef.current = { lat: latitude, lng: longitude, alt: altitude, timestamp };

          const newGpsData: GpsData = {
            latitude,
            longitude,
            altitude,
            accuracy: accuracy ?? 999,
            heading: calcHeading ?? null,
            speed: calcSpeed ?? null,
            timestamp,
          };

          setGpsData(newGpsData);

          setAircraftState({
            position: { lat: latitude, lng: longitude },
            altitude: altitude ?? 0,
            heading: calcHeading ?? 0,
            speed: calcSpeed ?? 0,
            verticalSpeed,
            timestamp,
          });
        }
      );

      watchIdRef.current = id;
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
      setIsTracking(false);
    }
  }, []);

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current) {
      try {
        await Geolocation.clearWatch({ id: watchIdRef.current });
      } catch (e) {
        console.error('Failed to clear GPS watch:', e);
      }
      watchIdRef.current = null;
    }
    setIsTracking(false);
    prevPositionRef.current = null;
  }, []);

  // Auto-start on native platform
  useEffect(() => {
    if (isCapacitor) {
      startTracking();
    }
    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current });
      }
    };
  }, [startTracking]);

  return { gpsData, aircraftState, isTracking, startTracking, stopTracking, permissionDenied };
}

// 모의 GPS - 움직이는 항공기
export function useMockGps(enabled: boolean) {
  const [gpsData, setGpsData] = useState<GpsData | null>(null);
  const [aircraftState, setAircraftState] = useState<AircraftState | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    let lat = 36.5;
    let lng = 127.8;
    let heading = 45;
    let altitude = 1000;

    intervalRef.current = setInterval(() => {
      // 이동 계산 (속도 60m/s = 약 120kt)
      const speed = 60;
      const hdgRad = (heading * Math.PI) / 180;
      lat += (speed * Math.cos(hdgRad)) / 111000;
      lng += (speed * Math.sin(hdgRad)) / (111000 * Math.cos(lat * Math.PI / 180));
      
      // 약간의 변동
      heading = (heading + (Math.random() - 0.5) * 2) % 360;
      altitude += (Math.random() - 0.5) * 10;

      const now = Date.now();
      
      setGpsData({
        latitude: lat,
        longitude: lng,
        altitude,
        accuracy: 5 + Math.random() * 5,
        heading,
        speed,
        timestamp: now,
      });

      setAircraftState({
        position: { lat, lng },
        altitude,
        heading,
        speed,
        verticalSpeed: (Math.random() - 0.5) * 200,
        timestamp: now,
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled]);

  return {
    gpsData,
    aircraftState,
    isTracking: enabled,
    startTracking: async () => {},
    stopTracking: async () => {},
  };
}
