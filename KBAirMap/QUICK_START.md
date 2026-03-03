# KB AirMap - Quick Start Guide

> 개발자를 위한 5분快速 시작 가이드

---

## 🚀 5분 안에 실행하기

### 1. 환경 준비

필수 설치 항목:
- Node.js 18+ 
- Android Studio (Android 16 SDK 포함)
- Git

### 2. 프로젝트 클론 및 설정

```bash
# 저장소 클론
git clone <repository-url>
cd KBAirMap

# 의존성 설치
npm install

# Android 프로젝트 초기화 (이미 되어있음)
npx cap sync android
```

### 3. 개발 서버 실행

```bash
# 웹 개발 서버
npm run dev

# 브라우저에서 http://localhost:3000 접속
```

### 4. Android 디바이스에서 실행

```bash
# 1. 웹 빌드
npm run build

# 2. Android 동기화
npx cap sync android

# 3. Android Studio 실행
npx cap open android

# 4. Android Studio에서 'Run' 버튼 클릭
#    (연결된 디바이스 또는 에뮬레이터 필요)
```

---

## 📱 Android 디바이스 설정

### 개발자 옵션 활성화
1. 설정 → 휴전화 정보 → 소프트웨어 정보
2. 빌드번호 7번 탭 → 개발자 모드 활성화

### USB 디버깅 활성화
1. 설정 → 개발자 옵션
2. USB 디버깅 ON

### 디바이스 연결 확인
```bash
adb devices
# List of devices attached
# xxxxxxxx    device
```

---

## 🏗️ 프로젝트 구조 요약

```
KBAirMap/
├── src/
│   ├── components/          # UI 컴포넌트
│   │   ├── MapView.tsx      # 지도 (핵심)
│   │   ├── FlightPlanPanel.tsx  # 항로계획
│   │   ├── GpsStatus.tsx    # GPS 상태
│   │   ├── InstrumentPanel.tsx  # 비행 계기
│   │   └── OfflineMapManager.tsx
│   ├── hooks/
│   │   └── useGps.ts        # GPS 관리
│   ├── utils/
│   │   ├── geo.ts           # 지리 계산
│   │   └── storage.ts       # 저장소
│   └── types/
│       └── index.ts         # 타입 정의
├── android/                 # Android 네이티브
└── README.md               # 상세 문서
```

**핵심 파일 3개**:
1. `src/components/MapView.tsx` - 지도 렌더링
2. `src/hooks/useGps.ts` - GPS 데이터
3. `src/App.tsx` - 메인 레이아웃

---

## 🔧 주요 개발 작업

### 지도 타일 변경

`src/components/MapView.tsx`:
```typescript
const AVIATION_STYLE = {
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: ['https://your-tile-server/{z}/{x}/{y}.png'],
      // ...
    }
  }
};
```

### 새로운 데이터 필드 추가

1. `src/types/index.ts`에 타입 추가
2. 컴포넌트에 Props 추가
3. `storage.ts`에 저장 로직 확인

### 스타일 변경

`src/App.css` CSS 변수 수정:
```css
:root {
  --primary-color: #00d4ff;
  --bg-primary: #0a1628;
  /* ... */
}
```

---

## 🐛 디버깅

### 웹 개발자 도구
```bash
npm run dev
# Chrome DevTools (F12) 사용
```

### Android 디버깅
```bash
# Chrome 브라우저에서
chrome://inspect
# → 디바이스/에뮬레이터 목록에서 WebView 선택
```

### 로그 확인
```bash
# Android 로그
adb logcat -s "Capacitor" "AndroidRuntime"
```

---

## 📦 배포 빌드

### Debug APK
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug

# 출력: app/build/outputs/apk/debug/app-debug.apk
```

### Release APK
```bash
cd android
./gradlew assembleRelease

# 서명 필요
```

---

## ❓ 문제 해결

### Capacitor 동기화 실패
```bash
rm -rf android/app/src/main/assets/public
npm run build
npx cap sync android
```

### Android Studio에서 Gradle 오류
```bash
cd android
./gradlew clean
./gradlew build
```

### GPS 권한 오류
- Android 설정 → 앱 → KB AirMap → 권한 → 위치 "허용"
- 또는 앱 재설치

---

## 📚 다음 단계

1. **DEVELOPER_GUIDE.md** - 상세 아키텍처 문서
2. **API_REFERENCE.md** - API 상세 참조
3. **README.md** - 사용자 매뉴얼

---

**즐거운 개발 되세요! ✈️**
