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

/** Small inline gear (settings) icon. */
function GearIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
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
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});

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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">{t("appTitle")}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("appSubtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <ThemeToggle theme={theme} onChange={handleThemeChange} />
            {/* Language toggle */}
            <button
              onClick={() => handleLanguageChange(language === "zh" ? "en" : "zh")}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {language === "zh" ? "EN" : "\u4e2d"}
            </button>
            {/* Settings / Home button (hidden during onboarding) */}
            {currentPage !== "onboarding" &&
              (currentPage !== "settings" ? (
                <Tooltip text={t("settings")}>
                  <button
                    onClick={() => setCurrentPage("settings")}
                    aria-label={t("settings")}
                    className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <GearIcon />
                  </button>
                </Tooltip>
              ) : (
                <Tooltip text={t("home")}>
                  <button
                    onClick={() => setCurrentPage("home")}
                    aria-label={t("home")}
                    className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
          <div className="flex items-center gap-3 py-10 text-gray-500 dark:text-gray-400">
            <svg
              className="h-5 w-5 animate-spin text-blue-500"
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
                strokeWidth="4"
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
          <>
            {/* Search + Refresh */}
            <div className="mb-4 flex items-center gap-3">
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <Tooltip text={t("refresh")}>
                <button
                  onClick={handleRefreshSkills}
                  disabled={refreshing}
                  aria-label={t("refresh")}
                  className="flex h-[38px] items-center justify-center rounded-lg border border-gray-300 px-3 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
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
                  className="flex h-[38px] items-center justify-center rounded-lg border border-gray-300 px-3 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M3 7h18M3 12h18M3 17h18" />
                  </svg>
                </button>
              </Tooltip>
            </div>

            {/* Grouped skill sections */}
            {filteredSkills.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                {searchQuery ? t("noSearchResults") : t("noSkills")}
              </p>
            ) : (
              <div className="space-y-5">
                {groupedSkills.map((group) => {
                  const isCollapsed = collapsedCats[group.key];
                  return (
                    <div key={group.key}>
                      <button
                        onClick={() =>
                          setCollapsedCats((prev) => ({
                            ...prev,
                            [group.key]: !prev[group.key],
                          }))
                        }
                        className="mb-3 flex w-full items-center gap-2 text-left text-sm font-semibold text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={
                            "h-4 w-4 flex-shrink-0 transition-transform " +
                            (isCollapsed ? "" : " rotate-90")
                          }
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span>{group.label}</span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                          {group.skills.length}
                        </span>
                      </button>
                      {!isCollapsed && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {group.skills.map((skill) => (
                            <SkillCard
                              key={skill.name}
                              skill={skill}
                              onClick={handleSkillClick}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
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
