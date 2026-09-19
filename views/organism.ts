/** views/organism.ts — 가상 정원 생물 SVG (코드 생성, AI 이미지 대체 MVP). */
import type { Haplotype } from "../engine/haplotypes";

/** 두 특성만 변경: 몸색(A/a) × 무늬(B/b). 동일 구도·크기. */
const BODY: Record<string, string> = { A: "#2DD4BF", a: "#94A3B8" };

export type OrganismVariant = 0 | 1 | 2;

export interface OrganismAsset {
  id: string;
  haplotype: Haplotype;
  variant: OrganismVariant;
  alt: string;
  semanticLabels: string[];
  /** 배포 이미지 파일명 (web/public/organisms). 대소문자 충돌 회피용 표현형 기반 명명. */
  imageFile: string;
}

/** 하플로타입→표현형 파일명 (대소문자 비구분 FS 안전). */
export function phenotypeFile(haplotype: Haplotype, variant: OrganismVariant): string {
  const color = haplotype.includes("A") ? "teal" : "gray";
  const pattern = haplotype.includes("B") ? "striped" : "spotted";
  return `org-${color}-${pattern}-${variant}.webp`;
}

/** 하플로타입→표현형: A_ 초록몸/aa 회색몸, B_ 줄무늬/bb 점무늬. */
export function organismSvg(haplotype: Haplotype, variant: OrganismVariant): string {
  const body = haplotype.includes("A") ? BODY.A : BODY.a;
  const striped = haplotype.includes("B");
  const dy = variant === 0 ? 0 : variant === 1 ? -3 : 3;
  const deco = striped
    ? `<path d="M30 ${70 + dy} q20 -12 40 0 q20 12 40 0" stroke="#0F172A" stroke-width="4" fill="none"/>`
    : `<g fill="#0F172A"><circle cx="55" cy="${68 + dy}" r="4"/><circle cx="75" cy="${74 + dy}" r="4"/><circle cx="95" cy="${68 + dy}" r="4"/></g>`;
  return (
    `<svg viewBox="0 0 140 120" role="img" aria-label="가상 정원 생물 ${haplotype} 변형 ${variant + 1}">` +
    `<ellipse cx="70" cy="${72 + dy}" rx="42" ry="30" fill="${body}" stroke="#0F172A" stroke-width="3"/>${deco}` +
    `<circle cx="58" cy="${52 + dy}" r="5" fill="#fff" stroke="#0F172A" stroke-width="2"/>` +
    `<circle cx="82" cy="${52 + dy}" r="5" fill="#fff" stroke="#0F172A" stroke-width="2"/></svg>`
  );
}

/** P0 12종 매니페스트 (표현형 4 × 개체 3). */
export function organismManifest(): OrganismAsset[] {
  const out: OrganismAsset[] = [];
  (["AB", "Ab", "aB", "ab"] as Haplotype[]).forEach((h) => {
    ([0, 1, 2] as OrganismVariant[]).forEach((v) => {
      out.push({
        id: `org-${h}-${v}`,
        haplotype: h,
        variant: v,
        alt: `가상 정원 생물: 배우자 ${h} 표현형, 개체 ${v + 1}`,
        semanticLabels: [`haplotype:${h}`, `variant:${v}`, "virtual-specimen"],
        imageFile: phenotypeFile(h, v),
      });
    });
  });
  return out;
}
