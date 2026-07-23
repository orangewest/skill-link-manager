import { useEffect, type ReactNode } from "react";

interface ModalProps {
  /** Whether the modal is visible. Defaults to true; consumers may also
   * gate rendering with `{cond && <Modal ... />}`. */
  open?: boolean;
  onClose: () => void;
  /** Optional header title. */
  title?: ReactNode;
  /** Optional leading icon (e.g. a status badge) shown next to the title. */
  icon?: ReactNode;
  children: ReactNode;
  /** Optional footer area (e.g. action buttons), right-aligned. */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Padding for the body; defaults to a comfortable size. */
  bodyClassName?: string;
}

const sizeClass: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/**
 * Shared, theme-aware modal shell. Provides a blurred overlay, a centered
 * card with an optional header (title + icon + close button) and footer,
 * ESC-to-close, overlay-click-to-close, and body-scroll locking. All
 * floating dialogs reuse this so they look consistent.
 */
export default function Modal({
  open = true,
  onClose,
  title,
  icon,
  children,
  footer,
  size = "md",
  bodyClassName = "",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`flex max-h-[85vh] w-full ${sizeClass[size]} flex-col overflow-hidden rounded-panel border border-hairline bg-surface shadow-overlay dark:border-hairline dark:bg-surface`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || icon) && (
          <div className="flex items-center gap-3 border-b border-hairline px-5 py-4 dark:border-hairline">
            {icon}
            <h3 className="flex-1 text-base font-semibold tracking-tight text-ink dark:text-ink">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-chip p-1.5 text-ink-4 transition-colors hover:bg-fill hover:text-ink-2 dark:hover:bg-hover dark:hover:text-ink"
              aria-label="close"
            >
              <CloseIcon />
            </button>
          </div>
        )}
        <div className={`flex-1 overflow-y-auto px-5 py-4 ${bodyClassName}`}>{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-hairline px-5 py-4 dark:border-hairline">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
