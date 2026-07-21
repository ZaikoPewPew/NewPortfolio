import { feedback } from "../../../experience/feedback/FeedbackBus";
import { userPreferences } from "../../../experience/preferences/UserPreferences";
import { readSayHiDismissed } from "../profile-menu/profile-menu.storage";

/** Glyph box of the say-hi text (matches the svg drawn into the canvas). */
const TEXT_W = 143;
const TEXT_H = 80;

/** Breathing room around the glyph so repelled particles never clip the canvas
    edge. Kept in sync with `--say-hi-pad` in profile-menu.css. */
const PAD = 48;
const CANVAS_W = TEXT_W + PAD * 2;
const CANVAS_H = TEXT_H + PAD * 2;

/** Sampling density in the glyph box; smaller = more particles, heavier. */
const SAMPLE_STEP = 2;
const ALPHA_THRESHOLD = 128;
const PARTICLE_SIZE = 1.4;

/** Motion model: the cursor defines a bounded displacement target per particle,
    and each particle *eases* toward it (exponential approach). No velocity and
    no spring, so there is zero overshoot ("string snap") and the offset can
    never exceed MAX_PUSH — which is kept below PAD so nothing clips the edge. */
const REPEL_RADIUS = 60;
const MAX_PUSH = 34;
/** Lower = slower, more languid glide (matches the site's measured motion). */
const EASE = 0.06;
const SCATTER = 30;

const COLOR_TOKEN = "--color-text-primary";
const FALLBACK_COLOR = "#ffffff";

interface Particle {
  x: number;
  y: number;
  hx: number;
  hy: number;
  /** Per-particle push multiplier — small variance keeps the parting organic. */
  f: number;
}

interface State {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  menu: HTMLElement | null;
  particles: Particle[];
  color: string;
  pointerX: number;
  pointerY: number;
  pointerActive: boolean;
  rafId: number | null;
  onPointerMove: (event: PointerEvent) => void;
  onPointerLeave: () => void;
  unsubscribeTheme: () => void;
}

let state: State | null = null;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isDesktop(): boolean {
  return window.matchMedia("(min-width: 640px)").matches;
}

function readColor(canvas: HTMLElement): string {
  const value = getComputedStyle(canvas).getPropertyValue(COLOR_TOKEN).trim();
  return value || FALLBACK_COLOR;
}

/** Rasterize the svg to an offscreen canvas and sample opaque pixels into home points. */
function sampleParticles(src: string): Promise<Particle[]> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = TEXT_W;
      offscreen.height = TEXT_H;
      const octx = offscreen.getContext("2d", { willReadFrequently: true });
      if (!octx) {
        reject(new Error("say-hi: no 2d context"));
        return;
      }

      octx.drawImage(image, 0, 0, TEXT_W, TEXT_H);
      const { data } = octx.getImageData(0, 0, TEXT_W, TEXT_H);
      const particles: Particle[] = [];

      for (let y = 0; y < TEXT_H; y += SAMPLE_STEP) {
        for (let x = 0; x < TEXT_W; x += SAMPLE_STEP) {
          const alpha = data[(y * TEXT_W + x) * 4 + 3];
          if (alpha < ALPHA_THRESHOLD) continue;
          // Home is offset by PAD so the glyph sits inside the padded canvas.
          const hx = x + PAD;
          const hy = y + PAD;
          particles.push({
            x: hx + (Math.random() - 0.5) * SCATTER,
            y: hy + (Math.random() - 0.5) * SCATTER,
            hx,
            hy,
            f: 0.75 + Math.random() * 0.4,
          });
        }
      }

      resolve(particles);
    };
    image.onerror = () => reject(new Error("say-hi: image failed to load"));
    image.src = src;
  });
}

function isMenuOpen(menu: HTMLElement | null): boolean {
  return Boolean(menu && menu.hasAttribute("data-open"));
}

function step() {
  if (!state) return;
  const { ctx, particles } = state;
  const active = state.pointerActive && !isMenuOpen(state.menu);
  const mx = state.pointerX;
  const my = state.pointerY;
  const radiusSq = REPEL_RADIUS * REPEL_RADIUS;

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = state.color;

  for (const p of particles) {
    // Target defaults to home; near the cursor it shifts outward by a bounded push.
    let tx = p.hx;
    let ty = p.hy;

    if (active) {
      const dx = p.hx - mx;
      const dy = p.hy - my;
      const distSq = dx * dx + dy * dy;
      if (distSq < radiusSq) {
        const dist = Math.sqrt(distSq) || 0.0001;
        const push = (1 - dist / REPEL_RADIUS) * MAX_PUSH * p.f;
        tx = p.hx + (dx / dist) * push;
        ty = p.hy + (dy / dist) * push;
      }
    }

    p.x += (tx - p.x) * EASE;
    p.y += (ty - p.y) * EASE;

    ctx.fillRect(p.x, p.y, PARTICLE_SIZE, PARTICLE_SIZE);
  }

  state.rafId = requestAnimationFrame(step);
}

function updatePointer(event: PointerEvent) {
  if (!state) return;
  const rect = state.canvas.getBoundingClientRect();
  const localX = event.clientX - rect.left;
  const localY = event.clientY - rect.top;
  const inside =
    localX >= 0 &&
    localX <= CANVAS_W &&
    localY >= 0 &&
    localY <= CANVAS_H;

  const wasActive = state.pointerActive;
  state.pointerX = localX;
  state.pointerY = localY;
  state.pointerActive = inside && !isMenuOpen(state.menu);

  // Debounced by nature: only fires on the outside -> inside transition.
  if (state.pointerActive && !wasActive) {
    feedback.emit({ sound: "bubble", haptic: "light", source: "sayHi" });
  }
}

export async function initSayHiParticles(): Promise<void> {
  if (state) return;
  if (!document.querySelector("[data-home-page]")) return;
  if (!isDesktop() || prefersReducedMotion()) return;
  // Hint already retired after a previous open — never rebuild it.
  if (readSayHiDismissed()) return;

  const canvas = document.querySelector<HTMLCanvasElement>("[data-say-hi-canvas]");
  if (!canvas) return;

  const src = canvas.dataset.sayHiSrc;
  if (!src) return;

  const menu = canvas.closest<HTMLElement>("[data-profile-menu]");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(CANVAS_W * dpr);
  canvas.height = Math.round(CANVAS_H * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  let particles: Particle[];
  try {
    particles = await sampleParticles(src);
  } catch {
    return;
  }

  // A teardown may have happened while the image was loading.
  if (state) return;
  if (!document.querySelector("[data-home-page]")) return;

  if (menu) menu.setAttribute("data-say-hi-particles", "");

  const onPointerMove = (event: PointerEvent) => updatePointer(event);
  const onPointerLeave = () => {
    if (state) state.pointerActive = false;
  };
  const unsubscribeTheme = userPreferences.subscribe(() => {
    if (state) state.color = readColor(state.canvas);
  });

  state = {
    canvas,
    ctx,
    menu,
    particles,
    color: readColor(canvas),
    pointerX: 0,
    pointerY: 0,
    pointerActive: false,
    rafId: null,
    onPointerMove,
    onPointerLeave,
    unsubscribeTheme,
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave, { passive: true });
  state.rafId = requestAnimationFrame(step);
}

export function resetSayHiParticles(): void {
  if (!state) return;
  if (state.rafId !== null) cancelAnimationFrame(state.rafId);
  window.removeEventListener("pointermove", state.onPointerMove);
  window.removeEventListener("pointerleave", state.onPointerLeave);
  state.unsubscribeTheme();
  state.ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  state = null;
}
