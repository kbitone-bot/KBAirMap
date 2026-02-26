import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { LatLng, Waypoint, GpsData, FlightPlan } from '../types';
import { getMapState, saveMapState } from '../utils/storage';

interface MapViewProps {
  gpsData: GpsData | null;
  flightPlan: FlightPlan | null;
  isEditing: boolean;
  onMapClick?: (coordinate: LatLng) => void;
  selectedWaypoint: Waypoint | null;
  onWaypointSelect?: (waypoint: Waypoint | null) => void;
  followAircraft?: boolean;
}

// Aviation-themed dark map style
const AVIATION_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  name: 'Aviation',
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: [
        'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'USGS The National Map',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#0a1628',
      },
    },
    {
      id: 'raster-tiles',
      type: 'raster',
      source: 'raster-tiles',
      paint: {
        'raster-opacity': 0.6,
      },
    },
  ],
};

// Fallback offline style
const OFFLINE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  name: 'Offline',
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#1a2332',
      },
    },
  ],
};

export const MapView: React.FC<MapViewProps> = ({
  gpsData,
  flightPlan,
  isEditing,
  onMapClick,
  selectedWaypoint,
  onWaypointSelect,
  followAircraft = false,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const aircraftMarkerRef = useRef<maplibregl.Marker | null>(null);
  const flightPathRef = useRef<maplibregl.GeoJSONSource | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const isFollowingRef = useRef(followAircraft);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = async () => {
      const savedState = await getMapState();
      
      const initialCenter = savedState?.center || { lat: 36.5, lng: 127.8 }; // Korea center
      const initialZoom = savedState?.zoom || 7;
      const initialBearing = savedState?.bearing || 0;

      const newMap = new maplibregl.Map({
        container: mapContainer.current!,
        style: OFFLINE_STYLE,
        center: [initialCenter.lng, initialCenter.lat],
        zoom: initialZoom,
        bearing: initialBearing,
        pitch: 0,
        attributionControl: false,
        maxZoom: 18,
        minZoom: 3,
      });

      // Add navigation controls
      newMap.addControl(
        new maplibregl.NavigationControl({
          visualizePitch: false,
          showZoom: true,
          showCompass: true,
        }),
        'bottom-right'
      );

      // Add scale control
      newMap.addControl(
        new maplibregl.ScaleControl({
          maxWidth: 150,
          unit: 'metric',
        }),
        'bottom-left'
      );

      // Handle map load
      newMap.on('load', () => {
        setIsMapLoaded(true);
        
        // Initialize flight path source
        newMap.addSource('flight-path', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [],
            },
          },
        });

        // Add flight path layer
        newMap.addLayer({
          id: 'flight-path-line',
          type: 'line',
          source: 'flight-path',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#00d4ff',
            'line-width': 3,
            'line-dasharray': [2, 1],
          },
        });

        flightPathRef.current = newMap.getSource('flight-path') as maplibregl.GeoJSONSource;

        // Try to load online tiles
        try {
          newMap.setStyle(AVIATION_STYLE);
        } catch (e) {
          console.warn('Could not load online tiles, using offline mode');
        }
      });

      // Handle map click for waypoint creation
      newMap.on('click', (e) => {
        if (isEditing && onMapClick) {
          onMapClick({
            lat: e.lngLat.lat,
            lng: e.lngLat.lng,
          });
        }
      });

      // Save map state on move end
      newMap.on('moveend', () => {
        const center = newMap.getCenter();
        saveMapState({
          center: { lat: center.lat, lng: center.lng },
          zoom: newMap.getZoom(),
          bearing: newMap.getBearing(),
        });
      });

      map.current = newMap;
    };

    initMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isEditing, onMapClick]);

  // Update follow aircraft
  useEffect(() => {
    isFollowingRef.current = followAircraft;
  }, [followAircraft]);

  // Update aircraft marker position
  useEffect(() => {
    if (!map.current || !isMapLoaded || !gpsData) return;

    const position: [number, number] = [gpsData.longitude, gpsData.latitude];

    // Create or update aircraft marker
    if (!aircraftMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'aircraft-marker';
      el.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2L18 12H14L16 2Z" fill="#00d4ff"/>
          <path d="M16 30L14 20H18L16 30Z" fill="#00d4ff"/>
          <path d="M16 16L2 10V14L16 18V16Z" fill="#00d4ff"/>
          <path d="M16 16L30 10V14L16 18V16Z" fill="#00d4ff"/>
          <circle cx="16" cy="16" r="3" fill="#ff6b00"/>
        </svg>
      `;
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.transformOrigin = 'center';

      aircraftMarkerRef.current = new maplibregl.Marker({
        element: el,
        anchor: 'center',
        rotationAlignment: 'map',
      })
        .setLngLat(position)
        .addTo(map.current);
    } else {
      aircraftMarkerRef.current.setLngLat(position);
      if (gpsData.heading !== null) {
        const el = aircraftMarkerRef.current.getElement();
        el.style.transform = `rotate(${gpsData.heading}deg)`;
      }
    }

    // Follow aircraft if enabled
    if (isFollowingRef.current) {
      map.current.easeTo({
        center: position,
        bearing: gpsData.heading || 0,
        duration: 500,
      });
    }
  }, [gpsData, isMapLoaded]);

  // Update flight plan display
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (flightPlan && flightPlan.waypoints.length > 0) {
      const coordinates: [number, number][] = [];

      flightPlan.waypoints.forEach((waypoint, index) => {
        const coord: [number, number] = [waypoint.coordinate.lng, waypoint.coordinate.lat];
        coordinates.push(coord);

        // Create waypoint marker
        const el = document.createElement('div');
        el.className = 'waypoint-marker';
        el.innerHTML = `
          <div class="waypoint-icon ${selectedWaypoint?.id === waypoint.id ? 'selected' : ''}">
            <span class="waypoint-number">${index + 1}</span>
          </div>
          <div class="waypoint-label">${waypoint.name}</div>
        `;
        el.style.cursor = 'pointer';
        el.onclick = () => onWaypointSelect?.(waypoint);

        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'bottom',
        })
          .setLngLat(coord)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });

      // Update flight path
      if (flightPathRef.current) {
        flightPathRef.current.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        });
      }

      // Fit bounds if not following aircraft
      if (!followAircraft && coordinates.length > 1) {
        const bounds = coordinates.reduce(
          (bounds, coord) => bounds.extend(coord),
          new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
        );
        map.current.fitBounds(bounds, { padding: 100, maxZoom: 12 });
      }
    } else {
      // Clear flight path
      if (flightPathRef.current) {
        flightPathRef.current.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        });
      }
    }
  }, [flightPlan, selectedWaypoint, onWaypointSelect, isMapLoaded, followAircraft]);

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map-view" />
      {!isMapLoaded && (
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <span>지도 로딩 중...</span>
        </div>
      )}
    </div>
  );
};

export default MapView;
