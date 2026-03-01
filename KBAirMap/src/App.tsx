import { useState, useCallback } from 'react';
import { Menu, X, Target, Map, FileText, Radio, MapPin, Trash2, Layers, Navigation } from 'lucide-react';
import MapView from './components/MapView';
import InstrumentPanel from './components/InstrumentPanel';
import PDFManager from './components/PDFManager';
import AirspaceFilter from './components/AirspaceFilter';
import type { MapScale, Waypoint } from './types';
import { useGps, useMockGps } from './hooks/useGps';
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
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [visibleAirspaces, setVisibleAirspaces] = useState<Set<string>>(new Set());
  const [addWaypointMode, setAddWaypointMode] = useState(false);

  const realGps = useGps();
  const mockGps = useMockGps(isMockMode);
  const { gpsData, aircraftState, isTracking, startTracking, stopTracking } = 
    isMockMode ? mockGps : realGps;

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

  const handleDeleteWaypoint = useCallback((id: string) => {
    setWaypoints(prev => prev.filter(wp => wp.id !== id));
  }, []);

  const handleAirspaceVisibilityChange = useCallback((visibleIds: Set<string>) => {
    setVisibleAirspaces(visibleIds);
  }, []);

  return (
    <div className="app">
      {/* Header - 깔끔하게 */}
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
        </div>
      </header>

      {/* Main Layout */}
      <main className="main">
        {/* Left Panel - 공역 필터 & 참조점 */}
        {leftPanelOpen && (
          <aside className="left-panel">
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
                <Navigation size={14} />
                <span>참조점 ({waypoints.length})</span>
                <button 
                  className={`btn-add-small ${addWaypointMode ? 'active' : ''}`}
                  onClick={() => setAddWaypointMode(!addWaypointMode)}
                  title={addWaypointMode ? '취소' : '참조점 추가'}
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
              
              {waypoints.length === 0 && !addWaypointMode && (
                <div className="wp-empty">+ 버튼을 클릭하여 참조점 추가</div>
              )}
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
            visibleAirspaces={visibleAirspaces}
            addWaypointMode={addWaypointMode}
            onAddWaypoint={handleAddWaypoint}
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

      {showPDF && <PDFManager onClose={() => setShowPDF(false)} />}
    </div>
  );
}

export default App;
