import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ToolDirDetail as ToolDirDetailType } from "../types";
import { useI18n } from "../i18n/I18nContext";

interface Props {
  toolDirName: string;
  onBack: () => void;
}

export default function ToolDirDetail({ toolDirName, onBack }: Props) {
  const { t } = useI18n();
  const [detail, setDetail] = useState<ToolDirDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await invoke<ToolDirDetailType>("get_tool_dir_detail", { toolDirName });
      setDetail(d);
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
    } finally {
      setLoading(false);
    }
  }, [toolDirName]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleToggleLink = async (skillName: string, currentlyLinked: boolean) => {
    setActionLoading(skillName);
    setError(null);
    try {
      if (currentlyLinked) {
        await invoke("remove_link", { skillName, toolDirName });
      } else {
        await invoke("add_link", { skillName, toolDirName });
      }
      await loadDetail();
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
    } finally {
      setActionLoading(null);
    }
  };

  const handleLinkAll = async () => {
    if (!detail) return;
    setActionLoading("all");
    setError(null);
    try {
      const allSkillNames = detail.skills.map((s) => s.name);
      await invoke("apply_links", {
        selectedSkills: allSkillNames,
        selectedToolDirs: [toolDirName],
      });
      await loadDetail();
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
    } finally {
      setActionLoading(null);
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

      {/* Tool dir header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{detail.name}</h2>
        <p className="mt-1 break-all text-sm text-gray-500 dark:text-gray-400">{detail.path}</p>
      </div>

      {/* Link all */}
      <div className="mb-4">
        <button
          onClick={handleLinkAll}
          disabled={actionLoading === "all" || detail.skills.length === 0}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
        >
          {actionLoading === "all" ? t("applying") : t("linkAll")}
        </button>
      </div>

      {/* Skill list */}
      {detail.skills.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">{t("noSkills")}</p>
      ) : (
        <div className="space-y-2">
          {detail.skills.map((skill) => (
            <div
              key={skill.name}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-700 dark:text-gray-200">{skill.name}</div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {skill.linked ? (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                    {t("linkedStatus")}
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                    {t("unlinkedStatus")}
                  </span>
                )}
                <input
                  type="checkbox"
                  checked={skill.linked}
                  disabled={actionLoading === skill.name}
                  onChange={() => handleToggleLink(skill.name, skill.linked)}
                  className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
