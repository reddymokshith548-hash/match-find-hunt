import { useCallback, useRef } from "react";

interface Options {
  onLongPress: () => void;
  onClick?: () => void;
  delay?: number;
  moveThreshold?: number;
}

/**
 * Returns handlers that distinguish a tap (click) from a long-press.
 * Works for both mouse and touch. If the press exceeds `delay` ms without
 * significant movement, `onLongPress` fires and the subsequent click is suppressed.
 */
export function useLongPress({ onLongPress, onClick, delay = 450, moveThreshold = 10 }: Options) {
  const timer = useRef<number | null>(null);
  const triggered = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const begin = useCallback(
    (x: number, y: number) => {
      triggered.current = false;
      start.current = { x, y };
      clear();
      timer.current = window.setTimeout(() => {
        triggered.current = true;
        onLongPress();
      }, delay);
    },
    [clear, delay, onLongPress]
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
      clear();
      if (triggered.current) {
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

  return {
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
}

export default useLongPress;