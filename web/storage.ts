/** web/storage.ts — localStorage 기록 저장 (PII 없음) + 메모리 폴백. */
import type { ExperimentRecord } from "../models/record";

const KEY = "grl.records.v1";
let memory: ExperimentRecord[] = [];
let fallback = false;

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
