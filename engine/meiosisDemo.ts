/** meiosisDemo.ts — 무교차/단일교차 정적 시연 데이터. 확률 샘플러와 별도 모드. */
import type { Haplotype, Phase } from "./haplotypes";

export interface MeiosisDemoStep {
  id: string;
  title: string;
  chromatidIds: [string, string, string, string];
  /** 교차 구간 (무교차면 빈 배열). */
  crossoverSegments: string[];
  /** 4염색분체 결과 (고정 순서). */
  products: [Haplotype, Haplotype, Haplotype, Haplotype];
  note: string;
}

/** 무교차 시연: 4 결과 모두 부모형. */
export function getNoCrossoverDemo(phase: Phase): MeiosisDemoStep {
  const products: MeiosisDemoStep["products"] =
    phase === "AB/ab" ? ["AB", "AB", "ab", "ab"] : ["Ab", "Ab", "aB", "aB"];
  return {
    id: `no-crossover-${phase}`,
    title: "교차 없음",
    chromatidIds: ["c1", "c2", "c3", "c4"],
    crossoverSegments: [],
    products,
    note: "4염색분체 모두 부모형. 애니메이션 속도는 확률과 무관.",
  };
}

/**
 * 단일 교차 시연: 4 중 2개만 재조합되는 예시.
 * 일반 r를 단일 교차 빈도와 동일시 금지 (설계 §5).
 */
export function getSingleCrossoverDemo(phase: Phase): MeiosisDemoStep {
  const products: MeiosisDemoStep["products"] =
    phase === "AB/ab" ? ["AB", "ab", "Ab", "aB"] : ["Ab", "aB", "AB", "ab"];
  return {
    id: `single-crossover-${phase}`,
    title: "단일 교차 1회 예시",
    chromatidIds: ["c1", "c2", "c3", "c4"],
    crossoverSegments: ["c2-c3"],
    products,
    note: "네 염색분체 중 두 개가 재조합되는 예시. 일반 r와 동일시하지 않음.",
  };
}
