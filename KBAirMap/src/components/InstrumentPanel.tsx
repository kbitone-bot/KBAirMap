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

  return (
    <div className="inst-panel">
      {/* Heading */}
      <div className="inst-box">
        <div className="inst-title">방위 HDG</div>
        <svg viewBox="0 0 120 70" className="inst-svg">
          <path d="M10 60 A50 35 0 0 1 110 60" fill="none" stroke="#374151" strokeWidth="1"/>
          <g transform={`translate(60,60) rotate(${-hdg})`}>
            {[0,45,90,135,180,225,270,315].map(deg => {
              const rad = deg * Math.PI / 180;
              const x = Math.sin(rad) * 45;
              const y = -Math.cos(rad) * 30;
              const isCard = deg % 90 === 0;
              return (
                <g key={deg}>
                  <line x1={x*0.7} y1={y*0.7} x2={x} y2={y} 
                    stroke={isCard ? '#f9fafb' : '#6b7280'} strokeWidth={isCard ? 2 : 1}/>
                  {isCard && (
                    <text x={x*0.5} y={y*0.5} textAnchor="middle" 
                      fill={deg===0?'#f97316':'#f9fafb'} fontSize="10" fontWeight="bold">
                      {deg===0?'N':deg===90?'E':deg===180?'S':'W'}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
          <polygon points="60,12 57,22 63,22" fill="#f97316"/>
          <g transform="translate(60,40)">
            <polygon points="0,-8 -5,6 0,4 5,6" fill="#06b6d4"/>
          </g>
        </svg>
        <div className="inst-value">{hdg.toString().padStart(3,'0')}°</div>
      </div>

      {/* Data Grid */}
      <div className="data-grid">
        <div className="data-item">
          <span className="data-label">속도</span>
          <span className="data-value">{spd} <small>KT</small></span>
        </div>
        <div className="data-item">
          <span className="data-label">고도</span>
          <span className="data-value">{alt} <small>FT</small></span>
        </div>
        <div className="data-item">
          <span className="data-label">상승률</span>
          <span className={`data-value ${vsi>0?'up':vsi<0?'down':''}`}>
            {vsi>0?'▲':vsi<0?'▼':'—'} {Math.abs(vsi)} <small>FPM</small>
          </span>
        </div>
      </div>

      {/* GPS */}
      {gpsData && (
        <div className="gps-info">
          <div className="gps-line">
            <span>위도</span>
            <span>{gpsData.latitude.toFixed(5)}°</span>
          </div>
          <div className="gps-line">
            <span>경도</span>
            <span>{gpsData.longitude.toFixed(5)}°</span>
          </div>
          <div className="gps-line">
            <span>정확도</span>
            <span style={{color: gpsData.accuracy<10?'#10b981':'#f59e0b'}}>
              ±{Math.round(gpsData.accuracy)}m
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstrumentPanel;
