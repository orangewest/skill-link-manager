import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ToolDirDetail as ToolDirDetailType, SkillLinkStatus } from "../types";
import { useI18n } from "../i18n/I18nContext";
import Tooltip from "./Tooltip";

interface Props {
  toolDirName: string;
  onBack: () => void;
  /** skillName -> categoryName. Reused from the global category config. */
  categoriesMap: Record<string, string>;
  /** Ordered category names driving the grouping order. */
  categoryOrder: string[];
}

/** Collapsible section header with a rotating chevron. */
function SectionHeader({
  title,
  count,
  expanded,
  onToggle,
  right,
}: {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <button
        onClick={onToggle}
        className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={"h-4 w-4 flex-shrink-0 transition-transform " + (expanded ? "rotate-90" : "")}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span>{title}</span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300">
          {count}
        </span>
      </button>
      {right}
    </div>
  );
}

/** Small inline link icon used on the "Link All" button. */
function LinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h4" />
    </svg>
  );
}

/** Small inline "link off" icon used on the "Unlink All" button. */
function UnlinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h4M3 3l18 18" />
    </svg>
  );
}

/**
 * Single toggle button for "link all" / "unlink all" on the active skill
 * group. Shows the link icon (link everything) when not all skills are
 * linked, and the link-off icon (unlink everything) when all are linked.
 */
function LinkAllToggle({
  allLinked,
  loading,
  onLinkAll,
  onUnlinkAll,
  linkLabel,
  unlinkLabel,
  applyingLabel,
}: {
  allLinked: boolean;
  loading: boolean;
  onLinkAll: () => void;
  onUnlinkAll: () => void;
  linkLabel: string;
  unlinkLabel: string;
  applyingLabel: string;
}) {
  const title = loading ? applyingLabel : allLinked ? unlinkLabel : linkLabel;
  return (
    <Tooltip text={title}>
      <button
        onClick={() => (allLinked ? onUnlinkAll() : onLinkAll())}
        disabled={loading}
        aria-label={title}
        className={
          allLinked
            ? "rounded-md border border-gray-300 p-1.5 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            : "rounded-md bg-blue-600 p-1.5 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
        }
      >
        {allLinked ? <UnlinkIcon /> : <LinkIcon />}
      </button>
    </Tooltip>
  );
}

