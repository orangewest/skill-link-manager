import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ToolDirConfig, AppConfig } from "../types";
import { useI18n } from "../i18n/I18nContext";
import PathInput from "./PathInput";

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
  const [newName, setNewName] = useState("");
  const [newPath, setNewPath] = useState("");
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
    setNewName("");
    setNewPath("");
  };

  const handleRemoveManual = (index: number) => {
    setManualToolDirs(manualToolDirs.filter((_, i) => i !== index));
  };

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
      <h2 className="mb-2 text-xl font-bold text-gray-800">{t("onboardingTitle")}</h2>
      <p className="mb-6 text-sm text-gray-500">{t("onboardingWelcome")}</p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>{t("error")}: </strong>
          {error}
        </div>
      )}

      {/* Step 1: Shared dir */}
      <div className="mb-8">
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          {t("sharedDirConfig")}
        </label>
        <p className="mb-2 text-xs text-gray-500">{t("onboardingSharedDirHint")}</p>
        <PathInput
          value={sharedDir}
          onChange={setSharedDir}
          placeholder={t("sharedDirPlaceholder")}
          className="w-full"
          size="lg"
          ariaLabel={t("sharedDirConfig")}
        />
        {sharedDirExists !== null && (
          <p className={`mt-1 text-xs ${sharedDirExists ? "text-green-600" : "text-amber-600"}`}>
            {sharedDirExists ? t("dirExists") : t("dirNotExists")}
          </p>
        )}
      </div>

      {/* Step 2: Tool dirs */}
      <div className="mb-8">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          {t("toolDirManagement")}
        </h3>
        <p className="mb-3 text-xs text-gray-500">{t("onboardingDetected")}</p>

        {detectedAgents.length === 0 ? (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {t("onboardingNoAgents")}
          </p>
        ) : (
          <div className="mb-4 space-y-2">
            {detectedAgents.map((agent) => (
              <div key={agent.name} className="flex items-center gap-2 rounded-lg border border-gray-200 p-3">
                <input
                  type="checkbox"
                  checked={checkedAgents.has(agent.name)}
                  onChange={() => handleToggleAgent(agent.name)}
                  className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-700">{agent.name}</div>
                  <div className="truncate text-xs text-gray-400">{agent.path}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manual add */}
        <div className="mb-3">
          <p className="mb-2 text-xs font-medium text-gray-600">{t("onboardingManualAdd")}</p>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 p-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("toolDirName")}
              className="w-24 flex-shrink-0 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
            />
            <PathInput
              value={newPath}
              onChange={setNewPath}
              placeholder={t("toolDirPath")}
              className="min-w-0 flex-1"
              ariaLabel={t("toolDirPath")}
            />
            <button
              onClick={handleAddManual}
              disabled={!newName.trim() || !newPath.trim()}
              className="flex-shrink-0 rounded bg-green-600 px-3 py-1 text-sm text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {t("add")}
            </button>
          </div>
        </div>

        {/* Manual tool dirs list */}
        {manualToolDirs.length > 0 && (
          <div className="mb-4 space-y-2">
            {manualToolDirs.map((td, index) => (
              <div key={index} className="flex items-center gap-2 rounded-lg border border-gray-200 p-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-700">{td.name}</div>
                  <div className="truncate text-xs text-gray-400">{td.path}</div>
                </div>
                <button
                  onClick={() => handleRemoveManual(index)}
                  className="flex-shrink-0 text-sm text-red-600 hover:text-red-800"
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
        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {saving ? t("onboardingFinishing") : t("onboardingComplete")}
      </button>
    </div>
  );
}
