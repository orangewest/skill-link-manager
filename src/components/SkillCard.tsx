import type { SkillInfo } from "../types";
import { useI18n } from "../i18n/I18nContext";
import Tooltip from "./Tooltip";

interface Props {
  skill: SkillInfo;
  onClick: (name: string) => void;
}

export default function SkillCard({ skill, onClick }: Props) {
  const { t } = useI18n();
  return (
    <div
      onClick={() => onClick(skill.name)}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
    >
      <h3 className="font-semibold text-gray-800 dark:text-gray-100">{skill.name}</h3>
      {skill.description ? (
        <Tooltip text={skill.description} className="block" wrap>
          <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
            {skill.description}
          </p>
        </Tooltip>
      ) : (
        <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
          {"\u2014"}
        </p>
      )}
      <div className="mt-3 flex items-center justify-end">
        {skill.linked_count === skill.total_tool_dirs && skill.total_tool_dirs > 0 ? (
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
            {t("linkedCount", { linked: skill.linked_count, total: skill.total_tool_dirs })}
          </span>
        ) : skill.linked_count > 0 ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
            {t("linkedCount", { linked: skill.linked_count, total: skill.total_tool_dirs })}
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300">
            {t("unlinked")}
          </span>
        )}
      </div>
    </div>
  );
}
