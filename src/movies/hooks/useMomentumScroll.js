import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useMomentumScroll — smooth, inertial horizontal drag-scrolling for the
 * Movies/TV sliders.
 *
 * Why this exists: the old rows moved the scroll position 1:1 with the mouse
 * and then stopped DEAD the instant the button was released — that abrupt halt
 * is the "hard scroll" the rows had. This hook adds:
 *
 *   • velocity tracking while dragging,
 *   • inertial deceleration (momentum) on release via requestAnimationFrame,
 *   • eased button paging (`scrollByPage`) that animates instead of jumping,
 *
 * giving every slide a fluid, animated feel.
 *
 * Returns the handlers/refs the component spreads onto its scroll container.
 */
export default function useMomentumScroll() {
  const trackRef = useRef(null);

  const drag = useRef({
    active: false,
    moved: false,
    startX: 0,
    startScroll: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0, // px per ms
  });

  const rafRef = useRef(0);
  const [dragging, setDragging] = useState(false);

  const stopGlide = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    const el = trackRef.current;
    if (el) el.classList.remove("is-gliding");
  }, []);

  // Inertial deceleration after the pointer is released.
  const startMomentum = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    let velocity = drag.current.velocity * 16; // px/frame (~16ms)
    if (Math.abs(velocity) < 0.5) return;

    el.classList.add("is-gliding");
    const friction = 0.94; // higher = longer glide

    const step = () => {
      velocity *= friction;
      el.scrollLeft -= velocity;
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      if (Math.abs(velocity) < 0.4 || atStart || atEnd) {
        stopGlide();
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [stopGlide]);

  // Eased programmatic paging used by the chevron buttons.
  const glideBy = useCallback(
    (distance) => {
      const el = trackRef.current;
      if (!el) return;
      stopGlide();
      el.classList.add("is-gliding");
      const start = el.scrollLeft;
      const startTime = performance.now();
      const duration = 520;
      const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic

      const step = (now) => {
        const p = Math.min(1, (now - startTime) / duration);
        el.scrollLeft = start + distance * ease(p);
        if (p < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          stopGlide();
        }
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [stopGlide]
  );

  const scrollByPage = useCallback(
    (dir) => {
      const el = trackRef.current;
      if (!el) return;
      glideBy(dir * el.clientWidth * 0.85);
    },
    [glideBy]
  );

  const onMouseDown = useCallback(
    (e) => {
      const el = trackRef.current;
      if (!el) return;
      stopGlide();
      drag.current = {
        active: true,
        moved: false,
        startX: e.pageX,
        startScroll: el.scrollLeft,
        lastX: e.pageX,
        lastT: performance.now(),
        velocity: 0,
      };
    },
    [stopGlide]
  );

  const onMouseMove = useCallback((e) => {
    const d = drag.current;
    if (!d.active) return;
    const el = trackRef.current;
    if (!el) return;

    const delta = e.pageX - d.startX;
    if (Math.abs(delta) > 5 && !d.moved) {
      d.moved = true;
      setDragging(true);
      el.classList.add("is-gliding"); // disable native smooth while dragging
    }
    if (d.moved) {
      e.preventDefault();
      el.scrollLeft = d.startScroll - delta;

      const now = performance.now();
      const dt = now - d.lastT || 16;
      d.velocity = (e.pageX - d.lastX) / dt;
      d.lastX = e.pageX;
      d.lastT = now;
    }
  }, []);

  const endDrag = useCallback(() => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (d.moved) {
      startMomentum();
      setTimeout(() => setDragging(false), 0);
    } else {
      setDragging(false);
    }
  }, [startMomentum]);

  // Suppress the click that follows a real drag so cards don't navigate.
  const onClickCapture = useCallback((e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  useEffect(() => () => stopGlide(), [stopGlide]);

  return {
    trackRef,
    dragging,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp: endDrag,
      onMouseLeave: endDrag,
      onClickCapture,
    },
    scrollByPage,
    glideBy,
  };
}
