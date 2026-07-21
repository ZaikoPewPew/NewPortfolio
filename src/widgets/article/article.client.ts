import { feedback } from "../../experience/feedback/FeedbackBus";
import { prefersReducedMotion } from "../../experience/motion/prefersReducedMotion";
import { getMessages, interpolate } from "../../i18n";

/*
 * Article scroll drum.
 *
 * Reads the ## headings inside the case body and renders them as a vertical
 * strip of dots (right) plus section names (left). Position is a continuous
 * fractional index derived from scroll (scroll-spy), eased toward its target
 * each frame so the drum glides. Active item = biggest dot / brightest name;
 * neighbours shrink by one step. At the extremes the active item pins to the
 * top/bottom of the pill (8px inset) and the rest cascade away.
 *
 * Collapsed: a compact indicator. A tap opens the full menu; it expands evenly
 * from the center (staying screen-centered) into a list of every section that
 * you can navigate by clicking a name or a dot. Tap outside / Esc / pick a
 * section collapses it again. You can also drag the drum or wheel over it to
 * scrub the page.
 */

// Collapsed geometry.
const DOT_SIZE_MAX = 8; // px, active dot
const DOT_SIZE_STEP = 1; // px shrink per section away from active
const DOT_SIZE_MIN = 2; // px, smallest visible dot
const DOT_SPACING = 16; // px, center-to-center (8px dot + 8px gap between dots)
const MAX_DOT_SLOT = 6; // dots farther than this fade out
const NAME_SIZE_MAX = 12; // px, active name
const NAME_SIZE_MIN = 10; // px, far names
const NAME_SPACING = 20; // px, center-to-center between names
const NAME_WINDOW = 1.4; // names shown within this distance (≈3 when collapsed)
const EDGE_INSET = 8; // px, active item inset from pill edge at the extremes

// Expanded (full menu) geometry.
const EXPANDED_SPACING = 24; // px, row pitch in the open menu
const EXPANDED_PAD = 12; // px, inset at the top/bottom of the open pill
const EXPANDED_SPACING_MIN = 14; // px, floor when many sections must fit

const READING_LINE_RATIO = 0.35; // "current" reading line, share of viewport
const DRAG_PX_PER_SECTION = 34; // drag distance that advances one section
const DRAG_THRESHOLD = 4; // px before a press becomes a drag
const SMOOTH = 0.2; // easing toward the target position
const EXPAND_DURATION = 420; // ms, open/close tween

interface Section {
  el: HTMLElement;
  name: string;
  dot: HTMLButtonElement;
  label: HTMLButtonElement;
  top: number;
}

interface ArticleState {
  root: HTMLElement;
  drum: HTMLElement;
  namesEl: HTMLElement;
  dotsEl: HTMLElement;
  sections: Section[];
  baseHeight: number;
  pos: number;
  targetPos: number;
  expansion: number;
  expandedTarget: number;
  expandFrom: number;
  expandAt: number;
  lastDetent: number;
  down: boolean;
  dragging: boolean;
  startY: number;
  startPos: number;
  raf: number;
  ticking: boolean;
  abort: AbortController;
  resizeObserver: ResizeObserver | null;
}

let state: ArticleState | null = null;

