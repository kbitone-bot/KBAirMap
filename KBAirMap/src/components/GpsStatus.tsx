import React from 'react';
import { Satellite, Navigation, Wind, Gauge, AlertCircle } from 'lucide-react';
import type { GpsData, AircraftState } from '../types';
import { formatAltitude, formatSpeed, formatHeading, formatCoordinate } from '../utils/geo';

interface GpsStatusProps {
  gpsData: GpsData | null;
  aircraftState: AircraftState | null;
  isTracking: boolean;
  error: string | null;
  onStartTracking: () => void;
  onStopTracking: () => void;
}

export const GpsStatus: React.FC<GpsStatusProps> = ({
  gpsData,
  aircraftState,
  isTracking,
  error,
  onStartTracking,
  onStopTracking,
}) => {
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy < 10) return '#00ff88';
    if (accuracy < 50) return '#ffcc00';
    return '#ff4444';
  };

  const getAccuracyText = (accuracy: number) => {
    if (accuracy < 10) return '우수';
    if (accuracy < 50) return '보통';
    return '미흡';
  };

  return (
    <div className="gps-status-panel">
      <div className="gps-header">
        <div className="gps-title">
          <Satellite size={18} className={isTracking ? 'pulsing' : ''} />
          <span>GPS 상태</span>
        </div>
        <button
          className={`gps-toggle ${isTracking ? 'active' : ''}`}
          onClick={isTracking ? onStopTracking : onStartTracking}
        >
          {isTracking ? '추적 중지' : '추적 시작'}
        </button>
      </div>

      {error && (
        <div className="gps-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {gpsData ? (
        <div className="gps-data">
          {/* Position */}
          <div className="gps-section">
            <div className="gps-label">
              <Navigation size={14} />
              위치
            </div>
            <div className="gps-value coordinate">
              {formatCoordinate(gpsData.latitude, gpsData.longitude)}
            </div>
          </div>

          {/* Primary Data Grid */}
          <div className="gps-grid">
            <div className="gps-item">
              <div className="gps-label">
                <Gauge size={14} />
                고도
              </div>
              <div className="gps-value">{formatAltitude(gpsData.altitude)}</div>
            </div>

            <div className="gps-item">
              <div className="gps-label">
                <Wind size={14} />
                속도
              </div>
              <div className="gps-value">{formatSpeed(gpsData.speed)}</div>
            </div>

            <div className="gps-item">
              <div className="gps-label">
                <Navigation size={14} />
                방위
              </div>
              <div className="gps-value">{formatHeading(gpsData.heading)}</div>
            </div>

            <div className="gps-item">
              <div className="gps-label">정확도</div>
              <div
                className="gps-value"
                style={{ color: getAccuracyColor(gpsData.accuracy) }}
              >
                {Math.round(gpsData.accuracy)}m
                <span className="accuracy-text">
                  ({getAccuracyText(gpsData.accuracy)})
                </span>
              </div>
            </div>
          </div>

          {/* Vertical Speed */}
          {aircraftState && (
            <div className="gps-section">
              <div className="gps-label">상승/하강률</div>
              <div
                className={`gps-value vertical-speed ${
                  aircraftState.verticalSpeed > 0
                    ? 'climbing'
                    : aircraftState.verticalSpeed < 0
                    ? 'descending'
                    : ''
                }`}
              >
                {aircraftState.verticalSpeed > 0 ? '↑' : aircraftState.verticalSpeed < 0 ? '↓' : '→'}
                {Math.abs(Math.round(aircraftState.verticalSpeed))} ft/min
              </div>
            </div>
          )}

          {/* Signal Status */}
          <div className="gps-signal">
            <div className="signal-bars">
              {[1, 2, 3, 4, 5].map((bar) => (
                <div
                  key={bar}
                  className={`signal-bar ${
                    isTracking && gpsData.accuracy < bar * 20 ? 'active' : ''
                  }`}
                />
              ))}
            </div>
            <span className="signal-text">
              {isTracking ? 'GPS 신호 수신 중' : 'GPS 추적 중지됨'}
            </span>
          </div>
        </div>
      ) : (
        <div className="gps-empty">
          <Satellite size={32} />
          <p>GPS 데이터 없음</p>
          <button className="btn-primary" onClick={onStartTracking}>
            GPS 추적 시작
          </button>
        </div>
      )}
    </div>
  );
};

export default GpsStatus;
