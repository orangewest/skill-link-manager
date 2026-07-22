import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { SkillDetail as SkillDetailType } from "../types";
import { useI18n } from "../i18n/I18nContext";
import Modal from "./Modal";
import Tooltip from "./Tooltip";

/** Small inline link icon. */
function LinkIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={"h-4 w-4 " + className}
    >
      <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h4" />
    </svg>
  );
}

/** Small inline "link off" icon. */
function UnlinkIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={"h-4 w-4 " + className}
    >
      <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h4M3 3l18 18" />
    </svg>
  );
}

interface Props {
  skillName: string;
  onBack: () => void;
}

export default function SkillDetail({ skillName, onBack }: Props) {
  const { t } = useI18n();
  const [detail, setDetail] = useState<SkillDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteStep1, setShowDeleteStep1] = useState(false);
  const [showDeleteStep2, setShowDeleteStep2] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await invoke<SkillDetailType>("get_skill_detail", { skillName });
      setDetail(d);
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
    } finally {
      setLoading(false);
    }
  }, [skillName]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleAddLink = async (toolDirName: string) => {
    setActionLoading(`add-${toolDirName}`);
    setError(null);
    try {
      await invoke("add_link", { skillName, toolDirName });
      await loadDetail();
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveLink = async (toolDirName: string) => {
    setActionLoading(`remove-${toolDirName}`);
    setError(null);
    try {
      await invoke("remove_link", { skillName, toolDirName });
      await loadDetail();
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApplyToAll = async () => {
    if (!detail) return;
    setActionLoading("all");
    setError(null);
    try {
      const toolDirNames = detail.linked_dirs.map((d) => d.name);
      await invoke("apply_links", {
        selectedSkills: [skillName],
        selectedToolDirs: toolDirNames,
      });
      await loadDetail();
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
    } finally {
      setActionLoading(null);
    }
  };

  // Unlink the skill from every tool dir it is currently linked to.
  const handleUnlinkAll = async () => {
    if (!detail) return;
    setActionLoading("all");
    setError(null);
    try {
      for (const d of detail.linked_dirs) {
        if (d.linked) await invoke("remove_link", { skillName, toolDirName: d.name });
      }
      await loadDetail();
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenFolder = async () => {
    if (!detail) return;
    setError(null);
    try {
      await invoke("open_path", { path: detail.path });
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
    }
  };

  const handleRequestDelete = () => {
    setShowDeleteStep1(true);
  };

  const handleDeleteStep1Continue = () => {
    setShowDeleteStep1(false);
    setShowDeleteStep2(true);
  };

  const handleDeleteStep1Cancel = () => {
    setShowDeleteStep1(false);
  };

  const handleDeleteStep2Cancel = () => {
    setShowDeleteStep2(false);
    setConfirmInput("");
  };

  const handleConfirmDelete = async () => {
    if (!detail || confirmInput !== detail.name) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await invoke("delete_skill", { skillName: detail.name });
      // Return to home (onBack refreshes the skill list)
      onBack();
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
      setShowDeleteStep2(false);
      setConfirmInput("");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-10 text-center text-gray-500 dark:text-gray-400">{t("loading")}</div>
    );
  }

  if (error && !detail) {
    return (
      <div>
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
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          <strong>{t("error")}: </strong>
          {error}
        </div>
      </div>
    );
  }

  if (!detail) return null;

  // True when the skill is linked into every tool dir — then the top-right
  // toggle should offer to unlink all; otherwise it links all.
  const allLinked =
    detail.linked_dirs.length > 0 &&
    detail.linked_dirs.every((d) => d.linked);

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

      {/* Error message (non-fatal) */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Skill header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{detail.name}</h2>
          <div className="flex flex-shrink-0 items-center gap-2">
            {/* Open folder */}
            <Tooltip text={t("openFolder")}>
              <button
                onClick={handleOpenFolder}
                aria-label={t("openFolder")}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </Tooltip>
            {/* Link / unlink all — colored like the per-row add/remove buttons */}
            <Tooltip text={actionLoading === "all" ? t("applying") : allLinked ? t("unlinkAll") : t("linkAll")}>
              <button
                onClick={() => (allLinked ? handleUnlinkAll() : handleApplyToAll())}
                disabled={actionLoading === "all"}
                aria-label={allLinked ? t("unlinkAll") : t("linkAll")}
                className={
                  allLinked
                    ? "rounded-lg bg-red-50 p-1.5 text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                    : "rounded-lg bg-blue-50 p-1.5 text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                }
              >
                {allLinked ? (
                  <UnlinkIcon className={actionLoading === "all" ? "animate-spin" : ""} />
                ) : (
                  <LinkIcon className={actionLoading === "all" ? "animate-spin" : ""} />
                )}
              </button>
            </Tooltip>
            {/* Delete */}
            <Tooltip text={t("deleteSkill")}>
              <button
                onClick={handleRequestDelete}
                disabled={deleteLoading}
                aria-label={t("deleteSkill")}
                className="rounded-lg border border-red-200 p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
          {detail.description || "\u2014"}
        </p>
      </div>

      {/* Tool dir list */}
      <div className="space-y-2">
        {detail.linked_dirs.map((dir) => (
          <div
            key={dir.name}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-700 dark:text-gray-200">{dir.name}</div>
              <div className="truncate text-xs text-gray-400 dark:text-gray-500">{dir.path}</div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              {dir.linked ? (
                <>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                    {t("linkedStatus")}
                  </span>
                  <Tooltip text={t("removeLink")}>
                    <button
                      onClick={() => handleRemoveLink(dir.name)}
                      disabled={actionLoading === `remove-${dir.name}`}
                      aria-label={t("removeLink")}
                      className="rounded bg-red-50 p-1.5 text-red-600 transition-colors hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
                    >
                      <UnlinkIcon />
                    </button>
                  </Tooltip>
                </>
              ) : (
                <>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                    {t("unlinkedStatus")}
                  </span>
                  <Tooltip text={t("addLink")}>
                    <button
                      onClick={() => handleAddLink(dir.name)}
                      disabled={actionLoading === `add-${dir.name}`}
                      aria-label={t("addLink")}
                      className="rounded bg-blue-50 p-1.5 text-blue-600 transition-colors hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
                    >
                      <LinkIcon />
                    </button>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ---- Delete confirmation: step 1 (warning) ---- */}
      {showDeleteStep1 && (
        <Modal
          size="sm"
          title={t("deleteSkill")}
          onClose={handleDeleteStep1Cancel}
          footer={
            <>
              <button
                onClick={handleDeleteStep1Cancel}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDeleteStep1Continue}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                {t("continueButton")}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">{t("deleteSkillConfirmBody")}</p>
        </Modal>
      )}

      {/* ---- Delete confirmation: step 2 (typed name) ---- */}
      {showDeleteStep2 && detail && (
        <Modal
          size="sm"
          title={t("deleteSkillFinalTitle")}
          onClose={handleDeleteStep2Cancel}
          footer={
            <>
              <button
                onClick={handleDeleteStep2Cancel}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={confirmInput !== detail.name || deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
              >
                {deleteLoading ? t("deleting") : t("deleteSkill")}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("deleteSkillFinalBody")} <span className="font-mono font-semibold text-gray-800 dark:text-gray-100">{detail.name}</span>
          </p>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={detail.name}
            autoFocus
            className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </Modal>
      )}
    </div>
  );
}
