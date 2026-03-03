# KB AirMap - 항공로 지도 시스템

안드로이드 태블릿용 항공로 지도 열림 및 비행 계획 애플리케이션입니다. 오프라인 환경에서도 GPS 정보와 지도 데이터를 활용할 수 있습니다.

## 주요 기능

### 1. 항공로 지도 열림
- 전자지도 및 비행 참고자료 탑재
- 실시간 위치 표시
- 다양한 지도 스타일 지원
- 오프라인 지도 캐싱

### 2. 좌표 기반 참조점 설정
- 지도 클릭으로 경유지 추가
- 경유지별 고도 및 비고 설정
- 순서 변경 및 편집 기능

### 3. 항로 작성 기능
- 다중 경유지 항로계획 작성
- 경유지 간 거리 및 방위 계산
- 항로 저장 및 불러오기

### 4. 실시간 비행 정보 표시
- **위치 (Position)**: WGS84 좌표계
- **방위 (Heading)**: 0-360° 진북 기준
- **속도 (Speed)**: 노트(kt) 단위
- **고도 (Altitude)**: 피트(ft) 단위
- **상승/하강률**: ft/min

### 5. 오프라인 지원
- 네트워크 단절 상태에서 GPS 정보 활용
- 지도 타일 로컬 캐싱
- 항로계획 로컬 저장

## 개발 환경

- **프론트엔드**: React 18 + TypeScript
- **지도 엔진**: MapLibre GL JS
- **네이티브 래퍼**: Capacitor 6
- **타겟 플랫폼**: Android 16 (API 36)
- **디스플레이**: 가로형(Landscape) 최적화

## 설치 및 실행

### 개발 서버 실행
```bash
npm install
npm run dev
```

### Android 앱 빌드
```bash
# 1. 웹 애플리케이션 빌드
npm run build

# 2. Android 프로젝트 동기화
npx cap sync android

# 3. Android Studio에서 열기
npx cap open android

# 4. Android Studio에서 빌드 및 배포
```

### 프로덕션 빌드
```bash
# 디버그 APK 빌드
cd android
./gradlew assembleDebug

# 릴리즈 APK 빌드
./gradlew assembleRelease
```

## 권한 요구사항

### Android Permissions
- `ACCESS_FINE_LOCATION`: 정확한 GPS 위치
- `ACCESS_COARSE_LOCATION`: 대략적 위치
- `ACCESS_BACKGROUND_LOCATION`: 백그라운드 위치 추적
- `READ_EXTERNAL_STORAGE`: 오프라인 지도 데이터 읽기
- `WRITE_EXTERNAL_STORAGE`: 오프라인 지도 데이터 저장

## 프로젝트 구조

```
KBAirMap/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── MapView.tsx      # 지도 표시 컴포넌트
│   │   ├── FlightPlanPanel.tsx  # 항로계획 패널
│   │   ├── GpsStatus.tsx    # GPS 상태 표시
│   │   ├── InstrumentPanel.tsx  # 비행 계기 패널
│   │   └── OfflineMapManager.tsx # 오프라인 지도 관리
│   ├── hooks/
│   │   └── useGps.ts        # GPS 커스텀 훅
│   ├── utils/
│   │   ├── geo.ts           # 지리 계산 유틸리티
│   │   └── storage.ts       # 로컬 저장소 유틸리티
│   ├── types/
│   │   └── index.ts         # TypeScript 타입 정의
│   ├── App.tsx              # 메인 앱 컴포넌트
│   └── main.tsx             # 앱 진입점
├── android/                 # Capacitor Android 프로젝트
├── public/                  # 정적 파일
└── index.html               # HTML 템플릿
```

## UI 구성

### 헤더
- 메뉴 버튼
- 앱 타이틀
- 항공기 추적 토글
- 전체화면 토글

### 사이드 메뉴
- GPS 상태
- 항로계획
- 비행 계기
- 오프라인 지도 관리
- 비행 참고자료
- 설정

### 메인 영역 (지도)
- MapLibre 기반 지도 표시
- 항공기 위치 마커
- 경유지 마커
- 항로 라인

### 우측 패널
- **GPS 상태**: 실시간 위치, 속도, 방위, 고도
- **항로계획**: 경유지 목록 및 편집
- **비행 계기**: HSI 스타일 방위계, 속도계, 고도계, 상승률

### 하단 상태바
- GPS 상태
- 정확도
- 앱 버전

## 오프라인 지도 데이터

### 현재 구현
- USGS Topo Tiles (온라인)
- 브라우저/앱 캐싱

### 향후 개선사항
- 한국 항공 지도 데이터 연동
- MBTiles 포맷 지원
- 사용자 정의 지도 타일 서버 연동

## 주의사항

⚠️ **이 앱은 실제 항법 시스템이 아닙니다.**
- 실제 비행에 사용하기 전에 반드시 공식 항공 정보를 확인하세요.
- GPS 정확도는 환경에 따라 달라질 수 있습니다.
- 오프라인 지도 데이터는 최신 상태가 아닐 수 있습니다.

## 라이선스

MIT License

## 지원 및 문의

- Issues: [GitHub Issues]
- Email: support@kbairmap.com
