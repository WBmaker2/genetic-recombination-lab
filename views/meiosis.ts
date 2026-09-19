/** views/meiosis.ts — 감수분열 단계 SVG (순수 문자열, DOM 의존 없음). */
import type { Haplotype, Phase } from "../engine/haplotypes";
import { getNoCrossoverDemo, getSingleCrossoverDemo } from "../engine/meiosisDemo";

export type MeiosisMode = "no-crossover" | "single";
export const MEIOSIS_STEPS = ["부모 염색체", "복제된 염색분체", "교차", "4개 배우자"] as const;

const HAP_COLOR: Record<Haplotype, string> = {
  AB: "#1E3A5F",
  ab: "#475569",
  Ab: "#0E7C72",
  aB: "#B45309",
};

function chromRect(x: number, label: string, color: string, dashed = false): string {
  return (
    `<g><rect x="${x}" y="30" width="44" height="90" rx="20" fill="${color}"` +
    ` fill-opacity="0.18" stroke="${color}" stroke-width="3"${dashed ? ` stroke-dasharray="7 5"` : ""}/>` +
    `<text x="${x + 22}" y="82" text-anchor="middle" font-size="16" font-weight="700" fill="${color}">${label}</text></g>`
  );
}

/** 단계별 SVG. 동일 ID(c1..c4)·대립유전자 라벨을 3D와 공유. */
export function meiosisSvg(phase: Phase, mode: MeiosisMode, step: number): string {
  const s = Math.max(0, Math.min(3, Math.floor(step)));
  const demo = mode === "single" ? getSingleCrossoverDemo(phase) : getNoCrossoverDemo(phase);
  const parental = phase === "AB/ab" ? ["AB", "ab"] : ["Ab", "aB"];
  let inner = "";
  if (s === 0) {
    inner = chromRect(20, parental[0] as Haplotype, HAP_COLOR[parental[0] as Haplotype]) +
      chromRect(220, parental[1] as Haplotype, HAP_COLOR[parental[1] as Haplotype]);
  } else if (s === 1) {
    inner = demo.chromatidIds
      .map((id, i) => {
        const h = (parental[i < 2 ? 0 : 1] ?? parental[0]) as Haplotype;
        return `<g data-chromatid="${id}">${chromRect(20 + i * 72, h, HAP_COLOR[h])}</g>`;
      })
      .join("");
  } else if (s === 2) {
    inner = demo.chromatidIds
      .map((id, i) => {
        const h = (parental[i < 2 ? 0 : 1] ?? parental[0]) as Haplotype;
        const hot = mode === "single" && (id === "c2" || id === "c3");
        return `<g data-chromatid="${id}">${chromRect(20 + i * 72, h, HAP_COLOR[h], hot)}` +
          (hot ? `<text x="${20 + i * 72 + 22}" y="140" text-anchor="middle" font-size="12" fill="#B45309">교차 구간</text>` : "") +
          `</g>`;
      })
      .join("");
  } else {
    inner = demo.products
      .map((h, i) => `<g data-chromatid="${demo.chromatidIds[i]}">${chromRect(20 + i * 72, h, HAP_COLOR[h])}</g>`)
      .join("");
  }
  const label = `${MEIOSIS_STEPS[s]} (${s + 1}/4) · ${demo.title}`;
  return (
    `<svg viewBox="0 0 340 160" role="img" aria-label="감수분열 시연: ${label}">` +
    `<defs><pattern id="rec-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="white"/><line x1="0" y1="0" x2="0" y2="6" stroke="#0E7C72" stroke-width="2"/></pattern></defs>` +
    `<text x="8" y="16" font-size="13" fill="#0F172A">${label}</text>${inner}</svg>`
  );
}

export const MEIOSIS_MODEL_NOTE = "교육용 과장 모형. 막대 두께·크기는 실제와 다름. 애니메이션 속도는 확률과 무관.";
export const SINGLE_CROSSOVER_NOTE = "4염색분체 중 2개가 재조합되는 예시. 일반 r와 동일시하지 않음.";
