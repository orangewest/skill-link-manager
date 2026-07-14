import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AppConfig, ToolDirConfig } from "../types";
import { useI18n } from "../i18n/I18nContext";
import PathInput from "./PathInput";

interface Props {
  config: AppConfig;
  onConfigSaved: (config: AppConfig) => void;
  onBack: () => void;
  onToolDirClick: (name: string) => void;
}

export default function SettingsPage({ config, onConfigSaved, onBack, onToolDirClick }: Props) {
  const { t } = useI18n();
  const [sharedDir, setSharedDir] = useState(config.shared_dir);
  const [toolDirs, setToolDirs] = useState<ToolDirConfig[]>([...config.tool_dirs]);
  const [toolDirsChecked, setToolDirsChecked] = useState<Record<string, boolean>>({
    ...config.tool_dirs_checked,
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add new tool dir form
  const [newName, setNewName] = useState("");
  const [newPath, setNewPath] = useState("");

  // Edit tool dir
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPath, setEditPath] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Clean up tool_dirs_checked: only keep entries for existing tool dirs
      const cleanedChecked: Record<string, boolean> = {};
      for (const td of toolDirs) {
        cleanedChecked[td.name] = toolDirsChecked[td.name] ?? true;
      }
      const newConfig: AppConfig = {
        ...config,
        shared_dir: sharedDir,
        tool_dirs: toolDirs,
        tool_dirs_checked: cleanedChecked,
      };
      await invoke("save_config", { config: newConfig });
      onConfigSaved(newConfig);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleAddToolDir = () => {
    if (!newName.trim() || !newPath.trim()) return;
    setToolDirs([...toolDirs, { name: newName.trim(), path: newPath.trim() }]);
    setNewName("");
    setNewPath("");
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditName(toolDirs[index].name);
    setEditPath(toolDirs[index].path);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    if (!editName.trim() || !editPath.trim()) return;
    const oldName = toolDirs[editingIndex].name;
    const updated = [...toolDirs];
    updated[editingIndex] = { name: editName.trim(), path: editPath.trim() };
    setToolDirs(updated);
    // Update checked state if name changed
    if (oldName !== editName.trim()) {
      setToolDirsChecked((prev) => {
        const next = { ...prev };
        next[editName.trim()] = next[oldName] ?? true;
        delete next[oldName];
        return next;
      });
    }
    setEditingIndex(null);
  };

  const handleDeleteToolDir = (index: number) => {
    if (!window.confirm(t("confirmDelete"))) return;
    const deleted = toolDirs[index];
    const updated = toolDirs.filter((_, i) => i !== index);
    setToolDirs(updated);
    setToolDirsChecked((prev) => {
      const next = { ...prev };
      delete next[deleted.name];
      return next;
    });
  };

  const handleToggleToolDir = (name: string) => {
    setToolDirsChecked((prev) => ({
      ...prev,
      [name]: !(prev[name] ?? true),
    }));
  };

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        {t("back")}
      </button>

      <h2 className="mb-6 text-lg font-bold text-gray-800">{t("settingsTitle")}</h2>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>{t("error")}: </strong>
          {error}
        </div>
      )}

      {/* Shared dir config */}
      <div className="mb-8">
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          {t("sharedDirConfig")}
        </label>
        <div className="flex gap-2">
          <PathInput
            value={sharedDir}
            onChange={setSharedDir}
            placeholder={t("sharedDirPlaceholder")}
            className="flex-1"
            size="lg"
            ariaLabel={t("sharedDirConfig")}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {saving ? t("loading") : t("save")}
          </button>
        </div>
      </div>

      {/* Tool dir management */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          {t("toolDirManagement")}
        </h3>

        {/* Tool dir list */}
        <div className="mb-4 space-y-2">
          {toolDirs.map((td, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg border border-gray-200 p-3"
            >
              <input
                type="checkbox"
                checked={toolDirsChecked[td.name] ?? true}
                onChange={() => handleToggleToolDir(td.name)}
                className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {editingIndex === index ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={t("toolDirName")}
                    className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
                  />
                  <PathInput
                    value={editPath}
                    onChange={setEditPath}
                    placeholder={t("toolDirPath")}
                    className="min-w-0 flex-1"
                    ariaLabel={t("toolDirPath")}
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="flex-shrink-0 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {t("save")}
                  </button>
                  <button
                    onClick={() => setEditingIndex(null)}
                    className="flex-shrink-0 text-sm text-gray-500 hover:text-gray-700"
                  >
                    {t("cancel")}
                  </button>
                </>
              ) : (
                <>
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => onToolDirClick(td.name)}
                    title={t("clickToViewDetail")}
                  >
                    <div className="font-medium text-gray-700 hover:text-blue-600">{td.name}</div>
                    <div className="truncate text-xs text-gray-400">{td.path}</div>
                  </div>
                  <button
                    onClick={() => handleStartEdit(index)}
                    className="flex-shrink-0 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {t("edit")}
                  </button>
                  <button
                    onClick={() => handleDeleteToolDir(index)}
                    className="flex-shrink-0 text-sm text-red-600 hover:text-red-800"
                  >
                    {t("delete")}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add new tool dir */}
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-dashed border-gray-300 p-3">
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
            onClick={handleAddToolDir}
            disabled={!newName.trim() || !newPath.trim()}
            className="flex-shrink-0 rounded bg-green-600 px-3 py-1 text-sm text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {t("add")}
          </button>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {saving ? t("loading") : t("save")}
          </button>
          {savedMsg && (
            <span className="text-sm text-green-600">{t("saved")}</span>
          )}
        </div>
      </div>
    </div>
  );
}
