import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AppConfig, ToolDirConfig } from "../types";
import { useI18n } from "../i18n/I18nContext";
import PathInput from "./PathInput";
import ConfirmDialog from "./ConfirmDialog";
import Modal from "./Modal";
import Tooltip from "./Tooltip";
import { useAutoName } from "../hooks/useAutoName";
import { pathsEqual } from "../utils/path";
import CheckboxIcon from "./CheckboxIcon";

/** Small inline pencil (edit) icon. */
function EditIcon() {
  return (
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
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

/** Small inline trash (delete) icon. */
function TrashIcon() {
  return (
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
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  );
}

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
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [redetecting, setRedetecting] = useState(false);
  // Candidates surfaced by re-detect that are not yet in the config, and
  // which of them the user has ticked in the selection dialog.
  const [redetectCandidates, setRedetectCandidates] = useState<ToolDirConfig[]>([]);
  const [redetectChecked, setRedetectChecked] = useState<Set<string>>(new Set());

  // Two-step delete confirmation flow:
  //   1. `deleteTarget` set → show "delete this tool dir?" dialog
  //   2. on confirm → show "also delete links?" dialog
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [askDeleteLinks, setAskDeleteLinks] = useState(false);

  // Add new tool dir form — name auto-derives from the path until the
  // user manually edits the name field (see useAutoName).
  const {
    name: newName,
    path: newPath,
    setName: setNewName,
    setPath: setNewPath,
    reset: resetNewToolDir,
  } = useAutoName();

  // Edit tool dir
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPath, setEditPath] = useState("");

  // Latest config ref — auto-save uses this as the base so the shared_dir
  // (which is only saved on its own button click) is not clobbered by
  // tool-dir auto-saves.
  const configRef = useRef(config);
  configRef.current = config;

  // ---- Auto-save: whenever tool dirs or their checked state changes,
  // persist immediately (no save button needed). ----
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    let cancelled = false;
    const cleanedChecked: Record<string, boolean> = {};
    for (const td of toolDirs) {
      cleanedChecked[td.name] = toolDirsChecked[td.name] ?? true;
    }
    const newConfig: AppConfig = {
      ...configRef.current,
      tool_dirs: toolDirs,
      tool_dirs_checked: cleanedChecked,
    };
    setSaving(true);
    invoke("save_config", { config: newConfig })
      .then(() => {
        if (cancelled) return;
        onConfigSaved(newConfig);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(typeof e === "string" ? e : String(e));
      })
      .finally(() => {
        if (!cancelled) setSaving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toolDirs, toolDirsChecked, onConfigSaved]);

  // ---- Shared dir save (explicit button — text input should not save on
  // every keystroke). ----
  const handleSaveSharedDir = async () => {
    setSaving(true);
    setError(null);
    try {
      const newConfig: AppConfig = {
        ...configRef.current,
        shared_dir: sharedDir,
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
    setToolDirsChecked((prev) => ({ ...prev, [newName.trim()]: true }));
    resetNewToolDir();
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
    // Step 1: open the "delete this tool dir?" dialog
    setDeleteTarget(index);
  };

  const handleConfirmDelete = () => {
    // User confirmed deleting the tool dir entry — now ask whether to
    // also remove the links on disk. NOTE: keep `deleteTarget` set so
    // the second-step handlers know which index to remove; it is cleared
    // by `removeFromConfig` after the flow completes.
    setAskDeleteLinks(true);
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleConfirmDeleteLinks = async () => {
    // User chose to also delete the links on disk
    setAskDeleteLinks(false);
    const index = deleteTarget;
    if (index === null) return;
    const deleted = toolDirs[index];
    try {
      const count = await invoke<number>("remove_tool_dir_links", {
        toolDirName: deleted.name,
      });
      setInfoMsg(t("linksRemoved", { count }));
      setTimeout(() => setInfoMsg(null), 3000);
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
    }
    removeFromConfig(index);
  };

  const handleCancelDeleteLinks = () => {
    // User chose to keep the links — only remove the tool dir from config
    setAskDeleteLinks(false);
    const index = deleteTarget;
    if (index === null) return;
    removeFromConfig(index);
  };

  const removeFromConfig = (index: number) => {
    const deleted = toolDirs[index];
    const updated = toolDirs.filter((_, i) => i !== index);
    setToolDirs(updated);
    setToolDirsChecked((prev) => {
      const next = { ...prev };
      delete next[deleted.name];
      return next;
    });
    setDeleteTarget(null);
  };

  const handleToggleToolDir = (name: string) => {
    setToolDirsChecked((prev) => ({
      ...prev,
      [name]: !(prev[name] ?? true),
    }));
  };

  // Toggle every tool dir's checked state at once (icon button in the header).
  const allToolDirsChecked =
    toolDirs.length > 0 &&
    toolDirs.every((td) => toolDirsChecked[td.name] ?? true);
  const handleToggleAllToolDirs = () => {
    const nextVal = !allToolDirsChecked;
    setToolDirsChecked((prev) => {
      const next = { ...prev };
      for (const td of toolDirs) next[td.name] = nextVal;
      return next;
    });
  };

  // Re-scan the computer for installed agent directories. Detected agents
  // that are not already in the config are shown in a selection dialog so
  // the user can tick the ones to add, rather than being added silently.
  const handleRedetect = async () => {
    setRedetecting(true);
    setError(null);
    try {
      const detected = await invoke<ToolDirConfig[]>("detect_known_agents");
      const existingNames = new Set(toolDirs.map((td) => td.name));
      const newOnes = detected.filter((d) => !existingNames.has(d.name));
      if (newOnes.length === 0) {
        setInfoMsg(t("redetectNoNew"));
        setTimeout(() => setInfoMsg(null), 3000);
      } else {
        setRedetectCandidates(newOnes);
        setRedetectChecked(new Set(newOnes.map((d) => d.name)));
      }
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
    } finally {
      setRedetecting(false);
    }
  };

  const handleRedetectToggle = (name: string) => {
    setRedetectChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const closeRedetectDialog = () => {
    setRedetectCandidates([]);
    setRedetectChecked(new Set());
  };

  // Add the ticked candidates, persist (auto-save effect), and re-scan.
  const handleRedetectConfirm = () => {
    const selected = redetectCandidates.filter((d) => redetectChecked.has(d.name));
    if (selected.length === 0) {
      setInfoMsg(t("redetectAddedNone"));
    } else {
      setToolDirs((prev) => [...prev, ...selected]);
      setToolDirsChecked((prev) => {
        const next = { ...prev };
        for (const d of selected) next[d.name] = true;
        return next;
      });
      setInfoMsg(t("redetectAdded", { count: selected.length }));
    }
    setTimeout(() => setInfoMsg(null), 3000);
    closeRedetectDialog();
  };

  // Live duplicate-path check: as soon as the entered path matches an
  // existing tool dir (case-insensitive on Win/macOS, per backend rules),
  // surface the hint and disable the Add button.
  const duplicatePath =
    newPath.trim() !== "" &&
    toolDirs.some((td) => pathsEqual(td.path, newPath.trim()));

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        {t("back")}
      </button>

      <h2 className="mb-6 text-lg font-bold text-gray-800 dark:text-gray-100">{t("settingsTitle")}</h2>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          <strong>{t("error")}: </strong>
          {error}
        </div>
      )}

      {/* Info message (e.g. links removed count) */}
      {infoMsg && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
          {infoMsg}
        </div>
      )}

      {/* Shared dir config */}
      <div className="mb-8">
        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
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
            onClick={handleSaveSharedDir}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            {saving ? t("loading") : t("save")}
          </button>
        </div>
        {savedMsg && (
          <p className="mt-1 text-xs text-green-600 dark:text-green-400">{t("saved")}</p>
        )}
      </div>

      {/* Tool dir management */}
      <div>
        <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300">
          <span>{t("toolDirManagement")}</span>
          <div className="flex items-center gap-2">
            <Tooltip text={allToolDirsChecked ? t("selectNone") : t("selectAll")}>
              <button
                onClick={handleToggleAllToolDirs}
                disabled={toolDirs.length === 0}
                aria-label={allToolDirsChecked ? t("selectNone") : t("selectAll")}
                className="rounded-lg border border-gray-300 p-1.5 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <CheckboxIcon checked={allToolDirsChecked} className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
            <Tooltip text={t("redetectAgents")}>
              <button
                onClick={handleRedetect}
                disabled={redetecting}
                aria-label={t("redetectAgents")}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={"h-3.5 w-3.5" + (redetecting ? " animate-spin" : "")}>
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                {redetecting ? t("redetecting") : t("redetectAgents")}
              </button>
            </Tooltip>
          </div>
        </h3>

        {/* Tool dir list */}
        <div className="mb-4 space-y-2">
          {toolDirs.map((td, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <input
                type="checkbox"
                checked={toolDirsChecked[td.name] ?? true}
                onChange={() => handleToggleToolDir(td.name)}
                className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
              />
              {editingIndex === index ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={t("toolDirName")}
                    className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
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
                    className="flex-shrink-0 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {t("save")}
                  </button>
                  <button
                    onClick={() => setEditingIndex(null)}
                    className="flex-shrink-0 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {t("cancel")}
                  </button>
                </>
              ) : (
                <>
                  <Tooltip text={t("clickToViewDetail")} className="min-w-0 flex-1">
                    <div
                      className="cursor-pointer"
                      onClick={() => onToolDirClick(td.name)}
                    >
                      <div className="font-medium text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400">{td.name}</div>
                      <div className="truncate text-xs text-gray-400 dark:text-gray-500">{td.path}</div>
                    </div>
                  </Tooltip>
                  <Tooltip text={t("edit")}>
                    <button
                      onClick={() => handleStartEdit(index)}
                      aria-label={t("edit")}
                      className="flex-shrink-0 rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      <EditIcon />
                    </button>
                  </Tooltip>
                  <Tooltip text={t("delete")}>
                    <button
                      onClick={() => handleDeleteToolDir(index)}
                      aria-label={t("delete")}
                      className="flex-shrink-0 rounded p-1.5 text-red-500 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40"
                    >
                      <TrashIcon />
                    </button>
                  </Tooltip>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add new tool dir */}
        <div className="flex items-start gap-2 rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-600">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("toolDirName")}
            className="w-24 flex-shrink-0 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
          <div className="min-w-0 flex-1">
            <PathInput
              value={newPath}
              onChange={setNewPath}
              placeholder={t("toolDirPath")}
              className="w-full"
              ariaLabel={t("toolDirPath")}
            />
            {duplicatePath && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 flex-shrink-0">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {t("pathExists")}
              </p>
            )}
          </div>
          <button
            onClick={handleAddToolDir}
            disabled={!newName.trim() || !newPath.trim() || duplicatePath}
            className="flex-shrink-0 rounded bg-green-600 px-3 py-1 text-sm text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            {t("add")}
          </button>
        </div>
      </div>

      {/* Step 1: confirm deleting the tool dir entry */}
      <ConfirmDialog
        open={deleteTarget !== null && !askDeleteLinks}
        title={t("delete")}
        message={
          deleteTarget !== null
            ? `${t("confirmDelete")}\n${toolDirs[deleteTarget]?.name ?? ""}`
            : ""
        }
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        kind="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Step 2: ask whether to also remove the links on disk */}
      <ConfirmDialog
        open={askDeleteLinks}
        title={t("deleteLinks")}
        message={t("confirmDeleteLinks")}
        confirmLabel={t("deleteLinks")}
        cancelLabel={t("keepLinks")}
        kind="warning"
        onConfirm={handleConfirmDeleteLinks}
        onCancel={handleCancelDeleteLinks}
      />

      {/* Re-detect selection dialog: pick which detected agents to add */}
      <Modal
        size="sm"
        open={redetectCandidates.length > 0}
        title={t("redetectTitle")}
        onClose={closeRedetectDialog}
        footer={
          <>
            <button
              onClick={closeRedetectDialog}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleRedetectConfirm}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              {t("addSelected")}
            </button>
          </>
        }
      >
        <div className="flex max-h-[60vh] flex-col">
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            {t("redetectSelectHint")}
          </p>
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {redetectCandidates.map((d) => (
              <label
                key={d.name}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <input
                  type="checkbox"
                  checked={redetectChecked.has(d.name)}
                  onChange={() => handleRedetectToggle(d.name)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
                />
                <div className="min-w-0">
                  <div className="font-medium text-gray-700 dark:text-gray-200">{d.name}</div>
                  <div className="truncate text-xs text-gray-400 dark:text-gray-500">{d.path}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
