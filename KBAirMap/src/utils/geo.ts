import type { LatLng } from '../types';

export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function calculateDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371000; // Earth radius in meters
  const lat1 = toRadians(point1.lat);
  const lat2 = toRadians(point2.lat);
  const deltaLat = toRadians(point2.lat - point1.lat);
  const deltaLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function calculateBearing(from: LatLng, to: LatLng): number {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const lng1 = toRadians(from.lng);
  const lng2 = toRadians(to.lng);

  const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);

  let bearing = toDegrees(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;

  return bearing;
}

export function formatCoordinate(lat: number, lng: number): string {
  const latDeg = Math.abs(lat);
  const latMin = (latDeg % 1) * 60;
  const latSec = (latMin % 1) * 60;
  const latDir = lat >= 0 ? 'N' : 'S';

  const lngDeg = Math.abs(lng);
  const lngMin = (lngDeg % 1) * 60;
  const lngSec = (lngMin % 1) * 60;
  const lngDir = lng >= 0 ? 'E' : 'W';

  return `${Math.floor(latDeg)}°${Math.floor(latMin)}'${latSec.toFixed(1)}"${latDir} ${Math.floor(lngDeg)}°${Math.floor(lngMin)}'${lngSec.toFixed(1)}"${lngDir}`;
}

export function formatAltitude(altitude: number | null): string {
  if (altitude === null || altitude === undefined) return '---';
  const feet = Math.round(altitude * 3.28084);
  return `${feet}ft`;
}

export function formatSpeed(speed: number | null): string {
  if (speed === null || speed === undefined) return '---';
  // Convert m/s to knots
  const knots = speed * 1.94384;
  return `${Math.round(knots)}kt`;
}

export function formatHeading(heading: number | null): string {
  if (heading === null || heading === undefined) return '---';
  const normalized = (heading + 360) % 360;
  return `${Math.round(normalized).toString().padStart(3, '0')}°`;
}

export function interpolatePosition(from: LatLng, to: LatLng, fraction: number): LatLng {
  return {
    lat: from.lat + (to.lat - from.lat) * fraction,
    lng: from.lng + (to.lng - from.lng) * fraction,
  };
}

export function isPointInBounds(point: LatLng, bounds: { ne: LatLng; sw: LatLng }): boolean {
  return (
    point.lat <= bounds.ne.lat &&
    point.lat >= bounds.sw.lat &&
    point.lng <= bounds.ne.lng &&
    point.lng >= bounds.sw.lng
  );
}

export function calculateETA(distance: number, speed: number): number {
  if (speed <= 0) return Infinity;
  return (distance / speed) * 3600; // seconds
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
