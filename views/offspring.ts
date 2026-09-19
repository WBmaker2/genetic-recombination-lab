/** views/offspring.ts — 분포 행·막대차트·자손표·요약문 (순수 함수). */
import { isRecombinant, type Haplotype, type Phase } from "../engine/haplotypes";
import type { CountsByHaplotype } from "../engine/sampler";

export interface DistributionRow {
  haplotype: Haplotype;
  count: number;
  ratio: number | null;
  role: "부모형" | "재조합형";
}

const BAR_COLOR: Record<Haplotype, string> = {
  AB: "#1E3A5F",
  ab: "#475569",
  Ab: "#0E7C72",
  aB: "#B45309",
};

const ORDER: Haplotype[] = ["AB", "ab", "Ab", "aB"];

export function distributionRows(
  counts: CountsByHaplotype,
  phase: Phase,
  N: number,
): DistributionRow[] {
  return ORDER.map((h) => ({
    haplotype: h,
    count: counts[h],
    ratio: N > 0 ? counts[h] / N : null,
    role: isRecombinant(h, phase) ? "재조합형" : "부모형",
  }));
}

/** 막대차트 SVG: 범례+직접 수치+축 단위 포함. */
export function barChartSvg(rows: DistributionRow[], N: number): string {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const bars = rows
    .map((r, i) => {
      const h = Math.round((r.count / max) * 110);
      const x = 52 + i * 70;
      const pattern = r.role === "재조합형";
      return (
        `<g tabindex="0" role="img" aria-label="${r.haplotype} ${r.role} ${r.count}개">` +
        `<rect x="${x}" y="${130 - h}" width="40" height="${h}" rx="4" fill="${pattern ? "url(#rec-hatch)" : BAR_COLOR[r.haplotype]}" stroke="${BAR_COLOR[r.haplotype]}" stroke-width="2"/>` +
        `<text x="${x + 20}" y="${124 - h}" text-anchor="middle" font-size="12" font-weight="700" fill="#0F172A">${r.count}</text>` +
        `<text x="${x + 20}" y="146" text-anchor="middle" font-size="12" fill="#0F172A">${r.haplotype}</text></g>`
      );
    })
    .join("");
  const legend =
    `<g font-size="12" fill="#0F172A"><rect x="52" y="152" width="12" height="12" fill="#1E3A5F"/><text x="68" y="162">부모형</text>` +
    `<rect x="140" y="152" width="12" height="12" fill="url(#rec-hatch)" stroke="#0E7C72"/><text x="156" y="162">재조합형(빗금)</text></g>`;
  return (
    `<svg viewBox="0 0 340 172" role="img" aria-label="하플로타입 분포 막대차트, 총 ${N}개">` +
    `<defs><pattern id="rec-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff"/><line x1="0" y1="0" x2="0" y2="6" stroke="#0E7C72" stroke-width="2"/></pattern></defs>` +
    `<text x="8" y="14" font-size="12" fill="#475569">개수 (개)</text>` +
    `<line x1="44" y1="20" x2="44" y2="130" stroke="#CBD5E1"/>` +
    `<line x1="44" y1="130" x2="330" y2="130" stroke="#CBD5E1"/>${bars}${legend}</svg>`
  );
}

/** 자손표 HTML: 고정 순서, 정렬 버튼 포함. */
export function offspringTableHtml(rows: DistributionRow[], N: number): string {
  const body = rows
    .map(
      (r) =>
        `<tr><td>${r.haplotype}</td><td>${r.role}</td>` +
        `<td data-num="${r.count}">${r.count}</td>` +
        `<td>${r.ratio === null ? "—" : r.ratio.toFixed(3)}</td></tr>`,
    )
    .join("");
  return (
    `<table><caption>검정교배 자손표 (상대 ab/ab, 총 ${N}개)</caption><thead><tr>` +
    `<th scope="col">배우자</th><th scope="col">구분</th>` +
    `<th scope="col" aria-sort="none"><button type="button" data-sort="count">개수</button></th>` +
    `<th scope="col">비율</th></tr></thead><tbody>${body}</tbody></table>`
  );
}

/** 스크린리더·기록용 한 문장 요약. */
export function summarySentence(rows: DistributionRow[], N: number, observedR: number | null): string {
  if (N === 0 || observedR === null) return "표본이 없어 추정할 수 없음.";
  const parts = rows.map((r) => `${r.haplotype}(${r.role}) ${r.count}개`).join(", ");
  return `총 ${N}개 중 ${parts}. 재조합 비율 r_hat=${observedR.toFixed(3)}.`;
}
