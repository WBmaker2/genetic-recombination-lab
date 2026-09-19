/** models/record.ts — 실험 기록 스키마·검증 (공통 원칙 §4). 렌더러 의존 없음. */
import { ENGINE_VERSION, SCENARIO_VERSION } from "../engine/index";
import type { CountsByHaplotype } from "../engine/sampler";
import type { Haplotype, Phase } from "../engine/haplotypes";

export const SCHEMA_VERSION = 1;
export const APP_ID = "genetic-recombination-lab";

export interface RecordParameters {
  phase: Phase;
  trueR: number;
  N: number;
  seed: number;
  engineVersion: string;
  scenarioVersion: string;
}

export interface RecordObservations {
  countsByHaplotype: CountsByHaplotype;
  /** N=0이면 null. */
  observedR: number | null;
  recombinantCount: number;
}

export interface ExperimentRecord {
  schemaVersion: number;
  appId: string;
  createdAt: string;
  scenarioId: string;
  parameters: RecordParameters;
  seed: number;
  observations: RecordObservations;
  prediction: { parentalGuess: Haplotype[] | null; rGuess: number | null };
  explanation: string;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function createRecord(input: {
  scenarioId: string;
  phase: Phase;
  trueR: number;
  N: number;
  seed: number;
  countsByHaplotype: CountsByHaplotype;
  observedR: number | null;
  recombinantCount: number;
  parentalGuess?: Haplotype[] | null;
  rGuess?: number | null;
  explanation?: string;
}): ExperimentRecord {
  const { scenarioId, phase, trueR, N, seed } = input;
  if (!scenarioId) throw new RangeError("scenarioId 필수");
  if (phase !== "AB/ab" && phase !== "Ab/aB") throw new RangeError(`phase 오류: ${phase}`);
  if (!isFiniteNumber(trueR) || trueR < 0 || trueR > 0.5) throw new RangeError(`trueR 범위 오류: ${trueR}`);
  if (!Number.isInteger(N) || N < 0) throw new RangeError(`N은 0 이상 정수: ${N}`);
  if (!Number.isInteger(seed) || !Number.isFinite(seed)) throw new RangeError(`seed는 유한 정수: ${seed}`);
  if (input.rGuess !== undefined && input.rGuess !== null) {
    if (!isFiniteNumber(input.rGuess)) throw new RangeError("rGuess는 유한수 또는 null");
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    appId: APP_ID,
    createdAt: new Date().toISOString(),
    scenarioId,
    parameters: { phase, trueR, N, seed, engineVersion: ENGINE_VERSION, scenarioVersion: SCENARIO_VERSION },
    seed,
    observations: {
      countsByHaplotype: { ...input.countsByHaplotype },
      observedR: input.observedR,
      recombinantCount: input.recombinantCount,
    },
    prediction: {
      parentalGuess: input.parentalGuess ?? null,
      rGuess: input.rGuess ?? null,
    },
    explanation: input.explanation ?? "",
  };
}

/** 저장된 JSON 파싱·검증. r_hat>0.5 원자료도 그대로 유지. */
export function parseRecord(json: string): ExperimentRecord {
  const v: unknown = JSON.parse(json);
  if (typeof v !== "object" || v === null) throw new RangeError("기록이 객체가 아님");
  const r = v as Record<string, unknown>;
  if (r.schemaVersion !== SCHEMA_VERSION) throw new RangeError("schemaVersion 불일치");
  if (r.appId !== APP_ID) throw new RangeError("appId 불일치");
  const p = r.parameters as Record<string, unknown>;
  if (!isFiniteNumber(p.trueR) || (p.trueR as number) < 0 || (p.trueR as number) > 0.5) {
    throw new RangeError("trueR 범위 오류");
  }
  if (!Number.isInteger(p.N) || (p.N as number) < 0) throw new RangeError("N 오류");
  return v as ExperimentRecord;
}
