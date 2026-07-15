import { prefersReducedMotion } from "../../experience/motion/prefersReducedMotion";
import { PHOTO_SLIDE_DURATION_MS } from "./config";

const MAX_TICK_ELAPSED_MS = 100;
const HAVE_CURRENT_DATA = 2;

export function initPhotoWidget(root: HTMLElement) {
  if (root.hasAttribute("data-bound")) return;
  root.setAttribute("data-bound", "true");

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

    track.insertBefore(lastClone, originalSlides[0]);
    track.appendChild(firstClone);
    track.setAttribute("data-infinite-ready", "true");
  }

  const mediaVideos = Array.from(
    track.querySelectorAll<HTMLVideoElement>("video"),
  );
  for (const video of mediaVideos) {
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.preload = "auto";
    video.pause();
    try {
      video.currentTime = 0;
    } catch {
      // Metadata may not be ready yet.
    }
  }

  let trackIndex = slideCount > 1 ? 1 : 0;
  let progress = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartTranslate = 0;
  let dragOffset = 0;
  let lastTick = 0;
  let playGeneration = 0;
  let playInFlight = false;
  let isVisible = !document.hidden;
  const reducedMotion = prefersReducedMotion();

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
    const fill = indicator.querySelector<HTMLElement>("[data-photo-progress]");
    if (fill) fill.style.width = `${progress * 100}%`;
  };

  const getActiveSlide = () =>
    track.children.item(trackIndex) as HTMLElement | null;

  const getActiveSlideVideo = () =>
    getActiveSlide()?.querySelector<HTMLVideoElement>("video") ?? null;

  const waitForCanPlay = (video: HTMLVideoElement) =>
    new Promise<void>((resolve) => {
      if (video.readyState >= HAVE_CURRENT_DATA) {
        resolve();
        return;
      }

      const finish = () => {
        video.removeEventListener("canplay", finish);
        video.removeEventListener("loadeddata", finish);
        video.removeEventListener("error", finish);
        resolve();
      };

      video.addEventListener("canplay", finish, { once: true });
      video.addEventListener("loadeddata", finish, { once: true });
      video.addEventListener("error", finish, { once: true });
    });

  const playVideo = async (video: HTMLVideoElement, restart: boolean) => {
    if (playInFlight && !restart) return;

    const generation = ++playGeneration;
    playInFlight = true;
    video.muted = true;
    video.volume = 0;
    video.playsInline = true;

    if (video.preload !== "auto") {
      video.preload = "auto";
    }

    try {
      await waitForCanPlay(video);
      if (generation !== playGeneration) return;

      if (restart) {
        try {
          video.currentTime = 0;
        } catch {
          // Ignore until seekable.
        }
      }

      try {
        await video.play();
      } catch {
        if (generation !== playGeneration) return;
        await waitForCanPlay(video);
        if (generation !== playGeneration) return;
        try {
          await video.play();
        } catch {
          // Autoplay may still be blocked; tick will retry while slide is active.
        }
      }
    } finally {
      if (generation === playGeneration) {
        playInFlight = false;
      }
    }
  };

  const syncActiveSlideVideo = (restart = true) => {
    const activeSlide = getActiveSlide();

    for (const video of mediaVideos) {
      const parentSlide = video.closest<HTMLElement>(".photo-widget__slide");
      const isActive = parentSlide === activeSlide;

      if (isActive) {
        void playVideo(video, restart);
      } else {
        video.pause();
        try {
          video.currentTime = 0;
        } catch {
          // Ignore until seekable.
        }
      }
    }
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
    syncActiveSlideVideo(true);

    if (!animate || reducedMotion) {
      normalizeTrackIndex();
    }
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
    snapToTrackIndex(trackIndex + 1);
  };

  const tick = (timestamp: number) => {
    if (!lastTick) lastTick = timestamp;

    const elapsed = Math.min(
      Math.max(0, timestamp - lastTick),
      MAX_TICK_ELAPSED_MS,
    );

    if (
      !isDragging &&
      !reducedMotion &&
      !document.hidden &&
      isVisible &&
      slideCount > 1
    ) {
      const activeVideo = getActiveSlideVideo();

      if (activeVideo) {
        if (
          activeVideo.paused &&
          !activeVideo.ended &&
          !playInFlight
        ) {
          void playVideo(activeVideo, false);
        }

        const duration = activeVideo.duration;
        if (Number.isFinite(duration) && duration > 0) {
          if (
            activeVideo.paused &&
            !activeVideo.ended &&
            activeVideo.currentTime < 0.05
          ) {
            // Play hasn't started (buffering / autoplay) — don't soft-lock the carousel.
            progress += elapsed / PHOTO_SLIDE_DURATION_MS;
          } else {
            progress = Math.min(1, activeVideo.currentTime / duration);
          }

          if (activeVideo.ended || progress >= 1) {
            advanceSlide();
          } else {
            updateProgressFill();
          }
        } else {
          // Metadata still loading — keep gallery moving, keep trying to play.
          progress += elapsed / PHOTO_SLIDE_DURATION_MS;
          if (progress >= 1) {
            advanceSlide();
          } else {
            updateProgressFill();
          }
        }
      } else {
        progress += elapsed / PHOTO_SLIDE_DURATION_MS;

        if (progress >= 1) {
          advanceSlide();
        } else {
          updateProgressFill();
        }
      }
    }

    if (!isDragging && !document.hidden && isVisible) {
      lastTick = timestamp;
    }

    window.requestAnimationFrame(tick);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    isDragging = true;
    dragStartX = event.clientX;
    dragStartTranslate = -trackIndex * getSlideWidth();
    dragOffset = 0;
    root.classList.add("is-dragging");
    root.setPointerCapture(event.pointerId);
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
      const activeVideo = getActiveSlideVideo();
      if (activeVideo) void playVideo(activeVideo, false);
    }

    lastTick = performance.now();
  };

  const onVisibilityChange = () => {
    lastTick = performance.now();
    if (document.hidden) {
      isVisible = false;
      getActiveSlideVideo()?.pause();
      return;
    }
    isVisible = true;
    syncActiveSlideVideo(false);
  };

  track.addEventListener("transitionend", (event) => {
    if (event.target !== track || event.propertyName !== "transform") return;
    normalizeTrackIndex();
  });

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerup", onPointerUp);
  root.addEventListener("pointercancel", onPointerUp);
  root.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });

  document.addEventListener("visibilitychange", onVisibilityChange);

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry) return;
      lastTick = performance.now();
      isVisible = entry.isIntersecting && !document.hidden;
      if (!entry.isIntersecting) {
        getActiveSlideVideo()?.pause();
        return;
      }
      if (!document.hidden) {
        syncActiveSlideVideo(false);
      }
    },
    { threshold: 0.4 },
  );
  intersectionObserver.observe(root);

  window.addEventListener("resize", () => {
    setTranslate(-trackIndex * getSlideWidth(), false);
  });

  snapToTrackIndex(trackIndex, false);
  lastTick = performance.now();
  window.requestAnimationFrame(tick);
}
