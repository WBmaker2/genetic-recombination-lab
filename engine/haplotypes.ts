/** haplotypes.ts — 연결상·하플로타입 타입과 부모형/재조합형 판정 (순수 함수). */

/** 4개 배우자 하플로타입. 고정 순서 AB/ab/Ab/aB (유전적 의미 우선, 정렬 변경 금지). */
export const HAPLOTYPES = ["AB", "ab", "Ab", "aB"] as const;
export type Haplotype = (typeof HAPLOTYPES)[number];

/** P0 이배체 부모 연결상. */
export const PHASES = ["AB/ab", "Ab/aB"] as const;
export type Phase = (typeof PHASES)[number];

export function assertPhase(phase: string): asserts phase is Phase {
  if (phase !== "AB/ab" && phase !== "Ab/aB") {
    throw new RangeError(`phase는 "AB/ab" 또는 "Ab/aB"만 허용 (입력: ${phase})`);
  }
}

/** 해당 연결상에서 부모형인지 판정. */
export function isParental(haplotype: Haplotype, phase: Phase): boolean {
  if (phase === "AB/ab") return haplotype === "AB" || haplotype === "ab";
  return haplotype === "Ab" || haplotype === "aB";
}

/** 해당 연결상에서 재조합형인지 판정. */
export function isRecombinant(haplotype: Haplotype, phase: Phase): boolean {
  return !isParental(haplotype, phase);
}

/** 해당 연결상의 부모형 2종. */
export function getParentalHaplotypes(phase: Phase): [Haplotype, Haplotype] {
  return phase === "AB/ab" ? ["AB", "ab"] : ["Ab", "aB"];
}

/** 해당 연결상의 재조합형 2종. */
export function getRecombinantHaplotypes(phase: Phase): [Haplotype, Haplotype] {
  return phase === "AB/ab" ? ["Ab", "aB"] : ["AB", "ab"];
}
