import { prefersReducedMotion } from "../../experience/motion/prefersReducedMotion";

const SLIDE_DURATION_MS = 5000;

export function initPhotoWidget(root: HTMLElement) {
  if (root.hasAttribute("data-bound")) return;
  root.setAttribute("data-bound", "true");

  const track = root.querySelector<HTMLElement>("[data-photo-track]");
  const indicator = root.querySelector<HTMLElement>("[data-photo-indicator]");
  const indicatorTrack = root.querySelector<HTMLElement>("[data-photo-indicator-track]");

  if (!track || !indicator || !indicatorTrack) return;

  const slideCount = Number(root.dataset.slideCount ?? 0);
  if (slideCount <= 0) return;

  let index = 0;
  let progress = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartTranslate = 0;
  let dragOffset = 0;
  let rafId = 0;
  let lastTick = 0;
  const reducedMotion = prefersReducedMotion();

  const getSlideWidth = () => root.clientWidth;

  const setTranslate = (px: number, animate = true) => {
    if (!animate) track.style.transition = "none";
    track.style.transform = `translateX(${px}px)`;
    if (!animate) {
      track.offsetHeight;
      track.style.transition = "";
    }
  };

  const updateProgressFill = () => {
    const fill = indicator.querySelector<HTMLElement>("[data-photo-progress]");
    if (fill) fill.style.width = `${progress * 100}%`;
  };

  const createDotItem = () => {
    const item = document.createElement("span");
    item.className = "photo-widget__indicator-item";
    const dot = document.createElement("span");
    dot.className = "photo-widget__indicator-dot";
    item.append(dot);
    return item;
  };

  const createProgressItem = () => {
    const item = document.createElement("span");
    item.className =
      "photo-widget__indicator-item photo-widget__indicator-item--progress";
    const progressTrack = document.createElement("span");
    progressTrack.className = "photo-widget__indicator-progress";
    const fill = document.createElement("span");
    fill.className = "photo-widget__indicator-progress-fill";
    fill.setAttribute("data-photo-progress", "");
    fill.style.width = `${progress * 100}%`;
    progressTrack.append(fill);
    item.append(progressTrack);
    return item;
  };

  const renderIndicator = () => {
    indicatorTrack.innerHTML = "";

    for (let i = 0; i < index; i += 1) {
      indicatorTrack.append(createDotItem());
    }

    indicatorTrack.append(createProgressItem());

    for (let i = index + 1; i < slideCount; i += 1) {
      indicatorTrack.append(createDotItem());
    }
  };

  const snapToIndex = (nextIndex: number, animate = true, resetProgress = true) => {
    index = (nextIndex + slideCount) % slideCount;
    if (resetProgress) progress = 0;
    setTranslate(-index * getSlideWidth(), animate);
    renderIndicator();
    root.dataset.currentIndex = String(index);
  };

  const tick = (timestamp: number) => {
    if (!lastTick) lastTick = timestamp;

    if (!isDragging && !reducedMotion) {
      const elapsed = timestamp - lastTick;
      progress += elapsed / SLIDE_DURATION_MS;

      if (progress >= 1) {
        snapToIndex(index + 1);
        lastTick = timestamp;
      } else {
        updateProgressFill();
      }
    }

    if (!isDragging) {
      lastTick = timestamp;
    }

    rafId = window.requestAnimationFrame(tick);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    isDragging = true;
    dragStartX = event.clientX;
    dragStartTranslate = -index * getSlideWidth();
    dragOffset = 0;
    root.classList.add("is-dragging");
    root.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!isDragging) return;
    dragOffset = event.clientX - dragStartX;
    setTranslate(dragStartTranslate + dragOffset, false);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!isDragging) return;
    isDragging = false;
    root.classList.remove("is-dragging");
    root.releasePointerCapture(event.pointerId);

    const slideWidth = getSlideWidth();
    const movedSlides = Math.round(-dragOffset / slideWidth);

    if (movedSlides !== 0) {
      snapToIndex(index + movedSlides);
    } else {
      setTranslate(-index * slideWidth, true);
    }

    lastTick = performance.now();
  };

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerup", onPointerUp);
  root.addEventListener("pointercancel", onPointerUp);

  window.addEventListener("resize", () => {
    setTranslate(-index * getSlideWidth(), false);
  });

  snapToIndex(0, false);
  lastTick = performance.now();
  rafId = window.requestAnimationFrame(tick);
}
