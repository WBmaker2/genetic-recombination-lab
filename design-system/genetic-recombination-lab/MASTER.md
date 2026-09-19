# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Genetic Recombination Lab
**Generated:** 2026-09-19 10:53:40
**Category:** General
**Mode:** Operate (impeccable) — visitor completes a task, tool disappears into task
**Spec sources:** `00-shared-design-principles.md`, `08-genetic-recombination-lab.md`

---

## Project Overrides — genetic-recombination-lab (verified, take precedence over generated defaults below)

> Dataset verification note: `--design-system "education science classroom tool"` returned Minimalism & Swiss Style (risk:low) — adopted. Portfolio Grid and Glassmorphism candidates rejected (landing-only / conditional a11y). `color education classroom bright` returned LMS teal #0D9488 — adopted as semantic accent family, darkened for contrast. `typography clean readable educational` returned Exo/Roboto Mono + Lexend/Source Sans — **no Korean support, rejected for headings/body**; Korean stack below overrides. `icons science lab flask dna` / `flask experiment` returned **0 results — no verified DB match**, fallback to Phosphor general guidance. `chart comparison distribution bar` → Bar Chart (risk:low) adopted. `ux keyboard focus modal / dragging movements / error summary validation / sampling loading progress` adopted. `stack react / threejs / html-tailwind` adopted. GSAP `step transition fade` Subtle tier adopted.

