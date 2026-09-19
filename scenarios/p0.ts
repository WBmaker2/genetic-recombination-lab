/** scenarios/p0.ts — P0 프리셋·관대 판정 (설계 §3·§6). */
import { getParentalHaplotypes, type Haplotype, type Phase } from "../engine/haplotypes";

export const SCENARIO_ID_PREDICT = "p0-predict";
export const SCENARIO_ID_SAMPLING = "p0-sampling";
export const SCENARIO_ID_INFERENCE = "p0-inference";
export const SCENARIO_ID_TRANSFER = "p0-transfer";

export interface P0Preset {
  id: string;
  title: string;
  minutes: number;
  phase: Phase;
  trueR: number;
  N: number;
  seed: number;
}

/** 25분 흐름(3/5/5/7/5) 대응 프리셋. */
export const P0_PRESETS: P0Preset[] = [
  { id: SCENARIO_ID_PREDICT, title: "배우자 예측", minutes: 3, phase: "AB/ab", trueR: 0.1, N: 0, seed: 1 },
  { id: SCENARIO_ID_SAMPLING, title: "100·1000개 생성", minutes: 5, phase: "AB/ab", trueR: 0.1, N: 1000, seed: 42 },
  { id: SCENARIO_ID_INFERENCE, title: "검정교배 추정", minutes: 7, phase: "AB/ab", trueR: 0.1, N: 1000, seed: 42 },
  { id: SCENARIO_ID_TRANSFER, title: "전이 Ab/aB", minutes: 5, phase: "Ab/aB", trueR: 0.1, N: 100, seed: 7 },
];

/** 부모형 선택 판정: 순서 무관 집합 일치. */
export function gradeParentalSelection(phase: Phase, selected: Haplotype[]): boolean {
  const expected = new Set(getParentalHaplotypes(phase));
  return selected.length === 2 && selected.every((h) => expected.has(h)) && new Set(selected).size === 2;
}

/**
 * 비율 판정: 허용오차 내면 통과. 기대값과 정확히 같아야 성공이 아님(§6·§10).
 * r_hat>0.5여도 계산 자체는 통과(표시는 호출자가 구분).
 */
export function gradeRatio(observed: number, expected: number, tol = 0.05): boolean {
  if (!Number.isFinite(observed) || !Number.isFinite(expected)) return false;
  return Math.abs(observed - expected) <= tol;
}

export type MisconceptionId = "dominant-common" | "linear-distance" | "single-sample";

export function describeMisconception(id: MisconceptionId): { title: string; guidance: string } {
  switch (id) {
    case "dominant-common":
      return { title: "우성≠흔함·유리함", guidance: "우열은 발현 관계일 뿐 빈도·유리함과 무관. 가상생물 예시로만 설명." };
    case "linear-distance":
      return { title: "재조합률≠거리 선형", guidance: "작은 r에서만 근사. P0 거리 표시 비활성, P1에서 포화 별도 설명." };
    case "single-sample":
      return { title: "한 표본≠전체 확률", guidance: "N=100과 N=1000 비교로 표본 변동 확인. r_hat과 참 r 분리 저장." };
  }
}
