import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { SkillInfo, AppConfig } from "./types";
import { I18nProvider, useI18n } from "./i18n/I18nContext";
import type { Language } from "./i18n/translations";
import SkillCard from "./components/SkillCard";
import SkillDetail from "./components/SkillDetail";
import SettingsPage from "./components/SettingsPage";
import ToolDirDetail from "./components/ToolDirDetail";
import Onboarding from "./components/Onboarding";
import CategoryManager from "./components/CategoryManager";
import ThemeToggle from "./components/ThemeToggle";
import type { Theme } from "./components/ThemeToggle";
import Tooltip from "./components/Tooltip";
import appIcon from "./assets/app-icon.png";

/** Small inline gear (settings) icon. */
function GearIcon() {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </svg>
  );
}

/** Small inline home icon. */
function HomeIcon() {
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
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

type Page = "home" | "detail" | "settings" | "toolDirDetail" | "onboarding";

/** Apply the given theme to the document root element. */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", shouldUseDark);
}

function AppContent() {
  const { t, language, setLanguage } = useI18n();

  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(null);
  const [selectedToolDirName, setSelectedToolDirName] = useState<string | null>(null);
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const configRef = useRef<AppConfig | null>(null);

  // ---- Categorization UI state ----
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // ---- Initial load: check config existence → onboarding or normal ----
  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const exists = await invoke<boolean>("config_file_exists");
        if (!exists) {
          // First run — show onboarding instead of loading config
          setCurrentPage("onboarding");
          return;
        }

        const cfg = await invoke<AppConfig>("load_config");
        configRef.current = cfg;
        setConfig(cfg);

        // Set language from config
        setLanguage(cfg.language === "en" ? "en" : "zh");

        const scanned = await invoke<SkillInfo[]>("scan_skills");
        setSkills(scanned);
      } catch (e: unknown) {
        setError(typeof e === "string" ? e : String(e));
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [setLanguage]);

  // ---- Theme application: apply theme + listen to system changes ----
  const theme: Theme = (config?.theme as Theme) ?? "system";
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  // ---- Handlers ----
  const handleSkillClick = useCallback((name: string) => {
    setSelectedSkillName(name);
    setCurrentPage("detail");
  }, []);

  const handleLanguageChange = useCallback(
    (lang: Language) => {
      setLanguage(lang);
      const currentConfig = configRef.current;
      if (currentConfig) {
        const newConfig = { ...currentConfig, language: lang };
        configRef.current = newConfig;
        setConfig(newConfig);
        invoke("save_config", { config: newConfig }).catch((e: unknown) =>
          console.error("Failed to save config:", e)
        );
      }
    },
    [setLanguage]
  );

  const handleThemeChange = useCallback(
    (newTheme: Theme) => {
      const currentConfig = configRef.current;
      if (currentConfig) {
        const newConfig = { ...currentConfig, theme: newTheme };
        configRef.current = newConfig;
        setConfig(newConfig);
        invoke("save_config", { config: newConfig }).catch((e: unknown) =>
          console.error("Failed to save config:", e)
        );
      }
    },
    []
  );

  const handleConfigSaved = useCallback((newConfig: AppConfig) => {
    configRef.current = newConfig;
    setConfig(newConfig);
    // Re-scan skills with new config (shared_dir may have changed)
    invoke<SkillInfo[]>("scan_skills")
      .then(setSkills)
      .catch((e: unknown) =>
        setError(typeof e === "string" ? e : String(e))
      );
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setCurrentPage("home");
    setSelectedSkillName(null);
    // Refresh skills to update linked counts
    invoke<SkillInfo[]>("scan_skills")
      .then(setSkills)
      .catch((e: unknown) =>
        setError(typeof e === "string" ? e : String(e))
      );
  }, []);

  const handleToolDirClick = useCallback((name: string) => {
    setSelectedToolDirName(name);
    setCurrentPage("toolDirDetail");
  }, []);

  const handleRefreshSkills = useCallback(() => {
    setRefreshing(true);
    setError(null);
    invoke<SkillInfo[]>("scan_skills")
      .then(setSkills)
      .catch((e: unknown) =>
        setError(typeof e === "string" ? e : String(e))
      )
      .finally(() => setRefreshing(false));
  }, []);

  const handleBackFromToolDirDetail = useCallback(() => {
    setCurrentPage("settings");
    setSelectedToolDirName(null);
    // Refresh skills — links may have been modified in the tool dir detail
    invoke<SkillInfo[]>("scan_skills")
      .then(setSkills)
      .catch((e: unknown) =>
        setError(typeof e === "string" ? e : String(e))
      );
  }, []);

  const handleOnboardingComplete = useCallback(
    (newConfig: AppConfig) => {
      configRef.current = newConfig;
      setConfig(newConfig);
      setLanguage(newConfig.language === "en" ? "en" : "zh");
      invoke<SkillInfo[]>("scan_skills")
        .then(setSkills)
        .catch((e: unknown) =>
          setError(typeof e === "string" ? e : String(e))
        );
      setCurrentPage("home");
    },
    [setLanguage]
  );

  // ---- Categorization helpers ----
  const updateConfig = useCallback((updater: (c: AppConfig) => AppConfig) => {
    const current = configRef.current;
    if (!current) return;
    const newConfig = updater(current);
    configRef.current = newConfig;
    setConfig(newConfig);
    invoke("save_config", { config: newConfig }).catch((e: unknown) =>
      console.error("Failed to save config:", e)
    );
  }, []);

  const handleReorderCategories = useCallback(
    (order: string[]) => {
      updateConfig((c) => ({ ...c, category_order: order }));
    },
    [updateConfig]
  );

  const handleSetCategoryMembers = useCallback(
    (category: string, skillNames: string[]) => {
      updateConfig((c) => {
        const categories = { ...c.categories };
        // Drop the category from skills that used to be members but aren't now.
        for (const [k, v] of Object.entries(categories)) {
          if (v === category && !skillNames.includes(k)) delete categories[k];
        }
        // Assign the category to every selected skill.
        for (const name of skillNames) categories[name] = category;
        return { ...c, categories };
      });
    },
    [updateConfig]
  );

  const handleAddCategory = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      updateConfig((c) => {
        if (c.category_order.includes(trimmed)) return c;
        return { ...c, category_order: [...c.category_order, trimmed] };
      });
    },
    [updateConfig]
  );

  const handleRenameCategory = useCallback(
    (oldName: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return;
      updateConfig((c) => {
        const category_order = c.category_order.includes(oldName)
          ? c.category_order.map((o) => (o === oldName ? trimmed : o))
          : [...c.category_order, trimmed];
        const categories = { ...c.categories };
        for (const [k, v] of Object.entries(categories)) {
          if (v === oldName) categories[k] = trimmed;
        }
        return { ...c, category_order, categories };
      });
    },
    [updateConfig]
  );

  const handleDeleteCategory = useCallback(
    (name: string) => {
      if (!window.confirm(t("confirmDeleteCategory"))) return;
      updateConfig((c) => {
        const category_order = c.category_order.filter((o) => o !== name);
        const categories = { ...c.categories };
        for (const k of Object.keys(categories)) {
          if (categories[k] === name) delete categories[k];
        }
        return { ...c, category_order, categories };
      });
    },
    [updateConfig, t]
  );

  // ---- Filtered skills for search ----
  const filteredSkills = searchQuery
    ? skills.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : skills;

  // ---- Categorization (pure UI; does not affect links/filesystem) ----
  const UNCATEGORIZED = "__uncategorized__";
  const categoriesMap = config?.categories ?? {};
  const categoryOrder = config?.category_order ?? [];

  // Category names = order + any categories still present in the map
  // but accidentally missing from `category_order` (orphans).
  const categoryNames = useMemo(() => {
    const set = new Set<string>();
    for (const c of categoryOrder) if (c && c.trim()) set.add(c);
    for (const c of Object.values(categoriesMap)) if (c && c.trim()) set.add(c);
    return Array.from(set);
  }, [categoryOrder, categoriesMap]);

  // Group filtered skills by category; order follows `category_order`,
  // with an "Uncategorized" bucket appended for skills with no category.
  const groupedSkills = useMemo(() => {
    const map = new Map<string, SkillInfo[]>();
    for (const s of filteredSkills) {
      const cat = (categoriesMap[s.name] || "").trim();
      const key = cat || UNCATEGORIZED;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    const ordered = [
      ...categoryOrder.filter((c) => map.has(c)),
      ...categoryNames.filter((c) => !categoryOrder.includes(c) && map.has(c)),
    ];
    const result: { key: string; label: string; skills: SkillInfo[] }[] = [];
    for (const key of ordered) {
      result.push({
        key,
        label: key === UNCATEGORIZED ? t("uncategorized") : key,
        skills: map.get(key)!,
      });
    }
    if (map.has(UNCATEGORIZED) && !ordered.includes(UNCATEGORIZED)) {
      result.push({
        key: UNCATEGORIZED,
        label: t("uncategorized"),
        skills: map.get(UNCATEGORIZED)!,
      });
    }
    return result;
  }, [filteredSkills, categoriesMap, categoryOrder, categoryNames, t]);

  // ---- Skills shown on the right, based on selected sidebar category ----
  const displaySkills = useMemo(() => {
    if (selectedCategory === "all") return filteredSkills;
    const group = groupedSkills.find((g) => g.key === selectedCategory);
    return group ? group.skills : [];
  }, [selectedCategory, filteredSkills, groupedSkills]);

  return (
    <div className="min-h-screen bg-ground text-ink">
      <div className="mx-auto max-w-[1920px] p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={appIcon}
              alt={t("appTitle")}
              className="h-10 w-10 rounded-card shadow-card"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight">{t("appTitle")}</h1>
              <p className="text-sm text-ink-3 dark:text-ink-4">{t("appSubtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <ThemeToggle theme={theme} onChange={handleThemeChange} />
            {/* Language toggle */}
            <Tooltip text={t("languageSwitch")}>
              <button
                onClick={() => handleLanguageChange(language === "zh" ? "en" : "zh")}
                aria-label={t("languageSwitch")}
                className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-fill dark:border-hairline dark:text-ink-4 dark:hover:bg-hover"
              >
                {language === "zh" ? "EN" : "\u4e2d"}
              </button>
            </Tooltip>
            {/* Settings / Home button (hidden during onboarding) */}
            {currentPage !== "onboarding" &&
              (currentPage !== "settings" ? (
                <Tooltip text={t("settings")}>
                  <button
                    onClick={() => setCurrentPage("settings")}
                    aria-label={t("settings")}
                    className="flex items-center justify-center rounded-lg border border-hairline px-3 py-1.5 text-ink transition-colors hover:bg-fill dark:border-hairline dark:text-ink-4 dark:hover:bg-hover"
                  >
                    <GearIcon />
                  </button>
                </Tooltip>
              ) : (
                <Tooltip text={t("home")}>
                  <button
                    onClick={() => setCurrentPage("home")}
                    aria-label={t("home")}
                    className="flex items-center justify-center rounded-lg border border-hairline px-3 py-1.5 text-ink transition-colors hover:bg-fill dark:border-hairline dark:text-ink-4 dark:hover:bg-hover"
                  >
                    <HomeIcon />
                  </button>
                </Tooltip>
              ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            <strong>{t("error")}: </strong>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 py-10 text-ink-3 dark:text-ink-4">
            <svg
              className="h-5 w-5 animate-spin text-accent"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{t("loadingConfig")}</span>
          </div>
        )}

        {/* ---- Onboarding view ---- */}
        {!loading && currentPage === "onboarding" && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}

        {/* ---- Home view ---- */}
        {!loading && currentPage === "home" && (
          <div className="flex gap-6">
            {/* Sidebar — categories */}
            <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-52 flex-shrink-0 flex-col md:flex">
              <nav className="flex-1 overflow-y-auto rounded-panel border border-hairline bg-surface p-2 shadow-card">
                <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-ink-4">
                  {t("categories")}
                </p>
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={
                    "mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors " +
                    (selectedCategory === "all"
                      ? "bg-accent-bg font-medium text-accent"
                      : "text-ink-2 hover:bg-fill dark:text-ink-4 dark:hover:bg-hover")
                  }
                >
                  <span>{t("allSkills")}</span>
                  <span className="rounded-full bg-fill px-2 py-0.5 text-xs font-medium text-ink-3 dark:bg-fill dark:text-ink-4">
                    {filteredSkills.length}
                  </span>
                </button>
                {groupedSkills.map((group) => (
                  <button
                    key={group.key}
                    onClick={() => setSelectedCategory(group.key)}
                    className={
                      "mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors " +
                      (selectedCategory === group.key
                        ? "bg-accent-bg font-medium text-accent"
                        : "text-ink-2 hover:bg-fill dark:text-ink-4 dark:hover:bg-hover")
                    }
                  >
                    <span className="truncate">{group.label}</span>
                    <span className="ml-2 flex-shrink-0 rounded-full bg-fill px-2 py-0.5 text-xs font-medium text-ink-3 dark:bg-fill dark:text-ink-4">
                      {group.skills.length}
                    </span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* Content — skills */}
            <main className="min-w-0 flex-1">
              {/* Search + Refresh + Manage */}
              <div className="mb-4 flex items-center gap-3">
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-hairline dark:bg-surface dark:text-ink"
                />
                <Tooltip text={t("refresh")}>
                  <button
                    onClick={handleRefreshSkills}
                    disabled={refreshing}
                    aria-label={t("refresh")}
                    className="flex h-[38px] items-center justify-center rounded-lg border border-hairline px-3 text-ink-2 transition-colors hover:bg-fill disabled:cursor-not-allowed disabled:opacity-50 dark:border-hairline dark:text-ink-4 dark:hover:bg-hover"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={"h-4 w-4" + (refreshing ? " animate-spin" : "")}
                    >
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip text={t("manageCategories")}>
                  <button
                    onClick={() => setShowCategoryModal(true)}
                    aria-label={t("manageCategories")}
                    className="flex h-[38px] items-center justify-center rounded-lg border border-hairline px-3 text-ink transition-colors hover:bg-fill dark:border-hairline dark:text-ink-4 dark:hover:bg-hover"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  </button>
                </Tooltip>
              </div>

              {/* Mobile category chips (sidebar hidden below md) */}
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={
                    "flex-shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors " +
                    (selectedCategory === "all"
                      ? "border-accent bg-accent-bg text-accent"
                      : "border-hairline text-ink-2 dark:border-hairline dark:text-ink-4")
                  }
                >
                  {t("allSkills")}
                </button>
                {groupedSkills.map((group) => (
                  <button
                    key={group.key}
                    onClick={() => setSelectedCategory(group.key)}
                    className={
                      "flex-shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors " +
                      (selectedCategory === group.key
                        ? "border-accent bg-accent-bg text-accent"
                        : "border-hairline text-ink-2 dark:border-hairline dark:text-ink-4")
                    }
                  >
                    {group.label}
                  </button>
                ))}
              </div>

              {/* Skill grid */}
              {displaySkills.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-4 dark:text-ink-3">
                  {searchQuery ? t("noSearchResults") : t("noSkills")}
                </p>
              ) : (
                <div className="skill-grid">
                  {displaySkills.map((skill) => (
                    <SkillCard
                      key={skill.name}
                      skill={skill}
                      onClick={handleSkillClick}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        )}

        {/* ---- Manage categories modal ---- */}
        {showCategoryModal && (
          <CategoryManager
            open={showCategoryModal}
            onClose={() => setShowCategoryModal(false)}
            categoryOrder={categoryOrder}
            categoriesMap={categoriesMap}
            skills={skills}
            onReorder={handleReorderCategories}
            onAddCategory={handleAddCategory}
            onRenameCategory={handleRenameCategory}
            onDeleteCategory={handleDeleteCategory}
            onApplyMembers={handleSetCategoryMembers}
          />
        )}

        {/* ---- Skill detail view ---- */}
        {!loading && currentPage === "detail" && selectedSkillName && (
          <SkillDetail
            skillName={selectedSkillName}
            onBack={handleBackFromDetail}
          />
        )}

        {/* ---- Tool dir detail view ---- */}
        {!loading && currentPage === "toolDirDetail" && selectedToolDirName && (
          <ToolDirDetail
            toolDirName={selectedToolDirName}
            onBack={handleBackFromToolDirDetail}
            categoriesMap={categoriesMap}
            categoryOrder={categoryOrder}
          />
        )}

        {/* ---- Settings view ---- */}
        {!loading && currentPage === "settings" && config && (
          <SettingsPage
            config={config}
            onConfigSaved={handleConfigSaved}
            onBack={() => setCurrentPage("home")}
            onToolDirClick={handleToolDirClick}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [language, setLanguage] = useState<Language>("zh");
  return (
    <I18nProvider language={language} setLanguage={setLanguage}>
      <AppContent />
    </I18nProvider>
  );
}
