import { useState, useCallback, useEffect } from 'react';
import { Menu, X, Target, Map, FileText, Radio, MapPin, Trash2, Layers, Navigation, Crosshair, Flag, Copy, Download } from 'lucide-react';
import MapView from './components/MapView';
import InstrumentPanel from './components/InstrumentPanel';
import PDFManager from './components/PDFManager';
import AirspaceFilter from './components/AirspaceFilter';
import type { MapScale, Waypoint, Destination, QuickMarker, TrackPoint } from './types';
import { useGps, useMockGps } from './hooks/useGps';
import { calculateDistance, calculateBearing, calculateETA, getGpsQuality, createTrackGeoJSON, downloadGeoJSON, copyToClipboard } from './utils/geo';
import './App.css';

const MAPS: Record<MapScale, { name: string; desc: string }> = {
  '1:50K': { name: '공도 1:50,000', desc: '활주로 상세' },
  '1:100K': { name: '공도 1:100,000', desc: '저고도 비행' },
  '1:250K': { name: '지형도 1:250,000', desc: '중고도 경로' },
  '1:500K': { name: '지형도 1:500,000', desc: '고고도 순항' },
  '1:1M': { name: '개요도 1:1,000,000', desc: '광역 개요' },
};

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [showPDF, setShowPDF] = useState(false);
  const [mapScale, setMapScale] = useState<MapScale>('1:250K');
  const [isMockMode, setIsMockMode] = useState(true);
  const [followAircraft, setFollowAircraft] = useState(true);
  
  // 참조점 & 퀵마커
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [quickMarkers, setQuickMarkers] = useState<QuickMarker[]>([]);
  const [addWaypointMode, setAddWaypointMode] = useState(false);
  const [addQuickMarkerMode, setAddQuickMarkerMode] = useState(false);
  
  // 공역
  const [visibleAirspaces, setVisibleAirspaces] = useState<Set<string>>(new Set());
  
  // DEST (도착지점)
  const [destination, setDestination] = useState<Destination | null>(null);
  const [setDestMode, setSetDestMode] = useState(false);
  const [destInfo, setDestInfo] = useState<{ distance: number; bearing: number; eta: number | null } | null>(null);
  
  // 트랙 로그
  const [trackLog, setTrackLog] = useState<TrackPoint[]>([]);
  const [trackLogEnabled, setTrackLogEnabled] = useState(true);
  
  // 클립보드 알림
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const realGps = useGps();
  const mockGps = useMockGps(isMockMode);
  const { gpsData, aircraftState, isTracking, startTracking, stopTracking } = 
    isMockMode ? mockGps : realGps;

  // GPS 품질
  const gpsQuality = gpsData ? getGpsQuality(gpsData.accuracy) : { level: 'NO FIX', color: '#6b7280' };

  // DEST 정보 계산
  useEffect(() => {
    if (destination && gpsData) {
      const distance = calculateDistance(
        gpsData.latitude, gpsData.longitude,
        destination.position.lat, destination.position.lng
      );
      const bearing = calculateBearing(
        gpsData.latitude, gpsData.longitude,
        destination.position.lat, destination.position.lng
      );
      const eta = gpsData.speed ? calculateETA(distance, gpsData.speed) : null;
      
      setDestInfo({ distance, bearing, eta });
    } else {
      setDestInfo(null);
    }
  }, [destination, gpsData]);

  // 트랙 로그 저장
  useEffect(() => {
    if (!trackLogEnabled || !gpsData) return;
    
    const newPoint: TrackPoint = {
      lat: gpsData.latitude,
      lng: gpsData.longitude,
      altitude: gpsData.altitude,
      speed: gpsData.speed,
      heading: gpsData.heading,
      timestamp: gpsData.timestamp,
    };
    
    setTrackLog(prev => {
      // 중복 포인트 방지 (최소 1초 간격)
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (newPoint.timestamp - last.timestamp < 1000) return prev;
      }
      
      // 최대 1000 포인트 유지
      const updated = [...prev, newPoint];
      if (updated.length > 1000) return updated.slice(-1000);
      return updated;
    });
  }, [gpsData, trackLogEnabled]);

  // 참조점 추가
  const handleAddWaypoint = useCallback((pos: { lat: number; lng: number; name?: string }) => {
    const newWp: Waypoint = {
      id: `wp-${Date.now()}`,
      name: pos.name || `WP${waypoints.length + 1}`,
      position: { lat: pos.lat, lng: pos.lng },
      type: 'user',
      createdAt: Date.now(),
    };
    setWaypoints(prev => [...prev, newWp]);
    setAddWaypointMode(false);
  }, [waypoints.length]);

  // 퀵 마커 추가
  const handleAddQuickMarker = useCallback((pos: { lat: number; lng: number }) => {
    if (quickMarkers.length >= 5) {
      setQuickMarkers(prev => prev.slice(1)); // 가장 오래된 것 제거
    }
    const newMarker: QuickMarker = {
      id: `qm-${Date.now()}`,
      name: `Q${quickMarkers.length + 1}`,
      position: { lat: pos.lat, lng: pos.lng },
      createdAt: Date.now(),
    };
    setQuickMarkers(prev => [...prev, newMarker]);
    setAddQuickMarkerMode(false);
  }, [quickMarkers.length]);

  // DEST 설정
  const handleSetDestination = useCallback((pos: { lat: number; lng: number }) => {
    setDestination({
      position: { lat: pos.lat, lng: pos.lng },
      name: `DEST`,
      setAt: Date.now(),
    });
    setSetDestMode(false);
  }, []);

  // 삭제 핸들러
  const handleDeleteWaypoint = useCallback((id: string) => {
    setWaypoints(prev => prev.filter(wp => wp.id !== id));
  }, []);
  
  const handleDeleteQuickMarker = useCallback((id: string) => {
    setQuickMarkers(prev => prev.filter(qm => qm.id !== id));
  }, []);
  
  const handleClearDestination = useCallback(() => {
    setDestination(null);
    setDestInfo(null);
  }, []);

  // 공역 필터
  const handleAirspaceVisibilityChange = useCallback((visibleIds: Set<string>) => {
    setVisibleAirspaces(visibleIds);
  }, []);

  // 클립보드 복사
  const handleCopyCoordinates = useCallback(async () => {
    if (!gpsData) return;
    const text = `${gpsData.latitude.toFixed(6)}, ${gpsData.longitude.toFixed(6)} | ALT: ${gpsData.altitude ? Math.round(gpsData.altitude * 3.28) + 'ft' : 'N/A'} | SPD: ${gpsData.speed ? Math.round(gpsData.speed * 1.94) + 'kt' : 'N/A'}`;
    const success = await copyToClipboard(text);
    if (success) {
      setCopyToast('좌표 복사됨');
      setTimeout(() => setCopyToast(null), 2000);
    }
  }, [gpsData]);

  // 트랙 로그 내보내기
  const handleExportTrack = useCallback(() => {
    if (trackLog.length === 0) return;
    const geojson = createTrackGeoJSON(trackLog);
    const date = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    downloadGeoJSON(geojson, `track_${date}.geojson`);
  }, [trackLog]);

  // 모드 전환 시 다른 모드 해제
  const setMode = (mode: 'waypoint' | 'quick' | 'dest' | null) => {
    setAddWaypointMode(mode === 'waypoint');
    setAddQuickMarkerMode(mode === 'quick');
    setSetDestMode(mode === 'dest');
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button className="btn-icon" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="logo">KB AirMap</span>
          <span className={`tag ${isMockMode ? 'mock' : 'real'}`}>
            <Radio size={12} />
            {isMockMode ? '모의' : '실제'}
          </span>
          {/* GPS 품질 배지 */}
          <span className="gps-quality" style={{ backgroundColor: gpsQuality.color + '20', color: gpsQuality.color, borderColor: gpsQuality.color }}>
            GPS: {gpsQuality.level}
          </span>
        </div>
        
        <div className="header-center">
          {gpsData && (
            <span className="coords">
              {gpsData.latitude.toFixed(4)}°N {gpsData.longitude.toFixed(4)}°E
            </span>
          )}
        </div>

        <div className="header-right">
          <button 
            className={`btn-icon ${followAircraft ? 'active' : ''}`}
            onClick={() => setFollowAircraft(!followAircraft)}
            title="항공기 추적"
          >
            <Target size={18} />
          </button>
          <button 
            className="btn-icon"
            onClick={handleCopyCoordinates}
            title="좌표 복사"
          >
            <Copy size={18} />
          </button>
        </div>
      </header>

      {/* DEST 정보 패널 */}
      {destInfo && destination && (
        <div className="dest-panel">
          <div className="dest-row">
            <span className="dest-label">DEST</span>
            <span className="dest-value">{destination.name}</span>
            <button className="dest-close" onClick={handleClearDestination}>×</button>
          </div>
          <div className="dest-stats">
            <div className="dest-stat">
              <span className="stat-label">DME</span>
              <span className="stat-value">{(destInfo.distance / 1852).toFixed(1)}<small>NM</small></span>
            </div>
            <div className="dest-stat">
              <span className="stat-label">BRG</span>
              <span className="stat-value">{Math.round(destInfo.bearing).toString().padStart(3, '0')}<small>°</small></span>
            </div>
            <div className="dest-stat">
              <span className="stat-label">ETA</span>
              <span className="stat-value">
                {destInfo.eta ? Math.round(destInfo.eta).toString().padStart(2, '0') : '--'}<small>min</small>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <main className="main">
        {/* Left Panel */}
        {leftPanelOpen && (
          <aside className="left-panel">
            {/* DEST 섹션 */}
            <div className="panel-section">
              <div className="section-header">
                <Flag size={14} />
                <span>도착지점 (DEST)</span>
                <button 
                  className={`btn-add-small ${setDestMode ? 'active' : ''}`}
                  onClick={() => setMode(setDestMode ? null : 'dest')}
                  title="DEST 설정"
                >
                  {setDestMode ? '✕' : <Crosshair size={12} />}
                </button>
              </div>
              {setDestMode && (
                <div className="mode-hint">
                  지도를 클릭하여 도착지점 설정
                </div>
              )}
              {destination && (
                <div className="dest-summary">
                  <div className="dest-coords">
                    {destination.position.lat.toFixed(3)}°, {destination.position.lng.toFixed(3)}°
                  </div>
                </div>
              )}
            </div>

            {/* 퀵 마커 섹션 */}
            <div className="panel-section">
              <div className="section-header">
                <Navigation size={14} />
                <span>퀵 마커 ({quickMarkers.length}/5)</span>
                <button 
                  className={`btn-add-small ${addQuickMarkerMode ? 'active' : ''}`}
                  onClick={() => setMode(addQuickMarkerMode ? null : 'quick')}
                  title="퀵 마커 추가"
                >
                  {addQuickMarkerMode ? '✕' : '+'}
                </button>
              </div>
              {addQuickMarkerMode && (
                <div className="mode-hint">
                  지도를 클릭하여 임시 마커 추가
                </div>
              )}
              <div className="waypoint-list compact">
                {quickMarkers.map(qm => (
                  <div key={qm.id} className="waypoint-item">
                    <span className="qm-badge">{qm.name}</span>
                    <div className="wp-info">
                      <span className="wp-coords">
                        {qm.position.lat.toFixed(3)}°, {qm.position.lng.toFixed(3)}°
                      </span>
                    </div>
                    <button className="wp-delete" onClick={() => handleDeleteQuickMarker(qm.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 공역 필터 섹션 */}
            <div className="panel-section">
              <div className="section-header">
                <Layers size={14} />
                <span>공역 필터</span>
              </div>
              <AirspaceFilter onVisibilityChange={handleAirspaceVisibilityChange} />
            </div>

            {/* 참조점 섹션 */}
            <div className="panel-section">
              <div className="section-header">
                <MapPin size={14} />
                <span>참조점 ({waypoints.length})</span>
                <button 
                  className={`btn-add-small ${addWaypointMode ? 'active' : ''}`}
                  onClick={() => setMode(addWaypointMode ? null : 'waypoint')}
                  title="참조점 추가"
                >
                  {addWaypointMode ? '✕' : '+'}
                </button>
              </div>
              {addWaypointMode && (
                <div className="mode-hint">
                  지도를 클릭하여 참조점 추가
                </div>
              )}
              <div className="waypoint-list">
                {waypoints.map(wp => (
                  <div key={wp.id} className="waypoint-item">
                    <MapPin size={12} className="wp-icon" />
                    <div className="wp-info">
                      <span className="wp-name">{wp.name}</span>
                      <span className="wp-coords">
                        {wp.position.lat.toFixed(3)}°, {wp.position.lng.toFixed(3)}°
                      </span>
                    </div>
                    <button className="wp-delete" onClick={() => handleDeleteWaypoint(wp.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 트랙 로그 섹션 */}
            <div className="panel-section">
              <div className="section-header">
                <span>트랙 로그</span>
                <label className="toggle-small">
                  <input 
                    type="checkbox" 
                    checked={trackLogEnabled} 
                    onChange={e => setTrackLogEnabled(e.target.checked)} 
                  />
                  <span>REC</span>
                </label>
              </div>
              <div className="track-info">
                <span className="track-count">{trackLog.length} 포인트</span>
                <button 
                  className="btn-export"
                  onClick={handleExportTrack}
                  disabled={trackLog.length === 0}
                >
                  <Download size={12} />
                  내보내기
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Left Panel Toggle */}
        <button 
          className="panel-toggle left" 
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          style={{ left: leftPanelOpen ? '280px' : '0' }}
        >
          {leftPanelOpen ? '‹' : '›'}
        </button>

        {/* Map Area */}
        <div className="map-area">
          <MapView 
            gpsData={gpsData} 
            followAircraft={followAircraft}
            waypoints={waypoints}
            quickMarkers={quickMarkers}
            destination={destination}
            trackLog={trackLog}
            visibleAirspaces={visibleAirspaces}
            addWaypointMode={addWaypointMode}
            addQuickMarkerMode={addQuickMarkerMode}
            setDestMode={setDestMode}
            onAddWaypoint={handleAddWaypoint}
            onAddQuickMarker={handleAddQuickMarker}
            onSetDestination={handleSetDestination}
          />
          
          {/* Map Info Overlay */}
          <div className="map-info">
            <div className="info-pill">
              <Map size={12} />
              {MAPS[mapScale].name}
            </div>
            {gpsData && (
              <div className="info-pill">
                정확도 ±{Math.round(gpsData.accuracy)}m
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - 계기판 */}
        {rightPanelOpen && (
          <aside className="right-panel">
            <InstrumentPanel aircraftState={aircraftState} gpsData={gpsData} />
          </aside>
        )}

        {/* Right Panel Toggle */}
        <button 
          className="panel-toggle right" 
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          style={{ right: rightPanelOpen ? '280px' : '0' }}
        >
          {rightPanelOpen ? '›' : '‹'}
        </button>
      </main>

      {/* Menu Overlay */}
      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)}>
          <aside className="menu" onClick={e => e.stopPropagation()}>
            <div className="menu-header">
              <span>메뉴</span>
              <button className="btn-close" onClick={() => setMenuOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="menu-section">
              <h4>지도 축척</h4>
              {(Object.keys(MAPS) as MapScale[]).map(scale => (
                <button
                  key={scale}
                  className={`menu-item ${mapScale === scale ? 'active' : ''}`}
                  onClick={() => setMapScale(scale)}
                >
                  <span className="item-title">{MAPS[scale].name}</span>
                  <span className="item-desc">{MAPS[scale].desc}</span>
                </button>
              ))}
            </div>

            <div className="menu-section">
              <h4>비행 자료</h4>
              <button className="menu-item" onClick={() => { setShowPDF(true); setMenuOpen(false); }}>
                <FileText size={14} />
                <span>비행기지별 PDF</span>
              </button>
            </div>

            <div className="menu-section">
              <h4>GPS 설정</h4>
              <button className="menu-item" onClick={() => isTracking ? stopTracking() : startTracking()}>
                <Radio size={14} />
                <span>{isTracking ? '추적 중지' : '추적 시작'}</span>
              </button>
              <label className="checkbox">
                <input type="checkbox" checked={isMockMode} onChange={e => setIsMockMode(e.target.checked)} />
                모의 GPS 모드
              </label>
            </div>
          </aside>
        </div>
      )}

      {/* Copy Toast */}
      {copyToast && (
        <div className="toast">{copyToast}</div>
      )}

      {showPDF && <PDFManager onClose={() => setShowPDF(false)} />}
    </div>
  );
}

export default App;
