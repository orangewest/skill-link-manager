import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useI18n } from "../i18n/I18nContext";
import Tooltip from "./Tooltip";

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
      ? "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
      : "rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

  const btnClasses =
    size === "lg"
      ? "flex-shrink-0 rounded-lg border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      : "flex-shrink-0 rounded border border-gray-300 bg-white p-1.5 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700";

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
        <Tooltip text={t("browse")}>
          <button
            type="button"
            onClick={handleBrowse}
            disabled={picking}
            aria-label={t("browse")}
            className={`${btnClasses} flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={picking ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </Tooltip>
      )}
    </div>
  );
}