export default function ToolDirDetail({
  toolDirName,
  onBack,
  categoriesMap,
  categoryOrder,
}: Props) {
  const { t } = useI18n();
  const [detail, setDetail] = useState<ToolDirDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [publicExpanded, setPublicExpanded] = useState(true);
  const [privateExpanded, setPrivateExpanded] = useState(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  /** Active category tab inside Public Skills. Empty = first available. */
  const [publicActiveCat, setPublicActiveCat] = useState<string>("");

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

  // --- Search filtering ---
  const query = search.trim().toLowerCase();
  const filteredPublic = useMemo(() => {
    if (!detail) return [];
    if (!query) return detail.skills;
    return detail.skills.filter((s) => s.name.toLowerCase().includes(query));
  }, [detail, query]);
  const filteredPrivate = useMemo(() => {
    if (!detail) return [];
    if (!query) return detail.private_skills;
    return detail.private_skills.filter((s) => s.name.toLowerCase().includes(query));
  }, [detail, query]);

  // --- Group public skills by the global category config ---
  const UNCATEGORIZED = "__uncategorized__";
  const groupedPublic = useMemo(() => {
    if (filteredPublic.length === 0) return [];
    const map = new Map<string, SkillLinkStatus[]>();
    for (const s of filteredPublic) {
      const cat = (categoriesMap[s.name] || "").trim();
      const key = cat || UNCATEGORIZED;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    // Ordered categories = explicit order, plus any orphan categories
    // present in the map but missing from `categoryOrder`.
    const catNames = new Set<string>();
    for (const c of categoryOrder) if (c && c.trim()) catNames.add(c);
    for (const c of Object.values(categoriesMap)) if (c && c.trim()) catNames.add(c);
    const ordered = [
      ...categoryOrder.filter((c) => c && map.has(c)),
      ...Array.from(catNames).filter((c) => !categoryOrder.includes(c) && map.has(c)),
    ];
    const result: { key: string; label: string; skills: SkillLinkStatus[] }[] = [];
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
  }, [filteredPublic, categoriesMap, categoryOrder, t]);

  // --- Tab selection: hide empty categories while searching ---
  const visibleGroups = query
    ? groupedPublic.filter((g) => g.skills.length > 0)
    : groupedPublic;
  const activeGroup =
    (publicActiveCat ? groupedPublic.find((g) => g.key === publicActiveCat) : undefined) ??
    visibleGroups[0] ??
    null;

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

  const handleLinkAll = async (groupKey: string, skillNames: string[]) => {
    if (skillNames.length === 0) return;
    setActionLoading("linkAll:" + groupKey);
    setError(null);
    try {
      await invoke("apply_links", {
        selectedSkills: skillNames,
        selectedToolDirs: [toolDirName],
      });
      await loadDetail();
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlinkAll = async (groupKey: string, skillNames: string[]) => {
    if (skillNames.length === 0) return;
    setActionLoading("unlinkAll:" + groupKey);
    setError(null);
    try {
      // `remove_link` is safe on already-unlinked skills (no-op), so we
      // can simply iterate the linked ones in this tab.
      for (const name of skillNames) {
        await invoke("remove_link", { skillName: name, toolDirName });
      }
      await loadDetail();
    } catch (e: unknown) {
      setError(typeof e === "string" ? e : String(e));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSync = async (skillName: string) => {
    setActionLoading(`sync-${skillName}`);
    setError(null);
    setInfoMsg(null);
    try {
      await invoke("sync_skill", { toolDirName, skillName });
      await loadDetail();
      setInfoMsg(t("syncSuccess", { name: skillName }));
      setTimeout(() => setInfoMsg(null), 3000);
    } catch (e: unknown) {
      const raw = typeof e === "string" ? e : String(e);
      if (raw.includes("already exists in the central repository")) {
        setError(t("alreadyInRepo"));
      } else if (raw.includes("already a link")) {
        setError(t("notPrivateSkill"));
      } else {
        setError(raw);
      }
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

      {/* Success message (e.g. sync) */}
      {infoMsg && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
          {infoMsg}
        </div>
      )}

      {/* Tool dir header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{detail.name}</h2>
        <p className="mt-1 break-all text-sm text-gray-500 dark:text-gray-400">{detail.path}</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={t("searchInToolDir")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      {/* ===== Public skills section (expanded by default) ===== */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <SectionHeader
          title={t("publicSkills")}
          count={detail.skills.length}
          expanded={publicExpanded}
          onToggle={() => setPublicExpanded((v) => !v)}
        />
        {publicExpanded && (
          filteredPublic.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
              {query ? t("noSearchResults") : t("noPublicSkills")}
            </p>
          ) : (
            <>
              {/* Category tabs + toggle controlling only the active tab */}
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                {visibleGroups.map((group) => {
                  const isActive = activeGroup?.key === group.key;
                  return (
                    <button
                      key={group.key}
                      onClick={() => setPublicActiveCat(group.key)}
                      className={
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors " +
                        (isActive
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600")
                      }
                    >
                      {group.label}
                      <span className={"ml-1 " + (isActive ? "opacity-80" : "opacity-60")}>
                        {group.skills.length}
                      </span>
                    </button>
                  );
                })}
                {activeGroup && (
                  <div className="ml-auto">
                    <LinkAllToggle
                      allLinked={activeGroup.skills.every((s) => s.linked)}
                      loading={
                        actionLoading === "linkAll:" + activeGroup.key ||
                        actionLoading === "unlinkAll:" + activeGroup.key
                      }
                      onLinkAll={() =>
                        handleLinkAll(
                          activeGroup.key,
                          activeGroup.skills.map((s) => s.name)
                        )
                      }
                      onUnlinkAll={() =>
                        handleUnlinkAll(
                          activeGroup.key,
                          activeGroup.skills.filter((s) => s.linked).map((s) => s.name)
                        )
                      }
                      linkLabel={t("linkAll")}
                      unlinkLabel={t("unlinkAll")}
                      applyingLabel={t("applying")}
                    />
                  </div>
                )}
              </div>
              {/* Active tab content */}
              {activeGroup && activeGroup.skills.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                  {t("noSearchResults")}
                </p>
              ) : (
                <div className="space-y-2">
                  {activeGroup!.skills.map((skill) => (
                    <div
                      key={skill.name}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
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
            </>
          )
        )}
      </div>

      {/* ===== Private skills section (collapsed by default) ===== */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <SectionHeader
          title={t("privateSkills")}
          count={detail.private_skills.length}
          expanded={privateExpanded}
          onToggle={() => setPrivateExpanded((v) => !v)}
        />
        {privateExpanded && (
          <>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{t("privateSkillsHint")}</p>
            {filteredPrivate.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                {query ? t("noSearchResults") : t("noPrivateSkills")}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredPrivate.map((skill) => (
                  <div
                    key={skill.name}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-700 dark:text-gray-200">{skill.name}</div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-400 dark:text-gray-500">
                        {skill.description || "\u2014"}
                      </p>
                    </div>
                    <Tooltip text={actionLoading === `sync-${skill.name}` ? t("syncing") : t("syncSkill")}>
                      <button
                        onClick={() => handleSync(skill.name)}
                        disabled={actionLoading === `sync-${skill.name}`}
                        aria-label={t("syncSkill")}
                        className="flex-shrink-0 rounded bg-green-600 p-1.5 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={"h-4 w-4" + (actionLoading === `sync-${skill.name}` ? " animate-spin" : "")}
                        >
                          <polyline points="23 4 23 10 17 10" />
                          <polyline points="1 20 1 14 7 14" />
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                      </button>
                    </Tooltip>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
