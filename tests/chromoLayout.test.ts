/** threeGene + chromoLayout 검증. */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { layoutChromatids } from "../views/chromoLayout";
import { getSingleCrossoverDemo } from "../engine/meiosisDemo";

describe("chromoLayout", () => {
  it("4염색분체 c1..c4 + 상동체 배정", () => {
    const layout = layoutChromatids("AB/ab", "single", 1);
    assert.equal(layout.length, 4);
    assert.deepEqual(layout.map((c) => c.id), ["c1", "c2", "c3", "c4"]);
    assert.deepEqual(layout.map((c) => c.homolog), [0, 0, 1, 1]);
    assert.deepEqual(layout.map((c) => c.alleles), ["AB", "AB", "ab", "ab"]);
  });

  it("단일교차: c2·c3 강조 + 4결과물 일치", () => {
    const layout = layoutChromatids("AB/ab", "single", 3);
    assert.deepEqual(layout.map((c) => c.crossover), [false, true, true, false]);
    assert.deepEqual(
      layout.map((c) => c.alleles),
      getSingleCrossoverDemo("AB/ab").products,
    );
    const recomb = layout.filter((c) => c.recombinant).map((c) => c.alleles);
    assert.deepEqual(recomb, ["Ab", "aB"]);
  });

  it("무교차: 재조합 없음 + 단계별 x spread", () => {
    const layout = layoutChromatids("Ab/aB", "no-crossover", 3);
    assert.ok(layout.every((c) => !c.recombinant && !c.crossover));
    const xs0 = layoutChromatids("AB/ab", "single", 0).map((c) => c.x);
    const xs1 = layoutChromatids("AB/ab", "single", 1).map((c) => c.x);
    assert.ok(Math.max(...xs0.map(Math.abs)) > Math.max(...xs1.map(Math.abs)));
  });
});
