/** M2 검증: 프리셋·관대 판정·오개념. */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  P0_PRESETS, gradeParentalSelection, gradeRatio, describeMisconception,
} from "../scenarios/p0";

describe("p0 scenarios", () => {
  it("프리셋 r·N 범위 유효 + 25분 합", () => {
    let minutes = 0;
    for (const p of P0_PRESETS) {
      assert.ok(p.trueR >= 0 && p.trueR <= 0.5);
      assert.ok(Number.isInteger(p.N) && p.N >= 0);
      minutes += p.minutes;
    }
    assert.equal(minutes, 20); // 예측3+표본5+추정7+전이5 (분열5는 데모 모드)
  });

  it("부모형 판정: 순서 무관, 연결상별 역할 교환", () => {
    assert.equal(gradeParentalSelection("AB/ab", ["ab", "AB"]), true);
    assert.equal(gradeParentalSelection("AB/ab", ["AB", "Ab"]), false);
    assert.equal(gradeParentalSelection("Ab/aB", ["Ab", "aB"]), true);
    assert.equal(gradeParentalSelection("Ab/aB", ["AB", "ab"]), false);
  });

  it("비율 판정: 근사 통과, 정확 일치 강제 없음", () => {
    assert.equal(gradeRatio(0.098, 0.1), true);
    assert.equal(gradeRatio(0.2, 0.1), false);
    assert.equal(gradeRatio(Number.NaN, 0.1), false);
  });

  it("오개념 3종 설명 존재", () => {
    for (const id of ["dominant-common", "linear-distance", "single-sample"] as const) {
      const d = describeMisconception(id);
      assert.ok(d.title.length > 0 && d.guidance.length > 0);
    }
  });
});
