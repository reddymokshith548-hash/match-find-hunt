import { useCallback, useRef, useState } from "react";

interface Options {
  onLongPress: () => void;
  onClick?: () => void;
  delay?: number;
  moveThreshold?: number;
  /** Called continuously with 0..1 progress while the user is pressing. */
  onProgress?: (progress: number) => void;
  /** Trigger a tactile vibration on supported devices when long-press fires. */
  haptic?: boolean;
}

/**
 * Returns handlers that distinguish a tap (click) from a long-press.
 * Works for both mouse and touch. While the user is holding, `progress`
 * (0..1) is reported via state and `onProgress` so callers can render a
 * visible indicator. When progress hits 1, `onLongPress` fires (with an
 * optional haptic buzz) and the trailing click is suppressed.
 */
export function useLongPress({
  onLongPress,
  onClick,
  delay = 450,
  moveThreshold = 10,
  onProgress,
  haptic = true,
}: Options) {
  const timer = useRef<number | null>(null);
  const raf = useRef<number | null>(null);
  const startTime = useRef<number>(0);
  const triggered = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [pressing, setPressing] = useState(false);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    if (raf.current !== null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
    setPressing(false);
    setProgress(0);
    onProgress?.(0);
  }, [onProgress]);

  const tick = useCallback(() => {
    const elapsed = performance.now() - startTime.current;
    const p = Math.min(1, elapsed / delay);
    setProgress(p);
    onProgress?.(p);
    if (p < 1) {
      raf.current = requestAnimationFrame(tick);
    }
  }, [delay, onProgress]);

  const begin = useCallback(
    (x: number, y: number) => {
      triggered.current = false;
      start.current = { x, y };
      clear();
      setPressing(true);
      startTime.current = performance.now();
      raf.current = requestAnimationFrame(tick);
      timer.current = window.setTimeout(() => {
        triggered.current = true;
        if (haptic && typeof navigator !== "undefined" && "vibrate" in navigator) {
          try { navigator.vibrate?.(30); } catch {}
        }
        onLongPress();
        // Keep the indicator visible briefly so the user sees it completed.
        setProgress(1);
        onProgress?.(1);
      }, delay);
    },
    [clear, delay, haptic, onLongPress, onProgress, tick]
  );

  const move = useCallback(
    (x: number, y: number) => {
      if (!start.current) return;
      const dx = Math.abs(x - start.current.x);
      const dy = Math.abs(y - start.current.y);
      if (dx > moveThreshold || dy > moveThreshold) clear();
    },
    [clear, moveThreshold]
  );

  const end = useCallback(
    (e?: { preventDefault?: () => void }) => {
      const wasTriggered = triggered.current;
      clear();
      if (wasTriggered) {
        e?.preventDefault?.();
        return;
      }
      onClick?.();
    },
    [clear, onClick]
  );

  const cancel = useCallback(() => {
    clear();
    triggered.current = false;
  }, [clear]);

  const handlers = {
    onMouseDown: (e: React.MouseEvent) => begin(e.clientX, e.clientY),
    onMouseMove: (e: React.MouseEvent) => move(e.clientX, e.clientY),
    onMouseUp: (e: React.MouseEvent) => end(e),
    onMouseLeave: cancel,
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      begin(t.clientX, t.clientY);
    },
    onTouchMove: (e: React.TouchEvent) => {
      const t = e.touches[0];
      move(t.clientX, t.clientY);
    },
    onTouchEnd: (e: React.TouchEvent) => end(e as any),
    onTouchCancel: cancel,
    onContextMenu: (e: React.MouseEvent) => {
      // Suppress browser context menu on long-press touch devices
      if (triggered.current) e.preventDefault();
    },
  };

  return { ...handlers, progress, pressing };
}

export default useLongPress;