/** P1 검증: 3유전자 확률표·표본·Haldane·Wilson. */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  TRI_HAPLOTYPES,
  classifyTri,
  estimateIntervals,
  getTriProbabilities,
  haldaneCM,
  sampleTriGametes,
  triProbSum,
  wilson,
} from "../engine/threeGene";
import { P1_PRESET } from "../scenarios/p1";

const EPS = 1e-12;

describe("threeGene", () => {
  it("확률합 1 (r1·r2 그리드, 양 부모상)", () => {
    for (const r1 of [0, 0.1, 0.5]) {
      for (const r2 of [0, 0.15, 0.5]) {
        for (const p of ["ABC", "AbC"] as const) {
          assert.ok(Math.abs(triProbSum(getTriProbabilities(p, r1, r2)) - 1) < EPS);
        }
      }
    }
  });

  it("r1=r2=0이면 부모형만, r=0.5이면 8종 각 1/8", () => {
    const z = getTriProbabilities("ABC", 0, 0);
    assert.equal(z.ABC, 0.5);
    assert.equal(z.abc, 0.5);
    const f = getTriProbabilities("ABC", 0.5, 0.5);
    for (const h of TRI_HAPLOTYPES) assert.ok(Math.abs(f[h] - 0.125) < EPS);
  });

  it("DCO율 = r1·r2 (간섭 없음), 분류와 확률표 일치", () => {
    const probs = getTriProbabilities("ABC", 0.1, 0.2);
    let dco = 0;
    for (const h of TRI_HAPLOTYPES) {
      const cls = classifyTri(h, "ABC");
      if (cls === "dco") dco += probs[h];
      // 확률표 가중치와 분류 교차 검증
      if (h === "ABC" || h === "abc") assert.equal(cls, "parental");
    }
    assert.ok(Math.abs(dco - 0.1 * 0.2) < EPS);
    assert.equal(classifyTri("Abc", "ABC"), "sco1");
    assert.equal(classifyTri("ABc", "ABC"), "sco2");
    assert.equal(classifyTri("AbC", "ABC"), "dco");
  });

  it("표본: seed 재현 + 구간추정 ≈ 참값 + N=0 null", () => {
    const a = sampleTriGametes("ABC", 0.1, 0.15, 2000, 7);
    const b = sampleTriGametes("ABC", 0.1, 0.15, 2000, 7);
    assert.deepEqual(a.counts, b.counts);
    const est = estimateIntervals(a.counts, "ABC", 2000);
    assert.ok(est.r1.rHat !== null && Math.abs(est.r1.rHat - 0.1) < 0.03);
    assert.ok(est.r2.rHat !== null && Math.abs(est.r2.rHat - 0.15) < 0.03);
    assert.ok(est.r1.ci95 !== null && est.r1.ci95[0] <= 0.1 && 0.1 <= est.r1.ci95[1]);
    const z = estimateIntervals(a.counts, "ABC", 0);
    assert.equal(z.r1.rHat, null);
    assert.equal(z.r2.ci95, null);
  });

  it("Haldane: 0→0, 작은 r 선형 근사, 0.5→무한(포화)", () => {
    assert.equal(haldaneCM(0), 0);
    assert.ok(Math.abs(haldaneCM(0.01) - 1) < 0.05);
    assert.equal(haldaneCM(0.5), Number.POSITIVE_INFINITY);
    assert.throws(() => haldaneCM(0.6), RangeError);
    assert.throws(() => haldaneCM(Number.NaN), RangeError);
  });

  it("Wilson: 경계·단조성", () => {
    const [lo, hi] = wilson(98, 1000);
    assert.ok(lo < 0.098 && 0.098 < hi && lo >= 0 && hi <= 1);
    const [lo0] = wilson(0, 100);
    assert.equal(lo0, 0);
    assert.throws(() => wilson(5, 0), RangeError);
  });

  it("P1 프리셋 유효 + 범위 밖 거부", () => {
    assert.ok(P1_PRESET.r1 <= 0.5 && P1_PRESET.r2 <= 0.5 && P1_PRESET.N > 0);
    assert.throws(() => getTriProbabilities("ABC", 0.6, 0.1), RangeError);
    assert.throws(() => sampleTriGametes("ABC", 0.1, 0.1, -1, 1), RangeError);
  });
});
