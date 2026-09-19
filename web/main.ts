/** web/main.ts — 셸·이동·setup·분열·히스토리 (DOM 배선). */
import { state, type StepName } from "./state";
import { gradeParentalSelection } from "../scenarios/p0";
import { MEIOSIS_MODEL_NOTE, SINGLE_CROSSOVER_NOTE, meiosisSvg } from "../views/meiosis";
import { organismManifest } from "../views/organism";
import type { Haplotype } from "../engine/haplotypes";
import { detectWebGL } from "./webgl";
import type { ChromoHandle } from "./chromo3d";
import { initLate } from "./late";
import { initP1 } from "./p1";

function el<T extends HTMLElement>(id: string): T {
  const n = document.getElementById(id);
  if (!n) throw new Error(`#${id} 없음`);
  return n as T;
}

  const STEPS: StepName[] = ["setup", "meiosis", "sampling", "inference", "review", "p1"];

export function showStep(name: StepName): void {
  state.step = name;
  for (const s of STEPS) {
    el(`step-${s}`).hidden = s !== name;
  }
  document.querySelectorAll(".stepper button").forEach((b) => {
    const on = (b as HTMLButtonElement).dataset.step === name;
    b.setAttribute("aria-current", on ? "step" : "false");
  });
  if (location.hash !== `#${name}`) history.replaceState(null, "", `#${name}`);
  el<HTMLHeadingElement>(`h-${name}`).focus({ preventScroll: false });
}

function syncSeedBadge(): void {
  el("seedBadge").textContent = `seed ${state.seed} · r=${state.trueR} · N=${state.N} · ${state.phase}`;
}

function initSetup(): void {
  const rRange = el<HTMLInputElement>("rRange");
  const rNumber = el<HTMLInputElement>("rNumber");
  const rError = el("rError");
  const applyR = (v: number, from: "range" | "num") => {
    if (!Number.isFinite(v) || v < 0 || v > 0.5) {
      rError.hidden = false;
      rError.textContent = `r은 0〜0.5 (입력: ${from === "num" ? rNumber.value : rRange.value})`;
      return;
    }
    rError.hidden = true;
    state.trueR = Math.round(v * 100) / 100;
    rRange.value = String(state.trueR);
    rNumber.value = String(state.trueR);
    syncSeedBadge();
  };
  rRange.addEventListener("input", () => applyR(Number(rRange.value), "range"));
  rNumber.addEventListener("blur", () => applyR(Number(rNumber.value), "num"));
  document.querySelectorAll('input[name="phase"]').forEach((r) => {
    r.addEventListener("change", () => {
      const checked = document.querySelector('input[name="phase"]:checked') as HTMLInputElement;
      state.phase = checked.value as typeof state.phase;
      syncSeedBadge();
    });
  });
  el("nSelect").addEventListener("change", (e) => {
    state.N = Number((e.target as HTMLSelectElement).value);
    syncSeedBadge();
  });
  const seedInput = el<HTMLInputElement>("seedInput");
  seedInput.addEventListener("blur", () => {
    const v = Number(seedInput.value);
    const err = el("seedError");
    if (!Number.isInteger(v)) {
      err.hidden = false;
      err.textContent = "seed는 정수";
      return;
    }
    err.hidden = true;
    state.seed = v;
    syncSeedBadge();
  });

  const predBox = el("predButtons");
  const predResult = el("predResult");
  predBox.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      const h = (b as HTMLButtonElement).dataset.hap as Haplotype;
      const i = state.parentalGuess.indexOf(h);
      if (i >= 0) state.parentalGuess.splice(i, 1);
      else if (state.parentalGuess.length < 2) state.parentalGuess.push(h);
      predBox.querySelectorAll("button").forEach((x) => {
        x.setAttribute("aria-pressed", String(state.parentalGuess.includes((x as HTMLButtonElement).dataset.hap as Haplotype)));
      });
      if (state.parentalGuess.length === 2) {
        const ok = gradeParentalSelection(state.phase, state.parentalGuess);
        predResult.textContent = ok ? "정확: 부모형 식별 성공." : "다름: 분열·반복 단계에서 다시 확인.";
      } else {
        predResult.textContent = `선택 ${state.parentalGuess.length}/2`;
      }
    });
  });

  const gallery = el("orgGallery");
  gallery.innerHTML = organismManifest()
    .filter((m) => m.variant === 0)
    .map((m) => `<figure><img src="./organisms/${m.imageFile}" alt="${m.alt}" width="1200" height="896" loading="lazy" /><figcaption>${m.haplotype}</figcaption></figure>`)
    .join("");

  el("toMeiosisBtn").addEventListener("click", () => showStep("meiosis"));
}

