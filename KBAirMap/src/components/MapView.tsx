import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GpsData, Waypoint, QuickMarker, Destination, TrackPoint } from '../types';
import type { AirspaceFeature } from './AirspaceFilter';
import '../styles/MapView.css';

interface Props {
  gpsData: GpsData | null;
  followAircraft: boolean;
  waypoints: Waypoint[];
  quickMarkers: QuickMarker[];
  destination: Destination | null;
  trackLog: TrackPoint[];
  visibleAirspaces: Set<string>;
  addWaypointMode: boolean;
  addQuickMarkerMode: boolean;
  setDestMode: boolean;
  onAddWaypoint?: (pos: { lat: number; lng: number; name?: string }) => void;
  onAddQuickMarker?: (pos: { lat: number; lng: number }) => void;
  onSetDestination?: (pos: { lat: number; lng: number }) => void;
}

// Esri 위성 타일
const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: 'Esri',
    },
    labels: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
    },
  },
  layers: [
    { id: 'satellite', type: 'raster', source: 'satellite', paint: { 'raster-opacity': 1 } },
    { id: 'labels', type: 'raster', source: 'labels', paint: { 'raster-opacity': 0.8 } },
  ],
};

export function MapView({ 
  gpsData, followAircraft, waypoints, quickMarkers, destination, trackLog,
  visibleAirspaces, addWaypointMode, addQuickMarkerMode, setDestMode,
  onAddWaypoint, onAddQuickMarker, onSetDestination 
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const labelMarker = useRef<maplibregl.Marker | null>(null);
  const arrowMarker = useRef<maplibregl.Marker | null>(null);
  const destMarker = useRef<maplibregl.Marker | null>(null);
  const wpMarkersRef = useRef<maplibregl.Marker[]>([]);
  const qmMarkersRef = useRef<maplibregl.Marker[]>([]);
  const airspaceSourcesRef = useRef<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [clickPos, setClickPos] = useState<{ lat: number; lng: number } | null>(null);
  const [wpName, setWpName] = useState('');
  const [airspaces, setAirspaces] = useState<AirspaceFeature[]>([]);

  // 지도 초기화
  useEffect(() => {
    if (!container.current || map.current) return;

    const m = new maplibregl.Map({
      container: container.current,
      style: MAP_STYLE,
      center: [127.8, 36.5],
      zoom: 8,
    });

    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    m.on('load', () => {
      // 정확도 원
      m.addSource('acc', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [] } } });
      m.addLayer({ id: 'acc-fill', type: 'fill', source: 'acc', paint: { 'fill-color': '#06b6d4', 'fill-opacity': 0.15 } });
      m.addLayer({ id: 'acc-line', type: 'line', source: 'acc', paint: { 'line-color': '#06b6d4', 'line-width': 1, 'line-dasharray': [3, 3] } });

      // 속도 벡터 라인
      m.addSource('vector-line', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } } });
      m.addLayer({ id: 'vector-line-layer', type: 'line', source: 'vector-line', paint: { 'line-color': '#f97316', 'line-width': 2, 'line-dasharray': [5, 5] } });

      // DEST 라인
      m.addSource('dest-line', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } } });
      m.addLayer({ id: 'dest-line-layer', type: 'line', source: 'dest-line', paint: { 'line-color': '#10b981', 'line-width': 2, 'line-dasharray': [3, 3] } });

      // 트랙 라인
      m.addSource('track-line', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } } });
      m.addLayer({ id: 'track-line-layer', type: 'line', source: 'track-line', paint: { 'line-color': '#06b6d4', 'line-width': 3, 'line-opacity': 0.7 } });

      setLoaded(true);
    });

    map.current = m;

    fetch('/data/airspaces.json')
      .then(r => r.json())
      .then(data => setAirspaces(data.features || []))
      .catch(console.error);

    return () => { m.remove(); map.current = null; };
  }, []);

  // 지도 클릭 핸들러 (모드별)
  useEffect(() => {
    if (!map.current) return;
    
    const activeMode = addWaypointMode || addQuickMarkerMode || setDestMode;
    
    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (!activeMode) return;
      
      const pos = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      
      if (addWaypointMode && onAddWaypoint) {
        setClickPos(pos);
        setWpName(`WP${waypoints.length + 1}`);
        setShowDialog(true);
      } else if (addQuickMarkerMode && onAddQuickMarker) {
        onAddQuickMarker(pos);
      } else if (setDestMode && onSetDestination) {
        onSetDestination(pos);
      }
    };

    map.current.on('click', handleClick);
    map.current.getCanvas().style.cursor = activeMode ? 'crosshair' : '';

    return () => { if (map.current) map.current.off('click', handleClick); };
  }, [addWaypointMode, addQuickMarkerMode, setDestMode, onAddWaypoint, onAddQuickMarker, onSetDestination, waypoints.length]);

  // 공역 레이어 업데이트
  useEffect(() => {
    if (!map.current || !loaded) return;

    airspaceSourcesRef.current.forEach(sourceId => {
      const fillLayerId = `${sourceId}-fill`;
      const lineLayerId = `${sourceId}-line`;
      if (map.current!.getLayer(fillLayerId)) map.current!.removeLayer(fillLayerId);
      if (map.current!.getLayer(lineLayerId)) map.current!.removeLayer(lineLayerId);
      if (map.current!.getSource(sourceId)) map.current!.removeSource(sourceId);
    });
    airspaceSourcesRef.current.clear();

    airspaces.forEach(airspace => {
      if (!visibleAirspaces.has(airspace.properties.id)) return;
      const sourceId = `airspace-${airspace.properties.id}`;
      const fillLayerId = `${sourceId}-fill`;
      const lineLayerId = `${sourceId}-line`;
      const color = airspace.properties.color;

      map.current!.addSource(sourceId, { type: 'geojson', data: airspace as any });
      map.current!.addLayer({ id: fillLayerId, type: 'fill', source: sourceId, paint: { 'fill-color': color, 'fill-opacity': 0.08 } });
      map.current!.addLayer({ id: lineLayerId, type: 'line', source: sourceId, paint: { 'line-color': color, 'line-width': 1.5, 'line-dasharray': [4, 2] } });
      airspaceSourcesRef.current.add(sourceId);
    });
  }, [airspaces, visibleAirspaces, loaded]);

  // 항공기 마커 업데이트
  useEffect(() => {
    if (!map.current || !loaded || !gpsData) return;
    const pos: [number, number] = [gpsData.longitude, gpsData.latitude];

    if (!marker.current) {
      const el = document.createElement('div');
      el.innerHTML = `<svg viewBox="0 0 24 24" width="32" height="32"><path d="M12 2l4 8h-8l4-8zM12 22l-4-8h8l-4 8zM12 12L2 7v4l10 3v-2zM12 12l10-5v4l-10 3v-2z" fill="#06b6d4" stroke="#fff" stroke-width="0.5"/><circle cx="12" cy="12" r="3" fill="#f97316"/></svg>`;
      el.className = 'ac-icon';
      marker.current = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(pos).addTo(map.current);
    } else {
      marker.current.setLngLat(pos);
      const svg = marker.current.getElement().querySelector('svg');
      if (svg && gpsData.heading != null) svg.style.transform = `rotate(${gpsData.heading}deg)`;
    }

    if (!labelMarker.current) {
      const el = document.createElement('div');
      el.className = 'ac-label';
      el.innerHTML = `<span class="hdg">${Math.round(gpsData.heading || 0).toString().padStart(3, '0')}°</span><span class="spd">${Math.round((gpsData.speed || 0) * 1.94)}kt</span><span class="alt">${Math.round((gpsData.altitude || 0) * 3.28)}ft</span>`;
      labelMarker.current = new maplibregl.Marker({ element: el, anchor: 'left', offset: [15, -25] }).setLngLat(pos).addTo(map.current);
    } else {
      labelMarker.current.setLngLat(pos);
      labelMarker.current.getElement().innerHTML = `<span class="hdg">${Math.round(gpsData.heading || 0).toString().padStart(3, '0')}°</span><span class="spd">${Math.round((gpsData.speed || 0) * 1.94)}kt</span><span class="alt">${Math.round((gpsData.altitude || 0) * 3.28)}ft</span>`;
    }

    const acc = map.current.getSource('acc') as maplibregl.GeoJSONSource;
    if (acc && gpsData.accuracy) {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 64; i++) {
        const ang = (i / 64) * Math.PI * 2;
        const r = gpsData.accuracy;
        pts.push([
          gpsData.longitude + (r * Math.cos(ang)) / (111000 * Math.cos(gpsData.latitude * Math.PI / 180)),
          gpsData.latitude + (r * Math.sin(ang)) / 111000
        ]);
      }
      acc.setData({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [pts] } });
    }

    // 속도 벡터
    if (gpsData.speed && gpsData.heading) {
      const speedMs = gpsData.speed;
      const dist10min = speedMs * 60 * 10;
      const hdgRad = (gpsData.heading * Math.PI) / 180;
      const endLat = gpsData.latitude + (dist10min * Math.cos(hdgRad)) / 111000;
      const endLng = gpsData.longitude + (dist10min * Math.sin(hdgRad)) / (111000 * Math.cos(gpsData.latitude * Math.PI / 180));
      const endPos: [number, number] = [endLng, endLat];

      const vectorLine = map.current.getSource('vector-line') as maplibregl.GeoJSONSource;
      if (vectorLine) vectorLine.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [pos, endPos] } });

      if (!arrowMarker.current) {
        const el = document.createElement('div');
        el.className = 'vector-arrow';
        el.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24"><polygon points="12,4 22,20 12,16 2,20" fill="#f97316" stroke="#fff" stroke-width="1"/></svg>`;
        arrowMarker.current = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(endPos).addTo(map.current);
      } else {
        arrowMarker.current.setLngLat(endPos);
        const svg = arrowMarker.current.getElement().querySelector('svg');
        if (svg && gpsData.heading != null) svg.style.transform = `rotate(${gpsData.heading}deg)`;
      }
    }

    // DEST 라인
    if (destination) {
      const destPos: [number, number] = [destination.position.lng, destination.position.lat];
      const destLine = map.current.getSource('dest-line') as maplibregl.GeoJSONSource;
      if (destLine) destLine.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [pos, destPos] } });
      
      if (!destMarker.current) {
        const el = document.createElement('div');
        el.className = 'dest-marker';
        el.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28"><polygon points="12,2 22,22 12,18 2,22" fill="#10b981" stroke="#fff" stroke-width="1.5"/><text x="12" y="15" text-anchor="middle" fill="white" font-size="8" font-weight="bold">D</text></svg>`;
        destMarker.current = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(destPos).addTo(map.current);
      } else {
        destMarker.current.setLngLat(destPos);
      }
    } else {
      if (destMarker.current) {
        destMarker.current.remove();
        destMarker.current = null;
      }
      const destLine = map.current.getSource('dest-line') as maplibregl.GeoJSONSource;
      if (destLine) destLine.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });
    }

    // 트랙 라인
    if (trackLog.length > 1) {
      const trackCoords = trackLog.map(p => [p.lng, p.lat]);
      const trackLine = map.current.getSource('track-line') as maplibregl.GeoJSONSource;
      if (trackLine) trackLine.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: trackCoords } });
    }

    if (followAircraft) map.current.easeTo({ center: pos, duration: 500 });
  }, [gpsData, loaded, followAircraft, destination, trackLog]);

  // 참조점 마커 업데이트
  useEffect(() => {
    if (!map.current || !loaded) return;
    wpMarkersRef.current.forEach(m => m.remove());
    wpMarkersRef.current = [];

    waypoints.forEach(wp => {
      const el = document.createElement('div');
      el.className = 'wp-marker';
      el.innerHTML = `<div class="wp-pin"></div><div class="wp-name">${wp.name}</div>`;
      const m = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([wp.position.lng, wp.position.lat]).addTo(map.current!);
      wpMarkersRef.current.push(m);
    });
  }, [waypoints, loaded]);

  // 퀵 마커 업데이트
  useEffect(() => {
    if (!map.current || !loaded) return;
    qmMarkersRef.current.forEach(m => m.remove());
    qmMarkersRef.current = [];

    quickMarkers.forEach(qm => {
      const el = document.createElement('div');
      el.className = 'qm-marker';
      el.innerHTML = `<div class="qm-pin">${qm.name}</div>`;
      const m = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([qm.position.lng, qm.position.lat]).addTo(map.current!);
      qmMarkersRef.current.push(m);
    });
  }, [quickMarkers, loaded]);

  const handleAdd = useCallback(() => {
    if (clickPos && onAddWaypoint && wpName.trim()) {
      onAddWaypoint({ lat: clickPos.lat, lng: clickPos.lng, name: wpName.trim() });
      setShowDialog(false);
      setWpName('');
    }
  }, [clickPos, wpName, onAddWaypoint]);

  const cancelAdd = useCallback(() => {
    setShowDialog(false);
    setWpName('');
  }, []);

  return (
    <div className="map-wrap">
      <div ref={container} className="map-canvas" />
      {!loaded && <div className="loading"><span>로딩...</span></div>}

      <div className="compass">
        <svg viewBox="0 0 80 80" width="60" height="60">
          <circle cx="40" cy="40" r="36" fill="rgba(17,24,39,0.9)" stroke="#374151" strokeWidth="1"/>
          <text x="40" y="14" textAnchor="middle" fill="#f97316" fontSize="10" fontWeight="bold">N</text>
          <text x="40" y="70" textAnchor="middle" fill="#6b7280" fontSize="9">S</text>
          <text x="68" y="43" textAnchor="middle" fill="#6b7280" fontSize="9">E</text>
          <text x="12" y="43" textAnchor="middle" fill="#6b7280" fontSize="9">W</text>
          {gpsData?.heading != null && (
            <g transform={`translate(40,40) rotate(${gpsData.heading})`}>
              <polygon points="0,-26 -5,-14 5,-14" fill="#f97316"/>
            </g>
          )}
          <circle cx="40" cy="40" r="2" fill="#06b6d4"/>
        </svg>
      </div>

      {showDialog && (
        <div className="dialog">
          <h4>참조점 추가</h4>
          <input value={wpName} onChange={e => setWpName(e.target.value)} placeholder="이름" autoFocus />
          <div className="coords">{clickPos?.lat.toFixed(5)}°, {clickPos?.lng.toFixed(5)}°</div>
          <div className="btns">
            <button onClick={cancelAdd}>취소</button>
            <button className="pri" onClick={handleAdd}>추가</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapView;
