import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ToolDirConfig, AppConfig } from "../types";
import { useI18n } from "../i18n/I18nContext";
import PathInput from "./PathInput";
import { useAutoName } from "../hooks/useAutoName";
import { pathsEqual } from "../utils/path";

interface Props {
  onComplete: (config: AppConfig) => void;
}

export default function Onboarding({ onComplete }: Props) {
  const { t } = useI18n();
  const [sharedDir, setSharedDir] = useState("");
  const [sharedDirExists, setSharedDirExists] = useState<boolean | null>(null);
  const [detectedAgents, setDetectedAgents] = useState<ToolDirConfig[]>([]);
  const [checkedAgents, setCheckedAgents] = useState<Set<string>>(new Set());
  const [manualToolDirs, setManualToolDirs] = useState<ToolDirConfig[]>([]);
  // Manual-add form — name auto-derives from the path (see useAutoName).
  const {
    name: newName,
    path: newPath,
    setName: setNewName,
    setPath: setNewPath,
    reset: resetManualAdd,
  } = useAutoName();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize: get default shared_dir suggestion + detect installed agents
  useEffect(() => {
    async function init() {
      try {
        // load_config returns default config (with home/skills) when no config file exists
        const cfg = await invoke<AppConfig>("load_config");
        setSharedDir(cfg.shared_dir);

        const agents = await invoke<ToolDirConfig[]>("detect_known_agents");
        setDetectedAgents(agents);
        // Pre-select all detected agents
        setCheckedAgents(new Set(agents.map((a) => a.name)));
      } catch (e: unknown) {
        setError(typeof e === "string" ? e : String(e));
      }
    }
    init();
  }, []);

  // Check if shared dir exists (real-time hint)
  useEffect(() => {
    if (!sharedDir.trim()) {
      setSharedDirExists(null);
      return;
    }
    let cancelled = false;
    invoke<boolean>("check_path_exists", { path: sharedDir.trim() })
      .then((exists) => {
        if (!cancelled) setSharedDirExists(exists);
      })
      .catch(() => {
        if (!cancelled) setSharedDirExists(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sharedDir]);

  const handleToggleAgent = (name: string) => {
    setCheckedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleAddManual = () => {
    if (!newName.trim() || !newPath.trim()) return;
    setManualToolDirs([...manualToolDirs, { name: newName.trim(), path: newPath.trim() }]);
    resetManualAdd();
  };

  const handleRemoveManual = (index: number) => {
    setManualToolDirs(manualToolDirs.filter((_, i) => i !== index));
  };

  // Live duplicate-path check against the manual dirs AND the selected
  // detected agents (which get merged on completion). Matches the backend's
  // case-insensitive comparison on Win/macOS.
  const manualDuplicatePath =
    newPath.trim() !== "" &&
    [
      ...manualToolDirs.map((td) => td.path),
      ...detectedAgents
        .filter((a) => checkedAgents.has(a.name))
        .map((a) => a.path),
    ].some((p) => pathsEqual(p, newPath.trim()));

  const handleComplete = async () => {
    if (!sharedDir.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const toolDirs: ToolDirConfig[] = [
        ...detectedAgents.filter((a) => checkedAgents.has(a.name)),
        ...manualToolDirs,
      ];
      const toolDirsChecked: Record<string, boolean> = {};
      for (const td of toolDirs) {
        toolDirsChecked[td.name] = true;
      }
      const newConfig: AppConfig = {
        shared_dir: sharedDir.trim(),
        tool_dirs: toolDirs,
        tool_dirs_checked: toolDirsChecked,
        skills_checked: {},
        language: "zh",
        theme: "system",
        categories: {},
        category_order: [],
      };
      await invoke("save_config", { config: newConfig });
      onComplete(newConfig);
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-ink dark:text-ink">{t("onboardingTitle")}</h2>
      <p className="mb-6 text-sm text-ink-3 dark:text-ink-4">{t("onboardingWelcome")}</p>

      {error && (
        <div className="mb-4 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          <strong>{t("error")}: </strong>
          {error}
        </div>
      )}

      {/* Step 1: Shared dir */}
      <div className="mb-8">
        <label className="mb-2 block text-sm font-semibold text-ink dark:text-ink-4">
          {t("sharedDirConfig")}
        </label>
        <p className="mb-2 text-xs text-ink-3 dark:text-ink-4">{t("onboardingSharedDirHint")}</p>
        <PathInput
          value={sharedDir}
          onChange={setSharedDir}
          placeholder={t("sharedDirPlaceholder")}
          className="w-full"
          size="lg"
          ariaLabel={t("sharedDirConfig")}
        />
        {sharedDirExists !== null && (
          <p className={`mt-1 text-xs ${sharedDirExists ? "text-live dark:text-live" : "text-heat dark:text-heat"}`}>
            {sharedDirExists ? t("dirExists") : t("dirNotExists")}
          </p>
        )}
      </div>

      {/* Step 2: Tool dirs */}
      <div className="mb-8">
        <h3 className="mb-2 text-sm font-semibold text-ink dark:text-ink-4">
          {t("toolDirManagement")}
        </h3>
        <p className="mb-3 text-xs text-ink-3 dark:text-ink-4">{t("onboardingDetected")}</p>

        {detectedAgents.length === 0 ? (
          <p className="mb-3 rounded-card border border-heat-bg bg-heat-bg px-3 py-2 text-sm text-heat dark:border-heat-bg dark:bg-heat-bg dark:text-heat">
            {t("onboardingNoAgents")}
          </p>
        ) : (
          <div className="mb-4 divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-surface shadow-card dark:border-hairline dark:bg-surface">
            {detectedAgents.map((agent) => (
              <div key={agent.name} className="flex items-center gap-2 p-3 transition-colors hover:bg-hover dark:hover:bg-hover">
                <input
                  type="checkbox"
                  checked={checkedAgents.has(agent.name)}
                  onChange={() => handleToggleAgent(agent.name)}
                  className="h-4 w-4 flex-shrink-0 rounded border-hairline text-accent focus:ring-accent dark:border-hairline dark:bg-surface"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ink dark:text-ink">{agent.name}</div>
                  <div className="truncate text-xs text-ink-4 dark:text-ink-3">{agent.path}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manual add */}
        <div className="mb-3">
          <p className="mb-2 text-xs font-medium text-ink-2 dark:text-ink-4">{t("onboardingManualAdd")}</p>
          <div className="flex items-start gap-2 rounded-card border border-dashed border-hairline p-3 dark:border-hairline">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("toolDirName")}
              className="w-24 flex-shrink-0 rounded border border-hairline bg-surface px-2 py-1 text-sm focus:border-accent focus:outline-none dark:border-hairline dark:bg-surface dark:text-ink"
            />
            <div className="min-w-0 flex-1">
              <PathInput
                value={newPath}
                onChange={setNewPath}
                placeholder={t("toolDirPath")}
                className="w-full"
                ariaLabel={t("toolDirPath")}
              />
              {manualDuplicatePath && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 flex-shrink-0">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  {t("pathExists")}
                </p>
              )}
            </div>
            <button
              onClick={handleAddManual}
              disabled={!newName.trim() || !newPath.trim() || manualDuplicatePath}
              className="flex-shrink-0 rounded bg-accent px-3 py-1 text-sm text-white transition-colors hover:bg-accent-press disabled:cursor-not-allowed disabled:bg-fill dark:disabled:bg-fill"
            >
              {t("add")}
            </button>
          </div>
        </div>

        {/* Manual tool dirs list */}
        {manualToolDirs.length > 0 && (
          <div className="mb-4 divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-surface shadow-card dark:border-hairline dark:bg-surface">
            {manualToolDirs.map((td, index) => (
              <div key={index} className="flex items-center gap-2 p-3 transition-colors hover:bg-hover dark:hover:bg-hover">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ink dark:text-ink">{td.name}</div>
                  <div className="truncate text-xs text-ink-4 dark:text-ink-3">{td.path}</div>
                </div>
                <button
                  onClick={() => handleRemoveManual(index)}
                  className="flex-shrink-0 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  {t("delete")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete button */}
      <button
        onClick={handleComplete}
        disabled={saving || !sharedDir.trim()}
        className="rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-cta transition-all hover:bg-accent-press disabled:cursor-not-allowed disabled:bg-fill disabled:shadow-none dark:disabled:bg-fill"
      >
        {saving ? t("onboardingFinishing") : t("onboardingComplete")}
      </button>
    </div>
  );
}
