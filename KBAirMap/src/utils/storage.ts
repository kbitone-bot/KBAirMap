import { Preferences } from '@capacitor/preferences';
import type { FlightPlan, ReferencePoint } from '../types';

const STORAGE_KEYS = {
  FLIGHT_PLANS: 'flight_plans',
  REFERENCE_POINTS: 'reference_points',
  MAP_STATE: 'map_state',
  SETTINGS: 'settings',
  OFFLINE_TILES: 'offline_tiles',
};

export async function saveFlightPlan(plan: FlightPlan): Promise<void> {
  const plans = await getFlightPlans();
  const existingIndex = plans.findIndex((p) => p.id === plan.id);
  
  if (existingIndex >= 0) {
    plans[existingIndex] = plan;
  } else {
    plans.push(plan);
  }
  
  await Preferences.set({
    key: STORAGE_KEYS.FLIGHT_PLANS,
    value: JSON.stringify(plans),
  });
}

export async function getFlightPlans(): Promise<FlightPlan[]> {
  const { value } = await Preferences.get({ key: STORAGE_KEYS.FLIGHT_PLANS });
  return value ? JSON.parse(value) : [];
}

export async function deleteFlightPlan(id: string): Promise<void> {
  const plans = await getFlightPlans();
  const filtered = plans.filter((p) => p.id !== id);
  await Preferences.set({
    key: STORAGE_KEYS.FLIGHT_PLANS,
    value: JSON.stringify(filtered),
  });
}

export async function saveReferencePoint(point: ReferencePoint): Promise<void> {
  const points = await getReferencePoints();
  const existingIndex = points.findIndex((p) => p.id === point.id);
  
  if (existingIndex >= 0) {
    points[existingIndex] = point;
  } else {
    points.push(point);
  }
  
  await Preferences.set({
    key: STORAGE_KEYS.REFERENCE_POINTS,
    value: JSON.stringify(points),
  });
}

export async function getReferencePoints(): Promise<ReferencePoint[]> {
  const { value } = await Preferences.get({ key: STORAGE_KEYS.REFERENCE_POINTS });
  return value ? JSON.parse(value) : [];
}

export async function deleteReferencePoint(id: string): Promise<void> {
  const points = await getReferencePoints();
  const filtered = points.filter((p) => p.id !== id);
  await Preferences.set({
    key: STORAGE_KEYS.REFERENCE_POINTS,
    value: JSON.stringify(filtered),
  });
}

export async function saveMapState(state: {
  center: { lat: number; lng: number };
  zoom: number;
  bearing: number;
}): Promise<void> {
  await Preferences.set({
    key: STORAGE_KEYS.MAP_STATE,
    value: JSON.stringify(state),
  });
}

export async function getMapState(): Promise<{
  center: { lat: number; lng: number };
  zoom: number;
  bearing: number;
} | null> {
  const { value } = await Preferences.get({ key: STORAGE_KEYS.MAP_STATE });
  return value ? JSON.parse(value) : null;
}

export async function saveSettings(settings: Record<string, any>): Promise<void> {
  await Preferences.set({
    key: STORAGE_KEYS.SETTINGS,
    value: JSON.stringify(settings),
  });
}

export async function getSettings(): Promise<Record<string, any>> {
  const { value } = await Preferences.get({ key: STORAGE_KEYS.SETTINGS });
  return value ? JSON.parse(value) : {};
}

export async function clearAllData(): Promise<void> {
  await Preferences.clear();
}
