import { useState, useEffect, useCallback } from 'react';
import { Menu, X, Maximize2, Minimize2, Target, Layers } from 'lucide-react';
import MapView from './components/MapView';
import FlightPlanPanel from './components/FlightPlanPanel';
import GpsStatus from './components/GpsStatus';
import InstrumentPanel from './components/InstrumentPanel';
import OfflineMapManager from './components/OfflineMapManager';
import type { FlightPlan, Waypoint, LatLng } from './types';
import { useGps } from './hooks/useGps';
import { getFlightPlans, saveFlightPlan } from './utils/storage';
import './App.css';

function App() {
  const [flightPlan, setFlightPlan] = useState<FlightPlan | null>(null);
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingCoordinate, setPendingCoordinate] = useState<LatLng | null>(null);
  const [followAircraft, setFollowAircraft] = useState(false);
  const [showInstruments, setShowInstruments] = useState(true);
  const [showGpsPanel, setShowGpsPanel] = useState(true);
  const [showFlightPlan, setShowFlightPlan] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showOfflineManager, setShowOfflineManager] = useState(false);

  const {
    gpsData,
    aircraftState,
    isTracking,
    error,
    startTracking,
    stopTracking,
  } = useGps();

  // Load saved flight plan on mount
  useEffect(() => {
    const loadSavedPlan = async () => {
      const plans = await getFlightPlans();
      if (plans.length > 0) {
        setFlightPlan(plans[plans.length - 1]);
      }
    };
    loadSavedPlan();
  }, []);

  // Save flight plan when updated
  useEffect(() => {
    if (flightPlan) {
      saveFlightPlan(flightPlan);
    }
  }, [flightPlan]);

  const handleMapClick = useCallback((coordinate: LatLng) => {
    if (isEditing) {
      setPendingCoordinate(coordinate);
    }
  }, [isEditing]);

  const handleUpdateFlightPlan = useCallback((plan: FlightPlan | null) => {
    setFlightPlan(plan);
    if (!plan) {
      setSelectedWaypoint(null);
    }
  }, []);

  const handleSelectWaypoint = useCallback((waypoint: Waypoint | null) => {
    setSelectedWaypoint(waypoint);
  }, []);

  const toggleEditing = useCallback(() => {
    setIsEditing((prev) => !prev);
    if (isEditing) {
      setPendingCoordinate(null);
    }
  }, [isEditing]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <button
            className="menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="app-title">KB AirMap</h1>
        </div>
        
        <div className="header-right">
          <button
            className={`header-btn ${followAircraft ? 'active' : ''}`}
            onClick={() => setFollowAircraft(!followAircraft)}
            title="항공기 추적"
          >
            <Target size={20} />
          </button>
          <button
            className="header-btn"
            onClick={toggleFullscreen}
            title="전체화면"
          >
            {document.fullscreenElement ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </header>

      {/* Side Menu */}
      <aside className={`side-menu ${isMenuOpen ? 'open' : ''}`}>
        <nav className="menu-nav">
          <button
            className={`menu-item ${showGpsPanel ? 'active' : ''}`}
            onClick={() => setShowGpsPanel(!showGpsPanel)}
          >
            <span className="menu-icon">📡</span>
            <span>GPS 상태</span>
          </button>
          <button
            className={`menu-item ${showFlightPlan ? 'active' : ''}`}
            onClick={() => setShowFlightPlan(!showFlightPlan)}
          >
            <span className="menu-icon">🗺️</span>
            <span>항로계획</span>
          </button>
          <button
            className={`menu-item ${showInstruments ? 'active' : ''}`}
            onClick={() => setShowInstruments(!showInstruments)}
          >
            <span className="menu-icon">🎛️</span>
            <span>비행 계기</span>
          </button>
          <div className="menu-divider" />
          <button
            className="menu-item"
            onClick={() => setShowOfflineManager(true)}
          >
            <span className="menu-icon">💾</span>
            <span>오프라인 지도 관리</span>
          </button>
          <button
            className="menu-item"
            onClick={() => alert('비행 참고자료 기능은 개발 중입니다')}
          >
            <span className="menu-icon">📚</span>
            <span>비행 참고자료</span>
          </button>
          <button
            className="menu-item"
            onClick={() => alert('설정 기능은 개발 중입니다')}
          >
            <span className="menu-icon">⚙️</span>
            <span>설정</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Map View */}
        <div className="map-wrapper">
          <MapView
            gpsData={gpsData}
            flightPlan={flightPlan}
            isEditing={isEditing}
            onMapClick={handleMapClick}
            selectedWaypoint={selectedWaypoint}
            onWaypointSelect={handleSelectWaypoint}
            followAircraft={followAircraft}
          />
          
          {/* Edit Mode Indicator */}
          {isEditing && (
            <div className="edit-mode-indicator">
              <Layers size={18} />
              <span>지도에서 경유지 위치를 선택하세요</span>
              <button onClick={toggleEditing}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Follow Mode Indicator */}
          {followAircraft && (
            <div className="follow-mode-indicator">
              <Target size={14} />
              <span>항공기 추적 중</span>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          {showGpsPanel && (
            <GpsStatus
              gpsData={gpsData}
              aircraftState={aircraftState}
              isTracking={isTracking}
              error={error}
              onStartTracking={startTracking}
              onStopTracking={stopTracking}
            />
          )}
          
          {showFlightPlan && (
            <FlightPlanPanel
              flightPlan={flightPlan}
              onUpdateFlightPlan={handleUpdateFlightPlan}
              onSelectWaypoint={handleSelectWaypoint}
              selectedWaypoint={selectedWaypoint}
              isEditing={isEditing}
              onToggleEditing={toggleEditing}
              pendingCoordinate={pendingCoordinate}
            />
          )}
          
          {showInstruments && (
            <InstrumentPanel aircraftState={aircraftState} />
          )}
        </div>
      </main>

      {/* Offline Map Manager Modal */}
      <OfflineMapManager
        isOpen={showOfflineManager}
        onClose={() => setShowOfflineManager(false)}
      />

      {/* Footer Status Bar */}
      <footer className="status-bar">
        <div className="status-left">
          <span className={`gps-status ${isTracking ? 'active' : ''}`}>
            ● GPS {isTracking ? 'ON' : 'OFF'}
          </span>
          {gpsData && (
            <>
              <span className="status-separator">|</span>
              <span>정확도: {Math.round(gpsData.accuracy)}m</span>
            </>
          )}
        </div>
        <div className="status-right">
          <span>KB AirMap v1.0</span>
          <span className="status-separator">|</span>
          <span>오프라인 모드 지원</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
