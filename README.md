# 버전 0.9 화면예시
<img width="1790" height="1013" alt="image" src="https://github.com/user-attachments/assets/f1abcd5b-629d-4d18-a0cd-02e1d40fb37b" />
 - 완성도 80%
 - 실제지도 탑재필요
 - GPS 테스트 필요
 - 부가 기능 및 UI 개선필요
 - PDF 파일 업데이트 기능 개선필요


# KB AirMap - 개발자 가이드

> 항공로 지도 및 비행 계획 Android 애플리케이션
> 
> **버전**: 1.0.0  
> **최종 업데이트**: 2026-02-26

---

## 📌 프로젝트 개요

### 목적
- **단말기 내 항공로 지도 열림**: 조종사가 태블릿으로 항공로를 확인
- **전자지도 및 비행 참고자료 탑재**: 디지털 비행 정보 제공
- **좌표 이용 참조점 설정 및 항로 작성**: 경유지 기반 항로계획 수립
- **비행 중 실시간 정보 전시**: GPS 기반 위치, 방위, 속도, 고도 표시

### 타겟 환경
- **디바이스**: Android 16 (API 36) 태블릿
- **화면 방향**: 가로형(Landscape) 고정
- **네트워크**: 오프라인 환경 지원 필수

---

## 🏗️ 기술 아키텍처

### 프론트엔드 스택
```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
├─────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript                                       │
│  ├── MapLibre GL JS (지도 렌더링)                           │
│  ├── Lucide React (아이콘)                                  │
│  └── CSS3 (스타일링)                                        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Native Bridge Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Capacitor 6                                                 │
│  ├── @capacitor/geolocation (GPS)                           │
│  ├── @capacitor/filesystem (파일 저장)                      │
│  └── @capacitor/preferences (설정 저장)                     │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Android Native                          │
├─────────────────────────────────────────────────────────────┤
│  Android 16 (API 36)                                         │
│  └── WebView (Chromium 기반)                                │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 흐름
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   GPS硬件     │────▶│  useGps Hook │────▶│  Components  │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                       ┌──────────────┐          │
                       │   Storage    │◀─────────┘
                       │ (Preferences)│
                       └──────────────┘
```

---

## 📁 프로젝트 구조

```
KBAirMap/
├── android/                          # Android 네이티브 프로젝트
│   ├── app/src/main/
│   │   ├── AndroidManifest.xml       # 권한 선언
│   │   └── assets/public/            # 웹 리소스 (빌드시 복사)
│   └── build.gradle                  # 빌드 설정
├── src/
│   ├── components/                   # React 컴포넌트
│   │   ├── MapView.tsx              # 핵심 지도 컴포넌트
│   │   ├── FlightPlanPanel.tsx      # 항로계획 UI
│   │   ├── GpsStatus.tsx            # GPS 상태 표시
│   │   ├── InstrumentPanel.tsx      # 비행 계기 패널
│   │   └── OfflineMapManager.tsx    # 오프라인 지도 관리
│   ├── hooks/
│   │   └── useGps.ts                # GPS 상태 관리 Hook
│   ├── utils/
│   │   ├── geo.ts                   # 지리 계산 유틸리티
│   │   └── storage.ts               # 로컬 저장소 API
│   ├── types/
│   │   └── index.ts                 # TypeScript 타입 정의
│   ├── App.tsx                      # 메인 앱 컴포넌트
│   ├── App.css                      # 앱 스타일
│   ├── main.tsx                     # React 진입점
│   └── index.css                    # 글로벌 스타일
├── public/
│   ├── manifest.json                # PWA 매니페스트
│   └── aircraft-icon.svg            # 앱 아이콘
├── index.html                       # HTML 템플릿
├── vite.config.ts                   # Vite + PWA 설정
├── capacitor.config.ts              # Capacitor 설정
├── package.json                     # 의존성
└── README.md                        # 사용자 매뉴얼
```

---

## 🔧 핵심 모듈 상세 설명

### 1. MapView (`src/components/MapView.tsx`)

**역할**: 지도 렌더링 및 항공기/경유지 시각화

**주요 기능**:
- MapLibre GL JS 초기화
- 항공기 마커 (SVG 기반, 방위 회전)
- 경유지 마커 및 라벨
- 항로 라인 (점선 스타일)
- 지도 클릭 이벤트 처리

**스타일 설정**:
```typescript
// 오프라인 폰백 스타일
const OFFLINE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  name: 'Offline',
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#1a2332' } }]
};

// 온라인 타일 스타일
const AVIATION_STYLE = {
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: ['https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256
    }
  }
};
```

