import fragSource from "./meshGradient.frag.glsl?raw";
import vertSource from "./meshGradient.vert.glsl?raw";

export type WashTintId =
  | "employer"
  | "email"
  | "linkedin"
  | "telegram"
  | "github"
  | "x"
  | "cv";

export interface WashController {
  setTint(hex: string): void;
  setTintId(id: WashTintId | string): void;
  destroy(): void;
}

const MAX_COLORS = 10;
const MAX_PIXEL_COUNT = 1_500_000;
const TINT_MIX = 0.06;

function readCssVar(name: string, fallback = ""): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function readTokenNumber(name: string, fallback: number): number {
  const raw = Number.parseFloat(readCssVar(name, String(fallback)));
  return Number.isFinite(raw) ? raw : fallback;
}

function parseCssColor(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "#000000";
  if (trimmed.startsWith("#")) return trimmed;

  const rgbMatch = trimmed.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    const toHex = (n: string) =>
      Math.round(Number.parseFloat(n)).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  return trimmed;
}

export function readWashBg(): string {
  return parseCssColor(
    readCssVar("--color-bg-page", readCssVar("--wash-bg", "#000000")),
  );
}

export function readWashTint(id: WashTintId | string): string {
  return parseCssColor(readCssVar(`--wash-tint-${id}`, readWashBg()));
}

export function readWashPalette(id: WashTintId | string): string[] | null {
  const bg = readCssVar(`--wash-palette-${id}-bg`);
  const c1 = readCssVar(`--wash-palette-${id}-1`);
  const c2 = readCssVar(`--wash-palette-${id}-2`);
  const c3 = readCssVar(`--wash-palette-${id}-3`);
  if (!bg || !c1 || !c2 || !c3) return null;
  return [bg, c1, c2, c3].map(parseCssColor);
}