function teardown(): void {
  if (!state) return;
  state.abort.abort();
  state.resizeObserver?.disconnect();
  if (state.raf) cancelAnimationFrame(state.raf);
  state = null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Snappy in, soft settle out — a nicer feel for opening the menu. */
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function readSections(
  body: HTMLElement,
  dotsEl: HTMLElement,
  namesEl: HTMLElement
): Section[] {
  const headings = Array.from(body.querySelectorAll<HTMLElement>("h2"));
  const messages = getMessages();
  const sections: Section[] = [];

  dotsEl.replaceChildren();
  namesEl.replaceChildren();

  headings.forEach((el, index) => {
    const name = (el.textContent ?? "").trim();
    if (!name) return;
    if (!el.id) el.id = `case-section-${index + 1}`;
    const sectionIndex = sections.length;
    const label = interpolate(messages.articleWidget.jumpTo, { name });

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "article-widget__dot";
    dot.dataset.index = String(sectionIndex);
    dot.dataset.feedback = "tap hover";
    dot.dataset.feedbackSource = "widget.article.section";
    dot.setAttribute("aria-label", label);
    dotsEl.appendChild(dot);

    const nameButton = document.createElement("button");
    nameButton.type = "button";
    nameButton.className = "article-widget__name";
    nameButton.dataset.index = String(sectionIndex);
    nameButton.dataset.feedback = "tap hover";
    nameButton.dataset.feedbackSource = "widget.article.section";
    nameButton.setAttribute("aria-label", label);
    nameButton.textContent = name;
    namesEl.appendChild(nameButton);

    sections.push({ el, name, dot, label: nameButton, top: 0 });
  });

  return sections;
}

function measure(): void {
  if (!state) return;
  const scrollY = window.scrollY;
  for (const section of state.sections) {
    section.top = section.el.getBoundingClientRect().top + scrollY;
  }
}

function readingLine(): number {
  return window.scrollY + window.innerHeight * READING_LINE_RATIO;
}

/** Continuous fractional section index for the current scroll position. */
function posFromScroll(): number {
  if (!state) return 0;
  const { sections } = state;
  const last = sections.length - 1;
  // At (or past) the bottom of the page the last heading may never cross the
  // reading line, so pin the last section active once we can't scroll further.
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll > 0 && window.scrollY >= maxScroll - 2) return last;
  const line = readingLine();
  if (line <= sections[0].top) return 0;
  if (line >= sections[last].top) return last;
  for (let i = 0; i < last; i += 1) {
    const a = sections[i].top;
    const b = sections[i + 1].top;
    if (line >= a && line < b) {
      return i + (line - a) / Math.max(1, b - a);
    }
  }
  return last;
}

/** Inverse of posFromScroll — target scrollY that centers a fractional index. */
function scrollForPos(pos: number): number {
  if (!state) return 0;
  const { sections } = state;
  const last = sections.length - 1;
  const i = Math.min(last, Math.floor(pos));
  let line: number;
  if (i >= last) {
    line = sections[last].top;
  } else {
    const frac = pos - i;
    line = sections[i].top + frac * (sections[i + 1].top - sections[i].top);
  }
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return clamp(line - window.innerHeight * READING_LINE_RATIO, 0, Math.max(0, maxScroll));
}

/**
 * Collapsed vertical layout for a strip of items. Returns the y (center) for
 * each index. Normally the active fractional index sits at the middle; near the
 * ends the strip pins so the outer item keeps an `inset` gap from the edge.
 */
function stripLayout(
  pos: number,
  sizes: number[],
  height: number,
  spacing: number,
  inset: number
): (index: number) => number {
  const n = sizes.length;
  const base = (i: number): number => height / 2 + (i - pos) * spacing;
  const top = base(0) - sizes[0] / 2;
  const bottom = base(n - 1) + sizes[n - 1] / 2;
  const content = bottom - top;

  let shift = 0;
  if (content <= height - 2 * inset) {
    shift = height / 2 - (top + content / 2);
  } else if (top > inset) {
    shift = inset - top;
  } else if (bottom < height - inset) {
    shift = height - inset - bottom;
  }

  return (i: number): number => base(i) + shift;
}

function expandedSpacing(n: number): number {
  const available = window.innerHeight - 64;
  const needed = (n - 1) * EXPANDED_SPACING + 2 * EXPANDED_PAD;
  if (needed <= available) return EXPANDED_SPACING;
  return Math.max(EXPANDED_SPACING_MIN, (available - 2 * EXPANDED_PAD) / (n - 1));
}

