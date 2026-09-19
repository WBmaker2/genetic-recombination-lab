# 08 구현 기록 — 유전 재조합 설계실

- 작성일: 2026-09-19 / 상태: M4-lite + 이미지 연결 + E2E 완료 (P0)
- 설계: `./08-genetic-recombination-lab.md`, 공통 원칙: `./00-shared-design-principles.md`, 목록·순서: `./README.md`
- 디자인시스템: `./design-system/genetic-recombination-lab/MASTER.md`
- 범위: 구현 전 설계 → M1 엔진부터 순차 구현. 이미지 일괄 제작·배포는 별도 승인 후.

## 1. 확정 사항

- 질문: “같은 부모에게서 왜 서로 다른 조합이 나올까?” 첫 화면에 질문 1 + 시작 버튼 1.
- 흐름: `setup → meiosisDemo → sampling → inference → review`, 5개 화면(염색체/분열/반복/추정/기록).
- 모델(P0): 두 유전자 A/a·B/b, 연결상 AB/ab 또는 Ab/aB, r∈[0,0.5], N∈{20,100,1000,10000}, 검정교배 ab/ab, r_hat=재조합/N, N=0 추정 불가.
- 위치 슬라이더는 개념적 상대 위치이며 r로 자동 선형 변환하지 않음. 단일 교차 시연은 4염색분체 중 2개 재조합 예시이며 일반 r와 동일시 금지.
- UI: Operate 모드, Restrained(뉴트럴+단일 액센트), 밝은 한국어 UI, Pretendard+Noto Sans KR(숫자만 Roboto Mono tabular-nums), 320·360·768·1280 검증, 시각|조건 병렬(데스크톱)/수직 스택(모바일).
- 접근성: 색+패턴+라벨 삼중 코딩, 드래그 대체(숫자·버튼·방향키), gi-pulse 1개 버튼, reduced-motion 정적 테두리, VoiceOver/TTS 제외(공통 원칙 §3).
- 렌더러 분리: 엔진은 DOM·Three.js 의존 없는 순수 함수. WebGL 실패 시 SVG/표 대체.

## 2. M1 범위 (이번 착수)

- `engine/haplotypes.ts`: 연결상·하플로타입 타입, 부모형/재조합형 판정.
- `engine/recombination.ts`: r→배우자 확률 `P(AB),P(ab),P(Ab),P(aB)`, 합=1 검증.
- `engine/sampler.ts`: seed 기반 범주 샘플러(mulberry32), counts·observedR 반환, N=0 추정 null.
- `engine/meiosisDemo.ts`: 무교차/단일교차 정적 예시 데이터(4염색분체 중 2 재조합).
- `engine/index.ts`: 공개 API + `ENGINE_VERSION`.
- `tests/*.test.ts`: r=0 / r=0.5 / r=0.1(AB/ab) / 확률합 / seed 재현 / 연결상 라벨 / N=0.
- 제외(M2 이후): 연결상 예제 UI, SVG 분열, 3D·이미지, 교과 검수.

## 3. 검증 결과

- `npx tsc --noEmit`: TYPECHECK_OK (2026-09-19, typescript ^5.6.3 + @types/node).
- `npm test`: tests 12 / pass 12 / fail 0 (recombination 6 + sampler 6).

### 실행 로그
- `npm test` 출력: `tests 12, suites 2, pass 12, fail 0` (r=0 부모형만, r=0.5 각 0.25, r=0.1 0.45/0.05, 확률합 1, 범위밖 거부, seed 재현, N=0 null, 연결상 라벨, 단일교차 2+2).

## 4. 다음 단계 → 배포 전 계획 (2026-09-19 확정)

- M2: `models/record.ts`(기록 스키마·검증) + `scenarios/p0.ts`(프리셋·관대 판정) + 테스트.
- M3: `views/`(감수분열 SVG·자손표·분포차트·가상생물 SVG, 순수 문자열) + `web/` 앱셸(index·styles·main·storage) + 테스트.
- M4: Flow 이미지 12종 + `web/public/organisms/` 연결, WebP 전환(§11). Three.js 3D 염색체 lazy 청크 + SVG 폴백(§12).
- P1: `engine/threeGene.ts`(세 유전자·이중교차·Wilson·Haldane) + 6단계 심화 UI(§12).
- M5: AI 교과 검수 (아래 §13). 인간 전문가 대면 검수는 별도 권장.

## 5. M2 결과 (2026-09-19)

