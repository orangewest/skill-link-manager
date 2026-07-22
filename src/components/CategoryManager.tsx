import { Fragment, useState, useEffect, useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { SkillInfo } from "../types";
import { useI18n } from "../i18n/I18nContext";
import CheckboxIcon from "./CheckboxIcon";
import Modal from "./Modal";
import Tooltip from "./Tooltip";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Ordered category names. */
  categoryOrder: string[];
  /** skillName -> categoryName. */
  categoriesMap: Record<string, string>;
  /** All scanned skills (used to pick members for a category). */
  skills: SkillInfo[];
  onReorder: (order: string[]) => void;
  onAddCategory: (name: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (name: string) => void;
  /** Replace the full membership set of a category. */
  onApplyMembers: (category: string, skillNames: string[]) => void;
}

// ---- Small inline icon components ----
function Icon({ path, className = "h-4 w-4" }: { path: string; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={path} />
    </svg>
  );
}
const DragHandleIcon = () => (
  <Icon path="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" className="h-5 w-5" />
);
const EditIcon = () => <Icon path="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />;
const TrashIcon = () => (
  <Icon path="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
);
const PlusIcon = () => <Icon path="M12 5v14M5 12h14" />;
const SearchIcon = () => (
  <Icon path="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35" />
);

/** Popup that lets the user pick which skills belong to a category. */
function SkillPicker({
  category,
  skills,
  categoriesMap,
  onApplyMembers,
  onClose,
}: {
  category: string;
  skills: SkillInfo[];
  categoriesMap: Record<string, string>;
  onApplyMembers: (category: string, skillNames: string[]) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const initial = useMemo(
    () => new Set(skills.filter((s) => categoriesMap[s.name] === category).map((s) => s.name)),
    [category, skills, categoriesMap]
  );
  const [selected, setSelected] = useState<Set<string>>(initial);
  const [query, setQuery] = useState("");
  // Hidden operation: reveal skills that already belong to *other* categories.
  const [showCategorized, setShowCategorized] = useState(false);

  const q = query.trim().toLowerCase();
  const visible = skills.filter((s) => {
    if (q && !s.name.toLowerCase().includes(q)) return false;
    const cur = categoriesMap[s.name] || "";
    // Hide skills that live in another category unless the hidden toggle is on.
    if (!showCategorized && cur && cur !== category) return false;
    return true;
  });

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Select every skill currently visible (respects search filter + showCategorized toggle).
  const selectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const s of visible) next.add(s.name);
      return next;
    });
  };

  // Deselect every skill currently visible.
  const selectNone = () => {
    setSelected((prev) => {
      const visibleNames = new Set(visible.map((s) => s.name));
      const next = new Set<string>();
      for (const n of prev) if (!visibleNames.has(n)) next.add(n);
      return next;
    });
  };

  // Single toggle: select all visible when not all are selected, otherwise clear them.
  const allVisibleSelected =
    visible.length > 0 && visible.every((s) => selected.has(s.name));
  const toggleSelectAll = () => {
    if (allVisibleSelected) selectNone();
    else selectAll();
  };

  const confirm = () => {
    onApplyMembers(category, Array.from(selected));
    onClose();
  };

  return (
    <Modal
      size="md"
      title={t("categoryMembers", { name: category })}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t("cancel")}
          </button>
          <button
            onClick={confirm}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {t("done")}
          </button>
        </>
      }
    >
      <div className="flex max-h-[65vh] flex-col">
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchSkills")}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex flex-shrink-0 items-center gap-1">
            <Tooltip text={allVisibleSelected ? t("selectNone") : t("selectAll")}>
              <button
                onClick={toggleSelectAll}
                aria-label={allVisibleSelected ? t("selectNone") : t("selectAll")}
                className="rounded border border-gray-300 p-1.5 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <CheckboxIcon checked={allVisibleSelected} />
              </button>
            </Tooltip>
            <span className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
              {t("selectedCount", { count: selected.size })}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {visible.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
              {t("noSkills")}
            </p>
          ) : (
            visible.map((skill) => {
              const cur = categoriesMap[skill.name] || "";
              const inOther = cur && cur !== category;
              const checked = selected.has(skill.name);
              return (
                <label
                  key={skill.name}
                  className={
                    "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 " +
                    (inOther ? "opacity-70" : "")
                  }
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(skill.name)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-900"
                  />
                  <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
                    {skill.name}
                  </span>
                  {inOther && (
                    <span className="whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                      {t("inCategory", { name: cur })}
                    </span>
                  )}
                </label>
              );
            })
          )}
        </div>

        <button
          onClick={() => setShowCategorized((v) => !v)}
          className="mt-2 self-start text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          {showCategorized ? t("hideCategorized") : t("showCategorized")}
        </button>
      </div>
    </Modal>
  );
}

