# 유전 재조합 설계실 — 개발 순서·목록

이 폴더는 12종 묶음 중 `08` 한 종(`genetic-recombination-lab`)의 설계·구현을 담는다.
`00-shared-design-principles.md`의 [개발 순서]와 `08-genetic-recombination-lab.md`의 [목록]이 가리키는 파일이다.

## 개발 순서 (P0)

1. M1 배우자 확률·표본 엔진 — 완료 (`engine/`, 테스트 12)
2. M2 기록 스키마·P0 프리셋 — 완료 (`models/`, `scenarios/`)
3. M3 앱셸·SVG 분열·자손표 — 완료 (`views/`, `web/`)
4. M4 이미지·3D — 완료 (`assets/organisms/` WebP 12종, Three.js lazy 청크 + SVG 폴백)
5. M5 교과 검수 — AI 수행 완료, 인간 스팟체크 권장 (기록 §13)
6. P1 심화(세 유전자·이중교차·Wilson·Haldane) — 완료 (`engine/threeGene.ts`, 6단계)

## 목록

- `08-genetic-recombination-lab.md` — 설계 (P0/P1 범위, 검증 기준)
- `08-implementation-record.md` — 구현 기록 (M1〜M5·P1·3D·WebP, 검증 로그, 보류항목 §10)
- `design-system/` — 확정 디자인 토큰 (MASTER.md)

## 실행

- `npm test` — 엔진·스키마·뷰 테스트 (34)
- `npm run build:web` — 정적 빌드 → `dist-web/` (상대경로, 하위 경로 배포 대응)
