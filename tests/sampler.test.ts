/** M1 검증: seed 재현·연결상 라벨·N=0 (설계 §10). */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getParentalHaplotypes,
  getRecombinantHaplotypes,
  isParental,
  type Haplotype,
} from "../engine/haplotypes";
import {
  estimateRecombination,
  sampleGametes,
} from "../engine/sampler";
import { getSingleCrossoverDemo } from "../engine/meiosisDemo";

describe("sampler", () => {
  it("동일 seed+입력은 동일 표본", () => {
    const a = sampleGametes({ phase: "AB/ab", trueR: 0.1, N: 1000, seed: 42 });
    const b = sampleGametes({ phase: "AB/ab", trueR: 0.1, N: 1000, seed: 42 });
    assert.deepEqual(a.countsByHaplotype, b.countsByHaplotype);
    assert.equal(a.observedR, b.observedR);
  });

  it("다른 seed는 (거의 확실히) 다른 표본", () => {
    const a = sampleGametes({ phase: "AB/ab", trueR: 0.1, N: 1000, seed: 1 });
    const b = sampleGametes({ phase: "AB/ab", trueR: 0.1, N: 1000, seed: 2 });
    assert.notDeepEqual(a.countsByHaplotype, b.countsByHaplotype);
  });

  it("N=0은 추정 null + 전량 0", () => {
    const r = sampleGametes({ phase: "AB/ab", trueR: 0.1, N: 0, seed: 7 });
    assert.equal(r.observedR, null);
    assert.deepEqual(r.countsByHaplotype, { AB: 0, ab: 0, Ab: 0, aB: 0 });
    assert.equal(estimateRecombination(r.countsByHaplotype, "AB/ab", 0), null);
  });

  it("연결상 변경 시 부모형/재조합형 라벨 대응", () => {
    assert.deepEqual(getParentalHaplotypes("AB/ab"), ["AB", "ab"]);
    assert.deepEqual(getRecombinantHaplotypes("AB/ab"), ["Ab", "aB"]);
    assert.deepEqual(getParentalHaplotypes("Ab/aB"), ["Ab", "aB"]);
    assert.deepEqual(getRecombinantHaplotypes("Ab/aB"), ["AB", "ab"]);
    assert.equal(isParental("AB", "AB/ab"), true);
    assert.equal(isParental("AB", "Ab/aB"), false);
  });

  it("표본 합=N, observedR=재조합/N", () => {
    const r = sampleGametes({ phase: "AB/ab", trueR: 0.2, N: 100, seed: 123 });
    const total =
      r.countsByHaplotype.AB + r.countsByHaplotype.ab + r.countsByHaplotype.Ab + r.countsByHaplotype.aB;
    assert.equal(total, 100);
    assert.equal(r.observedR, r.recombinantCount / 100);
  });

  it("단일 교차 시연 전수 검사: 4중 2 부모형+2 재조합형", () => {
    for (const phase of ["AB/ab", "Ab/aB"] as const) {
      const demo = getSingleCrossoverDemo(phase);
      assert.equal(demo.products.length, 4);
      const parental = demo.products.filter((h: Haplotype) => isParental(h, phase));
      assert.equal(parental.length, 2);
    }
  });
});
