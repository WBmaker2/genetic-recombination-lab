/** web/late.ts — 표본·추정·기록 (DOM 배선). 엔진은 순수 함수만 사용. */
import { state } from "./state";
import { getGameteProbabilities } from "../engine/recombination";
import { HAPLOTYPES, isRecombinant, type Haplotype } from "../engine/haplotypes";
import { estimateRecombination, mulberry32, zeroCounts, type SampleResult } from "../engine/sampler";
import { gradeParentalSelection, gradeRatio } from "../scenarios/p0";
import { createRecord, parseRecord } from "../models/record";
import { barChartSvg, distributionRows, offspringTableHtml } from "../views/offspring";
import { appendRecord, downloadJson, listRecords, saveSessionRuns } from "./storage";

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
    renderComparison();
    return;
  }
  const fixedRows = distributionRows(run.countsByHaplotype, run.phase, run.N);
  const tableRows = state.tableSortDesc ? [...fixedRows].sort((a, b) => b.count - a.count) : fixedRows;
  summary.textContent = `실행 #${state.runs.length} (N=${run.N}, ${run.phase}): ` +
    (run.N === 0 ? "표본이 없어 추정할 수 없음." : `총 ${run.N}개. ` + fixedRows.map((r) => `${r.haplotype} ${r.count}개`).join(", ") + ". 설정값과 표본 추정값은 추정 단계에서 계산을 제출한 뒤 비교합니다.");
  chartBox.innerHTML = run.N === 0 ? "<p>표본이 없어 차트 없음.</p>" : barChartSvg(fixedRows, run.N);
  tableBox.innerHTML = offspringTableHtml(tableRows, run.N);
  const sortBtn = tableBox.querySelector('[data-sort]') as HTMLButtonElement | null;
  sortBtn?.addEventListener("click", () => {
    state.tableSortDesc = !state.tableSortDesc;
    sortBtn.parentElement?.setAttribute("aria-sort", state.tableSortDesc ? "descending" : "ascending");
    renderLatest();
  });
  renderRunList();
  renderRunSelect();
  renderComparison();
}

function renderComparison(): void {
  const box = el("comparisonBox");
  const headers = state.runs.map((r, i) => `<th scope="col">실행 #${i + 1}<br>${r.phase}<br>설정 r=${r.trueR.toFixed(2)}<br>N=${r.N}<br>seed=${r.seed}</th>`).join("");
  const rows = HAPLOTYPES.map((h) => `<tr><th scope="row">${h}</th>${state.runs.map((r) => `<td>${r.countsByHaplotype[h]}개 (${r.N ? (r.countsByHaplotype[h] / r.N).toFixed(3) : "—"})</td>`).join("")}</tr>`).join("");
  box.innerHTML = `<h3>표본 크기 비교</h3><p>표본 크기만 비교하려면 연결상과 설정 r을 같게 맞추세요. 실행별 개수와 비율이며 범주 순서는 AB, ab, Ab, aB로 고정됩니다.</p>${state.runs.length < 2 ? "<p>표본을 두 번 이상 생성하면 나란히 비교할 수 있습니다.</p>" : `<div class="table-scroll"><table><caption>실행별 하플로타입 개수와 비율</caption><thead><tr><th scope="col">하플로타입</th>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`}`;
}

function renderRunList(): void {
  const ul = el("runList");
  ul.innerHTML = state.runs
    .map((r, i) => `<li>실행 #${i + 1} · ${r.phase} · N=${r.N} · seed=${r.seed}</li>`)
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
      state.inferenceRunIndex = null;
      el("inferResult").textContent = "";
      el("inferError").textContent = "";
      el("inferError").hidden = true;
      el("diffBox").textContent = "새 실행의 계산을 제출한 뒤 비교 내용을 확인할 수 있습니다.";
      const run = state.runs[state.selectedRun];
      if (run) {
        el<HTMLInputElement>("numInput").value = "";
        el<HTMLInputElement>("denInput").value = String(run.N);
      }
    });
  });
  const selected = state.selectedRun !== null ? state.runs[state.selectedRun] : undefined;
  if (selected) {
    el<HTMLInputElement>("numInput").value = "";
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
      state.inferenceRunIndex = null;
      el("inferResult").textContent = "";
      el("inferError").textContent = "";
      el("inferError").hidden = true;
      el("diffBox").textContent = "새 실행의 계산을 제출한 뒤 비교 내용을 확인할 수 있습니다.";
      const restored = saveSessionRuns(state.runs);
      state.runSeq += 1;
      state.selectedRun = state.runs.length - 1;
      renderLatest();
      if (!restored) el("sampleSummary").textContent += " 이 브라우저는 탭 임시 저장을 사용할 수 없어 새로고침 뒤 표본 복구가 되지 않을 수 있습니다.";
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
    state.inferenceRunIndex = null;
    out.textContent = "";
    el("diffBox").textContent = "계산 제출 후 비교 내용을 확인할 수 있습니다.";
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
    if (den !== run.N) {
      err.hidden = false;
      err.textContent = `선택한 표본의 전체 수 N=${run.N}을 분모로 입력하세요.`;
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
      `제출한 r̂=${userR.toFixed(3)} (재조합 ${num}/${den}). ` +
      `표본에서 계산한 r̂=${expected === null ? "추정 불가" : expected.toFixed(3)}, 시뮬레이션 설정값 r=${run.trueR}. ` +
      (ok ? "계산 정확." : "계산이 실행값과 다름 — 분자·분모를 확인.") + over;
    state.inferenceRunIndex = state.selectedRun;
    el("reviewAccessNotice").hidden = true;
  });
}

function initReview(): void {
  const diffBox = el("diffBox");
  const renderDiff = () => {
    const index = state.selectedRun;
    const run = index === null ? undefined : state.runs[index];
    if (!run || state.inferenceRunIndex !== index) {
      diffBox.textContent = "실행을 선택하고 추정 단계에서 계산을 제출하면 비교 내용을 확인할 수 있습니다.";
      return;
    }
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
    const run = state.selectedRun === null ? undefined : state.runs[state.selectedRun];
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
