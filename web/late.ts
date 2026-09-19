/** web/late.ts — 표본·추정·기록 (DOM 배선). 엔진은 순수 함수만 사용. */
import { state } from "./state";
import { getGameteProbabilities } from "../engine/recombination";
import { HAPLOTYPES, isRecombinant, type Haplotype } from "../engine/haplotypes";
import { estimateRecombination, mulberry32, zeroCounts, type SampleResult } from "../engine/sampler";
import { gradeParentalSelection, gradeRatio } from "../scenarios/p0";
import { createRecord, parseRecord } from "../models/record";
import { barChartSvg, distributionRows, offspringTableHtml, summarySentence } from "../views/offspring";
import { appendRecord, downloadJson, listRecords } from "./storage";

function el<T extends HTMLElement>(id: string): T {
  const n = document.getElementById(id);
  if (!n) throw new Error(`#${id} 없음`);
  return n as T;
}

let aborter: AbortController | null = null;
let runToken = 0;

async function generateChunked(
  onProgress: (p: number) => void,
  signal: AbortSignal,
): Promise<SampleResult> {
  const { phase, trueR, N, seed } = state;
  const probs = getGameteProbabilities(phase, trueR);
  const edges = HAPLOTYPES.map((h) => probs[h]);
  const counts = zeroCounts();
  const rand = mulberry32(seed);
  const CHUNK = 2000;
  for (let i = 0; i < N; i++) {
    const u = rand();
    let acc = 0;
    let pick: Haplotype = "AB";
    for (let k = 0; k < edges.length; k++) {
      acc += edges[k];
      if (u < acc) {
        pick = HAPLOTYPES[k];
        break;
      }
    }
    counts[pick] += 1;
    if (i % CHUNK === 0) {
      onProgress(N === 0 ? 1 : i / N);
      await new Promise((r) => setTimeout(r, 0));
      if (signal.aborted) throw new DOMException("aborted", "AbortError");
    }
  }
  onProgress(1);
  let recombinant = 0;
  for (const h of HAPLOTYPES) if (isRecombinant(h, phase)) recombinant += counts[h];
  return {
    phase, trueR, N, seed, countsByHaplotype: counts,
    observedR: N === 0 ? null : recombinant / N, recombinantCount: recombinant,
  };
}

function renderLatest(): void {
  const run = state.runs[state.runs.length - 1];
  const summary = el("sampleSummary");
  const chartBox = el("chartBox");
  const tableBox = el("tableBox");
  if (!run) {
    summary.textContent = "아직 표본이 없음. 표본 생성을 누르세요.";
    chartBox.innerHTML = "";
    tableBox.innerHTML = "";
    renderRunList();
    renderRunSelect();
    return;
  }
  let rows = distributionRows(run.countsByHaplotype, run.phase, run.N);
  if (state.tableSortDesc) rows = [...rows].sort((a, b) => b.count - a.count);
  summary.textContent = `실행 #${state.runs.length} (seed ${run.seed}, 참 r=${run.trueR}, ${run.phase}): ` +
    summarySentence(distributionRows(run.countsByHaplotype, run.phase, run.N), run.N, run.observedR);
  chartBox.innerHTML = run.N === 0 ? "<p>표본이 없어 차트 없음.</p>" : barChartSvg(rows, run.N);
  tableBox.innerHTML = offspringTableHtml(rows, run.N);
  const sortBtn = tableBox.querySelector('[data-sort]') as HTMLButtonElement | null;
  sortBtn?.addEventListener("click", () => {
    state.tableSortDesc = !state.tableSortDesc;
    sortBtn.parentElement?.setAttribute("aria-sort", state.tableSortDesc ? "descending" : "ascending");
    renderLatest();
  });
  renderRunList();
  renderRunSelect();
}

function renderRunList(): void {
  const ul = el("runList");
  ul.innerHTML = state.runs
    .map((r, i) => `<li>실행 #${i + 1} · ${r.phase} · N=${r.N} · seed=${r.seed} · 참 r=${r.trueR} · r_hat=${r.observedR === null ? "추정 불가" : r.observedR.toFixed(3)}</li>`)
    .join("");
}

function renderRunSelect(): void {
  const box = el("runSelect");
  box.innerHTML = state.runs
    .map((r, i) => `<label><input type="radio" name="runSel" value="${i}" ${state.selectedRun === i ? "checked" : ""} /> 실행 #${i + 1} (N=${r.N}, ${r.phase})</label>`)
    .join("") || "<p>먼저 표본을 생성하세요.</p>";
  box.querySelectorAll('input[name="runSel"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      state.selectedRun = Number((radio as HTMLInputElement).value);
      const run = state.runs[state.selectedRun];
      if (run) {
        el<HTMLInputElement>("numInput").value = String(run.recombinantCount);
        el<HTMLInputElement>("denInput").value = String(run.N);
      }
    });
  });
  const selected = state.selectedRun !== null ? state.runs[state.selectedRun] : undefined;
  if (selected) {
    el<HTMLInputElement>("numInput").value = String(selected.recombinantCount);
    el<HTMLInputElement>("denInput").value = String(selected.N);
  }
}

