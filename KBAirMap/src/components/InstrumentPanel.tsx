import React from 'react';
import { Compass, Gauge, ArrowUp, Wind } from 'lucide-react';
import type { AircraftState } from '../types';
import { formatAltitude, formatSpeed, formatHeading } from '../utils/geo';

interface InstrumentPanelProps {
  aircraftState: AircraftState | null;
}

export const InstrumentPanel: React.FC<InstrumentPanelProps> = ({ aircraftState }) => {
  const heading = aircraftState?.heading || 0;
  const speed = aircraftState?.speed || 0;
  const altitude = aircraftState?.altitude || 0;
  const verticalSpeed = aircraftState?.verticalSpeed || 0;

  // Convert m/s to knots
  const speedKnots = Math.round(speed * 1.94384);
  // Convert meters to feet
  const altitudeFeet = Math.round(altitude * 3.28084);

  return (
    <div className="instrument-panel">
      <div className="instrument-title">
        <Compass size={16} />
        <span>비행 계기</span>
      </div>

      <div className="instruments-grid">
        {/* Heading Indicator (HSI Style) */}
        <div className="instrument">
          <div className="instrument-label">방위 (HDG)</div>
          <div className="heading-indicator">
            <svg viewBox="0 0 100 60" className="heading-svg">
              {/* Compass card */}
              <g transform={`translate(50, 50)`}>
                {/* Tick marks */}
                {Array.from({ length: 72 }).map((_, i) => {
                  const angle = (i * 5 - heading) * (Math.PI / 180);
                  const isMajor = i % 9 === 0; // Every 45 degrees
                  const length = isMajor ? 12 : 6;
                  const r1 = 35;
                  const r2 = r1 - length;
                  
                  const x1 = Math.sin(angle) * r1;
                  const y1 = -Math.cos(angle) * r1;
                  const x2 = Math.sin(angle) * r2;
                  const y2 = -Math.cos(angle) * r2;
                  
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isMajor ? '#fff' : '#666'}
                      strokeWidth={isMajor ? 2 : 1}
                    />
                  );
                })}
                
                {/* Cardinal directions */}
                {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map((dir, i) => {
                  const angle = (i * 45 - heading) * (Math.PI / 180);
                  const r = 22;
                  const x = Math.sin(angle) * r;
                  const y = -Math.cos(angle) * r;
                  
                  return (
                    <text
                      key={dir}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={dir === 'N' ? '#ff6b00' : '#fff'}
                      fontSize={dir === 'N' ? 10 : 8}
                      fontWeight={dir === 'N' ? 'bold' : 'normal'}
                    >
                      {dir}
                    </text>
                  );
                })}
              </g>
              
              {/* Aircraft symbol (fixed) */}
              <g transform="translate(50, 50)">
                <polygon
                  points="0,-15 -8,8 0,5 8,8"
                  fill="#00d4ff"
                  stroke="#fff"
                  strokeWidth="1"
                />
              </g>
              
              {/* Lubber line */}
              <line x1="50" y1="10" x2="50" y2="20" stroke="#ff6b00" strokeWidth="2" />
            </svg>
            <div className="heading-value">{formatHeading(heading)}</div>
          </div>
        </div>

        {/* Airspeed Indicator */}
        <div className="instrument">
          <div className="instrument-label">
            <Wind size={14} />
            속도 (SPD)
          </div>
          <div className="speed-indicator">
            <svg viewBox="0 0 60 100" className="speed-svg">
              {/* Speed tape background */}
              <rect x="0" y="0" width="60" height="100" fill="#1a2332" rx="4" />
              
              {/* Speed scale */}
              <g transform={`translate(0, ${50 - (speedKnots % 20) * 2})`}>
                {Array.from({ length: 20 }).map((_, i) => {
                  const speedValue = Math.floor(speedKnots / 20) * 20 + (i - 10) * 20;
                  if (speedValue < 0) return null;
                  
                  const y = 50 + i * 20;
                  
                  return (
                    <g key={i}>
                      <line x1="35" y1={y} x2="45" y2={y} stroke="#666" strokeWidth="1" />
                      <text x="30" y={y} textAnchor="end" dominantBaseline="middle" fill="#fff" fontSize="8">
                        {speedValue}
                      </text>
                    </g>
                  );
                })}
              </g>
              
              {/* Speed bug */}
              <polygon points="35,48 45,50 35,52" fill="#ff6b00" />
              
              {/* Current speed box */}
              <rect x="10" y="42" width="25" height="16" fill="#000" stroke="#00d4ff" strokeWidth="2" rx="2" />
              <text x="22" y="53" textAnchor="middle" dominantBaseline="middle" fill="#00d4ff" fontSize="10" fontWeight="bold">
                {speedKnots}
              </text>
            </svg>
            <div className="speed-value">{formatSpeed(speed)}</div>
          </div>
        </div>

        {/* Altitude Indicator */}
        <div className="instrument">
          <div className="instrument-label">
            <Gauge size={14} />
            고도 (ALT)
          </div>
          <div className="altitude-indicator">
            <svg viewBox="0 0 60 100" className="altitude-svg">
              {/* Altitude tape background */}
              <rect x="0" y="0" width="60" height="100" fill="#1a2332" rx="4" />
              
              {/* Altitude scale */}
              <g transform={`translate(0, ${50 - (altitudeFeet % 100) / 5})`}>
                {Array.from({ length: 15 }).map((_, i) => {
                  const altValue = Math.floor(altitudeFeet / 100) * 100 + (i - 7) * 100;
                  
                  const y = 50 + i * 20;
                  
                  return (
                    <g key={i}>
                      <line x1="15" y1={y} x2="25" y2={y} stroke="#666" strokeWidth="1" />
                      <text x="30" y={y} textAnchor="start" dominantBaseline="middle" fill="#fff" fontSize="8">
                        {Math.abs(altValue)}
                      </text>
                    </g>
                  );
                })}
              </g>
              
              {/* Altitude bug */}
              <polygon points="25,48 15,50 25,52" fill="#ff6b00" />
              
              {/* Current altitude box */}
              <rect x="25" y="42" width="30" height="16" fill="#000" stroke="#00d4ff" strokeWidth="2" rx="2" />
              <text x="40" y="53" textAnchor="middle" dominantBaseline="middle" fill="#00d4ff" fontSize="10" fontWeight="bold">
                {altitudeFeet}
              </text>
            </svg>
            <div className="altitude-value">{formatAltitude(altitude)}</div>
          </div>
        </div>

        {/* Vertical Speed Indicator */}
        <div className="instrument">
          <div className="instrument-label">
            <ArrowUp size={14} />
            상승률 (VSI)
          </div>
          <div className="vsi-indicator">
            <svg viewBox="0 0 40 100" className="vsi-svg">
              {/* VSI background */}
              <rect x="0" y="0" width="40" height="100" fill="#1a2332" rx="4" />
              
              {/* Center line */}
              <line x1="5" y1="50" x2="35" y2="50" stroke="#666" strokeWidth="1" />
              
              {/* Scale marks */}
              {[1, 2, 3].map((i) => (
                <g key={i}>
                  <line x1="15" y1={50 - i * 15} x2="25" y2={50 - i * 15} stroke="#666" strokeWidth="1" />
                  <line x1="15" y1={50 + i * 15} x2="25" y2={50 + i * 15} stroke="#666" strokeWidth="1" />
                </g>
              ))}
              
              {/* Needle */}
              <g transform={`translate(20, 50) rotate(${Math.max(-45, Math.min(45, verticalSpeed / 10))})`}>
                <line x1="0" y1="0" x2="0" y2="-25" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" />
                <circle cx="0" cy="0" r="3" fill="#00ff88" />
              </g>
              
              {/* Labels */}
              <text x="35" y="20" textAnchor="end" fill="#666" fontSize="6">+2000</text>
              <text x="35" y="35" textAnchor="end" fill="#666" fontSize="6">+1000</text>
              <text x="35" y="85" textAnchor="end" fill="#666" fontSize="6">-1000</text>
              <text x="35" y="95" textAnchor="end" fill="#666" fontSize="6">-2000</text>
            </svg>
            <div className="vsi-value">
              {Math.round(verticalSpeed)} <span>ft/min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstrumentPanel;
