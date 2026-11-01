import { useState, useEffect } from 'react';

/**
 * useForceRepaint
 * Triggers a re-render / force a repaint on window resize, visibilitychange,
 * and DPI scale / monitor resolution changes.
 * Used to eliminate Chrome GPU compositing and stale-repaint glitches.
 *
 * @param {boolean} enabled - Whether listeners are active (default: true)
 */
export function useForceRepaint(enabled = true) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const forceRepaint = () => {
      setTick((prev) => prev + 1);
    };

    window.addEventListener('resize', forceRepaint, { passive: true });
    document.addEventListener('visibilitychange', forceRepaint, { passive: true });

    // Track resolution changes (e.g. dragging between monitors with different DPI or browser zoom)
    let mediaQueryList = null;
    let handleMediaChange = null;

    if (window.matchMedia) {
      try {
        const dppx = window.devicePixelRatio || 1;
        mediaQueryList = window.matchMedia(`(resolution: ${dppx}dppx)`);
        handleMediaChange = () => {
          forceRepaint();
        };

        if (mediaQueryList.addEventListener) {
          mediaQueryList.addEventListener('change', handleMediaChange);
        } else if (mediaQueryList.addListener) {
          mediaQueryList.addListener(handleMediaChange);
        }
      } catch (err) {
        // Fallback gracefully if resolution query isn't supported
      }
    }

    return () => {
      window.removeEventListener('resize', forceRepaint);
      document.removeEventListener('visibilitychange', forceRepaint);
      if (mediaQueryList && handleMediaChange) {
        if (mediaQueryList.removeEventListener) {
          mediaQueryList.removeEventListener('change', handleMediaChange);
        } else if (mediaQueryList.removeListener) {
          mediaQueryList.removeListener(handleMediaChange);
        }
      }
    };
  }, [enabled]);
}

export default useForceRepaint;
