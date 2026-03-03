import type { GpsData, AircraftState } from '../types';
import '../styles/InstrumentPanel.css';

interface Props {
  aircraftState: AircraftState | null;
  gpsData: GpsData | null;
}

export function InstrumentPanel({ aircraftState, gpsData }: Props) {
  const hdg = Math.round(aircraftState?.heading ?? 0);
  const spd = Math.round((aircraftState?.speed ?? 0) * 1.94384);
  const alt = Math.round((aircraftState?.altitude ?? 0) * 3.28084);
  const vsi = Math.round(aircraftState?.verticalSpeed ?? 0);

  // EFB 스타일: 큰 디지털 수치 + HUD 느낌
  return (
    <div className="inst-panel">
      {/* Title */}
      <div className="panel-title">EFB INSTRUMENTS</div>
      
      {/* Primary Flight Display Style */}
      <div className="pfd-container">
        {/* HDG - 방위 */}
        <div className="instr-primary">
          <div className="instr-label">HDG</div>
          <div className="instr-value hdg">
            {hdg.toString().padStart(3, '0')}°
          </div>
          <div className="instr-sub">MAG</div>
        </div>

        {/* SPD - 속도 */}
        <div className="instr-primary">
          <div className="instr-label">SPD</div>
          <div className="instr-value spd">
            {spd}
          </div>
          <div className="instr-sub">KT</div>
        </div>

        {/* ALT - 고도 */}
        <div className="instr-primary">
          <div className="instr-label">ALT</div>
          <div className="instr-value alt">
            {alt.toLocaleString()}
          </div>
          <div className="instr-sub">FT</div>
        </div>

        {/* VSI - 상승률 */}
        <div className="instr-primary">
          <div className="instr-label">VSI</div>
          <div className={`instr-value vsi ${vsi > 0 ? 'up' : vsi < 0 ? 'down' : ''}`}>
            {vsi > 0 ? '+' : ''}{vsi}
          </div>
          <div className="instr-sub">FPM</div>
        </div>
      </div>

      {/* Tape Display - 방위 테이프 */}
      <div className="tape-section">
        <div className="tape-label">HEADING</div>
        <div className="heading-tape">
          <div className="tape-scale" style={{ transform: `translateX(${-hdg * 2}px)` }}>
            {Array.from({ length: 72 }, (_, i) => {
              const deg = i * 5;
              return (
                <div key={deg} className={`tape-mark ${deg % 90 === 0 ? 'major' : deg % 30 === 0 ? 'minor' : ''}`}>
                  {deg % 30 === 0 && <span className="tape-num">{deg}</span>}
                </div>
              );
            })}
          </div>
          <div className="tape-pointer">▼</div>
        </div>
      </div>

      {/* GPS Data */}
      {gpsData && (
        <div className="gps-section">
          <div className="section-title">GPS DATA</div>
          <div className="gps-grid">
            <div className="gps-item">
              <span className="gps-label">LAT</span>
              <span className="gps-value">{gpsData.latitude.toFixed(6)}°</span>
            </div>
            <div className="gps-item">
              <span className="gps-label">LON</span>
              <span className="gps-value">{gpsData.longitude.toFixed(6)}°</span>
            </div>
            <div className="gps-item">
              <span className="gps-label">ACC</span>
              <span className={`gps-value ${gpsData.accuracy < 10 ? 'good' : gpsData.accuracy < 30 ? 'fair' : 'poor'}`}>
                ±{Math.round(gpsData.accuracy)}m
              </span>
            </div>
            <div className="gps-item">
              <span className="gps-label">TIME</span>
              <span className="gps-value">
                {new Date(gpsData.timestamp).toLocaleTimeString('ko-KR', { hour12: false })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstrumentPanel;