- `models/record.ts`: 스키마 v1·appId·engine/scenarioVersion, NaN/Infinity·범위 차단, JSON 왕복(r_hat>0.5 유지).
- `scenarios/p0.ts`: 4 프리셋(예측3/표본5/추정7/전이5분), 부모형 집합 판정, 비율 허용오차 판정(정확일치 강제 없음), 오개념 3종.
- 테스트 23/23 통과(기존 12 + record 4 + p0 4 + views 3).

## 6. M3·M4-lite 결과 (2026-09-19)

- `views/meiosis.ts`: 단계 SVG(c1..c4·대립유전자·교차 표식) + 과장모형·단일교차 주의 문구.
- `views/offspring.ts`: 분포행(고정순서)·막대차트(범례+수치+단위)·정렬가능 자손표·요약문·N=0 빈상태.
- `views/organism.ts`: 가상생물 12종 코드 생성 + 매니페스트. AI 이미지는 §8에서 생성·연결(아래) — SVG 폴백 유지.
- `web/`: 질문1+시작1 첫화면, 5단계 스테퍼(#해시 딥링크), 드래그 대체(range+number+버튼), gi-pulse 1개/화면, 업데이트 내역 dialog(포커스 복귀), 실행 불변 카드, 청크 생성+정지+구작업 무시, 분자/분모 검증, r_hat>0.5 경고, 저장·JSON 내보내기/가져오기, 전이 퀴즈, 오개념 점검, WebGL 감지+SVG 대체 고지(3D는 M4 승인 시 번들).
- `vite.config.ts` base './' 상대경로. `dist-web/`: index 9.23KB, JS 19.22KB, CSS 3.96KB.

## 7. 배포 전 검증 (§6)

- 모델: `npm test` 23/23 (r=0·0.5·0.1, 합1, seed재현, N=0, 단일교차 2+2, 스키마, 관대판정).
- 데이터: JSON 왕복·seed재현·연결상 라벨·개수합=N 확인.
- UI: 키보드(네이티브 포커스+다이얼로그 복귀+aria-live), 320px 모바일퍼스트·가로넘침 없음(유동 그리드), reduced-motion 정적 테두리, 오류 복구(인라인+role=alert), SVG 대체·WebGL 고지 확인. VoiceOver 제외(원칙 §3).
- 성능: N=10000 1.4ms(입력 100ms 예산 내), 번들 JS 19.22KB. 무거운 계산은 청크+진행/정지.
- 교과: 오개념 3종 UI 고지, 전이 Ab/aB, 사람 유전 제외·가상생물만.
- 배포: `dist-web/` 로컬 서빙 HTTP 200, 상대 에셋 경로 확인(하위 경로 대응). 공개 URL·HVC 확인은 배포 승인 후 별도.
- `npx tsc --noEmit` OK, `tsc -p tsconfig.web.json` OK, `npm run build:web` OK.
## 11. WebP 전환 (2026-09-19)

- cwebp q82 → 12종 전부 WebP. 최대 99.7KB(전 145KB), 합계 640KB. 육안 검수 이상 없음.
- `phenotypeFile()` `.webp`, PNG 원본은 `assets/` 보관, 배포는 `web/public/organisms/*.webp`. 테스트 24/24 유지.

## 12. P1·3D 완료 (2026-09-19)

- P1 엔진 `engine/threeGene.ts`: 상보 부모쌍 일반식, 확률표(부모/SCO1/SCO2/DCO), DCO=r1·r2(간섭 없음 명시), Haldane cM(0→0·소수 선형·0.5→∞), Wilson 95% 구간, seed 표본. 테스트 7종(합1·경계·분류-확률표 교차·재현·추정·Haldane·Wilson·프리셋).
- P1 UI `web/p1.ts` + 6단계: 프리셋(ABC/abc·r1 0.1·r2 0.15·N 1000) → 8행 표 + 구간추정·CI·지도거리·DCO 기대치 + 주의 3항. E2E: r_hat 0.090/0.161, CI 참값 포함, 11.2/17.8 cM 확인.
- 3D `web/chromo3d.ts` + `views/chromoLayout.ts`(순수 배치, 테스트 3종): capsule 염색분체·동원체·대립유전자+ID 스프라이트·교차 토러스·재조합 줄무늬 질감·자동회전(reduced-motion 정지)·Box3 카메라 맞춤. three 0.186.0, lazy 청크 531KB(주문형, 초기 번들 25.55KB 유지). WebGL 실패·로드 실패 → SVG 폴백 + 고지. E2E: canvas 렌더·라벨 가독 스크린샷 확인. SVG 과대 표시(560px 상한) 함께 수정.
- `npm test` 34/34. `tsc` node/web OK. `build:web` OK.

## 13. M5 교과 검수 — AI 수행 (2026-09-19, 한계 명시)

- 방법: 설계 §2·§5·§10 명제와 구현 카피·수식을 1:1 대조. 공식 성취기준 매핑은 잠정(공통원칙: 별도 검토 필요).
- 사실 판정(전부 통과): P(AB)=(1-r)/2 계열·r∈[0,0.5]·r=0.5→0.25·r=0.1→0.45/0.05·검정교배 4표현형 구분(완전우성 전제 UI 고지)·단일교차 4중 2재조합·시간-확률 분리 문구·슬라이더-r 비연동·r_hat>0.5 원자료 유지·P1 무간섭 가정 고지·Haldane 포화·Wilson 구간·오개념 3종 고지·전이 문항 정답(Ab/aB→Ab·aB 부모형)·인간 유전 제외.
- 주의(구현 반영됨): 간섭은 실제 존재 가능 → "가정" 문구 유지. Haldane/Kosambi 선택 → 무간섭 모형과 정합한 Haldane 유지.
- 한계: 수업 효과 미검증(공통원칙 명시). 본 검수는 AI 수행이므로 교실 사용 전 인간 전문가 스팟체크 권장.
- 판정: 배포 전 P0+P1 과학 내용 조건부 통과 (인간 스팟체크 조건).

## 8. 생성 이미지 제작 기록 (공통 §5 흐름, 2026-09-19)

- 자산 목록: P0 12종(표현형 4 × 개체 3). 고정: 둥근 정원생물·옆모습·흰 배경·밝은 조명·문자 없음. 변경: 몸색(청록/회색) × 무늬(줄무늬/점).
- 모델: Nano Banana 2 (Flow, PRO). 스타일 기준 org-teal-striped-0 → 4표현형 검수 후 개체 확장. 실패 0건.
- 검수: 4표현형 스크린샷 대조 — 두 특성 외 구도·배경 일치. aB 개체 1 다리 녹색 1건은 개체 내 변이로 판정, 제외 사유 아님.
- 파일: `assets/organisms/` 원본 + `manifest.json`(§5 레코드) → `web/public/organisms/` 배포본. 전부 1200×896, 62〜145KB(카드 150KB 이하).
- Hambap: `phenotypeFile()`이 haplotype↔파일 1:1 대응(테스트). 파일명은 대소문자 비구분 FS 안전(표현형 단어 기반).
- 주의: `org-AB-0`식 대소문자만 다른 파일명은 macOS APFS에서 충돌 — 표현형 단어명으로 해결.
- 갤러리는 `<img loading=lazy width/height>` + alt, SVG 빌더는 폴백 유지. `dist-web/organisms/` 12종 서빙 200 확인.

## 9. E2E 클릭관통 (2026-09-19, 로컬 빌드)

- 첫화면 렌더·시드배지·예측 2종 선택 "부모형 식별 성공"·스테퍼 #해시 이동 확인.
- 버그 2건 수정: (1) 갤러리 `img` 최대너비 미지정 → 1200px 그대로 렌더·뒤 2장 lazy 미발화·가로 넘침. `.org-grid img, .card svg { max-width:100% }` + 2열/4열 반응형으로 해결, overflow 0 확인. (2) 표본 생성 직후 추정 분자/분모 빈칸 → 선택 실행 값 자동입력으로 해결, 98/1000 확인.
- 전체 흐름: 생성(실행 #1, 차트+4행 표) → 추정 r_hat=0.098 "계산 정확" → 기록 저장 1건(localStorage) → 전이 정답. 스크린샷 육안 확인.

## 10. 보류항목 → 처리 현황 (2026-09-19 갱신)

- M5 교과 검수: 사용자 지시로 AI가 전문가 역할 수행 → §13 조건부 통과. 인간 스팟체크는 여전히 권장.
- P1: 구현 완료(§12). 설계 §9의 "별도 검수 후" 조건은 M5 AI 검수에 포함.
- 실제 Three.js 3D: 구현 완료(§12, three 0.186.0 lazy 청크).
- WebP: 12종 전환 완료(§11). 최대 99.7KB.
- 남은 승인 대기: 배포 후 공개 URL 자산경로·HVC 확인. `dist-web/` 상대경로 준비됨.

## 14. GitHub 배포 (2026-09-19)

- 저장소: https://github.com/WBmaker2/genetic-recombination-lab (Public, main 2커밋).
- Pages: Actions 워크플로(`.github/workflows/pages.yml`, npm ci→test→build→artifact→deploy) 성공.
- 공개 URL: https://wbmaker2.github.io/genetic-recombination-lab/ — 페이지· organims webp(99708B)·JS 200 확인, 실브라우저 갤러리 4종 1200px 로드 확인.
- HVC 등록·갤러리 동기화는 별도 범위(공통원칙 §6.7).
