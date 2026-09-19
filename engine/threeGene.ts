/** engine/threeGene.ts — P1 세 유전자 지도 (순수 함수). 간섭 없음 가정 명시. */
import { mulberry32 } from "./sampler";

export const TRI_HAPLOTYPES = ["ABC", "ABc", "AbC", "Abc", "aBC", "aBc", "abC", "abc"] as const;
export type TriHaplotype = (typeof TRI_HAPLOTYPES)[number];

export type TriBits = [0 | 1, 0 | 1, 0 | 1];

export function triToBits(h: TriHaplotype): TriBits {
  return [h[0] === "A" ? 1 : 0, h[1] === "B" ? 1 : 0, h[2] === "C" ? 1 : 0] as TriBits;
}

export function bitsToTri(b: TriBits): TriHaplotype {
  return `${b[0] ? "A" : "a"}${b[1] ? "B" : "b"}${b[2] ? "C" : "c"}` as TriHaplotype;
}

/** 상보적 부모 한 쌍 (p2 = p1 전체 뒤집기). */
export function complementTri(h: TriHaplotype): TriHaplotype {
  const b = triToBits(h);
  return bitsToTri([(1 - b[0]) as 0 | 1, (1 - b[1]) as 0 | 1, (1 - b[2]) as 0 | 1]);
}

export type TriClass = "parental" | "sco1" | "sco2" | "dco";

/** 부모 p 기준 배우자 분류. 상보형(q)은 두 번째 부모형. */
export function classifyTri(h: TriHaplotype, parental: TriHaplotype): TriClass {
  const p = triToBits(parental);
  const b = triToBits(h);
  const key = `${b[0] !== p[0] ? 1 : 0}${b[1] !== p[1] ? 1 : 0}${b[2] !== p[2] ? 1 : 0}`;
  switch (key) {
    case "000":
    case "111":
      return "parental";
    case "100":
    case "011":
      return "sco1";
    case "001":
    case "110":
      return "sco2";
    case "101":
    case "010":
      return "dco";
    default:
      throw new RangeError(`분류 불가 haplotype (부모 ${parental} 기준): ${h}`);
  }
}

export type TriProbs = Record<TriHaplotype, number>;

export function isValidIntervalR(r: number): boolean {
  return Number.isFinite(r) && r >= 0 && r <= 0.5;
}

/**
 * 세 유전자 이론 확률 (간섭 없음: DCO율 = r1·r2).
 * - 부모형 각 (1-r1)(1-r2)/2, SCO1 각 r1(1-r2)/2, SCO2 각 (1-r1)r2/2, DCO 각 r1r2/2.
 */
export function getTriProbabilities(parental: TriHaplotype, r1: number, r2: number): TriProbs {
  if (!isValidIntervalR(r1) || !isValidIntervalR(r2)) {
    throw new RangeError(`r1·r2는 [0,0.5] (입력: ${r1}, ${r2})`);
  }
  const p = triToBits(parental);
  const q: TriBits = [(1 - p[0]) as 0 | 1, (1 - p[1]) as 0 | 1, (1 - p[2]) as 0 | 1];
  const at = (b: TriBits): TriHaplotype => bitsToTri(b);
  const wPar = ((1 - r1) * (1 - r2)) / 2;
  const wS1 = (r1 * (1 - r2)) / 2;
  const wS2 = ((1 - r1) * r2) / 2;
  const wD = (r1 * r2) / 2;
  const out = {} as TriProbs;
  out[at(p)] = wPar;
  out[at(q)] = wPar;
  out[at([q[0], p[1], p[2]])] = wS1;
  out[at([p[0], q[1], q[2]])] = wS1;
  out[at([p[0], p[1], q[2]])] = wS2;
  out[at([q[0], q[1], p[2]])] = wS2;
  out[at([q[0], p[1], q[2]])] = wD;
  out[at([p[0], q[1], p[2]])] = wD;
  return out;
}

export function triProbSum(probs: TriProbs): number {
  return TRI_HAPLOTYPES.reduce((s, h) => s + probs[h], 0);
}

export type TriCounts = Record<TriHaplotype, number>;

