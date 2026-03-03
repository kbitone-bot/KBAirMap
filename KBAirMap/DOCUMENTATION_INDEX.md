# KB AirMap - Documentation Index

> 프로젝트 문서 목차 및 가이드

---

## 📚 문서 목록

### 🚀 시작하기
| 문서 | 설명 | 대상 |
|------|------|------|
| [QUICK_START.md](./QUICK_START.md) | 5분快速 시작 가이드 | 신규 개발자 |
| [README.md](./README.md) | 사용자 매뉴얼 | 일반 사용자 |

### 📖 개발 문서
| 문서 | 설명 | 대상 |
|------|------|------|
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | 상세 아키텍처 및 개발 가이드 | 개발자 |
| [API_REFERENCE.md](./API_REFERENCE.md) | 컴포넌트/Hook/유틸리티 API 문서 | 개발자 |

### 📋 프로젝트 관리
| 문서 | 설명 | 대상 |
|------|------|------|
| [CHANGELOG.md](./CHANGELOG.md) | 버전별 변경사항 | 모두 |
| [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) | 이 문서 | 모두 |

---

## 🎯 독자별 추천 경로

### 👨‍💻 신규 개발자
```
1. QUICK_START.md → 프로젝트 실행
2. DEVELOPER_GUIDE.md → 아키텍처 이해
3. API_REFERENCE.md → API 상세 확인
4. src/ 코드 탐색
```

### 🧑‍🔧 기존 개발자 (버그 수정/기능 추가)
```
1. API_REFERENCE.md → 관련 API 확인
2. DEVELOPER_GUIDE.md → 데이터 흐름 파악
3. src/ 코드 수정
4. CHANGELOG.md 업데이트
```

### 👤 일반 사용자
```
README.md만 읽으면 충분합니다.
```

---

## 📁 코드 구조 요약

```
src/
├── components/     # UI 컴포넌트
│   ├── MapView.tsx           # 핵심: 지도 렌더링
│   ├── FlightPlanPanel.tsx   # 항로계획 관리
│   ├── GpsStatus.tsx         # GPS 상태 표시
│   ├── InstrumentPanel.tsx   # 비행 계기
│   └── OfflineMapManager.tsx # 오프라인 지도
├── hooks/
│   └── useGps.ts             # GPS 상태 관리
├── utils/
│   ├── geo.ts                # 지리 계산
│   └── storage.ts            # 로컬 저장소
└── types/
    └── index.ts              # TypeScript 타입
```

---

## 🔗 외부 참고자료

### 공식 문서
- [Capacitor Docs](https://capacitorjs.com/docs)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [React Docs](https://react.dev/)

### 항공 관련
- [ICAO](https://www.icao.int) - 국제민간항공기구
- [FAA Charts](https://www.faa.gov/air_traffic/flight_info/aeronav/)

---

## 💬 지원

- **Issues**: GitHub Issues 탭
- **Email**: support@kbairmap.com

---

**문서 최종 업데이트**: 2026-02-26
