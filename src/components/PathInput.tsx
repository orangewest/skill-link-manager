import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useI18n } from "../i18n/I18nContext";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Classes for the wrapper element (controls layout in parent, e.g. "flex-1", "w-full"). */
  className?: string;
  /** Size preset: "lg" for the shared-dir input, "md" (default) for compact tool-dir rows. */
  size?: "md" | "lg";
  /** Whether the directory picker button is shown (default true). */
  browseable?: boolean;
  /** Optional label for accessibility. */
  ariaLabel?: string;
}

/**
 * A path text input paired with a "Browse" button that opens the native
 * OS directory picker (via tauri-plugin-dialog). The user can still type
 * or edit the path manually.
 */
export default function PathInput({
  value,
  onChange,
  placeholder,
  className = "flex-1",
  size = "md",
  browseable = true,
  ariaLabel,
}: Props) {
  const { t } = useI18n();
  const [picking, setPicking] = useState(false);

  const handleBrowse = async () => {
    if (picking) return;
    setPicking(true);
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: value || undefined,
      });
      if (typeof selected === "string" && selected) {
        onChange(selected);
      }
    } catch (e) {
      console.error("Directory picker failed:", e);
    } finally {
      setPicking(false);
    }
  };

  const inputClasses =
    size === "lg"
      ? "rounded-lg border border-gray-300 px-3 py-2 text-sm"
      : "rounded border border-gray-300 px-2 py-1 text-sm";

  const btnClasses =
    size === "lg"
      ? "flex-shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
      : "flex-shrink-0 rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100";

  return (
    <div className={`flex gap-2 ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`min-w-0 flex-1 ${inputClasses} focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400`}
      />
      {browseable && (
        <button
          type="button"
          onClick={handleBrowse}
          disabled={picking}
          className={`${btnClasses} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {picking ? "..." : t("browse")}
        </button>
      )}
    </div>
  );
}