**Props Interface**:
```typescript
interface MapViewProps {
  gpsData: GpsData | null;           // 현재 GPS 데이터
  flightPlan: FlightPlan | null;    // 항로계획
  isEditing: boolean;               // 경유지 추가 모드
  onMapClick?: (coordinate: LatLng) => void;
  selectedWaypoint: Waypoint | null;
  onWaypointSelect?: (waypoint: Waypoint | null) => void;
  followAircraft?: boolean;         // 항공기 추적 모드
}
```

---

### 2. useGps Hook (`src/hooks/useGps.ts`)

**역할**: GPS 센서 데이터 수집 및 상태 관리

**주요 기능**:
- Capacitor Geolocation API 래핑
- 실시간 위치 추적 (watchPosition)
- 항공 상태 계산 (고도→수직속도)
- 권한 체크 및 요청

**반환 데이터**:
```typescript
{
  gpsData: GpsData | null;          // 원시 GPS 데이터
  aircraftState: AircraftState | null;  // 계산된 항공 상태
  isTracking: boolean;              // 추적 중 여부
  error: string | null;             // 에러 메시지
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  getCurrentPosition: () => Promise<GpsData | null>;
}
```

**AircraftState 구조**:
```typescript
interface AircraftState {
  position: LatLng;      // 위도/경도
  altitude: number;      // 고도 (m)
  heading: number;       // 방위 (0-360°)
  speed: number;         // 속도 (m/s)
  verticalSpeed: number; // 상승/하강률 (ft/min)
  timestamp: number;     // Unix timestamp (ms)
}
```

---

### 3. FlightPlanPanel (`src/components/FlightPlanPanel.tsx`)

**역할**: 항로계획 CRUD UI

**주요 기능**:
- 항로계획 생성/삭제
- 경유지 추가/수정/삭제
- 경유지 순서 변경 (드래그 대체)
- 좌표 입력 및 고도 설정

**데이터 흐름**:
```
사용자 클릭 → onMapClick → pendingCoordinate → 
폼 입력 → addWaypoint → flightPlan.waypoints 업데이트 → 
Storage 저장
```

---

### 4. InstrumentPanel (`src/components/InstrumentPanel.tsx`)

**역할**: 항공 계기 시뮬레이션

**구성 계기**:
1. **HSI (Heading Indicator)**: 방위각 표시 (360° 나침반)
2. **Airspeed Indicator**: 속도 테이프 (노트 단위)
3. **Altimeter**: 고도 테이프 (피트 단위)
4. **VSI (Vertical Speed)**: 상승/하강률 (바늘식)

**단위 변환**:
```typescript
// m/s → knots
const speedKnots = speed * 1.94384;

// m → feet
const altitudeFeet = altitude * 3.28084;
```

---

### 5. Storage (`src/utils/storage.ts`)

**역할**: 로컬 데이터 영속화

**저장 메커니즘**: Capacitor Preferences (Key-Value)

**저장 항목**:
| 키 | 데이터 | 설명 |
|----|--------|------|
| `flight_plans` | FlightPlan[] | 항로계획 목록 |
| `reference_points` | ReferencePoint[] | 사용자 정의 참조점 |
| `map_state` | {center, zoom, bearing} | 마지막 지도 상태 |
| `settings` | object | 사용자 설정 |

**주의**: Preferences는 비동기 API이며 대용량 데이터에는 부적합

---

## 📊 타입 정의

### 핵심 타입 (`src/types/index.ts`)

```typescript
// 좌표
interface LatLng {
  lat: number;  // 위도 (-90 ~ 90)
  lng: number;  // 경도 (-180 ~ 180)
}

// 경유지
interface Waypoint {
  id: string;
  name: string;
  coordinate: LatLng;
  altitude?: number;  // ft
  note?: string;
}

// 항로계획
interface FlightPlan {
  id: string;
  name: string;
  waypoints: Waypoint[];
  createdAt: string;  // ISO 8601
  updatedAt: string;
}

// GPS 원시 데이터
interface GpsData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;    // meters
  heading: number | null;  // degrees
  speed: number | null;    // m/s
  timestamp: number;
}
```

---

## 🚀 빌드 및 배포

### 개발 환경 설정

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev
# → http://localhost:3000
```

### Android 빌드

```bash
# 1. 웹 빌드
npm run build

# 2. Capacitor 동기화
npx cap sync android

