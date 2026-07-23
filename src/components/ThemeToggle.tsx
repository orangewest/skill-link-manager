import { useState, useRef, useEffect } from "react";
import { useI18n } from "../i18n/I18nContext";
import Tooltip from "./Tooltip";

export type Theme = "light" | "dark" | "system";

interface Props {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

const ICONS: Record<Theme, () => JSX.Element> = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
};

export default function ThemeToggle({ theme, onChange }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const CurrentIcon = ICONS[theme] ?? MonitorIcon;
  const options: Theme[] = ["light", "dark", "system"];

  const labelFor = (value: Theme) => {
    if (value === "light") return t("themeLight");
    if (value === "dark") return t("themeDark");
    return t("themeSystem");
  };

  return (
    <div className="relative" ref={ref}>
      <Tooltip text={t("theme")}>
        <button
          onClick={() => setOpen(!open)}
          aria-label={t("theme")}
          className="flex items-center justify-center rounded-chip border border-hairline px-3 py-1.5 text-ink transition-colors hover:bg-fill dark:border-hairline dark:text-ink-4 dark:hover:bg-hover"
        >
          <CurrentIcon />
        </button>
      </Tooltip>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-36 overflow-hidden rounded-card border border-hairline py-1 shadow-overlay glass-overlay dark:border-hairline">
          {options.map((value) => {
            const Icon = ICONS[value];
            return (
              <button
                key={value}
                onClick={() => {
                  onChange(value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-fill dark:hover:bg-hover ${
                  theme === value
                    ? "font-medium text-accent dark:text-accent"
                    : "text-ink dark:text-ink-4"
                }`}
              >
                <Icon />
                {labelFor(value)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
