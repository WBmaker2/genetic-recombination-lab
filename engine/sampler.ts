/** sampler.ts — seed 기반 범주 샘플러 (순수 함수). Math.random 사용 금지. */
import { HAPLOTYPES, isRecombinant, type Haplotype, type Phase } from "./haplotypes";
import { getGameteProbabilities } from "./recombination";

export const ALLOWED_N = [20, 100, 1000, 10000] as const;

export type CountsByHaplotype = Record<Haplotype, number>;

export interface SampleInput {
  phase: Phase;
  trueR: number;
  N: number;
  seed: number;
}

export interface SampleResult {
  phase: Phase;
  trueR: number;
  N: number;
  seed: number;
  countsByHaplotype: CountsByHaplotype;
  /** 재조합 수 / N. N=0이면 null (추정 불가). */
  observedR: number | null;
  recombinantCount: number;
}

/** 32비트 결정적 RNG (mulberry32). seed는 유한 정수. */
export function mulberry32(seed: number): () => number {
  if (!Number.isInteger(seed) || !Number.isFinite(seed)) {
    throw new RangeError(`seed는 유한 정수만 허용 (입력: ${seed})`);
  }
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function zeroCounts(): CountsByHaplotype {
  return { AB: 0, ab: 0, Ab: 0, aB: 0 };
}

function assertSampleInput({ phase, trueR, N, seed }: SampleInput): void {
  if (phase !== "AB/ab" && phase !== "Ab/aB") {
    throw new RangeError(`phase 오류 (입력: ${phase})`);
  }
  if (!Number.isFinite(trueR) || trueR < 0 || trueR > 0.5) {
    throw new RangeError(`trueR은 [0, 0.5] 유한수 (입력: ${trueR})`);
  }
  if (!Number.isInteger(N) || N < 0 || !Number.isFinite(N)) {
    throw new RangeError(`N은 0 이상 정수 (입력: ${N})`);
  }
  if (!Number.isInteger(seed) || !Number.isFinite(seed)) {
    throw new RangeError(`seed는 유한 정수 (입력: ${seed})`);
  }
}

/** 범주 분포에서 N개 추출. 동일 입력+seed → 동일 결과. */
export function sampleGametes(input: SampleInput): SampleResult {
  assertSampleInput(input);
  const { phase, trueR, N, seed } = input;
  const counts = zeroCounts();
  if (N === 0) {
    return { phase, trueR, N, seed, countsByHaplotype: counts, observedR: null, recombinantCount: 0 };
  }
  const probs = getGameteProbabilities(phase, trueR);
  // 누적 경계 (부동소수점: 마지막 구간은 1로 강제).
  const edges: Array<{ h: Haplotype; edge: number }> = [];
  let acc = 0;
  for (const h of HAPLOTYPES) {
    acc += probs[h];
    edges.push({ h, edge: acc });
  }
  edges[edges.length - 1].edge = 1;
  const rand = mulberry32(seed);
  for (let i = 0; i < N; i++) {
    const u = rand();
    const hit = edges.find((e) => u < e.edge) ?? edges[edges.length - 1];
    counts[hit.h] += 1;
  }
  let recombinantCount = 0;
  for (const h of HAPLOTYPES) {
    if (isRecombinant(h, phase)) recombinantCount += counts[h];
  }
  return {
    phase,
    trueR,
    N,
    seed,
    countsByHaplotype: counts,
    observedR: recombinantCount / N,
    recombinantCount,
  };
}

/**
 * 검정교배 자손표 → r_hat = 재조합 자손 수 / N.
 * N<=0이면 null. r_hat>0.5이어도 원자료 유지 (호출자가 라벨 구분).
 */
export function estimateRecombination(
  countsByHaplotype: CountsByHaplotype,
  phase: Phase,
  N: number,
): number | null {
  if (!Number.isInteger(N) || N < 0 || !Number.isFinite(N)) {
    throw new RangeError(`N은 0 이상 정수 (입력: ${N})`);
  }
  if (N === 0) return null;
  let recombinantCount = 0;
  let total = 0;
  for (const h of HAPLOTYPES) {
    const c = countsByHaplotype[h];
    if (!Number.isInteger(c) || c < 0 || !Number.isFinite(c)) {
      throw new RangeError(`개수는 0 이상 정수 (입력: ${h}=${c})`);
    }
    total += c;
    if (isRecombinant(h, phase)) recombinantCount += c;
  }
  if (total !== N) {
    throw new RangeError(`개수 합(${total})이 N(${N})과不一致`);
  }
  return recombinantCount / N;
}
