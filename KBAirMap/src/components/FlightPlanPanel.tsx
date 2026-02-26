import React, { useState, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Navigation,
  MapPin,
  ChevronUp,
  ChevronDown,
  FileText
} from 'lucide-react';
import type { FlightPlan, Waypoint, LatLng } from '../types';
import { generateId } from '../utils/geo';

interface FlightPlanPanelProps {
  flightPlan: FlightPlan | null;
  onUpdateFlightPlan: (plan: FlightPlan | null) => void;
  onSelectWaypoint: (waypoint: Waypoint | null) => void;
  selectedWaypoint: Waypoint | null;
  isEditing: boolean;
  onToggleEditing: () => void;
  pendingCoordinate: LatLng | null;
}

export const FlightPlanPanel: React.FC<FlightPlanPanelProps> = ({
  flightPlan,
  onUpdateFlightPlan,
  onSelectWaypoint,
  selectedWaypoint,
  isEditing,
  onToggleEditing,
  pendingCoordinate,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingPlanName, setEditingPlanName] = useState(false);
  const [planName, setPlanName] = useState('');
  const [editingWaypoint, setEditingWaypoint] = useState<Waypoint | null>(null);
  const [waypointForm, setWaypointForm] = useState({
    name: '',
    altitude: '',
    note: '',
  });

  const createNewPlan = useCallback(() => {
    const newPlan: FlightPlan = {
      id: generateId(),
      name: '새 항로계획',
      waypoints: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onUpdateFlightPlan(newPlan);
    setPlanName(newPlan.name);
  }, [onUpdateFlightPlan]);

  const savePlanName = useCallback(() => {
    if (flightPlan) {
      onUpdateFlightPlan({
        ...flightPlan,
        name: planName,
        updatedAt: new Date().toISOString(),
      });
    }
    setEditingPlanName(false);
  }, [flightPlan, planName, onUpdateFlightPlan]);

  const addWaypoint = useCallback(() => {
    if (!flightPlan || !pendingCoordinate) return;

    const newWaypoint: Waypoint = {
      id: generateId(),
      name: `WP${flightPlan.waypoints.length + 1}`,
      coordinate: pendingCoordinate,
      altitude: waypointForm.altitude ? parseFloat(waypointForm.altitude) : undefined,
      note: waypointForm.note || undefined,
    };

    onUpdateFlightPlan({
      ...flightPlan,
      waypoints: [...flightPlan.waypoints, newWaypoint],
      updatedAt: new Date().toISOString(),
    });

    setWaypointForm({ name: '', altitude: '', note: '' });
  }, [flightPlan, pendingCoordinate, waypointForm, onUpdateFlightPlan]);

  const updateWaypoint = useCallback(() => {
    if (!flightPlan || !editingWaypoint) return;

    const updatedWaypoints = flightPlan.waypoints.map((wp) =>
      wp.id === editingWaypoint.id
        ? {
            ...wp,
            name: waypointForm.name || wp.name,
            altitude: waypointForm.altitude ? parseFloat(waypointForm.altitude) : wp.altitude,
            note: waypointForm.note || wp.note,
          }
        : wp
    );

    onUpdateFlightPlan({
      ...flightPlan,
      waypoints: updatedWaypoints,
      updatedAt: new Date().toISOString(),
    });

    setEditingWaypoint(null);
    setWaypointForm({ name: '', altitude: '', note: '' });
  }, [flightPlan, editingWaypoint, waypointForm, onUpdateFlightPlan]);

  const deleteWaypoint = useCallback((waypointId: string) => {
    if (!flightPlan) return;

    const updatedWaypoints = flightPlan.waypoints.filter((wp) => wp.id !== waypointId);
    onUpdateFlightPlan({
      ...flightPlan,
      waypoints: updatedWaypoints,
      updatedAt: new Date().toISOString(),
    });

    if (selectedWaypoint?.id === waypointId) {
      onSelectWaypoint(null);
    }
  }, [flightPlan, selectedWaypoint, onUpdateFlightPlan, onSelectWaypoint]);

  const moveWaypoint = useCallback((index: number, direction: 'up' | 'down') => {
    if (!flightPlan) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= flightPlan.waypoints.length) return;

    const waypoints = [...flightPlan.waypoints];
    [waypoints[index], waypoints[newIndex]] = [waypoints[newIndex], waypoints[index]];

    onUpdateFlightPlan({
      ...flightPlan,
      waypoints,
      updatedAt: new Date().toISOString(),
    });
  }, [flightPlan, onUpdateFlightPlan]);

  const startEditWaypoint = useCallback((waypoint: Waypoint) => {
    setEditingWaypoint(waypoint);
    setWaypointForm({
      name: waypoint.name,
      altitude: waypoint.altitude?.toString() || '',
      note: waypoint.note || '',
    });
  }, []);

  const formatCoordinate = (coord: LatLng) => {
    return `${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`;
  };

  return (
    <div className={`flight-plan-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="panel-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="panel-title">
          <Navigation size={18} />
          <span>항로계획</span>
          {flightPlan && (
            <span className="waypoint-count">
              ({flightPlan.waypoints.length} WP)
            </span>
          )}
        </div>
        <button className="panel-toggle">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isExpanded && (
        <div className="panel-content">
          {!flightPlan ? (
            <div className="empty-state">
              <FileText size={48} className="empty-icon" />
              <p>항로계획이 없습니다</p>
              <button className="btn-primary" onClick={createNewPlan}>
                <Plus size={16} />
                새 항로계획 생성
              </button>
            </div>
          ) : (
            <>
              {/* Plan Name */}
              <div className="plan-name-section">
                {editingPlanName ? (
                  <div className="edit-name-form">
                    <input
                      type="text"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      placeholder="항로계획 이름"
                      autoFocus
                    />
                    <button onClick={savePlanName} className="btn-icon">
                      <Save size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingPlanName(false);
                        setPlanName(flightPlan.name);
                      }}
                      className="btn-icon"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="plan-name-display">
                    <span className="plan-name">{flightPlan.name}</span>
                    <button onClick={() => setEditingPlanName(true)} className="btn-icon">
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Edit Mode Toggle */}
              <div className="edit-mode-toggle">
                <button
                  className={`btn-toggle ${isEditing ? 'active' : ''}`}
                  onClick={onToggleEditing}
                >
                  <MapPin size={14} />
                  {isEditing ? '지도에서 선택 중...' : '경유지 추가'}
                </button>
              </div>

              {/* Add Waypoint Form */}
              {isEditing && pendingCoordinate && (
                <div className="waypoint-form">
                  <div className="coordinate-preview">
                    <MapPin size={14} />
                    {formatCoordinate(pendingCoordinate)}
                  </div>
                  <input
                    type="text"
                    placeholder="경유지 이름"
                    value={waypointForm.name}
                    onChange={(e) =>
                      setWaypointForm({ ...waypointForm, name: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    placeholder="고도 (ft)"
                    value={waypointForm.altitude}
                    onChange={(e) =>
                      setWaypointForm({ ...waypointForm, altitude: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="비고"
                    value={waypointForm.note}
                    onChange={(e) =>
                      setWaypointForm({ ...waypointForm, note: e.target.value })
                    }
                  />
                  <div className="form-actions">
                    <button onClick={addWaypoint} className="btn-primary btn-sm">
                      <Plus size={14} />
                      추가
                    </button>
                  </div>
                </div>
              )}

              {/* Waypoints List */}
              <div className="waypoints-list">
                {flightPlan.waypoints.map((waypoint, index) => (
                  <div
                    key={waypoint.id}
                    className={`waypoint-item ${
                      selectedWaypoint?.id === waypoint.id ? 'selected' : ''
                    }`}
                    onClick={() => onSelectWaypoint(waypoint)}
                  >
                    {editingWaypoint?.id === waypoint.id ? (
                      <div className="waypoint-edit-form">
                        <input
                          type="text"
                          value={waypointForm.name}
                          onChange={(e) =>
                            setWaypointForm({ ...waypointForm, name: e.target.value })
                          }
                          placeholder="이름"
                        />
                        <input
                          type="number"
                          value={waypointForm.altitude}
                          onChange={(e) =>
                            setWaypointForm({ ...waypointForm, altitude: e.target.value })
                          }
                          placeholder="고도"
                        />
                        <input
                          type="text"
                          value={waypointForm.note}
                          onChange={(e) =>
                            setWaypointForm({ ...waypointForm, note: e.target.value })
                          }
                          placeholder="비고"
                        />
                        <div className="form-actions">
                          <button onClick={updateWaypoint} className="btn-icon">
                            <Save size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingWaypoint(null);
                              setWaypointForm({ name: '', altitude: '', note: '' });
                            }}
                            className="btn-icon"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="waypoint-number">{index + 1}</div>
                        <div className="waypoint-info">
                          <span className="waypoint-name">{waypoint.name}</span>
                          <span className="waypoint-coord">
                            {formatCoordinate(waypoint.coordinate)}
                          </span>
                          {waypoint.altitude && (
                            <span className="waypoint-altitude">
                              {waypoint.altitude}ft
                            </span>
                          )}
                        </div>
                        <div className="waypoint-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveWaypoint(index, 'up');
                            }}
                            disabled={index === 0}
                            className="btn-icon btn-sm"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveWaypoint(index, 'down');
                            }}
                            disabled={index === flightPlan.waypoints.length - 1}
                            className="btn-icon btn-sm"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditWaypoint(waypoint);
                            }}
                            className="btn-icon btn-sm"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWaypoint(waypoint.id);
                            }}
                            className="btn-icon btn-sm btn-danger"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Delete Plan Button */}
              <div className="panel-footer">
                <button
                  className="btn-danger btn-sm"
                  onClick={() => onUpdateFlightPlan(null)}
                >
                  <Trash2 size={14} />
                  항로계획 삭제
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FlightPlanPanel;
