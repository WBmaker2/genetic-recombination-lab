/** M2 검증: 기록 스키마·파싱. */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRecord, parseRecord, APP_ID, SCHEMA_VERSION } from "../models/record";

const counts = { AB: 450, ab: 452, Ab: 49, aB: 49 };

describe("record", () => {
  it("생성 시 버전·재현 필드 포함", () => {
    const r = createRecord({
      scenarioId: "p0-sampling", phase: "AB/ab", trueR: 0.1, N: 1000, seed: 42,
      countsByHaplotype: counts, observedR: 0.098, recombinantCount: 98,
    });
    assert.equal(r.schemaVersion, SCHEMA_VERSION);
    assert.equal(r.appId, APP_ID);
    assert.equal(r.parameters.engineVersion, "0.1.0");
    assert.ok(r.parameters.scenarioVersion.startsWith("p0-"));
    assert.ok(Date.parse(r.createdAt) > 0);
  });

  it("NaN/Infinity·범위 밖 입력 차단", () => {
    assert.throws(() => createRecord({
      scenarioId: "x", phase: "AB/ab", trueR: Number.NaN, N: 100, seed: 1,
      countsByHaplotype: counts, observedR: 0.1, recombinantCount: 10,
    }), RangeError);
    assert.throws(() => createRecord({
      scenarioId: "x", phase: "AB/ab", trueR: 0.6, N: 100, seed: 1,
      countsByHaplotype: counts, observedR: 0.1, recombinantCount: 10,
    }), RangeError);
    assert.throws(() => createRecord({
      scenarioId: "x", phase: "AB/ab", trueR: 0.1, N: -5, seed: 1,
      countsByHaplotype: counts, observedR: 0.1, recombinantCount: 10,
    }), RangeError);
  });

  it("JSON 왕복 + r_hat>0.5 원자료 유지", () => {
    const r = createRecord({
      scenarioId: "p0-inference", phase: "AB/ab", trueR: 0.5, N: 20, seed: 3,
      countsByHaplotype: { AB: 2, ab: 3, Ab: 8, aB: 7 }, observedR: 0.75, recombinantCount: 15,
    });
    const back = parseRecord(JSON.stringify(r));
    assert.equal(back.observations.observedR, 0.75);
  });

  it("스키마·appId 불일치 거부", () => {
    const r = createRecord({
      scenarioId: "x", phase: "AB/ab", trueR: 0.1, N: 0, seed: 1,
      countsByHaplotype: { AB: 0, ab: 0, Ab: 0, aB: 0 }, observedR: null, recombinantCount: 0,
    });
    assert.throws(() => parseRecord(JSON.stringify({ ...r, appId: "other" })), RangeError);
  });
});
