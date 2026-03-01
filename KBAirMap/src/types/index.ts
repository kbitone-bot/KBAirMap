export interface LatLng {
  lat: number;
  lng: number;
}

export interface GpsData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface AircraftState {
  position: LatLng;
  altitude: number;
  heading: number;
  speed: number;
  verticalSpeed: number;
  timestamp: number;
}

export interface MBTileSource {
  id: string;
  name: string;
  description: string;
  path: string;
  bounds: [number, number, number, number];
  minZoom: number;
  maxZoom: number;
  scale: MapScale;
  size: number;
  downloadedAt: string;
  isActive: boolean;
}

export type MapScale = '1:50K' | '1:100K' | '1:250K' | '1:500K' | '1:1M';

// 참조점 (Waypoint)
export interface Waypoint {
  id: string;
  name: string;
  position: LatLng;
  altitude?: number;
  type: 'user' | 'airport' | 'vor' | 'ndb' | 'fix';
  description?: string;
  createdAt: number;
}

// 도착지점 (DEST)
export interface Destination {
  position: LatLng;
  name: string;
  setAt: number;
}

// 퀵 마커
export interface QuickMarker {
  id: string;
  name: string;
  position: LatLng;
  memo?: string;
  createdAt: number;
}

// 트랙 포인트
export interface TrackPoint {
  lat: number;
  lng: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

// 트랙 로그 설정
export interface TrackLogSettings {
  enabled: boolean;
  maxPoints: number; // 최대 저장 포인트 수
  minDistance: number; // 최소 이동 거리 (m)
  minTime: number; // 최소 시간 간격 (ms)
}
