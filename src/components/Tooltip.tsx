import { useState, useRef, useLayoutEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Placement = "top" | "bottom";

interface TooltipProps {
  /** The text (or node) shown inside the tooltip. */
  text: ReactNode;
  /** The trigger element (usually a button). */
  children: ReactNode;
  /** Preferred side. Auto-flips when there isn't enough room. */
  placement?: Placement;
  /** Horizontal alignment of the tip relative to the trigger.
   *  "center" (default) centers it; "start" aligns the tip's left edge with
   *  the trigger's left edge — useful for wide triggers spanning a row. */
  align?: "start" | "center";
  /** Extra classes for the wrapper (e.g. "flex-1" so a growing child still grows). */
  className?: string;
  /** Allow the text to wrap (use for long descriptions). Default off so short labels stay on one line. */
  wrap?: boolean;
}

/**
 * Styled replacement for the native `title` tooltip. Renders into a portal at
 * <body> so it is never clipped by `overflow-hidden` / `overflow-y-auto`
 * containers (modal cards, scroll lists). Shows on hover and keyboard focus,
 * and clamps its position to stay fully inside the viewport.
 */
export default function Tooltip({ text, children, placement = "top", align = "center", className = "", wrap = false }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [trigger, setTrigger] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const show = () => {
    const el = triggerRef.current;
    if (!el) return;
    setTrigger(el.getBoundingClientRect());
  };
  const hide = () => {
    setTrigger(null);
    setPos(null);
  };

  // Measure the rendered tooltip, then clamp its position to the viewport and
  // pick the side with the most room.
  useLayoutEffect(() => {
    if (!trigger || !tipRef.current) return;
    const tip = tipRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 8;

    const roomAbove = trigger.top;
    const roomBelow = vh - trigger.bottom;
    let side: Placement = placement;
    if (placement === "top" && roomAbove < tip.height + gap * 2 + 4) side = "bottom";
    else if (placement === "bottom" && roomBelow < tip.height + gap * 2 + 4) side = "top";

    let top = side === "top" ? trigger.top - gap - tip.height : trigger.bottom + gap;
    let left = align === "start" ? trigger.left : trigger.left + trigger.width / 2 - tip.width / 2;
    left = Math.max(gap, Math.min(left, Math.max(gap, vw - tip.width - gap)));
    top = Math.max(gap, Math.min(top, Math.max(gap, vh - tip.height - gap)));
    setPos({ top, left });
  }, [trigger, placement]);

  return (
    <>
      <span
        ref={triggerRef}
        className={"inline-flex " + className}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {trigger &&
        createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            className={
              "pointer-events-none fixed z-[100] max-w-[340px] rounded-card border border-hairline px-3 py-1.5 text-xs leading-relaxed text-ink shadow-overlay glass-overlay dark:border-hairline dark:text-ink " +
              (wrap ? "break-words" : "whitespace-nowrap")
            }
            style={{
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              visibility: pos ? "visible" : "hidden",
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}
