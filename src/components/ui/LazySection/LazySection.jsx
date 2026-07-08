/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";

/**
 * LazySection — mounts its children only once it scrolls near the viewport.
 *
 * Why: the anime homepage has many heavy sections (Latest Episode, Top Airing,
 * Most Favorite, Latest Completed, Top 10, Trending...). Rendering them all at
 * once on first paint forces the browser to download dozens of poster images
 * immediately, which is what made the "full page" take 5-7s. By deferring the
 * below-the-fold sections until the user is about to reach them, the initial
 * load only fetches the above-the-fold images and paints in ~2-3s, while the
 * rest stream in seamlessly as you scroll.
 *
 * A `minHeight` placeholder keeps the scrollbar/layout stable so there is no
 * content jump when a section mounts.
 */
export default function LazySection({
  children,
  rootMargin = "600px",
  minHeight = 300,
  className = "",
}) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver (very old browser) -> just render immediately.
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show, rootMargin]);

  return (
    <div ref={ref} className={className} style={!show ? { minHeight } : undefined}>
      {show ? children : null}
    </div>
  );
}
