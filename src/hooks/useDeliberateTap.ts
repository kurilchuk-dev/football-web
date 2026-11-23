import { useRef, type MouseEvent, type PointerEvent } from 'react';

/** How far (px) a finger may move and still count as a tap rather than a scroll. */
const TAP_SLOP = 10;

interface Start {
  x: number;
  y: number;
  scrollY: number;
}

/**
 * Turns a press into `onTap` only when it was a real tap. A press that moved or that scrolled
 * the page (a finger flicking through the list) is ignored, so scrolling on a phone never opens
 * anything by accident. Mouse and keyboard clicks always pass.
 */
export function useDeliberateTap(onTap: () => void) {
  const start = useRef<Start | null>(null);

  return {
    onPointerDown: (event: PointerEvent) => {
      start.current = { x: event.clientX, y: event.clientY, scrollY: window.scrollY };
    },
    // The browser cancels the press when it takes over for scrolling.
    onPointerCancel: () => {
      start.current = null;
    },
    onClick: (event: MouseEvent) => {
      const from = start.current;
      start.current = null;
      if (from) {
        const moved = Math.hypot(event.clientX - from.x, event.clientY - from.y) > TAP_SLOP;
        const scrolled = Math.abs(window.scrollY - from.scrollY) > 1;
        if (moved || scrolled) return;
      }
      onTap();
    },
  };
}
