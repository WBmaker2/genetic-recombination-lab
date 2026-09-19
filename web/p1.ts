/** web/p1.ts — P1 심화 단계 (세 유전자·이중교차·Wilson 구간·Haldane 지도). */
import {
  TRI_HAPLOTYPES,
  classifyTri,
  estimateIntervals,
  haldaneCM,
  sampleTriGametes,
} from "../engine/threeGene";
import { P1_NOTES, P1_PRESET } from "../scenarios/p1";

function el<T extends HTMLElement>(id: string): T {
  const n = document.getElementById(id);
  if (!n) throw new Error(`#${id} 없음`);
  return n as T;
}

function fmtCM(r: number): string {
  const d = haldaneCM(r);
  if (!Number.isFinite(d)) return "∞ (포화: r=0.5에서 지도거리 무한)";
  return `${d.toFixed(1)} cM`;
}

export function initP1(): void {
  const info = el("p1Preset");
  info.textContent =
    `${P1_PRESET.title} — 부모 ${P1_PRESET.parental}/abc, r1=${P1_PRESET.r1}(A–B), r2=${P1_PRESET.r2}(B–C), N=${P1_PRESET.N}, seed=${P1_PRESET.seed}. 간섭 없음 가정.`;
  el("p1Notes").innerHTML = P1_NOTES.map((n) => `<li>${n}</li>`).join("");
  el("p1GenBtn").addEventListener("click", () => {
    const s = sampleTriGametes(P1_PRESET.parental, P1_PRESET.r1, P1_PRESET.r2, P1_PRESET.N, P1_PRESET.seed);
    const est = estimateIntervals(s.counts, s.parental, s.N);
    const rows = TRI_HAPLOTYPES.map((h) => {
      const c = s.counts[h];
      const cls = { parental: "부모형", sco1: "SCO1", sco2: "SCO2", dco: "DCO" }[classifyTri(h, s.parental)];
      return `<tr><td>${h}</td><td>${cls}</td><td data-num="${c}">${c}</td><td>${(c / s.N).toFixed(3)}</td></tr>`;
    }).join("");
    el("p1Table").innerHTML =
      `<table><caption>세 유전자 자손표 (검정교배 abc/abc, 총 ${s.N}개)</caption>` +
      `<thead><tr><th scope="col">배우자</th><th scope="col">구분</th><th scope="col">개수</th><th scope="col">비율</th></tr></thead>` +
      `<tbody>${rows}</tbody></table>`;
    const line = (label: string, rHat: number | null, ci: [number, number] | null, rTrue: number): string => {
      if (rHat === null || ci === null) return `${label}: 추정 불가(N=0).`;
      return `${label}: r_hat=${rHat.toFixed(3)} (95% 구간 ${ci[0].toFixed(3)}〜${ci[1].toFixed(3)}), 참 r=${rTrue}, 지도거리 ${fmtCM(rTrue)}.`;
    };
    el("p1Result").innerHTML =
      `<p>${line("A–B 구간", est.r1.rHat, est.r1.ci95, s.r1)}</p>` +
      `<p>${line("B–C 구간", est.r2.rHat, est.r2.ci95, s.r2)}</p>` +
      `<p>DCO 관측 ${est.r1.dco}개 (기대 ≈ ${(s.r1 * s.r2 * s.N).toFixed(1)}개, 간섭 없음 가정).</p>`;
  });
}
