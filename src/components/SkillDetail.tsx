import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { SkillDetail as SkillDetailType } from "../types";
import { useI18n } from "../i18n/I18nContext";

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

  const handleOpenFolder = async () => {
    if (!detail) return;
    setError(null);
    try {
      await invoke("open_path", { path: detail.path });
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
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
          <button
            onClick={handleOpenFolder}
            title={detail.path}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            {t("openFolder")}
          </button>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
          {detail.description || "\u2014"}
        </p>
      </div>

      {/* Apply to all */}
      <div className="mb-4">
        <button
          onClick={handleApplyToAll}
          disabled={actionLoading === "all"}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
        >
          {actionLoading === "all" ? t("applying") : t("applyToAll")}
        </button>
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
                  <button
                    onClick={() => handleRemoveLink(dir.name)}
                    disabled={actionLoading === `remove-${dir.name}`}
                    className="rounded bg-red-50 px-3 py-1 text-sm text-red-600 transition-colors hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
                  >
                    {actionLoading === `remove-${dir.name}` ? t("loading") : t("removeLink")}
                  </button>
                </>
              ) : (
                <>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                    {t("unlinkedStatus")}
                  </span>
                  <button
                    onClick={() => handleAddLink(dir.name)}
                    disabled={actionLoading === `add-${dir.name}`}
                    className="rounded bg-blue-50 px-3 py-1 text-sm text-blue-600 transition-colors hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
                  >
                    {actionLoading === `add-${dir.name}` ? t("loading") : t("addLink")}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
