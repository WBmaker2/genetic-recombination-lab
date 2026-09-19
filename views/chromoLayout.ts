/** views/chromoLayout.ts — 3D 배치 수학 (순수 함수, three/DOM 의존 없음). */
import { getParentalHaplotypes, isRecombinant, type Haplotype, type Phase } from "../engine/haplotypes";
import { getNoCrossoverDemo, getSingleCrossoverDemo } from "../engine/meiosisDemo";
import type { MeiosisMode } from "./meiosis";

export interface ChromatidLayout {
  id: string;
  homolog: 0 | 1;
  alleles: Haplotype;
  recombinant: boolean;
  crossover: boolean;
  x: number;
}

/** 단계별 4염색분체 배치. x는 월드 단위(염색분체 간격 1.4). */
export function layoutChromatids(phase: Phase, mode: MeiosisMode, step: number): ChromatidLayout[] {
  const s = Math.max(0, Math.min(3, Math.floor(step)));
  const demo = mode === "single" ? getSingleCrossoverDemo(phase) : getNoCrossoverDemo(phase);
  const parental = getParentalHaplotypes(phase);
  const spread = s === 0 ? 2.2 : 1.4;
  return demo.chromatidIds.map((id, i) => {
    const homolog = (i < 2 ? 0 : 1) as 0 | 1;
    const alleles = s < 3 ? parental[homolog] : demo.products[i];
    const crossover = mode === "single" && s >= 2 && (id === "c2" || id === "c3");
    return {
      id,
      homolog,
      alleles,
      recombinant: isRecombinant(alleles, phase),
      crossover,
      x: (i - 1.5) * spread + (s === 3 ? (i < 2 ? -0.6 : 0.6) : 0),
    };
  });
}

/** 상동체·염색분체 색 (MASTER haplotype 팔레트, 3D는 색+라벨+줄무늬 질감). */
export const CHROMO_COLORS: Record<Haplotype, string> = {
  AB: "#1E3A5F",
  ab: "#475569",
  Ab: "#0E7C72",
  aB: "#B45309",
};
