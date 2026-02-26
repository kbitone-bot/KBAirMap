export interface LatLng {
  lat: number;
  lng: number;
}

export interface Waypoint {
  id: string;
  name: string;
  coordinate: LatLng;
  altitude?: number;
  note?: string;
}

export interface FlightPlan {
  id: string;
  name: string;
  waypoints: Waypoint[];
  createdAt: string;
  updatedAt: string;
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

export interface MapState {
  center: LatLng;
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface ReferencePoint {
  id: string;
  name: string;
  coordinate: LatLng;
  type: 'waypoint' | 'airport' | 'vor' | 'ndb' | 'user';
  frequency?: string;
  description?: string;
}

export interface AircraftState {
  position: LatLng;
  altitude: number;
  heading: number;
  speed: number;
  verticalSpeed: number;
  timestamp: number;
}

export interface MapStyle {
  version: number;
  name: string;
  sources: Record<string, any>;
  layers: any[];
  glyphs?: string;
  sprite?: string;
}