function render(pos: number, expansion: number): void {
  if (!state) return;
  const { sections, baseHeight } = state;
  const n = sections.length;

  const dotSizes = sections.map((_, i) =>
    Math.max(DOT_SIZE_MIN, DOT_SIZE_MAX - DOT_SIZE_STEP * Math.abs(i - pos))
  );
  const nameSizes = sections.map((_, i) =>
    Math.max(NAME_SIZE_MIN, NAME_SIZE_MAX - Math.abs(i - pos))
  );
  const collapsedDotY = stripLayout(pos, dotSizes, baseHeight, DOT_SPACING, EDGE_INSET);
  const collapsedNameY = stripLayout(pos, nameSizes, baseHeight, NAME_SPACING, EDGE_INSET);

  const spacing = expandedSpacing(n);
  const expandedHeight = (n - 1) * spacing + 2 * EXPANDED_PAD;
  const expandedY = (i: number): number => EXPANDED_PAD + i * spacing;

  const containerHeight = lerp(baseHeight, expandedHeight, expansion);
  state.drum.style.height = `${containerHeight.toFixed(2)}px`;
  state.namesEl.style.height = `${containerHeight.toFixed(2)}px`;

  const open = expansion > 0.5;

  sections.forEach((section, index) => {
    const slot = index - pos;
    const abs = Math.abs(slot);
    const active = Math.max(0, 1 - abs);
    const { dot, label } = section;

    // Dot — collapsed 8px strip; on open it spreads to align with the names.
    const collapsedDotSize = dotSizes[index];
    const expandedDotSize = 6 + 2 * active; // 8 active, 6 otherwise
    const dotSize = lerp(collapsedDotSize, expandedDotSize, expansion);
    const dotY = lerp(collapsedDotY(index), expandedY(index), expansion);
    const collapsedDotOpacity = abs > MAX_DOT_SLOT ? 0 : clamp(MAX_DOT_SLOT - abs, 0, 1);
    const expandedDotOpacity = 0.55 + 0.45 * active;
    const dotOpacity = lerp(collapsedDotOpacity, expandedDotOpacity, expansion);
    dot.style.width = `${dotSize.toFixed(2)}px`;
    dot.style.height = `${dotSize.toFixed(2)}px`;
    dot.style.top = `${dotY.toFixed(2)}px`;
    dot.style.transform = "translate(-50%, -50%)";
    dot.style.setProperty("--dot-active", active.toFixed(3));
    dot.style.opacity = dotOpacity.toFixed(3);
    dot.style.pointerEvents = open || dotOpacity > 0.05 ? "auto" : "none";

    // Name.
    const collapsedNameScale = nameSizes[index] / NAME_SIZE_MAX;
    const expandedNameSize = NAME_SIZE_MIN + 1 + active; // 12 active, 11 otherwise
    const nameScale = lerp(collapsedNameScale, expandedNameSize / NAME_SIZE_MAX, expansion);
    const nameY = lerp(collapsedNameY(index), expandedY(index), expansion);
    const closeness = Math.max(0, 1 - abs / 2);
    const collapsedNameOpacity = (0.4 + 0.6 * closeness) * clamp((NAME_WINDOW - abs) / 0.6, 0, 1);
    const expandedNameOpacity = 0.6 + 0.4 * active;
    const nameOpacity = lerp(collapsedNameOpacity, expandedNameOpacity, expansion);
    label.style.top = `${nameY.toFixed(2)}px`;
    label.style.transform = `translateY(-50%) scale(${nameScale.toFixed(3)})`;
    label.style.setProperty("--item-opacity", nameOpacity.toFixed(3));
    label.style.pointerEvents = open || nameOpacity > 0.05 ? "auto" : "none";
  });
}

function tick(): void {
  if (!state) return;
  state.raf = 0;
  const reduce = prefersReducedMotion();

  const posDelta = state.targetPos - state.pos;
  state.pos = reduce || Math.abs(posDelta) < 0.0005 ? state.targetPos : state.pos + posDelta * SMOOTH;

  if (reduce) {
    state.expansion = state.expandedTarget;
  } else if (state.expansion !== state.expandedTarget) {
    const t = clamp((performance.now() - state.expandAt) / EXPAND_DURATION, 0, 1);
    const eased = easeOutExpo(t);
    state.expansion = t >= 1 ? state.expandedTarget : lerp(state.expandFrom, state.expandedTarget, eased);
  }

  if (state.dragging) {
    const detent = Math.round(state.pos);
    if (detent !== state.lastDetent) {
      state.lastDetent = detent;
      feedback.emit({ haptic: "light", source: "widget.article.detent" });
    }
  }

  render(state.pos, state.expansion);

  if (state.pos !== state.targetPos || state.expansion !== state.expandedTarget) {
    state.raf = requestAnimationFrame(tick);
  }
}

function requestTick(): void {
  if (state && !state.raf) state.raf = requestAnimationFrame(tick);
}

function setTargetFromScroll(): void {
  if (!state || state.ticking) return;
  state.ticking = true;
  requestAnimationFrame(() => {
    if (!state) return;
    state.ticking = false;
    state.targetPos = posFromScroll();
    requestTick();
  });
}

function setExpanded(current: ArticleState, open: boolean): void {
  const target = open ? 1 : 0;
  if (current.expandedTarget === target) return;
  current.expandedTarget = target;
  current.expandFrom = current.expansion;
  current.expandAt = performance.now();
  current.root.toggleAttribute("data-expanded", open);
  requestTick();
}

function jumpToSection(index: number): void {
  if (!state) return;
  window.scrollTo({
    top: scrollForPos(index),
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}

function indexFromPoint(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y);
  const item = el?.closest?.<HTMLElement>("[data-index]");
  return item ? Number(item.dataset.index) : null;
}

/** Section index only when the point is over a name label (left column). */
function nameIndexFromPoint(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y);
  const name = el?.closest?.<HTMLElement>(".article-widget__name");
  return name ? Number(name.dataset.index) : null;
}

