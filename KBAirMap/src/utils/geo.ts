// 지리 계산 유틸리티

// Haversine 거리 계산 (미터)
export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // 지구 반경 (m)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 방위각 계산 (0-360도)
export function calculateBearing(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  if (bearing < 0) bearing += 360;
  return bearing;
}

// ETA 계산 (분)
export function calculateETA(distanceMeters: number, speedMs: number): number | null {
  if (!speedMs || speedMs <= 0) return null;
  const timeSeconds = distanceMeters / speedMs;
  return timeSeconds / 60; // 분 단위
}

// GPS 품질 판정
export function getGpsQuality(accuracy: number): {
  level: 'GOOD' | 'FAIR' | 'POOR' | 'NO FIX';
  color: string;
} {
  if (accuracy <= 0) return { level: 'NO FIX', color: '#6b7280' };
  if (accuracy <= 10) return { level: 'GOOD', color: '#10b981' };
  if (accuracy <= 30) return { level: 'FAIR', color: '#f59e0b' };
  return { level: 'POOR', color: '#ef4444' };
}

// GeoJSON Feature 생성
export function createGeoJSONFeature(
  type: 'Point' | 'LineString',
  coordinates: number[] | number[][],
  properties: Record<string, any> = {}
): GeoJSON.Feature {
  return {
    type: 'Feature',
    properties,
    geometry: {
      type,
      coordinates: type === 'Point' ? coordinates : coordinates
    } as GeoJSON.Geometry
  };
}

// 트랙 GeoJSON 생성
export function createTrackGeoJSON(points: { lat: number; lng: number; timestamp: number }[]): GeoJSON.FeatureCollection {
  const coordinates = points.map(p => [p.lng, p.lat]);
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {
        startTime: points[0]?.timestamp,
        endTime: points[points.length - 1]?.timestamp,
        pointCount: points.length
      },
      geometry: {
        type: 'LineString',
        coordinates
      }
    }]
  };
}

// 파일 다운로드
export function downloadGeoJSON(geojson: GeoJSON.FeatureCollection, filename: string) {
  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 클립보드 복사
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Clipboard error:', err);
    return false;
  }
}
