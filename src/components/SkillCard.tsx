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
      className="cursor-pointer rounded-card border border-hairline bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <h3 className="font-semibold tracking-tight text-ink">{skill.name}</h3>
      {skill.description ? (
        <Tooltip text={skill.description} className="block" wrap>
          <p className="mt-1 line-clamp-2 text-sm text-ink-3 dark:text-ink-4">
            {skill.description}
          </p>
        </Tooltip>
      ) : (
        <p className="mt-1 line-clamp-2 text-sm text-ink-3 dark:text-ink-4">
          {"\u2014"}
        </p>
      )}
      <div className="mt-3 flex items-center justify-end">
        {skill.linked_count === skill.total_tool_dirs && skill.total_tool_dirs > 0 ? (
          <span className="rounded-full bg-live-bg px-2.5 py-0.5 text-xs font-medium text-live dark:bg-live-bg dark:text-live">
            {t("linkedCount", { linked: skill.linked_count, total: skill.total_tool_dirs })}
          </span>
        ) : skill.linked_count > 0 ? (
          <span className="rounded-full bg-heat-bg px-2.5 py-0.5 text-xs font-medium text-heat dark:bg-heat-bg dark:text-heat">
            {t("linkedCount", { linked: skill.linked_count, total: skill.total_tool_dirs })}
          </span>
        ) : (
          <span className="rounded-full bg-fill px-2.5 py-0.5 text-xs font-medium text-ink-3 dark:bg-fill dark:text-ink-4">
            {t("unlinked")}
          </span>
        )}
      </div>
    </div>
  );
}