function bindInteractions(current: ArticleState): void {
  const { root, drum, abort } = current;
  const { signal } = abort;

  root.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0) return;
      current.down = true;
      current.dragging = false;
      current.startY = event.clientY;
      current.startPos = current.targetPos;
      current.lastDetent = Math.round(current.targetPos);
      root.setPointerCapture(event.pointerId);
    },
    { signal }
  );

  root.addEventListener(
    "pointermove",
    (event) => {
      if (!current.down) return;
      const delta = event.clientY - current.startY;
      if (!current.dragging && Math.abs(delta) < DRAG_THRESHOLD) return;
      current.dragging = true;
      drum.classList.add("is-dragging");
      const nextPos = clamp(
        current.startPos - delta / DRAG_PX_PER_SECTION,
        0,
        current.sections.length - 1
      );
      window.scrollTo({ top: scrollForPos(nextPos), behavior: "auto" });
    },
    { signal }
  );

  const endPress = (event: PointerEvent) => {
    if (!current.down) return;
    current.down = false;
    const wasDragging = current.dragging;
    current.dragging = false;
    drum.classList.remove("is-dragging");
    if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId);
    if (wasDragging) return; // a scrub, not a tap

    if (current.expandedTarget < 0.5) {
      // Collapsed: a name navigates without opening; the pill (right) opens the menu.
      const nameIndex = nameIndexFromPoint(event.clientX, event.clientY);
      if (nameIndex != null) {
        jumpToSection(nameIndex);
        return;
      }
      setExpanded(current, true);
      return;
    }
    // Open: a section (dot or name) navigates and keeps the menu open;
    // tapping empty pill area (the drum itself) is what collapses it.
    const index = indexFromPoint(event.clientX, event.clientY);
    if (index != null) {
      jumpToSection(index);
      return;
    }
    setExpanded(current, false);
  };

  root.addEventListener("pointerup", endPress, { signal });
  root.addEventListener("pointercancel", endPress, { signal });

  root.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      window.scrollBy({ top: event.deltaY, behavior: "auto" });
    },
    { passive: false, signal }
  );

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (current.expandedTarget > 0.5 && !root.contains(event.target as Node)) {
        setExpanded(current, false);
      }
    },
    { signal }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && current.expandedTarget > 0.5) setExpanded(current, false);
    },
    { signal }
  );
}

export function initArticleWidget(): void {
  teardown();

  const root = document.querySelector<HTMLElement>("[data-article-widget]");
  if (!root) return;

  const namesEl = root.querySelector<HTMLElement>("[data-article-names]");
  const dotsEl = root.querySelector<HTMLElement>("[data-article-dots]");
  const drum = root.querySelector<HTMLElement>("[data-article-drum]");
  const body = document.querySelector<HTMLElement>("[data-case-content-body]");
  if (!namesEl || !dotsEl || !drum || !body) return;

  const sections = readSections(body, dotsEl, namesEl);
  if (sections.length < 2) {
    root.removeAttribute("data-ready");
    return;
  }

  const abort = new AbortController();
  const current: ArticleState = {
    root,
    drum,
    namesEl,
    dotsEl,
    sections,
    baseHeight: dotsEl.clientHeight,
    pos: 0,
    targetPos: 0,
    expansion: 0,
    expandedTarget: 0,
    expandFrom: 0,
    expandAt: 0,
    lastDetent: 0,
    down: false,
    dragging: false,
    startY: 0,
    startPos: 0,
    raf: 0,
    ticking: false,
    abort,
    resizeObserver: null,
  };
  state = current;

  const { signal } = abort;

  bindInteractions(current);

  window.addEventListener("scroll", setTargetFromScroll, { passive: true, signal });
  window.addEventListener(
    "resize",
    () => {
      measure();
      current.targetPos = posFromScroll();
      current.pos = current.targetPos;
      render(current.pos, current.expansion);
    },
    { signal }
  );

  const resizeObserver = new ResizeObserver(() => {
    measure();
    current.targetPos = posFromScroll();
    requestTick();
  });
  resizeObserver.observe(body);
  current.resizeObserver = resizeObserver;

  measure();
  current.targetPos = posFromScroll();
  current.pos = current.targetPos;
  render(current.pos, current.expansion);

  requestAnimationFrame(() => {
    state?.root.setAttribute("data-ready", "");
  });
}