function initSampling(): void {
  const genBtn = el<HTMLButtonElement>("genBtn");
  const cancelBtn = el<HTMLButtonElement>("cancelBtn");
  const progress = el<HTMLProgressElement>("genProgress");
  genBtn.addEventListener("click", async () => {
    const myToken = ++runToken;
    aborter = new AbortController();
    genBtn.disabled = true;
    cancelBtn.disabled = false;
    progress.hidden = false;
    genBtn.setAttribute("aria-busy", "true");
    try {
      const run = await generateChunked((p) => {
        progress.value = p;
      }, aborter.signal);
      if (myToken !== runToken) return; // 오래된 작업 무시
      state.runs.push(run);
      state.runSeq += 1;
      state.selectedRun = state.runs.length - 1;
      renderLatest();
    } catch (e) {
      if ((e as DOMException).name !== "AbortError") throw e;
      el("sampleSummary").textContent = "생성이 정지됨. 다시 시도 가능.";
    } finally {
      genBtn.disabled = false;
      cancelBtn.disabled = true;
      progress.hidden = true;
      genBtn.removeAttribute("aria-busy");
    }
  });
  cancelBtn.addEventListener("click", () => aborter?.abort());
}

function initInference(): void {
  el("calcBtn").addEventListener("click", () => {
    const err = el("inferError");
    const out = el("inferResult");
    const run = state.selectedRun !== null ? state.runs[state.selectedRun] : undefined;
    if (!run) {
      err.hidden = false;
      err.textContent = "실행을 먼저 선택하세요.";
      return;
    }
    const num = Number(el<HTMLInputElement>("numInput").value);
    const den = Number(el<HTMLInputElement>("denInput").value);
    if (!Number.isInteger(num) || num < 0 || !Number.isInteger(den) || den < 0) {
      err.hidden = false;
      err.textContent = "개수는 0 이상 정수로 입력.";
      return;
    }
    if (den === 0) {
      err.hidden = false;
      err.textContent = "N=0에서는 추정하지 않음.";
      return;
    }
    if (num > den) {
      err.hidden = false;
      err.textContent = "재조합 수가 전체를 넘을 수 없음.";
      return;
    }
    err.hidden = true;
    const userR = num / den;
    const expected = estimateRecombination(run.countsByHaplotype, run.phase, run.N);
    const ok = expected !== null && gradeRatio(userR, expected, 1e-9);
    const over = userR > 0.5 ? " 표본 변동 가능 — 원자료 유지, 참 모수 범위와 구분." : "";
    out.textContent =
      `r_hat=${userR.toFixed(3)} (재조합 ${num}/${den}). ` +
      `선택 실행의 r_hat=${expected === null ? "추정 불가" : expected.toFixed(3)}, 참 r=${run.trueR}. ` +
      (ok ? "계산 정확." : "계산이 실행값과 다름 — 분자·분모를 확인.") + over;
  });
}

function initReview(): void {
  const diffBox = el("diffBox");
  const renderDiff = () => {
    const run = state.runs[state.runs.length - 1];
    const predOk =
      state.parentalGuess.length === 2 && run
        ? gradeParentalSelection(run.phase, state.parentalGuess)
        : null;
    diffBox.textContent = run
      ? `예측 부모형 [${state.parentalGuess.join(", ") || "없음"}] vs 실제 ${run.phase} → ` +
        `${predOk === null ? "예측 미완" : predOk ? "일치" : "불일치"}. r_hat=${run.observedR === null ? "추정 불가" : run.observedR.toFixed(3)}, 참 r=${run.trueR}.`
      : "아직 비교할 실행이 없음.";
  };
  renderDiff();
  setInterval(renderDiff, 2000);

  el("saveBtn").addEventListener("click", () => {
    const run = state.runs[state.runs.length - 1];
    const msg = el("saveResult");
    if (!run) {
      msg.textContent = "저장할 실행이 없음.";
      return;
    }
    try {
      appendRecord(
        createRecord({
          scenarioId: "p0-review", phase: run.phase, trueR: run.trueR, N: run.N, seed: run.seed,
          countsByHaplotype: run.countsByHaplotype, observedR: run.observedR,
          recombinantCount: run.recombinantCount,
          parentalGuess: state.parentalGuess.length ? [...state.parentalGuess] : null,
          explanation: el<HTMLTextAreaElement>("explInput").value,
        }),
      );
      msg.textContent = `저장됨 (전체 ${listRecords().length}건).`;
    } catch (e) {
      msg.textContent = `저장 실패: ${(e as Error).message}`;
    }
  });
  el("exportBtn").addEventListener("click", () => {
    downloadJson("grl-records.json", JSON.stringify(listRecords(), null, 2));
  });
  el<HTMLInputElement>("importFile").addEventListener("change", async (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const arr = JSON.parse(text) as unknown[];
      let n = 0;
      for (const item of Array.isArray(arr) ? arr : [arr]) {
        appendRecord(parseRecord(JSON.stringify(item)));
        n++;
      }
      el("saveResult").textContent = `${n}건 가져옴.`;
    } catch (err) {
      el("saveResult").textContent = `가져오기 실패: ${(err as Error).message}`;
    }
  });

  el("transferButtons").querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      const ok = gradeParentalSelection("Ab/aB", (b as HTMLButtonElement).dataset.t === "Ab/aB" ? ["Ab", "aB"] : ["AB", "ab"]);
      el("transferResult").textContent = ok
        ? "정확: Ab/aB 연결상에서는 Ab·aB가 부모형."
        : "다름: 연결상이 바뀌면 부모형·재조합형 역할이 바뀜.";
    });
  });
}

export function initLate(): void {
  initSampling();
  initInference();
  initReview();
  renderLatest();
}
