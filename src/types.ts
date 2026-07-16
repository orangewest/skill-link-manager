export interface SkillInfo {
  name: string;
  path: string;
  description: string;
  linked_count: number;
  total_tool_dirs: number;
}

export interface ToolDirInfo {
  name: string;
  path: string;
  exists: boolean;
}

export interface ToolDirConfig {
  name: string;
  path: string;
}

export interface LinkedDir {
  name: string;
  path: string;
  linked: boolean;
}

export interface SkillDetail {
  name: string;
  path: string;
  description: string;
  linked_dirs: LinkedDir[];
}

export interface SkillLinkStatus {
  name: string;
  linked: boolean;
}

export interface PrivateSkill {
  name: string;
  path: string;
  description: string;
}

export interface ToolDirDetail {
  name: string;
  path: string;
  skills: SkillLinkStatus[];
  private_skills: PrivateSkill[];
}

export interface LogEntry {
  level: string;
  message: string;
}

export interface ApplyResult {
  success: number;
  skipped: number;
  failed: number;
  created: number;
  fixed: number;
  logs: LogEntry[];
}

export interface AppConfig {
  shared_dir: string;
  tool_dirs: ToolDirConfig[];
  tool_dirs_checked: Record<string, boolean>;
  skills_checked: Record<string, boolean>;
  language: string;
  theme: string; // "light" | "dark" | "system"
}
