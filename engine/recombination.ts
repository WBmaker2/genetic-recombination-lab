/** recombination.ts — r → 배우자 확률 (순수 함수, DOM/Three.js 의존 없음). */
import { HAPLOTYPES, type Haplotype, type Phase } from "./haplotypes";

export type GameteProbabilities = Record<Haplotype, number>;

/** r 유효 범위: [0, 0.5], 유한수. */
export function isValidR(r: number): boolean {
  return Number.isFinite(r) && r >= 0 && r <= 0.5;
}

export function assertValidR(r: number): void {
  if (!isValidR(r)) {
    throw new RangeError(`r은 [0, 0.5] 유한수만 허용 (입력: ${r})`);
  }
}

/**
 * 연결상과 참 재조합률 → 4 하플로타입 이론 확률.
 * - AB/ab: P(AB)=P(ab)=(1-r)/2, P(Ab)=P(aB)=r/2
 * - Ab/aB: 부모형/재조합형 역할 교환.
 */
export function getGameteProbabilities(phase: Phase, r: number): GameteProbabilities {
  assertValidR(r);
  const parental = (1 - r) / 2;
  const recombinant = r / 2;
  if (phase === "AB/ab") {
    return { AB: parental, ab: parental, Ab: recombinant, aB: recombinant };
  }
  return { AB: recombinant, ab: recombinant, Ab: parental, aB: parental };
}

/** 확률 합 (부동소수점 오차 확인용). */
export function probSum(probs: GameteProbabilities): number {
  return HAPLOTYPES.reduce((s, h) => s + probs[h], 0);
}
