import Modal from "./Modal";
import { useI18n } from "../i18n/I18nContext";

type DialogKind = "danger" | "warning" | "info";

interface Props {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual style of the confirm button and icon. */
  kind?: DialogKind;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A reusable modal confirmation dialog styled to match the app's UI
 * (rounded corners, dark mode, Tailwind color palette). Replaces the
 * OS-native `ask`/`confirm` dialogs from tauri-plugin-dialog which
 * could not be themed.
 *
 * - Click the overlay or press ESC to cancel.
 * - The confirm button is on the right; the cancel button on the left,
 *   matching the app's other button pairs.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  kind = "info",
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useI18n();

  const confirmBtnClass: Record<DialogKind, string> = {
    danger: "bg-red-600 text-white hover:bg-red-700",
    warning: "bg-heat text-white hover:opacity-90",
    info: "bg-accent text-white hover:bg-accent-press",
  };

  const iconColor: Record<DialogKind, string> = {
    danger: "text-red-600 dark:text-red-400",
    warning: "text-heat dark:text-heat",
    info: "text-accent dark:text-accent",
  };

  const iconBg: Record<DialogKind, string> = {
    danger: "bg-red-50 dark:bg-red-900/30",
    warning: "bg-heat-bg dark:bg-heat-bg",
    info: "bg-accent-bg dark:bg-accent-bg",
  };

  const Icon =
    kind === "info" ? InfoIcon : kind === "warning" ? WarningIcon : AlertIcon;

  const footer = (
    <>
      <button
        onClick={onCancel}
        className="rounded-pill border border-hairline px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-fill dark:border-hairline dark:text-ink-4 dark:hover:bg-hover"
      >
        {cancelLabel ?? t("cancel")}
      </button>
      <button
        onClick={onConfirm}
        className={`rounded-pill px-4 py-2 text-sm font-medium text-white shadow-cta transition-all ${confirmBtnClass[kind]}`}
      >
        {confirmLabel ?? t("confirm")}
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      title={title}
      icon={
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${iconBg[kind]}`}
        >
          <Icon className={`h-5 w-5 ${iconColor[kind]}`} />
        </div>
      }
      footer={footer}
    >
      <p className="whitespace-pre-wrap text-sm text-ink-2 dark:text-ink-4">
        {message}
      </p>
    </Modal>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
