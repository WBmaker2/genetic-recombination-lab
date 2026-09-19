/** M1 검증: 이론 확률 경계값 (설계 §10). node:test + assert/strict. */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getGameteProbabilities, probSum } from "../engine/recombination";

const EPS = 1e-12;

describe("recombination probabilities", () => {
  it("r=0이면 부모형만 (AB/ab)", () => {
    const p = getGameteProbabilities("AB/ab", 0);
    assert.equal(p.AB, 0.5);
    assert.equal(p.ab, 0.5);
    assert.equal(p.Ab, 0);
    assert.equal(p.aB, 0);
  });

  it("r=0.5이면 네 조합 각 0.25", () => {
    for (const phase of ["AB/ab", "Ab/aB"] as const) {
      const p = getGameteProbabilities(phase, 0.5);
      for (const h of ["AB", "ab", "Ab", "aB"] as const) {
        assert.ok(Math.abs(p[h] - 0.25) < EPS, `${phase} ${h}=${p[h]}`);
      }
    }
  });

  it("AB/ab r=0.1이면 0.45/0.45/0.05/0.05", () => {
    const p = getGameteProbabilities("AB/ab", 0.1);
    assert.ok(Math.abs(p.AB - 0.45) < EPS);
    assert.ok(Math.abs(p.ab - 0.45) < EPS);
    assert.ok(Math.abs(p.Ab - 0.05) < EPS);
    assert.ok(Math.abs(p.aB - 0.05) < EPS);
  });

  it("Ab/aB에서는 부모형/재조합형 역할 교환", () => {
    const p = getGameteProbabilities("Ab/aB", 0.1);
    assert.ok(Math.abs(p.Ab - 0.45) < EPS);
    assert.ok(Math.abs(p.aB - 0.45) < EPS);
    assert.ok(Math.abs(p.AB - 0.05) < EPS);
    assert.ok(Math.abs(p.ab - 0.05) < EPS);
  });

  it("확률합 1 (r 그리드)", () => {
    for (const r of [0, 0.05, 0.1, 0.25, 0.5]) {
      for (const phase of ["AB/ab", "Ab/aB"] as const) {
        assert.ok(Math.abs(probSum(getGameteProbabilities(phase, r)) - 1) < EPS);
      }
    }
  });

  it("범위 밖 r 거부 + NaN/Infinity 거부", () => {
    for (const bad of [-0.01, 0.5001, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.throws(() => getGameteProbabilities("AB/ab", bad), RangeError);
    }
  });
});