export default function CategoryManager({
  open,
  onClose,
  categoryOrder,
  categoriesMap,
  skills,
  onReorder,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onApplyMembers,
}: Props) {
  const { t } = useI18n();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Local mirror of order for drag-and-drop feedback.
  const [order, setOrder] = useState<string[]>(categoryOrder);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Skill picker state.
  const [pickerCategory, setPickerCategory] = useState<string | null>(null);

  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => setOrder(categoryOrder), [categoryOrder]);

  if (!open) return null;

  // ---- Pointer-based drag-and-drop reorder (works in webviews) ----
  // `overIndex` is the *insertion* position (0..order.length) where the
  // grabbed row would be dropped. We only commit the reorder on release, so
  // rows never jump around while the pointer moves.
  const computeOverIndex = (clientY: number): number => {
    const list = listRef.current;
    if (!list) return 0;
    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-row]"));
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) return i;
    }
    return rows.length;
  };

  const handlePointerDown = (e: ReactPointerEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragIndex(idx);
    setOverIndex(idx);
  };

  const handlePointerMove = (e: ReactPointerEvent) => {
    if (dragIndex === null) return;
    const over = computeOverIndex(e.clientY);
    setOverIndex((prev) => (prev === over ? prev : over));
  };

  const handlePointerUp = (e: ReactPointerEvent) => {
    if (dragIndex !== null && overIndex !== null) {
      const from = dragIndex;
      const to = overIndex > from ? overIndex - 1 : overIndex;
      if (to !== from) {
        const next = [...order];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        setOrder(next);
        onReorder(next);
      }
    }
    setDragIndex(null);
    setOverIndex(null);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  const commitAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    onAddCategory(trimmed);
    setNewCategoryName("");
  };

  const memberCount = (category: string) =>
    skills.filter((s) => categoriesMap[s.name] === category).length;

  return (
    <>
      <Modal size="md" title={t("manageCategories")} onClose={onClose}>
        {/* Add new category */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAddCategory();
            }}
            placeholder={t("categoryName")}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
          <button
            onClick={commitAddCategory}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <PlusIcon />
            {t("addCategory")}
          </button>
        </div>

        {order.length === 0 ? (
          <p className="mb-2 text-sm text-gray-400 dark:text-gray-500">
            {t("noCategories")}
          </p>
        ) : (
          <ul
            ref={listRef}
            className={
              "flex-1 space-y-1.5 overflow-y-auto pr-1" +
              (dragIndex !== null ? " select-none" : "")
            }
          >
            {order.map((cat, idx) => {
              const isRenaming = renamingCategory === cat;
              return (
                <Fragment key={cat}>
                  {dragIndex !== null && overIndex === idx && (
                    <div className="mx-1 h-0.5 rounded bg-blue-500" />
                  )}
                  <li
                    data-row
                    className={
                      "flex items-center gap-2 rounded-lg border bg-gray-50 px-2 py-1.5 dark:bg-gray-900 " +
                      (dragIndex === idx
                        ? "border-blue-400 opacity-50 ring-1 ring-blue-400 "
                        : "border-gray-100 dark:border-gray-700 ")
                    }
                  >
                    <Tooltip text={t("dragToReorder")}>
                      <span
                        onPointerDown={(e) => handlePointerDown(e, idx)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className="cursor-grab touch-none select-none text-gray-300 hover:text-gray-400 active:cursor-grabbing dark:text-gray-600 dark:hover:text-gray-400"
                      >
                        <DragHandleIcon />
                      </span>
                    </Tooltip>
                  {isRenaming ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onRenameCategory(cat, renameValue);
                        if (e.key === "Escape") {
                          setRenamingCategory(null);
                          setRenameValue("");
                        }
                      }}
                      onBlur={() => onRenameCategory(cat, renameValue)}
                      className="flex-1 select-text rounded border border-blue-400 bg-white px-1.5 py-0.5 text-sm focus:outline-none dark:bg-gray-800 dark:text-gray-100"
                    />
                  ) : (
                    <Tooltip text={t("rename")} className="min-w-0 flex-1">
                      <button
                        onClick={() => {
                          setRenamingCategory(cat);
                          setRenameValue(cat);
                        }}
                        aria-label={t("rename")}
                        className="flex w-full items-center gap-2 truncate text-left text-sm text-gray-700 dark:text-gray-200"
                      >
                        <span className="truncate">{cat}</span>
                        <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                          {memberCount(cat)}
                        </span>
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip text={t("addSkillToCategory")}>
                    <button
                      onClick={() => setPickerCategory(cat)}
                      aria-label={t("addSkillToCategory")}
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <PlusIcon />
                    </button>
                  </Tooltip>
                  <Tooltip text={t("rename")}>
                    <button
                      onClick={() => {
                        setRenamingCategory(cat);
                        setRenameValue(cat);
                      }}
                      aria-label={t("rename")}
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <EditIcon />
                    </button>
                  </Tooltip>
                  <Tooltip text={t("deleteCategory")}>
                    <button
                      onClick={() => onDeleteCategory(cat)}
                      aria-label={t("deleteCategory")}
                      className="rounded p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40"
                    >
                      <TrashIcon />
                    </button>
                  </Tooltip>
                </li>
                </Fragment>
              );
            })}
            {dragIndex !== null && overIndex === order.length && (
              <div className="mx-1 h-0.5 rounded bg-blue-500" />
            )}
          </ul>
        )}
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          {t("dragToReorderHint")}
        </p>
      </Modal>

      {pickerCategory && (
        <SkillPicker
          category={pickerCategory}
          skills={skills}
          categoriesMap={categoriesMap}
          onApplyMembers={onApplyMembers}
          onClose={() => setPickerCategory(null)}
        />
      )}
    </>
  );
}
