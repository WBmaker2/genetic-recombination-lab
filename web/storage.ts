/** web/storage.ts — localStorage 기록 저장 (PII 없음) + 메모리 폴백. */
import type { ExperimentRecord } from "../models/record";
import type { SampleResult } from "../engine/sampler";
import { ALLOWED_N } from "../engine/sampler";
import { HAPLOTYPES, isRecombinant, type Phase } from "../engine/haplotypes";

const KEY = "grl.records.v1";
const SESSION_RUNS_KEY = "grl.session-runs.v1";
let memory: ExperimentRecord[] = [];
let fallback = false;

/** 표본만 탭 세션에 임시 보관합니다. 학생 설명은 포함하지 않습니다. */
export function loadSessionRuns(): SampleResult[] {
  try {
    const raw = sessionStorage.getItem(SESSION_RUNS_KEY);
    const parsed = raw ? JSON.parse(raw) as unknown : [];
    if (!Array.isArray(parsed)) {
      sessionStorage.removeItem(SESSION_RUNS_KEY);
      return [];
    }
    const valid = parsed.filter(isSampleResult);
    if (valid.length !== parsed.length) {
      try { sessionStorage.setItem(SESSION_RUNS_KEY, JSON.stringify(valid)); } catch { /* 검증된 메모리 결과는 반환 */ }
    }
    return valid;
  } catch {
    return [];
  }
}

function isSampleResult(value: unknown): value is SampleResult {
  if (!value || typeof value !== "object") return false;
  const run = value as Partial<SampleResult>;
  if ((run.phase !== "AB/ab" && run.phase !== "Ab/aB") ||
      typeof run.trueR !== "number" || !Number.isFinite(run.trueR) || run.trueR < 0 || run.trueR > 0.5 ||
      typeof run.N !== "number" || !ALLOWED_N.includes(run.N as (typeof ALLOWED_N)[number]) ||
      typeof run.seed !== "number" || !Number.isInteger(run.seed) ||
      typeof run.recombinantCount !== "number" || !Number.isInteger(run.recombinantCount) || run.recombinantCount < 0 ||
      !run.countsByHaplotype || typeof run.countsByHaplotype !== "object") return false;
  let total = 0;
  let recombinant = 0;
  for (const h of HAPLOTYPES) {
    const count = run.countsByHaplotype[h];
    if (!Number.isInteger(count) || count < 0) return false;
    total += count;
    if (isRecombinant(h, run.phase as Phase)) recombinant += count;
  }
  if (total !== run.N || recombinant !== run.recombinantCount) return false;
  const expected = run.N === 0 ? null : recombinant / run.N;
  return run.observedR === expected;
}

export function saveSessionRuns(runs: SampleResult[]): boolean {
  try {
    sessionStorage.setItem(SESSION_RUNS_KEY, JSON.stringify(runs));
    return true;
  } catch {
    return false;
  }
}

export function storageStatus(): string {
  return fallback ? "기기 저장 불가 — 현재 세션 + JSON 내보내기 사용" : "기기 저장 사용 중";
}

export function listRecords(): ExperimentRecord[] {
  if (fallback) return [...memory];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as ExperimentRecord[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    fallback = true;
    return [...memory];
  }
}

export function appendRecord(r: ExperimentRecord): void {
  if (fallback) {
    memory.push(r);
    return;
  }
  try {
    const arr = listRecords();
    arr.push(r);
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {
    fallback = true;
    memory = listRecords();
    memory.push(r);
  }
}

export function downloadJson(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}
