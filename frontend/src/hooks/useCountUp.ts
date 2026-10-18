import { useState, useEffect, useRef } from "react";

/**
 * useCountUp: Smooth numeric animation hook.
 *
 * Animates a number from its current/initial value up to `targetValue`
 * using a high-performance requestAnimationFrame loop with ease-out cubic interpolation.
 *
 * @param targetValue The target number to count up to.
 * @param duration Duration in milliseconds (default: 1000ms).
 * @param decimals Decimal precision (default: 0).
 */
export function useCountUp(targetValue: number, duration: number = 1000, decimals: number = 0): number {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const currentRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // If targetValue is invalid or unchanged, do nothing
    if (typeof targetValue !== "number" || isNaN(targetValue)) {
      return;
    }

    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const startValue = currentRef.current;
    const diff = targetValue - startValue;

    if (diff === 0) {
      setDisplayValue(targetValue);
      return;
    }

    const startTime = performance.now();

    // Ease-out cubic: rapidly climbs then decelerates gracefully at the end
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const step = (now: number) => {
      const elapsed = now - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(rawProgress);

      const nextVal = startValue + diff * easedProgress;
      currentRef.current = nextVal;

      if (decimals > 0) {
        setDisplayValue(Number(nextVal.toFixed(decimals)));
      } else {
        setDisplayValue(Math.round(nextVal));
      }

      if (rawProgress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        currentRef.current = targetValue;
        setDisplayValue(targetValue);
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [targetValue, duration, decimals]);

  return displayValue;
}
