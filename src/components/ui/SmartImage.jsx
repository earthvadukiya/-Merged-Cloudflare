/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";

/**
 * SmartImage — a drop-in <img> replacement that makes images FEEL fast.
 *
 * Why it speeds up perceived loading:
 *  - The image fades + un-blurs in only once it has actually decoded, so users
 *    never see a half-painted/janky image — they see a smooth reveal.
 *  - A subtle gradient shimmer fills the box until the pixels land, so layout is
 *    stable (no jump) and the slot never looks "broken/empty".
 *  - `decoding="async"` + `loading="lazy"` (by default) keep image decode off the
 *    main thread and defer off-screen fetches — this is pure browser-native work,
 *    so it adds ZERO runtime weight to the bundle and never slows the site.
 *
 * It's intentionally tiny and dependency-free. Use it anywhere a poster / still /
 * backdrop is shown to get a consistent premium load animation.
 */
export default function SmartImage({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  eager = false,
  rounded = "",
  onErrorSrc,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);

  // If the image is already in the browser cache it may fire `load` before React
  // attaches the handler — catch that case so cached images reveal instantly.
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, [src]);

  return (
    <span className={`relative block overflow-hidden ${rounded} ${className}`}>
      {/* Placeholder shimmer — visible only until the image decodes. */}
      {!loaded && !failed && (
        <span className="absolute inset-0 bg-[#15151b]">
          <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </span>
      )}

      {src && !failed && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          fetchpriority={eager ? "high" : "low"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (onErrorSrc && imgRef.current && imgRef.current.src !== onErrorSrc) {
              imgRef.current.src = onErrorSrc;
            } else {
              setFailed(true);
            }
          }}
          className={`w-full h-full object-cover will-change-[transform,opacity,filter] transition-[opacity,filter,transform] duration-700 ease-out ${
            loaded
              ? "opacity-100 blur-0 scale-100"
              : "opacity-0 blur-md scale-[1.04]"
          } ${imgClassName}`}
          {...rest}
        />
      )}

      {failed && (
        <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#26262e] via-[#16161a] to-black text-gray-500 text-xs font-semibold">
          {alt ? alt.slice(0, 1).toUpperCase() : "?"}
        </span>
      )}
    </span>
  );
}
