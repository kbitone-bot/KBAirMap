# Real GPS Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable real Android GPS positioning on the map using Capacitor Geolocation plugin, with automatic fallback to Mock GPS in browser environments.

**Architecture:** Implement the stubbed `useGps()` hook using `@capacitor/geolocation` watchPosition API. App.tsx auto-detects native platform and switches between real/mock GPS. All downstream components (MapView, InstrumentPanel) remain unchanged since they consume the same `GpsData` interface.

**Tech Stack:** React 19, Capacitor 8, @capacitor/geolocation 8, TypeScript, MapLibre GL

---

### Task 1: Implement useGps() hook with Capacitor Geolocation

**Files:**
- Modify: `src/hooks/useGps.ts:1-26`

**Step 1: Replace the useGps() stub with full Capacitor Geolocation implementation**

Replace lines 1-26 of `src/hooks/useGps.ts` with:

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import type { GpsData, AircraftState } from '../types';

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
                const dLng = longitude - prev.lng;
                const dLat = latitude - prev.lat;
                if (Math.abs(dLat) > 1e-7 || Math.abs(dLng) > 1e-7) {
                  const y = Math.sin(dLng * Math.PI / 180) * Math.cos(latitude * Math.PI / 180);
                  const x = Math.cos(prev.lat * Math.PI / 180) * Math.sin(latitude * Math.PI / 180)
                    - Math.sin(prev.lat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * Math.cos(dLng * Math.PI / 180);
                  calcHeading = ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
                }
              }

              // Calculate speed from movement if not provided
              if (calcSpeed === null || calcSpeed === undefined || calcSpeed < 0) {
                const R = 6371000;
                const dLatRad = (latitude - prev.lat) * Math.PI / 180;
                const dLngRad = (longitude - prev.lng) * Math.PI / 180;
                const a = Math.sin(dLatRad / 2) ** 2
                  + Math.cos(prev.lat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * Math.sin(dLngRad / 2) ** 2;
                const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                calcSpeed = dist / dt;
              }
            }
          }

          // Calculate vertical speed
          let verticalSpeed = 0;
          if (prev && altitude !== null && prev.alt !== null) {
            const dt = (timestamp - prev.timestamp) / 1000;
            if (dt > 0) {
              verticalSpeed = ((altitude - prev.alt) / dt) * 60; // m/min → fpm style
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
      await Geolocation.clearWatch({ id: watchIdRef.current });
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
```

Keep the existing `useMockGps()` function (lines 28-90) unchanged.

**Step 2: Verify the build compiles**

Run: `cd KBAirMap && npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add src/hooks/useGps.ts
git commit -m "feat: implement useGps() with Capacitor Geolocation watchPosition"
```

---

### Task 2: Update App.tsx for auto-detection

**Files:**
- Modify: `src/App.tsx:1-53`

**Step 1: Add Capacitor import and auto-detection logic**

Add import at line 1 area:
```typescript
import { Capacitor } from '@capacitor/core';
```

Change the `isMockMode` initial state (line 26) to auto-detect:
```typescript
const [isMockMode, setIsMockMode] = useState(!Capacitor.isNativePlatform());
```

This single change makes the app:
- Native (Android): `isMockMode = false` → uses `useGps()` (real GPS)
- Browser: `isMockMode = true` → uses `useMockGps()` (mock GPS)

The existing toggle UI at line 496-499 still allows manual override.

**Step 2: Verify the build compiles**

Run: `cd KBAirMap && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: auto-detect native platform for GPS mode selection"
```

---

### Task 3: Build and sync to Android

**Step 1: Build the web assets**

Run: `cd KBAirMap && npm run build`
Expected: Build succeeds, output in `dist/`

**Step 2: Sync to Android project**

Run: `cd KBAirMap && npx cap sync android`
Expected: Capacitor syncs web assets and plugins to Android project

**Step 3: Verify Android build**

Open in Android Studio or run:
```bash
cd KBAirMap/android && ./gradlew assembleDebug
```
Expected: APK builds successfully

**Step 4: Commit any sync changes**

```bash
git add -A
git commit -m "chore: sync Capacitor build to Android"
```

---

### Task 4: Deploy and test on real device

**Step 1: Install on device**

Connect Android device via USB with developer mode enabled.

Run from Android Studio: Run > Run 'app'
Or via CLI:
```bash
cd KBAirMap/android && ./gradlew installDebug
adb shell am start -n com.kb.airmap/.MainActivity
```

**Step 2: Verify GPS behavior**

Test checklist:
- [ ] App starts, GPS permission dialog appears
- [ ] After granting permission, aircraft marker appears at current location
- [ ] Header shows "실제" tag (not "모의")
- [ ] GPS quality badge shows signal level (GPS/DGPS/RTK)
- [ ] Accuracy circle displays around aircraft marker
- [ ] Walking/driving moves the aircraft marker on map
- [ ] Heading/speed instruments update with movement
- [ ] Track log records path when enabled
- [ ] DEST navigation works from current position

**Step 3: Test fallback behavior**

- [ ] Deny GPS permission → app falls back gracefully (no crash)
- [ ] Toggle "모의 GPS 모드" in menu → switches to mock GPS
- [ ] Toggle back to real GPS → resumes tracking
