# KB AirMap - Changelog

모든 주요 변경사항은 이 파일에 기록됩니다.

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/)를 따륩니다.

---

## [1.0.0] - 2026-02-26

### 🎉 첫 릴리즈

#### 추가된 기능

- **항공로 지도 열림**
  - MapLibre GL JS 기반 전자지도
  - 가로형(Landscape) 태블릿 최적화 UI
  - 다크 테마 항공 스타일
  - 줌/패닝/회전 제어

- **전자지도 및 비행 참고자료**
  - USGS Topo 지도 타일 지원
  - 오프라인 지도 캐싱 (Service Worker)
  - PWA 기능 지원

- **좌표 이용 참조점 설정 및 항로 작성**
  - 지도 클릭으로 경유지 추가
  - 경유지 이름/고도/비고 설정
  - 경유지 순서 변경 (위/아래 이동)
  - 항로계획 저장/불러오기/삭제
  - 로컬 스토리지 영속화

- **실시간 비행 정보 표시**
  - GPS 위치 추적
  - 방위각 (Heading) 표시: 000-360°
  - 속도 표시: 노트(kt) 단위
  - 고도 표시: 피트(ft) 단위
  - 상승/하강률: ft/min

- **비행 계기 패널**
  - HSI 스타일 방위계 (나침반)
  - 속도 테이프 (Airspeed Indicator)
  - 고도 테이프 (Altimeter)
  - 수직속도 지시기 (VSI)

- **오프라인 지원**
  - 네트워크 단절 상태 GPS 정보 활용
  - Capacitor Preferences 기반 데이터 저장
  - 오프라인 지도 관리 UI

- **Android 네이티브 통합**
  - Android 16 (API 36) 지원
  - Capacitor 6 기반
  - 가로형 화면 고정
  - GPS 고정밀 위치 추적

#### 기술 스택

- React 18 + TypeScript 5
- MapLibre GL JS 5
- Capacitor 6
- Vite 6 + PWA Plugin
- Lucide React (아이콘)

#### 개발 문서

- DEVELOPER_GUIDE.md - 개발자 가이드
- API_REFERENCE.md - API 문서
- QUICK_START.md - 빠른 시작 가이드

---

## [Unreleased]

### 계획된 기능

#### 고우선순위
- [ ] 한국 항공 지도 데이터 연동
- [ ] MBTiles 오프라인 지도 지원
- [ ] 항공기록(LOG) 기능
- [ ] 기종별 항공기 아이콘

#### 중우선순위
- [ ] 기상정보 오버레이 (METAR/TAF)
- [ ] 공역 정보 시각화
- [ ] 항로 최적화
- [ ] 클라우드 동기화

#### 낮은 우선순위
- [ ] 다국어 지원
- [ ] 테마 설정
- [ ] 음성 알림

---

## 버전 관리 규칙

### 버전 번호 형식
`MAJOR.MINOR.PATCH`

- **MAJOR**: 하위 호환되지 않는 변경
- **MINOR**: 하위 호환되는 기능 추가
- **PATCH**: 버그 수정

### 커밋 메시지 규칙
```
[타입] 설명

- feat: 새로운 기능
- fix: 버그 수정
- docs: 문서 수정
- style: 코드 스타일 변경
- refactor: 리팩토링
- test: 테스트 코드
- chore: 빌드/설정 변경
```

---

**참고**: 이 프로젝트는 [Semantic Versioning](https://semver.org/lang/ko/)을 따릅니다.