function initMeiosis(): void {
  const box = el("demoBox");
  const caption = el("demoCaption");
  let chromo: ChromoHandle | null = null;
  const syncChromo = (): void => {
    chromo?.update({ phase: state.phase, mode: state.demoMode, step: state.demoStep });
  };
  const render = () => {
    box.innerHTML = meiosisSvg(state.phase, state.demoMode, state.demoStep);
    caption.textContent =
      `${MEIOSIS_MODEL_NOTE}` + (state.demoMode === "single" ? ` ${SINGLE_CROSSOVER_NOTE}` : "");
    el<HTMLInputElement>("demoRange").value = String(state.demoStep);
    syncChromo();
  };
  document.querySelectorAll('input[name="demoMode"]').forEach((r) => {
    r.addEventListener("change", () => {
      state.demoMode = (document.querySelector('input[name="demoMode"]:checked') as HTMLInputElement).value as typeof state.demoMode;
      state.demoStep = 0;
      render();
    });
  });
  el("demoPrev").addEventListener("click", () => {
    state.demoStep = Math.max(0, state.demoStep - 1);
    render();
  });
  el("demoNext").addEventListener("click", () => {
    state.demoStep = Math.min(3, state.demoStep + 1);
    render();
  });
  el<HTMLInputElement>("demoRange").addEventListener("input", (e) => {
    state.demoStep = Number((e.target as HTMLInputElement).value);
    render();
  });
  const webgl = detectWebGL();
  const btn3D = el<HTMLButtonElement>("demo3DBtn");
  const box3D = el("demo3D");
  if (!webgl.supported) {
    btn3D.disabled = true;
    el("webglNote").textContent = `3D 대체 화면: ${webgl.reason}. 단계별 SVG에서 동일 ID·대립유전자 제공.`;
  } else {
    el("webglNote").textContent = "3D 염색체: 색+줄무늬 질감+라벨로 구분. 교육용 과장 모형.";
  }
  btn3D.addEventListener("click", async () => {
    const on = btn3D.getAttribute("aria-pressed") === "true";
    if (on) {
      chromo?.dispose();
      chromo = null;
      box3D.hidden = true;
      box3D.innerHTML = "";
      btn3D.setAttribute("aria-pressed", "false");
      btn3D.textContent = "3D로 보기";
      return;
    }
    btn3D.disabled = true;
    try {
      const { mountChromo3D } = await import("./chromo3d");
      box3D.hidden = false;
      chromo = mountChromo3D(box3D, { phase: state.phase, mode: state.demoMode, step: state.demoStep });
      btn3D.setAttribute("aria-pressed", "true");
      btn3D.textContent = "3D 닫기";
    } catch {
      el("webglNote").textContent = "3D 모듈 로드 실패 — SVG 대체 화면을 사용.";
    } finally {
      btn3D.disabled = false;
    }
  });
  render();
}

function initShell(): void {
  document.querySelectorAll(".stepper button").forEach((b) => {
    b.addEventListener("click", () => showStep((b as HTMLButtonElement).dataset.step as StepName));
  });
  const dialog = el<HTMLDialogElement>("historyDialog");
  let lastFocus: HTMLElement | null = null;
  el("historyBtn").addEventListener("click", () => {
    lastFocus = document.activeElement as HTMLElement;
    dialog.showModal();
    el("historyClose").focus();
  });
  el("historyClose").addEventListener("click", () => {
    dialog.close();
    (lastFocus ?? el("historyBtn")).focus();
  });
  const hash = location.hash.replace("#", "") as StepName;
  if (STEPS.includes(hash)) state.step = hash;
  showStep(state.step);
}

syncSeedBadgeSafe();
function syncSeedBadgeSafe(): void {
  document.addEventListener("DOMContentLoaded", () => {
    initShell();
    initSetup();
    initMeiosis();
    initLate();
    initP1();
    syncSeedBadge();
  });
}