### 0.1 Color strategy: Restrained (Operate floor)
- Neutrals + one accent. Base stays `#F8FAFC / #0F172A / #FFFFFF` + Primary Navy `#1E3A5F`.
- Accent: generated `#059669` kept for CTA fill, but **text on accent MUST be `#000000`** (dataset `On Accent #000000` is correct; template `.btn-primary { color:white }` below is a contrast bug — do not use white on #059669, ~3.3:1). Verify 4.5:1 before shipping.
- Haplotype/offspring encoding never color-only: parental vs recombinant uses **color + pattern + label + legend** (e.g., parental solid + “부모형” tag, recombinant hatched + “재조합형” tag). Table provides text alternative for every chart.
- Haplotype palette (colorblind-safe, Okabe-Ito family, all with pattern+label): AB `#1E3A5F` solid, ab `#475569` solid, Ab `#0E7C72` (darkened teal for 4.5:1 text) diagonal-hatch, aB `#B45309` (darkened amber) dotted. Borders ≥3:1 vs card.

### 0.2 Typography: Korean override
- Generated Exo / Roboto Mono do not cover Korean — **do not use for Korean headings/body**.
- Headings/body/labels: `Pretendard Variable, -apple-system, "Noto Sans KR", "Apple SD Gothic Neo", sans-serif`. One family across UI (Operate rule).
- Numbers/tables/seed/N/r values only: `"Roboto Mono", "Noto Sans Mono", tabular-nums` with `font-variant-numeric: tabular-nums` to prevent layout shift.
- Scale (fixed rem, ratio 1.125–1.2, base 16px, lh 1.5–1.75): 12 / 14 / 16 / 18 / 20 / 24 / 32. Body ≥16px on mobile (iOS auto-zoom 방지). Long prose 60–75ch, mobile 35–60ch.
- Weights: headings 600–700, body 400, labels/buttons 500–600.

### 0.3 Layout: Operate shell (replaces Hero+Features+CTA landing pattern)
- Generated landing pattern does **not** apply to lab flow. Use app shell: top bar (title + seed badge + 업데이트 내역 button always visible) + stepper (setup → meiosisDemo → sampling → inference → review) + main split + footer note.
- Breakpoints (spec-mandated): **320 / 360 / 768 / 1280**. Test 320 minimum, no horizontal scroll. Desktop ≥1024: 시각자료 | 조건패널 side-by-side. Mobile: 시각자료 → 조건 → 실행 → 결과 vertical stack, core content first.
- Spacing: 4/8dp rhythm, `--space-*` tokens below reused. z-index scale: content 0 / sticky stepper 10 / dropdown 20 / modal 40 / toast 100 / skip-link 1000. Fixed header reserves `scroll-padding-top`.
- First screen (공통원칙 §3): 밝은 한국어 UI, 질문 하나 (“같은 부모에게서 왜 서로 다른 조합이 나올까?”) + 시작 버튼 하나. gi-pulse aura on exactly one primary next action per screen (표본 생성 / r 계산); `prefers-reduced-motion` → static 2px border, no pulse animation.

### 0.4 Interaction & motion (Subtle tier only)
- GSAP Subtle: route/step fade `opacity 0→1, y 12→0, 200–300ms, power1.inOut/out`; exit ≤250ms, faster than enter; no orchestrated page-load sequences; transform/opacity only.
- All drags have alternatives (WCAG 2.2 AA Dragging Movements): 염색체 위치 슬라이더 = number input + −/+ buttons + arrow keys; crossover position likewise. Never drag-only.
- Touch targets ≥44×44px web minimum 24×24, gaps ≥8px. `touch-action: manipulation`. Press feedback ≤100ms. Three.js canvas handles touchstart/touchmove + mouse, cursor pointer on hit.
- Sampling N∈{20,100,1000,10000}: progress bar + cancellable worker, stale-result ignore, skeleton for >1s waits, no flashing spinner for instant work. `aria-busy` + live region announces complete phrase (“1000개 생성 완료: AB 452…” focus stays).

### 0.5 Data-viz contract (sampling → inference)
- Chart type: Grouped/vertical Bar for 4 haplotypes + testcross offspring table. Categories ≤15 rule satisfied (4). Always sorted in fixed haplotype order AB/ab/Ab/aB (genetics meaning > descending sort here — descending optional, order stability required for phase comparison).
- Every bar chart ships with: legend adjacent, direct value labels, axis units (개수/비율), visible sortable `<table>` + concise summary sentence for screen readers, keyboard-focusable bars (Enter/Space shows tooltip value, `aria-sort` on table headers).
- `r_hat = 재조합 자손 수 / N`, N=0 → “추정 불가” empty state + action, never divide. r_hat>0.5 → keep raw data, label “표본 변동, 참 모수 범위와 구분”.
- Phase toggle AB/ab ↔ Ab/aB swaps parental/recombinant roles; existing samples preserved as 별도 실행 (immutable run cards with seed/trueR/N/counts/observedR).

### 0.6 Three.js + SVG fallback
- 3D: 상동체·염색분체 = color+pattern+label triple coding, crossover segment highlight, “교육용 과장 모형” caption. `traverse` sets shadows/materials, no bare `scene.add`. WebGL fail → identical IDs/alleles in stepwise SVG + table; unsupported features listed in fallback notice.
- Meiosis demo vs sampling sampler are separate labeled modes; animation speed ≠ probability; single-crossover demo explicitly “4 chromatids 중 2개 재조합 예시, 일반 r와 동일시 금지” caption.

### 0.7 Forms, errors, i18n-ko
- Visible `<label>` per input + persistent helper (유효범위·단위: r∈[0,0.5], N∈{20,100,1000,10000}, seed 정수). Validate on blur, error below field + `aria-describedby`, `role=alert` summary at top on submit fail with field links + focus to summary; retain inline errors.
- localStorage: experiment records only, no PII; failure → session + JSON export. Record: schemaVersion/appId/createdAt/scenarioId/parameters/seed/observations/prediction/explanation + engineVersion/scenarioVersion.
- Icons: Phosphor `@phosphor-icons/react` primary (Dna, FlaskConical, Microscope, ChartBar, Table, Play, Pause, ArrowLeft/ArrowRight, RotateCcw, Info, History), Heroicons fallback. One stroke family 1.5–2px, size tokens 16/20/24. Decorative beside text → `aria-hidden=true`; icon-only buttons → `aria-label`; state icons expose pressed/selected.
- No emoji as icons. No invested claims. 가상생물만, 사람 외모·질병 제외. 문자·수치·기호는 이미지합성 금지, 코드 레이어로 렌더.

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#1E3A5F` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#2563EB` | `--color-secondary` |
| On Secondary | `#FFFFFF` | `--color-on-secondary` |
| Accent/CTA | `#059669` | `--color-accent` |
| On Accent/CTA | `#000000` | `--color-on-accent` |
| Background | `#F8FAFC` | `--color-background` |
| Foreground | `#0F172A` | `--color-foreground` |
| Card | `#FFFFFF` | `--color-card` |
| Card Foreground | `#0F172A` | `--color-card-foreground` |
| Muted | `#F1F3F5` | `--color-muted` |
| Muted Foreground | `#475569` | `--color-muted-foreground` |
| Border | `#E4E7EB` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `--color-on-destructive` |
| Ring | `#1E3A5F` | `--color-ring` |

**Color Notes:** Navy professional + paid green

### Typography

- **Heading Font:** Exo
- **Body Font:** Roboto Mono
- **Mood:** science, technology, research, data, futuristic, precise
- **Google Fonts:** [Exo + Roboto Mono](https://fonts.googleapis.com/css2?family=Exo:wght@300;400;500;600;700&family=Roboto+Mono:wght@300;400;500;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Exo:wght@300;400;500;600;700&family=Roboto+Mono:wght@300;400;500;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button — contrast fix: #059669 with white fails 4.5:1, use #000000 per palette On-Accent */
.btn-primary {
  background: #059669;
  color: #000000;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #1E3A5F;
  border: 2px solid #1E3A5F;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #F8FAFC;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #1E3A5F;
  outline: none;
  box-shadow: 0 0 0 3px #1E3A5F20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Minimalism & Swiss Style

**Keywords:** Clean, simple, spacious, functional, white space, high contrast, geometric, sans-serif, grid-based, essential

**Best For:** Enterprise apps, dashboards, documentation sites, SaaS platforms, professional tools

**Key Effects:** Subtle hover (200-250ms), smooth transitions, sharp shadows if any, clear type hierarchy, fast loading

### Page Pattern

**Pattern Name:** Hero + Features + CTA

- **Conversion Strategy:** Deep CTA placement. For CTA label text, verify at least 4.5:1 against the button fill; use 7:1 only when the product explicitly targets AAA normal-text contrast. Keep focus and component boundaries independently visible. Disable hero parallax under reduced motion and render its static final state.
- **CTA Placement:** Hero (sticky) + Bottom
- **Section Order:** Hero with headline/image > Value prop > Key features (3-5) > CTA section > Footer

---

## Anti-Patterns (Do NOT Use)


### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
