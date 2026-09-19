/** web/state.ts — 앱 상태 (DOM 제외, 단일 진실 공급원). */
import type { Haplotype, Phase } from "../engine/haplotypes";
import type { MeiosisMode } from "../views/meiosis";
import type { SampleResult } from "../engine/sampler";

export type StepName = "setup" | "meiosis" | "sampling" | "inference" | "review" | "p1";

export const state = {
  step: "setup" as StepName,
  phase: "AB/ab" as Phase,
  trueR: 0.1,
  N: 1000 as number,
  seed: 42 as number,
  parentalGuess: [] as Haplotype[],
  demoMode: "no-crossover" as MeiosisMode,
  demoStep: 0 as number,
  runs: [] as SampleResult[],
  runSeq: 0 as number,
  selectedRun: null as number | null,
  tableSortDesc: true as boolean,
};