function hexToHsl(hex: string): [number, number, number] {
  const normalized = parseCssColor(hex).replace("#", "");
  const parts = normalized.match(/\w\w/g);
  if (!parts || parts.length < 3) return [0, 0, 0];

  const [r, g, b] = parts.map((x) => Number.parseInt(x, 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(100, Math.max(0, s)) / 100;
  const lit = Math.min(100, Math.max(0, l)) / 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = sat * Math.min(lit, 1 - lit);
  const f = (n: number) =>
    Math.round(255 * (lit - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return `#${[f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function mixHsl(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  const dh = ((b[0] - a[0] + 540) % 360) - 180;
  return [
    (((a[0] + dh * t) % 360) + 360) % 360,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/**
 * Soften brand accents without shifting hue (red stays red → burgundy, not orange).
 * Lowers lightness into deep tones; eases only neon-level saturation.
 */
function muteWashAccent(tintHex: string): string {
  const [h, s, l] = hexToHsl(parseCssColor(tintHex));
  const deepL = l > 42 ? l * 0.52 : l * 0.82;
  const richS = s > 72 ? s * 0.84 : s * 0.94;
  return hslToHex(h, richS, Math.max(18, Math.min(deepL, 38)));
}

/**
 * Ground accent in theme page bg via S/L only — hue locked, no red→orange drift.
 */
function mixAccentIntoPageBg(accentHex: string, bgHex: string, amount: number): string {
  const [h, s, l] = hexToHsl(parseCssColor(accentHex));
  const [, bgS, bgL] = hexToHsl(parseCssColor(bgHex));
  return hslToHex(h, s + (bgS - s) * amount, l + (bgL - l) * amount);
}

function prepareAccent(tintHex: string, bgHex: string): string {
  const deep = muteWashAccent(tintHex);
  const mix = readTokenNumber("--wash-accent-bg-mix", 0.42);
  return mixAccentIntoPageBg(deep, bgHex, mix);
}

/** Base = --color-bg-page; accents muted and blended into page bg. */
function softenPalette(palette: string[]): string[] {
  const bg = readWashBg();
  return palette.map((hex, index) => (index === 0 ? bg : prepareAccent(hex, bg)));
}

/** Theme page bg + deep accent (mixed with bg) + softer mid stop. */
function buildPalette(tintHex: string, bgHex: string): string[] {
  const accent = prepareAccent(tintHex, bgHex);
  const soft = mixAccentIntoPageBg(accent, bgHex, 0.45);
  return [bgHex, accent, soft, bgHex];
}

function colorToVec4(hex: string): [number, number, number, number] {
  const normalized = parseCssColor(hex).replace("#", "");
  const parts = normalized.match(/\w\w/g);
  if (!parts || parts.length < 3) return [0, 0, 0, 1];
  const [r, g, b] = parts.map((x) => Number.parseInt(x, 16) / 255);
  return [r, g, b, 1];
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Wash shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vert: string, frag: string) {
  const vertShader = compileShader(gl, gl.VERTEX_SHADER, vert);
  const fragShader = compileShader(gl, gl.FRAGMENT_SHADER, frag);
  if (!vertShader || !fragShader) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  gl.deleteShader(vertShader);
  gl.deleteShader(fragShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Wash shader link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

class MeshGradientWash {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private rafId: number | null = null;
  private lastTime = 0;
  private currentFrame = 0;
  private hslCurrent = hexToHsl(readWashBg());
  private targetHex = readWashBg();
  private tintId: WashTintId | string | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    });
    if (!gl) throw new Error("WebGL2 is not supported");

    const program = createProgram(gl, vertSource, fragSource);
    if (!program) throw new Error("Failed to create wash shader program");

    this.gl = gl;
    this.program = program;
    this.setupAttributes();
    this.cacheUniforms();
    this.setupGlState();
    this.resize();
    this.setupResizeObserver();
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private setupAttributes() {
    const { gl, program } = this;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  }

  private cacheUniforms() {
    const { gl, program } = this;
    const names = [
      "u_time",
      "u_resolution",
      "u_pixelRatio",
      "u_imageAspectRatio",
      "u_originX",
      "u_originY",
      "u_worldWidth",
      "u_worldHeight",
      "u_fit",
      "u_scale",
      "u_rotation",
      "u_offsetX",
      "u_offsetY",
      "u_colors",
      "u_colorsCount",
      "u_distortion",
      "u_swirl",
      "u_grainMixer",
      "u_grainOverlay",
    ];
    for (const name of names) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }
  }

  private setupGlState() {
    const { gl } = this;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
  }

  private setupResizeObserver() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(parent);
    window.addEventListener("resize", this.handleWindowResize);
  }

  private handleWindowResize = () => {
    this.resize();
  };

  private resize() {
    const { canvas, gl } = this;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width <= 0 || height <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let pixelWidth = Math.round(width * dpr);
    let pixelHeight = Math.round(height * dpr);

    const scale = Math.min(1, Math.sqrt(MAX_PIXEL_COUNT / (pixelWidth * pixelHeight)));
    pixelWidth = Math.round(pixelWidth * scale);
    pixelHeight = Math.round(pixelHeight * scale);

    if (canvas.width === pixelWidth && canvas.height === pixelHeight) return;

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    gl.viewport(0, 0, pixelWidth, pixelHeight);
  }

  private setStaticUniforms() {
    const { gl, program, uniforms } = this;
    gl.useProgram(program);

    gl.uniform1f(uniforms.u_pixelRatio, 1);
    gl.uniform1f(uniforms.u_imageAspectRatio, 1);
    gl.uniform1f(uniforms.u_originX, 0.5);
    gl.uniform1f(uniforms.u_originY, 0.5);
    gl.uniform1f(uniforms.u_worldWidth, 0);
    gl.uniform1f(uniforms.u_worldHeight, 0);
    gl.uniform1f(uniforms.u_fit, 1);
    gl.uniform1f(uniforms.u_scale, 1);
    gl.uniform1f(uniforms.u_rotation, 0);
    gl.uniform1f(uniforms.u_offsetX, 0);
    gl.uniform1f(uniforms.u_offsetY, 0);
    gl.uniform1f(uniforms.u_distortion, readTokenNumber("--wash-distortion", 0.8));
    gl.uniform1f(uniforms.u_swirl, readTokenNumber("--wash-swirl", 0.2));
    gl.uniform1f(uniforms.u_grainMixer, readTokenNumber("--wash-grain-mixer", 0.15));
    gl.uniform1f(uniforms.u_grainOverlay, readTokenNumber("--wash-grain-overlay", 0.08));
  }

  private updateColors() {
    const customPalette = this.tintId ? readWashPalette(this.tintId) : null;
    let palette: string[];

    if (customPalette) {
      palette = softenPalette(customPalette);
    } else {
      const bg = readWashBg();
      this.hslCurrent = mixHsl(this.hslCurrent, hexToHsl(this.targetHex), TINT_MIX);
      const shownHex = hslToHex(...this.hslCurrent);
      palette = buildPalette(shownHex, bg);
    }

    const colors = new Float32Array(MAX_COLORS * 4);

    palette.forEach((hex, index) => {
      const [r, g, b, a] = colorToVec4(hex);
      const offset = index * 4;
      colors[offset] = r;
      colors[offset + 1] = g;
      colors[offset + 2] = b;
      colors[offset + 3] = a;
    });

    this.gl.uniform4fv(this.uniforms.u_colors, colors);
    this.gl.uniform1f(this.uniforms.u_colorsCount, palette.length);
  }

  private tick = (timestamp: number) => {
    if (this.disposed) return;

    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;
    const speed = readTokenNumber("--wash-speed", 0.25);
    this.currentFrame += dt * speed;

    const { gl, canvas, program } = this;
    if (canvas.width > 0 && canvas.height > 0) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform1f(this.uniforms.u_time, this.currentFrame * 0.001);
      gl.uniform2f(this.uniforms.u_resolution, canvas.width, canvas.height);
      this.setStaticUniforms();
      this.updateColors();
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  setTint(hex: string) {
    this.tintId = null;
    this.targetHex = parseCssColor(hex);
  }

  setTintId(id: WashTintId | string) {
    this.tintId = id;
    this.targetHex = readWashTint(id);
  }

  destroy() {
    this.disposed = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.resizeObserver?.disconnect();
    window.removeEventListener("resize", this.handleWindowResize);
    this.gl.deleteProgram(this.program);
  }
}

export function createWash(canvas: HTMLCanvasElement): WashController {
  try {
    const wash = new MeshGradientWash(canvas);
    wash.setTint(readWashBg());
    return wash;
  } catch (error) {
    console.error("Failed to initialize wash:", error);
    return { setTint() {}, setTintId() {}, destroy() {} };
  }
}
