import { prefersReducedMotion } from "../../experience/motion/prefersReducedMotion";
import { PHOTO_SLIDE_DURATION_MS } from "./config";

const TICK_MS = 50;
const VIDEO_END_EPSILON = 0.12;
/** Must match `--motion-photo-slide` (650ms). */
const SLIDE_TRANSITION_MS = 650;

const cleanupByRoot = new WeakMap<HTMLElement, () => void>();

export function initPhotoWidget(root: HTMLElement) {
  cleanupByRoot.get(root)?.();

  const track = root.querySelector<HTMLElement>("[data-photo-track]");
  const indicator = root.querySelector<HTMLElement>("[data-photo-indicator]");
  const indicatorTrack = root.querySelector<HTMLElement>(
    "[data-photo-indicator-track]",
  );

  if (!track || !indicator || !indicatorTrack) return;

  const originalSlides = Array.from(
    track.querySelectorAll<HTMLElement>("[data-photo-slide]"),
  );
  const slideCount = originalSlides.length;
  if (slideCount <= 0) return;

  if (slideCount > 1 && !track.hasAttribute("data-infinite-ready")) {
    const firstClone = originalSlides[0].cloneNode(true) as HTMLElement;
    const lastClone = originalSlides[slideCount - 1].cloneNode(
      true,
    ) as HTMLElement;

    firstClone.removeAttribute("data-photo-slide");
    lastClone.removeAttribute("data-photo-slide");
    firstClone.dataset.clone = "first";
    lastClone.dataset.clone = "last";
    firstClone.setAttribute("aria-hidden", "true");
    lastClone.setAttribute("aria-hidden", "true");

    for (const video of firstClone.querySelectorAll("video")) {
      video.preload = "none";
      video.removeAttribute("src");
    }
    for (const video of lastClone.querySelectorAll("video")) {
      video.preload = "none";
      video.removeAttribute("src");
    }

    track.insertBefore(lastClone, originalSlides[0]);
    track.appendChild(firstClone);
    track.setAttribute("data-infinite-ready", "true");
  }

  const mediaVideos = Array.from(
    track.querySelectorAll<HTMLVideoElement>(
      ".photo-widget__slide:not([data-clone]) video",
    ),
  );
  for (const video of mediaVideos) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.pause();
  }

  let trackIndex = slideCount > 1 ? 1 : 0;
  let progress = 0;
  let progressFill: HTMLElement | null = null;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartTranslate = 0;
  let dragOffset = 0;
  let inViewport = isElementVisible(root);
  let tickId: number | null = null;
  let mediaSyncId: number | null = null;
  let imageStartedAt = 0;
  let isAdvancing = false;
  let playGeneration = 0;
  const reducedMotion = prefersReducedMotion();
  const abort = new AbortController();
  const { signal } = abort;

  const getSlideWidth = () => root.clientWidth;

  const getLogicalIndex = () => {
    if (slideCount <= 1) return 0;
    if (trackIndex === 0) return slideCount - 1;
    if (trackIndex === slideCount + 1) return 0;
    return trackIndex - 1;
  };

  const setTranslate = (px: number, animate = true) => {
    if (!animate) track.style.transition = "none";
    track.style.transform = `translateX(${px}px)`;
    if (!animate) {
      track.offsetHeight;
      track.style.transition = "";
    }
  };

  const updateProgressFill = () => {
    if (progressFill) progressFill.style.width = `${progress * 100}%`;
  };

  const getActiveSlide = () =>
    track.children.item(trackIndex) as HTMLElement | null;

  const getActiveSlideVideo = () => {
    const slide = getActiveSlide();
    if (!slide || slide.hasAttribute("data-clone")) return null;
    return slide.querySelector<HTMLVideoElement>("video");
  };

  const canAutoplay = () =>
    !reducedMotion &&
    !isDragging &&
    inViewport &&
    !document.hidden &&
    slideCount > 1;

  const stopTick = () => {
    if (tickId !== null) {
      window.clearInterval(tickId);
      tickId = null;
    }
  };

  const cancelPendingMediaSync = () => {
    if (mediaSyncId !== null) {
      window.clearTimeout(mediaSyncId);
      mediaSyncId = null;
    }
    playGeneration += 1;
  };

  const pauseAllVideos = () => {
    for (const video of mediaVideos) {
      video.pause();
    }
  };

  const playActiveVideo = (video: HTMLVideoElement, generation: number) => {
    video.muted = true;
    video.preload = "auto";
    progress = 0;
    updateProgressFill();

    // Restart from 0 on revisit — otherwise ended videos are skipped on the next loop.
    // Seek only the active slide after transform settle (inactive seek still freezes Chrome).
    if (video.ended || video.currentTime > VIDEO_END_EPSILON) {
      try {
        video.currentTime = 0;
      } catch {
        // Ignore seek errors before metadata is ready.
      }
    }

    const tryPlay = () => {
      if (generation !== playGeneration) return;
      if (getActiveSlideVideo() !== video || !canAutoplay()) return;
      void video.play().catch(() => {
        // Autoplay blocked — retry from tick while canAutoplay().
      });
    };

    if (video.readyState < 2) {
      video.addEventListener("loadeddata", tryPlay, { once: true, signal });
      // Network fetch if needed — not a compositor resuscitation.
      if (video.networkState === HTMLMediaElement.NETWORK_EMPTY) {
        video.load();
      }
    }
    tryPlay();
  };

  const syncActiveMedia = () => {
    stopTick();
    const activeSlide = getActiveSlide();
    const activeVideo = getActiveSlideVideo();
    const generation = playGeneration;

    // Pause only — do not seek inactive videos (seek + transform freezes Chrome).
    for (const video of mediaVideos) {
      const parentSlide = video.closest<HTMLElement>(".photo-widget__slide");
      if (parentSlide === activeSlide) continue;
      video.pause();
    }

    if (!canAutoplay() || activeSlide?.hasAttribute("data-clone")) {
      activeVideo?.pause();
      return;
    }

    if (activeVideo) {
      playActiveVideo(activeVideo, generation);
    } else {
      imageStartedAt = performance.now() - progress * PHOTO_SLIDE_DURATION_MS;
    }

    startTick();
  };

  /** Soft progress during slide transform, then sync media after settle. */
  const scheduleMediaSync = (immediate: boolean) => {
    cancelPendingMediaSync();
    pauseAllVideos();
    stopTick();

    if (immediate || reducedMotion) {
      syncActiveMedia();
      return;
    }

    imageStartedAt = performance.now();
    startTick();

    mediaSyncId = window.setTimeout(() => {
      mediaSyncId = null;
      // Video progress must start from zero, not soft-transition bleed.
      progress = 0;
      updateProgressFill();
      syncActiveMedia();
    }, SLIDE_TRANSITION_MS);
  };

  const startTick = () => {
    stopTick();
    if (!canAutoplay()) return;

    tickId = window.setInterval(() => {
      if (!canAutoplay()) {
        stopTick();
        return;
      }

      // Soft indicator while waiting for transform to finish.
      if (mediaSyncId !== null) {
        progress = Math.min(
          1,
          (performance.now() - imageStartedAt) / PHOTO_SLIDE_DURATION_MS,
        );
        updateProgressFill();
        if (progress >= 1) advanceSlide();
        return;
      }

      const activeVideo = getActiveSlideVideo();

      if (activeVideo) {
        const duration = activeVideo.duration;
        if (!Number.isFinite(duration) || duration <= 0) {
          return;
        }

        const nearEnd =
          activeVideo.ended ||
          duration - activeVideo.currentTime <= VIDEO_END_EPSILON;

        // Finished (or nearly) — advance. Do not restart here; playActiveVideo
        // resets currentTime when this slide becomes active again.
        if (nearEnd && activeVideo.currentTime > VIDEO_END_EPSILON) {
          progress = 1;
          updateProgressFill();
          advanceSlide();
          return;
        }

        if (activeVideo.paused) {
          void activeVideo.play().catch(() => {});
        }

        progress = Math.min(1, activeVideo.currentTime / duration);
        updateProgressFill();
        return;
      }

      progress = Math.min(
        1,
        (performance.now() - imageStartedAt) / PHOTO_SLIDE_DURATION_MS,
      );
      updateProgressFill();
      if (progress >= 1) advanceSlide();
    }, TICK_MS);
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
    progressFill = fill;
    return item;
  };

  const renderIndicator = () => {
    const index = getLogicalIndex();
    indicatorTrack.innerHTML = "";

    for (let i = 0; i < index; i += 1) {
      indicatorTrack.append(createDotItem());
    }

    indicatorTrack.append(createProgressItem());

    for (let i = index + 1; i < slideCount; i += 1) {
      indicatorTrack.append(createDotItem());
    }
  };

  const snapToTrackIndex = (
    nextTrackIndex: number,
    animate = true,
    resetProgress = true,
  ) => {
    trackIndex = nextTrackIndex;
    if (resetProgress) progress = 0;
    setTranslate(-trackIndex * getSlideWidth(), animate);
    renderIndicator();
    root.dataset.currentIndex = String(getLogicalIndex());
    scheduleMediaSync(!animate);
  };

  const moveSlides = (delta: number) => {
    if (slideCount <= 1 || delta === 0) {
      setTranslate(-trackIndex * getSlideWidth(), true);
      return;
    }

    if (trackIndex === 1 && delta === -1) {
      snapToTrackIndex(0);
      return;
    }

    if (trackIndex === slideCount && delta === 1) {
      snapToTrackIndex(slideCount + 1);
      return;
    }

    const nextLogical =
      (getLogicalIndex() + delta + slideCount * 1000) % slideCount;
    snapToTrackIndex(nextLogical + 1);
  };

  const normalizeTrackIndex = () => {
    if (slideCount <= 1) return;
    if (trackIndex === 0) {
      snapToTrackIndex(slideCount, false, false);
    } else if (trackIndex === slideCount + 1) {
      snapToTrackIndex(1, false, false);
    }
  };

  const advanceSlide = () => {
    if (slideCount <= 1 || isAdvancing) return;
    isAdvancing = true;
    window.setTimeout(() => {
      isAdvancing = false;
    }, 300);

    if (trackIndex === slideCount) {
      snapToTrackIndex(slideCount + 1);
      return;
    }

    snapToTrackIndex(trackIndex + 1);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    isDragging = true;
    dragStartX = event.clientX;
    dragStartTranslate = -trackIndex * getSlideWidth();
    dragOffset = 0;
    root.classList.add("is-dragging");
    root.setPointerCapture(event.pointerId);
    cancelPendingMediaSync();
    stopTick();
    getActiveSlideVideo()?.pause();
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
    moveSlides(movedSlides);
    if (movedSlides === 0) {
      scheduleMediaSync(true);
    }
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      cancelPendingMediaSync();
      stopTick();
      pauseAllVideos();
      return;
    }
    if (inViewport) {
      scheduleMediaSync(true);
    }
  };

  const onResize = () => {
    setTranslate(-trackIndex * getSlideWidth(), false);
  };

  const onTransitionEnd = (event: TransitionEvent) => {
    if (event.target !== track || event.propertyName !== "transform") return;
    normalizeTrackIndex();
  };

  const onDragStart = (event: Event) => {
    event.preventDefault();
  };

  track.addEventListener("transitionend", onTransitionEnd, { signal });
  root.addEventListener("pointerdown", onPointerDown, { signal });
  root.addEventListener("pointermove", onPointerMove, { signal });
  root.addEventListener("pointerup", onPointerUp, { signal });
  root.addEventListener("pointercancel", onPointerUp, { signal });
  root.addEventListener("dragstart", onDragStart, { signal });
  document.addEventListener("visibilitychange", onVisibilityChange, {
    signal,
  });
  window.addEventListener("resize", onResize, { signal });

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry) return;

      inViewport = entry.isIntersecting;
      if (!inViewport) {
        cancelPendingMediaSync();
        stopTick();
        pauseAllVideos();
        return;
      }
      if (!document.hidden) {
        scheduleMediaSync(true);
      }
    },
    { threshold: 0 },
  );
  intersectionObserver.observe(root);

  const cleanup = () => {
    abort.abort();
    cancelPendingMediaSync();
    stopTick();
    pauseAllVideos();
    intersectionObserver.disconnect();
    root.classList.remove("is-dragging");
    cleanupByRoot.delete(root);
  };
  cleanupByRoot.set(root, cleanup);

  snapToTrackIndex(trackIndex, false);
}

function isElementVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.top < window.innerHeight
  );
}
