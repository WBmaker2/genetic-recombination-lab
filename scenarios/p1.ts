/** scenarios/p1.ts — P1 심화 프리셋 (세 유전자·이중교차·불확실성). */
import type { TriHaplotype } from "../engine/threeGene";

export const SCENARIO_ID_P1 = "p1-trigene";

export interface P1Preset {
  id: string;
  title: string;
  parental: TriHaplotype;
  r1: number;
  r2: number;
  N: number;
  seed: number;
}

export const P1_PRESET: P1Preset = {
  id: SCENARIO_ID_P1,
  title: "세 유전자 지도와 이중 교차",
  parental: "ABC",
  r1: 0.1,
  r2: 0.15,
  N: 1000,
  seed: 2026,
};

export const P1_NOTES = [
  "간섭 없음 가정: 이중교차율 = r1·r2. 실제 염색체에서는 간섭이 있을 수 있음.",
  "작은 r에서 지도거리 ≈ r. r→0.5에서 포화(Haldane ∞) — 선형이 아님.",
  "추정값은 95% Wilson 구간과 함께 보고. 한 표본의 점추정만으로 확정하지 않음.",
] as const;