export function zeroTriCounts(): TriCounts {
  return { ABC: 0, ABc: 0, AbC: 0, Abc: 0, aBC: 0, aBc: 0, abC: 0, abc: 0 };
}

export interface TriSample {
  parental: TriHaplotype;
  r1: number;
  r2: number;
  N: number;
  seed: number;
  counts: TriCounts;
}

export function sampleTriGametes(parental: TriHaplotype, r1: number, r2: number, N: number, seed: number): TriSample {
  if (!Number.isInteger(N) || N < 0) throw new RangeError(`N은 0 이상 정수: ${N}`);
  if (!Number.isInteger(seed) || !Number.isFinite(seed)) throw new RangeError(`seed는 유한 정수: ${seed}`);
  const counts = zeroTriCounts();
  if (N === 0) return { parental, r1, r2, N, seed, counts };
  const probs = getTriProbabilities(parental, r1, r2);
  const edges = TRI_HAPLOTYPES.map((h) => probs[h]);
  const rand = mulberry32(seed);
  for (let i = 0; i < N; i++) {
    const u = rand();
    let acc = 0;
    let pick: TriHaplotype = TRI_HAPLOTYPES[TRI_HAPLOTYPES.length - 1];
    for (let k = 0; k < edges.length; k++) {
      acc += edges[k];
      if (u < acc) {
        pick = TRI_HAPLOTYPES[k];
        break;
      }
    }
    counts[pick] += 1;
  }
  return { parental, r1, r2, N, seed, counts };
}

export interface IntervalEstimate {
  /** 구간 재조합률 추정치 (SCO + DCO)/N. N=0이면 null. */
  rHat: number | null;
  sco: number;
  dco: number;
  /** 95% Wilson 구간. N=0이면 null. */
  ci95: [number, number] | null;
}

/** Wilson 점수 구간 (z=1.96). */
export function wilson(k: number, n: number, z = 1.96): [number, number] {
  if (!Number.isInteger(k) || !Number.isInteger(n) || k < 0 || n <= 0 || k > n) {
    throw new RangeError(`Wilson 입력 오류 k=${k} n=${n}`);
  }
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return [Math.max(0, center - half), Math.min(1, center + half)];
}

/** 검정교배(abc/abc) 가정: 구간별 SCO+DCO 집계 → 추정치 + Wilson 구간. */
export function estimateIntervals(counts: TriCounts, parental: TriHaplotype, N: number): { r1: IntervalEstimate; r2: IntervalEstimate } {
  if (!Number.isInteger(N) || N < 0) throw new RangeError(`N 오류: ${N}`);
  if (N === 0) {
    const e: IntervalEstimate = { rHat: null, sco: 0, dco: 0, ci95: null };
    return { r1: e, r2: { ...e } };
  }
  let total = 0;
  let sco1 = 0;
  let sco2 = 0;
  let dco = 0;
  for (const h of TRI_HAPLOTYPES) {
    const c = counts[h];
    if (!Number.isInteger(c) || c < 0) throw new RangeError(`개수 오류 ${h}=${c}`);
    total += c;
    const cls = classifyTri(h, parental);
    if (cls === "sco1") sco1 += c;
    else if (cls === "sco2") sco2 += c;
    else if (cls === "dco") dco += c;
  }
  if (total !== N) throw new RangeError(`합(${total})≠N(${N})`);
  const mk = (sco: number): IntervalEstimate => {
    const k = sco + dco;
    return { rHat: k / N, sco, dco, ci95: wilson(k, N) };
  };
  return { r1: mk(sco1), r2: mk(sco2) };
}

/**
 * Haldane 지도거리 (cM). r→0.5에서 ∞(포화). 작은 r에서는 ≈ r(선형 근사).
 */
export function haldaneCM(r: number): number {
  if (!Number.isFinite(r) || r < 0 || r > 0.5) throw new RangeError(`r 범위 오류: ${r}`);
  if (r === 0) return 0;
  if (r >= 0.5) return Number.POSITIVE_INFINITY;
  return -50 * Math.log(1 - 2 * r);
}