# 3. Android Studio에서 열기
npx cap open android

# 4. 명령어로 APK 빌드 (선택)
cd android
./gradlew assembleDebug

# 출력: android/app/build/outputs/apk/debug/app-debug.apk
```

### 릴리즈 빌드

```bash
cd android
./gradlew assembleRelease

# 서명 필요 (keystore 설정 후)
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore my-release-key.keystore \
  app-release-unsigned.apk alias_name
```

---

## 🔒 Android 권한 설정

### 선언된 권한 (`AndroidManifest.xml`)

```xml
<!-- 위치 권한 -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- 저장소 권한 -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<!-- 기타 -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
```

### 권한 요청 시점
- **런타임**: `Geolocation.requestPermissions()` (useGps.ts)
- **Android 6+**: 동적 권한 요청 필요

---

## 🛠️ 커스터마이징 가이드

### 지도 타일 소스 변경

`src/components/MapView.tsx`에서 `AVIATION_STYLE` 수정:

```typescript
const AVIATION_STYLE: maplibregl.StyleSpecification = {
  sources: {
    'custom-tiles': {
      type: 'raster',
      tiles: ['https://your-tile-server.com/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'Your Attribution'
    }
  }
};
```

### 항공지도 데이터 연동

현재 USGS Topo 지도 사용 중. 한국 항공 지도로 변경하려면:

1. **MBTiles 포맷**: `maplibre-gl` + `mbtiles` 플러그인
2. **XYZ 타일**: 항공지도 타일 서버 URL 설정
3. **Vector Tiles**: Mapbox Vector Tile 형식

### 테마 색상 변경

`src/App.css` CSS 변수 수정:

```css
:root {
  --primary-color: #00d4ff;    /* 메인 강조색 */
  --secondary-color: #ff6b00;   /* 보조 강조색 */
  --bg-primary: #0a1628;        /* 배경색 */
  --bg-secondary: #1a2332;      /* 패널 배경 */
  --text-primary: #ffffff;      /* 주 텍스트 */
  --text-secondary: #a0aec0;    /* 보조 텍스트 */
}
```

---

## 📋 향후 개선사항 (TODO)

### 고우선순위
- [ ] **한국 항공 지도 데이터 연동**: 국토교통부 또는 공항공사 데이터
- [ ] **MBTiles 오프라인 지도**: 대용량 지도 파일 로컬 저장
- [ ] **항공기록(LOG) 기능**: 비행 경로 기록 및 재생
- [ ] **항공기 고유 심볼**: 기종별 아이콘 (소형/중형/대형)

### 중우선순위
- [ ] **기상정보 오버레이**: METAR/TAF 데이터 표시
- [ ] **공역 정보**: 금지구역/제한구역 시각화
- [ ] **항로 최적화**: 바람/연료 고려 경로 계산
- [ ] **동기화 기능**: 클라우드 백업/복원

### 낮은 우선순위
- [ ] **다국어 지원**: 영어/한국어 전환
- [ ] **테마 설정**: 다크/라이트 모드
- [ ] **화면 설정**: 밝기/대비 조절
- [ ] **음성 알림**: 고도/방위 이탈 알림

---

## ⚠️ 알려진 이슈

### 1. 지도 타일 접근
- **현상**: 국내 접속 시 USGS 지도 로딩 지연
- **원인**: 해외 서버 접속
- **해결**: 한국 지도 타일 서버로 변경 필요

### 2. GPS 정확도
- **현상**: 실내/차량 내에서 위치 편차 발생
- **원인**: GPS 신호 차단/반사
- **해결**: 외장 GPS 안테나 연동 고려

### 3. 배터리 소모
- **현상**: 장시간 GPS 추적 시 배터리 소모 증가
- **원인**: 백그라운드 위치 업데이트
- **해결**: 추적 간격 조정 또는 절전 모드 구현

### 4. 저장소 용량
- **현상**: 오프라인 지도 대용량 데이터 저장 시 성능 저하
- **원인**: Preferences API의 제한
- **해결**: SQLite 또는 파일 기반 저장소 마이그레이션

---

## 📚 참고 자료

### 공식 문서
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [React Documentation](https://react.dev/)

### 항공 관련
- [ICAO Annex 4](https://www.icao.int): 항공지도 표준
- [FAA Sectional Charts](https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/): 항공지도 예시

---

## 👨‍💻 개발자 연락처

- **프로젝트**: KB AirMap
- **버전**: 1.0.0
- **라이선스**: MIT

---

**문서 끝**
