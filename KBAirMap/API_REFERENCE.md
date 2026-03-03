# KB AirMap - API Reference

> 컴포넌트, Hook, 유틸리티 함수 상세 문서

---

## Table of Contents
- [Components](#components)
- [Hooks](#hooks)
- [Utilities](#utilities)
- [Types](#types)

---

## Components

### MapView

지도 렌더링 및 항공기/경유지 시각화 컴포넌트

```typescript
import MapView from './components/MapView';

<MapView
  gpsData={gpsData}
  flightPlan={flightPlan}
  isEditing={false}
  onMapClick={handleMapClick}
  selectedWaypoint={selectedWaypoint}
  onWaypointSelect={handleWaypointSelect}
  followAircraft={true}
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `gpsData` | `GpsData \| null` | No | 현재 GPS 데이터 |
| `flightPlan` | `FlightPlan \| null` | No | 표시할 항로계획 |
| `isEditing` | `boolean` | No | 경유지 추가 모드 활성화 |
| `onMapClick` | `(coord: LatLng) => void` | No | 지도 클릭 콜백 |
| `selectedWaypoint` | `Waypoint \| null` | No | 선택된 경유지 |
| `onWaypointSelect` | `(wp: Waypoint \| null) => void` | No | 경유지 선택 콜백 |
| `followAircraft` | `boolean` | No | 항공기 추적 모드 |

---

### FlightPlanPanel

항로계획 관리 UI 컴포넌트

```typescript
import FlightPlanPanel from './components/FlightPlanPanel';

<FlightPlanPanel
  flightPlan={flightPlan}
  onUpdateFlightPlan={handleUpdate}
  onSelectWaypoint={handleSelect}
  selectedWaypoint={selectedWaypoint}
  isEditing={isEditing}
  onToggleEditing={toggleEdit}
  pendingCoordinate={pendingCoord}
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `flightPlan` | `FlightPlan \| null` | Yes | 현재 항로계획 |
| `onUpdateFlightPlan` | `(plan: FlightPlan \| null) => void` | Yes | 항로계획 업데이트 콜백 |
| `onSelectWaypoint` | `(wp: Waypoint \| null) => void` | Yes | 경유지 선택 콜백 |
| `selectedWaypoint` | `Waypoint \| null` | Yes | 선택된 경유지 |
| `isEditing` | `boolean` | Yes | 편집 모드 상태 |
| `onToggleEditing` | `() => void` | Yes | 편집 모드 토글 |
| `pendingCoordinate` | `LatLng \| null` | Yes | 대기 중인 좌표 |

---

### GpsStatus

GPS 상태 표시 컴포넌트

```typescript
import GpsStatus from './components/GpsStatus';

<GpsStatus
  gpsData={gpsData}
  aircraftState={aircraftState}
  isTracking={isTracking}
  error={error}
  onStartTracking={startTracking}
  onStopTracking={stopTracking}
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `gpsData` | `GpsData \| null` | Yes | GPS 원시 데이터 |
| `aircraftState` | `AircraftState \| null` | Yes | 계산된 항공 상태 |
| `isTracking` | `boolean` | Yes | 추적 중 여부 |
| `error` | `string \| null` | Yes | 에러 메시지 |
| `onStartTracking` | `() => void` | Yes | 추적 시작 핸들러 |
| `onStopTracking` | `() => void` | Yes | 추적 중지 핸들러 |

---

### InstrumentPanel

비행 계기 시뮬레이션 컴포넌트

```typescript
import InstrumentPanel from './components/InstrumentPanel';

<InstrumentPanel aircraftState={aircraftState} />
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `aircraftState` | `AircraftState \| null` | Yes | 항공 상태 데이터 |

---

### OfflineMapManager

오프라인 지도 관리 모달

```typescript
import OfflineMapManager from './components/OfflineMapManager';

<OfflineMapManager
  isOpen={showModal}
  onClose={() => setShowModal(false)}
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | 모달 표시 여부 |
| `onClose` | `() => void` | Yes | 닫기 콜백 |

---

## Hooks

### useGps

GPS 센서 데이터 수집 및 상태 관리

```typescript
import { useGps } from './hooks/useGps';

const {
  gpsData,
  aircraftState,
  isTracking,
  error,
  startTracking,
  stopTracking,
  getCurrentPosition
} = useGps();
```

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `gpsData` | `GpsData \| null` | 원시 GPS 데이터 |
| `aircraftState` | `AircraftState \| null` | 계산된 항공 상태 |
| `isTracking` | `boolean` | 위치 추적 중 여부 |
| `error` | `string \| null` | 에러 메시지 |
| `startTracking` | `() => Promise<void>` | 추적 시작 |
| `stopTracking` | `() => Promise<void>` | 추적 중지 |
| `getCurrentPosition` | `() => Promise<GpsData \| null>` | 현재 위치 한번 가져오기 |

#### Example

```typescript
function GpsComponent() {
  const { gpsData, isTracking, error, startTracking } = useGps();
  
  useEffect(() => {
    startTracking();
  }, []);
  
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <p>Latitude: {gpsData?.latitude}</p>
      <p>Longitude: {gpsData?.longitude}</p>
    </div>
  );
}
```

---

## Utilities

### geo.ts

지리 계산 유틸리티

#### calculateDistance

두 좌표 간 거리 계산 (Haversine 공식)

```typescript
import { calculateDistance } from './utils/geo';

const distance = calculateDistance(
  { lat: 37.5665, lng: 126.9780 },  // 서울
  { lat: 35.1796, lng: 129.0756 }   // 부산
);
// Returns: distance in meters (number)
```

**Parameters**
- `point1: LatLng` - 시작 좌표
- `point2: LatLng` - 종료 좌표

**Returns**: `number` - 거리 (미터)

---

#### calculateBearing

두 좌표 간 방위각 계산

```typescript
import { calculateBearing } from './utils/geo';

const bearing = calculateBearing(
  { lat: 37.5665, lng: 126.9780 },
  { lat: 35.1796, lng: 129.0756 }
);
// Returns: 135 (degrees from North)
```

**Parameters**
- `from: LatLng` - 시작 좌표
- `to: LatLng` - 종료 좌표

**Returns**: `number` - 방위각 (0-360°, 북쪽 기준)

---

#### formatCoordinate

좌표를 DMS 형식으로 변환

```typescript
import { formatCoordinate } from './utils/geo';

const coord = formatCoordinate(37.5665, 126.9780);
// Returns: "37°33'59.4"N 126°58'40.8"E"
```

---

#### formatAltitude

고도 포맷팅 (m → ft)

```typescript
import { formatAltitude } from './utils/geo';

formatAltitude(1000);   // Returns: "3281ft"
formatAltitude(null);   // Returns: "---"
```

---

#### formatSpeed

속도 포맷팅 (m/s → knots)

```typescript
import { formatSpeed } from './utils/geo';

formatSpeed(51.44);     // Returns: "100kt" (약 100노트)
formatSpeed(null);      // Returns: "---"
```

---

#### formatHeading

방위각 포맷팅

```typescript
import { formatHeading } from './utils/geo';

formatHeading(90);      // Returns: "090°"
formatHeading(null);    // Returns: "---"
```

---

#### generateId

고유 ID 생성

```typescript
import { generateId } from './utils/geo';

const id = generateId();
// Returns: "1709025600000-abc123def"
```

---

### storage.ts

로컬 데이터 저장소

#### saveFlightPlan

항로계획 저장

```typescript
import { saveFlightPlan } from './utils/storage';

await saveFlightPlan({
  id: 'plan-123',
  name: '인천-제주',
  waypoints: [...],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
```

---

#### getFlightPlans

저장된 항로계획 목록 조회

```typescript
import { getFlightPlans } from './utils/storage';

const plans = await getFlightPlans();
// Returns: FlightPlan[]
```

---

#### deleteFlightPlan

항로계획 삭제

```typescript
import { deleteFlightPlan } from './utils/storage';

await deleteFlightPlan('plan-123');
```

---

#### saveMapState

지도 상태 저장

```typescript
import { saveMapState } from './utils/storage';

await saveMapState({
  center: { lat: 37.5665, lng: 126.9780 },
  zoom: 10,
  bearing: 0
});
```

---

#### getMapState

저장된 지도 상태 조회

```typescript
import { getMapState } from './utils/storage';

const state = await getMapState();
// Returns: { center: {lat, lng}, zoom: number, bearing: number } | null
```

---

## Types

### LatLng

위도/경도 좌표

```typescript
interface LatLng {
  lat: number;  // 위도 (-90 ~ 90)
  lng: number;  // 경도 (-180 ~ 180)
}
```

---

### Waypoint

항로 경유지

```typescript
interface Waypoint {
  id: string;           // 고유 ID
  name: string;         // 경유지명
  coordinate: LatLng;   // 좌표
  altitude?: number;    // 고도 (ft, 선택)
  note?: string;        // 비고 (선택)
}
```

---

### FlightPlan

항로계획

```typescript
interface FlightPlan {
  id: string;           // 고유 ID
  name: string;         // 계획명
  waypoints: Waypoint[]; // 경유지 목록
  createdAt: string;    // 생성일 (ISO 8601)
  updatedAt: string;    // 수정일 (ISO 8601)
}
```

---

### GpsData

GPS 원시 데이터

```typescript
interface GpsData {
  latitude: number;     // 위도
  longitude: number;    // 경도
  altitude: number | null;    // 고도 (m)
  accuracy: number;     // 정확도 (m)
  heading: number | null;     // 방위 (0-360°)
  speed: number | null;       // 속도 (m/s)
  timestamp: number;    // 타임스탬프 (ms)
}
```

---

### AircraftState

계산된 항공 상태

```typescript
interface AircraftState {
  position: LatLng;     // 위치
  altitude: number;     // 고도 (m)
  heading: number;      // 방위 (0-360°)
  speed: number;        // 속도 (m/s)
  verticalSpeed: number; // 상승/하강률 (ft/min)
  timestamp: number;    // 타임스탬프 (ms)
}
```

---

### ReferencePoint

참조점 (VOR, NDB, 공항 등)

```typescript
interface ReferencePoint {
  id: string;
  name: string;
  coordinate: LatLng;
  type: 'waypoint' | 'airport' | 'vor' | 'ndb' | 'user';
  frequency?: string;
  description?: string;
}
```

---

### MapState

지도 상태

```typescript
interface MapState {
  center: LatLng;       // 중심 좌표
  zoom: number;         // 줌 레벨
  bearing: number;      // 회전 각도
  pitch: number;        // 기울기
}
```

---

**문서 끝**
