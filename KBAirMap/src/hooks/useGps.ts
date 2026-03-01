import { useState, useEffect, useCallback, useRef } from 'react';
import type { GpsData, AircraftState } from '../types';

const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;

// Native GPS (Android only via Capacitor)
export function useGps() {
  const [gpsData] = useState<GpsData | null>(null);
  const [aircraftState] = useState<AircraftState | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  
  // 웹에서는 사용 불가 - Capacitor만 지원
  const startTracking = useCallback(async () => {
    if (!isCapacitor) {
      console.log('Native GPS requires Capacitor/Android');
      return;
    }
    setIsTracking(true);
  }, []);

  const stopTracking = useCallback(async () => {
    setIsTracking(false);
  }, []);

  return { gpsData, aircraftState, isTracking, startTracking, stopTracking };
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
