/** M3 검증: views 순수 빌더 (ID·라벨·범례·12종). */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { meiosisSvg } from "../views/meiosis";
import { distributionRows, barChartSvg, offspringTableHtml, summarySentence } from "../views/offspring";
import { organismSvg, organismManifest } from "../views/organism";

describe("views", () => {
  it("감수분열 SVG: c1..c4 + 대립유전자 + 교차 표식 구분", () => {
    const single = meiosisSvg("AB/ab", "single", 2);
    assert.ok(single.includes("c2") && single.includes("교차 구간"));
    const none = meiosisSvg("AB/ab", "no-crossover", 2);
    assert.ok(!none.includes("교차 구간"));
    const done = meiosisSvg("Ab/aB", "single", 3);
    for (const id of ["c1", "c2", "c3", "c4"]) assert.ok(done.includes(id));
  });

  it("분포 행 합=N + 차트 범례·수치 + 표 단위", () => {
    const counts = { AB: 450, ab: 452, Ab: 49, aB: 49 };
    const rows = distributionRows(counts, "AB/ab", 1000);
    assert.equal(rows.reduce((s, r) => s + r.count, 0), 1000);
    assert.equal(rows.find((r) => r.haplotype === "Ab")?.role, "재조합형");
    const svg = barChartSvg(rows, 1000);
    assert.ok(svg.includes("부모형") && svg.includes("재조합형") && svg.includes("450"));
    const html = offspringTableHtml(rows, 1000);
    assert.ok(html.includes("검정교배") && html.includes("data-sort"));
    assert.ok(summarySentence(rows, 1000, 0.098).includes("r_hat=0.098"));
    assert.equal(summarySentence(rows, 0, null), "표본이 없어 추정할 수 없음.");
  });

  it("가상생물 12종: 동일 구도 + 두 특성만 변경", () => {
    const manifest = organismManifest();
    assert.equal(manifest.length, 12);
    const ids = new Set(manifest.map((m) => m.id));
    assert.equal(ids.size, 12);
    const a = organismSvg("AB", 0);
    const b = organismSvg("ab", 0);
    assert.ok(a.includes('viewBox="0 0 140 120"') && b.includes('viewBox="0 0 140 120"'));
    assert.notEqual(a, b);
  });

  it("가상생물 이미지 대응: haplotype↔파일 1:1 + 대소문자 안전명", () => {
    const expected: Record<string, string> = {
      AB: "org-teal-striped",
      Ab: "org-teal-spotted",
      aB: "org-gray-striped",
      ab: "org-gray-spotted",
    };
    const manifest = organismManifest();
    for (const m of manifest) {
      assert.ok(m.imageFile.startsWith(expected[m.haplotype]), m.id);
      assert.ok(m.imageFile.endsWith(`-${m.variant}.webp`), m.id);
    }
    const files = new Set(manifest.map((m) => m.imageFile.toLowerCase()));
    assert.equal(files.size, 12);
  });
});
