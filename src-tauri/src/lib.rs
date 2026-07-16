use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;

// ============================================================
//  Data Structures (shared with frontend via serde)
// ============================================================

#[derive(Serialize, Deserialize, Clone)]
pub struct SkillInfo {
    pub name: String,
    pub path: String,
    pub description: String,
    pub linked_count: usize,
    pub total_tool_dirs: usize,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ToolDirInfo {
    pub name: String,
    pub path: String,
    pub exists: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ToolDirConfig {
    pub name: String,
    pub path: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct LinkedDir {
    pub name: String,
    pub path: String,
    pub linked: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SkillDetail {
    pub name: String,
    pub path: String,
    pub description: String,
    pub linked_dirs: Vec<LinkedDir>,
}

/// Link status for a single skill within a tool directory.
#[derive(Serialize, Deserialize, Clone)]
pub struct SkillLinkStatus {
    pub name: String,
    pub linked: bool,
}

/// A skill that lives directly inside a tool directory (a real folder,
/// not a link to the central repository). Such skills are "private" to
/// that tool dir until synced into the central repository.
#[derive(Serialize, Deserialize, Clone)]
pub struct PrivateSkill {
    pub name: String,
    pub path: String,
    pub description: String,
}

/// Detailed view of a tool directory: lists every skill in the central
/// repository along with whether it is linked into this tool dir, plus the
/// private (non-linked) skills that live directly inside this tool dir.
#[derive(Serialize, Deserialize, Clone)]
pub struct ToolDirDetail {
    pub name: String,
    pub path: String,
    pub skills: Vec<SkillLinkStatus>,
    pub private_skills: Vec<PrivateSkill>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LogEntry {
    pub level: String,
    pub message: String,
}

#[derive(Serialize, Deserialize)]
pub struct ApplyResult {
    pub success: usize,
    pub skipped: usize,
    pub failed: usize,
    pub created: usize,
    pub fixed: usize,
    pub logs: Vec<LogEntry>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub shared_dir: String,
    pub tool_dirs: Vec<ToolDirConfig>,
    pub tool_dirs_checked: HashMap<String, bool>,
    pub skills_checked: HashMap<String, bool>,
    pub language: String,
    /// Theme preference: "light", "dark", or "system".
    #[serde(default = "default_theme")]
    pub theme: String,
}

fn default_theme() -> String {
    "system".to_string()
}

/// Partial config for backward-compatible deserialization.
/// Each field is optional so missing fields in old config files
/// are filled with defaults.
#[derive(Deserialize)]
struct AppConfigPartial {
    #[serde(default)]
    shared_dir: Option<String>,
    #[serde(default)]
    tool_dirs: Option<Vec<ToolDirConfig>>,
    #[serde(default)]
    tool_dirs_checked: Option<HashMap<String, bool>>,
    #[serde(default)]
    skills_checked: Option<HashMap<String, bool>>,
    #[serde(default)]
    language: Option<String>,
    #[serde(default)]
    theme: Option<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
        let shared_dir = home.join("skills").to_string_lossy().to_string();
        AppConfig {
            shared_dir,
            // No hardcoded tool dirs — first-run onboarding detects
            // installed agents via `detect_known_agents`.
            tool_dirs: Vec::new(),
            tool_dirs_checked: HashMap::new(),
            skills_checked: HashMap::new(),
            language: "zh".to_string(),
            theme: "system".to_string(),
        }
    }
}

// ============================================================
//  Path & Config Helpers
// ============================================================

/// Config file path: `%APPDATA%\skill-link-manager\config.json`
fn get_config_path() -> PathBuf {
    let config_dir = dirs::config_dir().expect("Could not determine config directory");
    config_dir.join("skill-link-manager").join("config.json")
}

/// Load config from disk, falling back to defaults on any error.
fn load_config_internal() -> AppConfig {
    let config_path = get_config_path();
    if !config_path.exists() {
        return AppConfig::default();
    }
    let content = match fs::read_to_string(&config_path) {
        Ok(c) => c,
        Err(_) => return AppConfig::default(),
    };
    parse_config(&content)
}

/// Normalise path separators to the OS-native form for display/storage.
///
/// The `known_agents.json` registry uses `/`-separated relative paths (e.g.
/// `.config/opencode/skills`). On Windows, `PathBuf::join` preserves those
/// forward slashes, producing mixed-separator strings like
/// `C:\Users\jinpeng\.config/opencode/skills`. This converts `/` → `\` on
/// Windows so paths are consistent. On Unix `/` is already native and `\`
/// is a valid filename character, so it is left untouched.
fn native_path_str(s: &str) -> String {
    #[cfg(windows)]
    {
        s.replace('/', "\\")
    }
    #[cfg(not(windows))]
    {
        s.to_string()
    }
}

/// Parse config JSON with backward compatibility for old formats.
fn parse_config(content: &str) -> AppConfig {
    let partial: AppConfigPartial = match serde_json::from_str(content) {
        Ok(p) => p,
        Err(_) => return AppConfig::default(),
    };
    let default = AppConfig::default();
    AppConfig {
        shared_dir: native_path_str(&partial.shared_dir.unwrap_or(default.shared_dir)),
        tool_dirs: partial
            .tool_dirs
            .unwrap_or(default.tool_dirs)
            .into_iter()
            .map(|mut td| {
                td.path = native_path_str(&td.path);
                td
            })
            .collect(),
        tool_dirs_checked: partial.tool_dirs_checked.unwrap_or(default.tool_dirs_checked),
        skills_checked: partial.skills_checked.unwrap_or(default.skills_checked),
        language: partial.language.unwrap_or(default.language),
        theme: partial.theme.unwrap_or(default.theme),
    }
}

// ============================================================
//  Platform Abstraction (link creation / detection)
// ============================================================
//
// Windows uses junctions (directory-only reparse points that do not
// require administrator privileges or Developer Mode). macOS and Linux
// use symbolic links via `std::os::unix::fs::symlink`. The `#[cfg]`
// gates below select the right implementation at compile time, so each
// platform build contains only its own code path — `cargo build` on
// Windows compiles the junction branch, on macOS/Linux the symlink
// branch. Tauri's `bundle.targets: "all"` then packages the result for
// the host OS (msi/nsis on Windows, dmg/app on macOS, deb/AppImage on
// Linux) with no extra build configuration.

#[cfg(windows)]
mod platform {
    use std::fs;
    use std::io;
    use std::path::{Path, PathBuf};

    /// Create a directory junction so `dst` points at `src`.
    pub fn create_link(src: &Path, dst: &Path) -> io::Result<()> {
        junction::create(src, dst)
    }

    /// Read the target of a junction; returns Err for non-junctions.
    pub fn get_link_target(p: &Path) -> io::Result<PathBuf> {
        junction::get_target(p)
    }

    /// Remove a junction. Safe: does not follow into the target.
    pub fn remove_link(p: &Path) -> io::Result<()> {
        fs::remove_dir(p)
    }

    /// Compare two paths for equality (Windows: case-insensitive, `\`).
    pub fn paths_equal(a: &Path, b: &Path) -> bool {
        normalize(a) == normalize(b)
    }

    fn normalize(p: &Path) -> String {
        let s = p.to_string_lossy().to_lowercase().replace('/', "\\");
        s.strip_prefix(r"\\?\")
            .unwrap_or(&s)
            .trim_end_matches('\\')
            .to_string()
    }
}

#[cfg(unix)]
mod platform {
    use std::fs;
    use std::io;
    use std::os::unix::fs::symlink;
    use std::path::{Path, PathBuf};

    /// Create a symbolic link so `dst` points at `src`.
    pub fn create_link(src: &Path, dst: &Path) -> io::Result<()> {
        symlink(src, dst)
    }

    /// Read the target of a symlink; returns Err for non-links.
    pub fn get_link_target(p: &Path) -> io::Result<PathBuf> {
        fs::read_link(p)
    }

    /// Remove a symlink. `remove_file` (unlink) is correct for symlinks
    /// to both files and directories and does not follow the link.
    /// `remove_dir` (rmdir) would fail because a symlink is not a directory.
    pub fn remove_link(p: &Path) -> io::Result<()> {
        fs::remove_file(p)
    }

    /// Compare two paths for equality.
    /// macOS default filesystems (APFS/HFS+) are case-insensitive;
    /// Linux is case-sensitive.
    pub fn paths_equal(a: &Path, b: &Path) -> bool {
        normalize(a) == normalize(b)
    }

    fn normalize(p: &Path) -> String {
        let s = p.to_string_lossy().trim_end_matches('/').to_string();
        #[cfg(target_os = "macos")]
        let s = s.to_lowercase();
        s
    }
}

/// Helper: push a log entry.
fn log(logs: &mut Vec<LogEntry>, level: &str, message: impl Into<String>) {
    logs.push(LogEntry {
        level: level.to_string(),
        message: message.into(),
    });
}

// ============================================================
//  Skill Description Parsing
// ============================================================

/// Parse skill description from `SKILL.md` file inside the skill folder.
///
/// Strategy (fault-tolerant):
/// 1. If SKILL.md doesn't exist → empty string
/// 2. If YAML frontmatter exists (between `---` markers), extract `description:` field
///    — supports both inline values (`description: foo`) and YAML block scalars
///      (`description: |` / `description: >` with indented content on the lines below)
/// 3. Otherwise, take the first non-empty, non-heading line from the body
fn parse_skill_description(skill_path: &Path) -> String {
    let skill_md = skill_path.join("SKILL.md");
    let content = match fs::read_to_string(&skill_md) {
        Ok(c) => c,
        Err(_) => return String::new(),
    };

    let lines: Vec<&str> = content.lines().collect();

    // Try YAML frontmatter: first line must be exactly "---"
    if !lines.is_empty() && lines[0].trim() == "---" {
        // Find the closing "---"
        let mut frontmatter_end: Option<usize> = None;
        for (i, line) in lines.iter().enumerate().skip(1) {
            if line.trim() == "---" {
                frontmatter_end = Some(i);
                break;
            }
        }
        if let Some(end) = frontmatter_end {
            // Search for description: within the frontmatter block.
            // `lines[1..end]` is the frontmatter body; index `idx` here is
            // 0-based within that slice, so the line's index in `lines` is
            // `idx + 1` and the first content line below it is `idx + 2`.
            for (idx, line) in lines[1..end].iter().enumerate() {
                let trimmed = line.trim();
                if let Some(value) = trimmed.strip_prefix("description:") {
                    let value = value.trim();
                    // YAML block scalar indicators: the actual content lives
                    // on the following indented lines, not on this one.
                    let block_folded = match value {
                        "|" | "|-" | "|+" => Some(false),
                        ">" | ">-" | ">+" => Some(true),
                        _ => None,
                    };
                    if let Some(folded) = block_folded {
                        let body_start = idx + 2;
                        if body_start <= end {
                            return parse_block_scalar(&lines[body_start..end], folded);
                        }
                        return String::new();
                    }
                    // Inline value (optionally quoted)
                    let desc = value
                        .trim_matches('"')
                        .trim_matches('\'')
                        .to_string();
                    if !desc.is_empty() {
                        return desc;
                    }
                }
            }
            // No description field in frontmatter — fall back to body
            return first_body_line(&lines[end + 1..]);
        }
    }

    // No frontmatter — use first non-empty non-heading line
    first_body_line(&lines)
}

/// Parse a YAML block scalar (literal `|` or folded `>`).
///
/// - Literal: newlines between lines are preserved.
/// - Folded: newlines between non-empty lines become spaces; blank lines
///   remain newlines.
///
/// Trailing empty lines are stripped (YAML default "clip" chomping).
fn parse_block_scalar(lines: &[&str], folded: bool) -> String {
    // Indentation is set by the first non-empty line.
    let indent = lines
        .iter()
        .find(|l| !l.trim().is_empty())
        .map(|l| l.len() - l.trim_start().len())
        .unwrap_or(0);

    let mut content_lines: Vec<String> = lines
        .iter()
        .map(|l| {
            if l.trim().is_empty() {
                String::new()
            } else if l.len() >= indent {
                l[indent..].to_string()
            } else {
                l.trim().to_string()
            }
        })
        .collect();

    // Trim trailing empty lines (default chomping = clip).
    while content_lines.last().map(|s| s.is_empty()).unwrap_or(false) {
        content_lines.pop();
    }

    if folded {
        let mut result = String::new();
        let mut prev_empty = false;
        for line in &content_lines {
            if line.is_empty() {
                if !result.is_empty() {
                    result.push('\n');
                }
                prev_empty = true;
            } else {
                if !result.is_empty() && !prev_empty {
                    result.push(' ');
                }
                result.push_str(line);
                prev_empty = false;
            }
        }
        result
    } else {
        content_lines.join("\n")
    }
}

/// Extract the first non-empty, non-heading line from markdown content.
fn first_body_line(lines: &[&str]) -> String {
    for line in lines {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        if trimmed.starts_with('#') {
            continue;
        }
        return trimmed.to_string();
    }
    String::new()
}

// ============================================================
//  Tauri Commands
// ============================================================

/// Scan the shared skills directory for all sub-directories (each = one skill).
/// Returns a sorted list with per-skill link status and description.
#[tauri::command]
fn scan_skills() -> Result<Vec<SkillInfo>, String> {
    let config = load_config_internal();
    let shared_dir = PathBuf::from(&config.shared_dir);
    if !shared_dir.exists() {
        return Err(format!(
            "Shared directory does not exist: {}\n\
             Please create the directory and add skill folders.",
            shared_dir.display()
        ));
    }

    // Only consider tool dirs that are checked (enabled) — unchecked
    // dirs are hidden from the home page skill list and link counts.
    let tool_dirs: Vec<(String, PathBuf)> = config
        .tool_dirs
        .iter()
        .filter(|td| *config.tool_dirs_checked.get(&td.name).unwrap_or(&true))
        .map(|td| (td.name.clone(), PathBuf::from(&td.path)))
        .collect();
    let mut skills: Vec<SkillInfo> = Vec::new();

    let entries = fs::read_dir(&shared_dir).map_err(|e| {
        format!(
            "Failed to read shared directory '{}': {}",
            shared_dir.display(),
            e
        )
    })?;

    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(e) => {
                eprintln!("Warning: failed to read entry: {}", e);
                continue;
            }
        };

        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let name = entry.file_name().to_string_lossy().to_string();

        // Count how many tool dirs already have a valid link for this skill.
        let mut linked_count = 0usize;
        for (_, tool_dir) in &tool_dirs {
            let target = tool_dir.join(&name);
            if platform::get_link_target(&target)
                .map(|t| platform::paths_equal(&t, &path))
                .unwrap_or(false)
            {
                linked_count += 1;
            }
        }

        let description = parse_skill_description(&path);

        skills.push(SkillInfo {
            name,
            path: path.to_string_lossy().to_string(),
            description,
            linked_count,
            total_tool_dirs: tool_dirs.len(),
        });
    }

    skills.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(skills)
}

/// Return metadata for all tool directories (name, path, whether it exists).
/// Reads from config so it reflects user customisation.
#[tauri::command]
fn get_tool_dirs_info() -> Vec<ToolDirInfo> {
    let config = load_config_internal();
    config
        .tool_dirs
        .iter()
        .map(|td| {
            let path = PathBuf::from(&td.path);
            ToolDirInfo {
                name: td.name.clone(),
                path: td.path.clone(),
                exists: path.exists(),
            }
        })
        .collect()
}

/// Create / fix / clean links for the cartesian product of
/// `selected_skills` × `selected_tool_dirs`.
///
/// Logic (mirrors `link-skills.ps1`):
///   - Tool dir missing  → create it
///   - Stale link        → remove (target no longer exists)
///   - Target absent     → create link
///   - Target is link pointing correctly → skip (OK)
///   - Target is link pointing wrongly   → remove & recreate
///   - Target is regular dir/file        → remove & create link
///
/// Link type is platform-dependent: junctions on Windows, symbolic links
/// on macOS/Linux (see the `platform` module).
#[tauri::command]
fn apply_links(
    selected_skills: Vec<String>,
    selected_tool_dirs: Vec<String>,
) -> Result<ApplyResult, String> {
    let config = load_config_internal();
    let shared_dir = PathBuf::from(&config.shared_dir);
    if !shared_dir.exists() {
        return Err(format!(
            "Shared directory does not exist: {}",
            shared_dir.display()
        ));
    }

    let mut logs: Vec<LogEntry> = Vec::new();
    let mut success = 0usize;
    let mut skipped = 0usize;
    let mut failed = 0usize;
    let mut created = 0usize;
    let mut fixed = 0usize;

    let all_tool_dirs: Vec<(String, PathBuf)> = config
        .tool_dirs
        .iter()
        .map(|td| (td.name.clone(), PathBuf::from(&td.path)))
        .collect();
    let tool_dir_map: HashMap<&str, &PathBuf> = all_tool_dirs
        .iter()
        .map(|(name, path)| (name.as_str(), path))
        .collect();

    for dir_name in &selected_tool_dirs {
        let tool_dir = match tool_dir_map.get(dir_name.as_str()) {
            Some(p) => (*p).clone(),
            None => {
                log(&mut logs, "error", format!("Unknown tool directory: {}", dir_name));
                continue;
            }
        };

        log(&mut logs, "info", format!("Processing: {} ({})", dir_name, tool_dir.display()));

        // --- Create tool directory if it doesn't exist ---
        if !tool_dir.exists() {
            fs::create_dir_all(&tool_dir).map_err(|e| {
                format!("Failed to create tool directory '{}': {}", tool_dir.display(), e)
            })?;
            log(&mut logs, "info", format!("  Created directory: {}", tool_dir.display()));
        }

        // --- Clean stale links (target gone) ---
        let mut stale_removed = 0usize;
        if let Ok(entries) = fs::read_dir(&tool_dir) {
            for entry in entries.flatten() {
                let entry_path = entry.path();
                // Only check entries that are links
                if let Ok(link_target) = platform::get_link_target(&entry_path) {
                    if !link_target.exists() {
                        match platform::remove_link(&entry_path) {
                            Ok(()) => {
                                log(&mut logs, "warning", format!(
                                    "  Removed stale link: {} (target gone)",
                                    entry.file_name().to_string_lossy()
                                ));
                                stale_removed += 1;
                            }
                            Err(e) => {
                                log(&mut logs, "error", format!(
                                    "  Failed to remove stale link {}: {}",
                                    entry.file_name().to_string_lossy(),
                                    e
                                ));
                            }
                        }
                    }
                }
            }
        }
        if stale_removed > 0 {
            log(&mut logs, "info", format!("  Cleaned {} stale link(s)", stale_removed));
        }

        // --- Process each selected skill ---
        for skill_name in &selected_skills {
            let source_path = shared_dir.join(skill_name);
            let target_path = tool_dir.join(skill_name);

            if !source_path.exists() {
                log(&mut logs, "error", format!("  Skill not found: {}", skill_name));
                failed += 1;
                continue;
            }

            // Check if something exists at the target (without following links)
            match fs::symlink_metadata(&target_path) {
                Ok(metadata) => {
                    // Something exists — is it a link?
                    match platform::get_link_target(&target_path) {
                        Ok(current_target) => {
                            // It IS a link — compare targets
                            if platform::paths_equal(&current_target, &source_path) {
                                log(&mut logs, "success", format!(
                                    "  OK: {} (link already correct)", skill_name
                                ));
                                skipped += 1;
                            } else {
                                // Wrong target — remove and recreate
                                if let Err(e) = platform::remove_link(&target_path) {
                                    log(&mut logs, "error", format!(
                                        "  Failed to remove old link {}: {}",
                                        skill_name, e
                                    ));
                                    failed += 1;
                                } else {
                                    match platform::create_link(&source_path, &target_path) {
                                        Ok(()) => {
                                            log(&mut logs, "warning", format!(
                                                "  Fixed: {} (re-pointed to correct source)",
                                                skill_name
                                            ));
                                            fixed += 1;
                                            success += 1;
                                        }
                                        Err(e) => {
                                            log(&mut logs, "error", format!(
                                                "  Failed to recreate link {}: {}",
                                                skill_name, e
                                            ));
                                            failed += 1;
                                        }
                                    }
                                }
                            }
                        }
                        Err(_) => {
                            // Not a link — it's a regular file or directory.
                            // Delete it and create a link.
                            log(&mut logs, "info", format!(
                                "  Replacing existing item with link: {}", skill_name
                            ));
                            let remove_result = if metadata.is_dir() {
                                fs::remove_dir_all(&target_path)
                            } else {
                                fs::remove_file(&target_path)
                            };
                            if let Err(e) = remove_result {
                                log(&mut logs, "error", format!(
                                    "  Failed to remove existing item {}: {}",
                                    skill_name, e
                                ));
                                failed += 1;
                            } else {
                                match platform::create_link(&source_path, &target_path) {
                                    Ok(()) => {
                                        log(&mut logs, "success", format!(
                                            "  Created link: {}", skill_name
                                        ));
                                        created += 1;
                                        success += 1;
                                    }
                                    Err(e) => {
                                        log(&mut logs, "error", format!(
                                            "  Failed to create link {}: {}",
                                            skill_name, e
                                        ));
                                        failed += 1;
                                    }
                                }
                            }
                        }
                    }
                }
                Err(_) => {
                    // Nothing exists at the target — create link directly.
                    match platform::create_link(&source_path, &target_path) {
                        Ok(()) => {
                            log(&mut logs, "success", format!("  Created link: {}", skill_name));
                            created += 1;
                            success += 1;
                        }
                        Err(e) => {
                            log(&mut logs, "error", format!(
                                "  Failed to create link {}: {}",
                                skill_name, e
                            ));
                            failed += 1;
                        }
                    }
                }
            }
        }
    }

    log(&mut logs, "info", format!(
        "Done.  Created: {}, Fixed: {}, Skipped: {}, Failed: {}",
        created, fixed, skipped, failed
    ));

    Ok(ApplyResult {
        success,
        skipped,
        failed,
        created,
        fixed,
        logs,
    })
}

/// Load saved config from `%APPDATA%\skill-link-manager\config.json`.
/// Backward-compatible: missing fields are filled with defaults.
#[tauri::command]
fn load_config() -> Result<AppConfig, String> {
    let config_path = get_config_path();
    if !config_path.exists() {
        return Ok(AppConfig::default());
    }
    let content = fs::read_to_string(&config_path).map_err(|e| {
        format!("Failed to read config file '{}': {}", config_path.display(), e)
    })?;
    Ok(parse_config(&content))
}

/// Save config to `%APPDATA%\skill-link-manager\config.json`.
#[tauri::command]
fn save_config(config: AppConfig) -> Result<(), String> {
    let config_path = get_config_path();
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent).map_err(|e| {
            format!("Failed to create config directory '{}': {}", parent.display(), e)
        })?;
    }
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&config_path, content).map_err(|e| {
        format!("Failed to write config file '{}': {}", config_path.display(), e)
    })
}

/// Get detailed information about a single skill, including link status
/// for every tool directory.
#[tauri::command]
fn get_skill_detail(skill_name: String) -> Result<SkillDetail, String> {
    let config = load_config_internal();
    let shared_dir = PathBuf::from(&config.shared_dir);
    let skill_path = shared_dir.join(&skill_name);
    if !skill_path.exists() {
        return Err(format!("Skill not found: {}", skill_name));
    }

    let description = parse_skill_description(&skill_path);
    let mut linked_dirs = Vec::new();

    for td in &config.tool_dirs {
        // Skip unchecked (disabled) tool dirs — they should not appear
        // in the skill detail view's link list.
        if !*config.tool_dirs_checked.get(&td.name).unwrap_or(&true) {
            continue;
        }
        let target = PathBuf::from(&td.path).join(&skill_name);
        let linked = platform::get_link_target(&target)
            .map(|t| platform::paths_equal(&t, &skill_path))
            .unwrap_or(false);
        linked_dirs.push(LinkedDir {
            name: td.name.clone(),
            path: td.path.clone(),
            linked,
        });
    }

    Ok(SkillDetail {
        name: skill_name,
        path: skill_path.to_string_lossy().to_string(),
        description,
        linked_dirs,
    })
}

/// Remove a single link for a specific skill in a specific tool directory.
/// Uses `platform::remove_link` which is safe for links (does not follow the target).
#[tauri::command]
fn remove_link(skill_name: String, tool_dir_name: String) -> Result<(), String> {
    let config = load_config_internal();
    let shared_dir = PathBuf::from(&config.shared_dir);
    let skill_path = shared_dir.join(&skill_name);

    let tool_dir = config
        .tool_dirs
        .iter()
        .find(|td| td.name == tool_dir_name)
        .ok_or_else(|| format!("Unknown tool directory: {}", tool_dir_name))?;
    let target_path = PathBuf::from(&tool_dir.path).join(&skill_name);

    // Only remove if it's a link pointing to this skill
    match platform::get_link_target(&target_path) {
        Ok(current_target) => {
            if platform::paths_equal(&current_target, &skill_path) {
                // Safe: remove_link removes the link, not the target
                platform::remove_link(&target_path)
                    .map_err(|e| format!("Failed to remove link '{}': {}", skill_name, e))?;
                Ok(())
            } else {
                Err(format!(
                    "Link exists but points to a different target. Not removing for safety."
                ))
            }
        }
        Err(_) => {
            // Not a link
            if target_path.exists() {
                Err(format!(
                    "'{}' in '{}' is not a link, cannot remove safely.",
                    skill_name, tool_dir_name
                ))
            } else {
                // Nothing to remove — already unlinked
                Ok(())
            }
        }
    }
}

/// Delete a skill entirely: first unlink it from every tool directory that
/// links to it, then delete the skill folder in the shared directory.
///
/// Unlinking reuses the same safety logic as `remove_link` (only removes a
/// link whose target points back at this skill). The final folder delete is
/// `remove_dir_all` on the shared skill folder — it does NOT touch the
/// contents of any tool directory (links were already removed above).
#[tauri::command]
fn delete_skill(skill_name: String) -> Result<usize, String> {
    let config = load_config_internal();
    let shared_dir = PathBuf::from(&config.shared_dir);
    let skill_path = shared_dir.join(&skill_name);
    if !skill_path.exists() {
        return Err(format!("Skill not found: {}", skill_name));
    }

    // --- Step 1: remove every link pointing at this skill ---
    let mut unlinked = 0usize;
    for td in &config.tool_dirs {
        let target = PathBuf::from(&td.path).join(&skill_name);
        match platform::get_link_target(&target) {
            Ok(current_target) => {
                if platform::paths_equal(&current_target, &skill_path) {
                    match platform::remove_link(&target) {
                        Ok(()) => unlinked += 1,
                        Err(e) => eprintln!(
                            "Warning: failed to remove link '{}': {}",
                            skill_name, e
                        ),
                    }
                }
            }
            Err(_) => continue,
        }
    }

    // --- Step 2: delete the skill folder in the shared directory ---
    fs::remove_dir_all(&skill_path)
        .map_err(|e| format!("Failed to delete skill folder '{}': {}", skill_name, e))?;

    Ok(unlinked)
}

/// Create a single link for a specific skill in a specific tool directory.
/// Reuses the same safety logic as `apply_links`.
#[tauri::command]
fn add_link(skill_name: String, tool_dir_name: String) -> Result<(), String> {
    let config = load_config_internal();
    let shared_dir = PathBuf::from(&config.shared_dir);
    let skill_path = shared_dir.join(&skill_name);
    if !skill_path.exists() {
        return Err(format!("Skill not found: {}", skill_name));
    }

    let tool_dir = config
        .tool_dirs
        .iter()
        .find(|td| td.name == tool_dir_name)
        .ok_or_else(|| format!("Unknown tool directory: {}", tool_dir_name))?;
    let tool_dir_path = PathBuf::from(&tool_dir.path);
    let target_path = tool_dir_path.join(&skill_name);

    // Create tool directory if it doesn't exist
    if !tool_dir_path.exists() {
        fs::create_dir_all(&tool_dir_path).map_err(|e| {
            format!("Failed to create tool directory '{}': {}", tool_dir.path, e)
        })?;
    }

    // Check if something exists at the target (without following links)
    match fs::symlink_metadata(&target_path) {
        Ok(metadata) => {
            match platform::get_link_target(&target_path) {
                Ok(current_target) => {
                    if platform::paths_equal(&current_target, &skill_path) {
                        // Already linked correctly — nothing to do
                        Ok(())
                    } else {
                        // Wrong link — remove and recreate
                        platform::remove_link(&target_path)
                            .map_err(|e| format!("Failed to remove old link: {}", e))?;
                        platform::create_link(&skill_path, &target_path)
                            .map_err(|e| format!("Failed to create link: {}", e))?;
                        Ok(())
                    }
                }
                Err(_) => {
                    // Regular file or directory — remove and create link
                    let remove_result = if metadata.is_dir() {
                        fs::remove_dir_all(&target_path)
                    } else {
                        fs::remove_file(&target_path)
                    };
                    remove_result
                        .map_err(|e| format!("Failed to remove existing item: {}", e))?;
                    platform::create_link(&skill_path, &target_path)
                        .map_err(|e| format!("Failed to create link: {}", e))?;
                    Ok(())
                }
            }
        }
        Err(_) => {
            // Nothing at target — create link directly
            platform::create_link(&skill_path, &target_path)
                .map_err(|e| format!("Failed to create link: {}", e))?;
            Ok(())
        }
    }
}

/// Remove all links in a tool directory that point to skills in the shared
/// directory. Used when a user deletes a tool dir and chooses to also clean
/// up the links on disk.
///
/// Only links whose target's parent matches the shared dir are removed —
/// other entries (regular files, dirs, links to elsewhere) are left untouched.
#[tauri::command]
fn remove_tool_dir_links(tool_dir_name: String) -> Result<usize, String> {
    let config = load_config_internal();
    let shared_dir = PathBuf::from(&config.shared_dir);

    let tool_dir = config
        .tool_dirs
        .iter()
        .find(|td| td.name == tool_dir_name)
        .ok_or_else(|| format!("Unknown tool directory: {}", tool_dir_name))?;
    let tool_dir_path = PathBuf::from(&tool_dir.path);

    if !tool_dir_path.exists() {
        return Ok(0);
    }

    let entries = fs::read_dir(&tool_dir_path)
        .map_err(|e| format!("Failed to read tool directory '{}': {}", tool_dir_path.display(), e))?;

    let mut removed = 0usize;
    for entry in entries.flatten() {
        let entry_path = entry.path();
        // Only consider links
        if let Ok(target) = platform::get_link_target(&entry_path) {
            // Check if the link points to a skill in the shared dir
            // (target's parent should be the shared dir)
            if let Some(parent) = target.parent() {
                if platform::paths_equal(parent, &shared_dir) {
                    match platform::remove_link(&entry_path) {
                        Ok(()) => removed += 1,
                        Err(e) => eprintln!(
                            "Warning: failed to remove link '{}': {}",
                            entry.file_name().to_string_lossy(),
                            e
                        ),
                    }
                }
            }
        }
    }
    Ok(removed)
}

// ============================================================
//  Known Agent Registry & Detection
// ============================================================

/// Built-in registry of known agent skill directories.
///
/// The list lives in `known_agents.json` (same directory as this file) so
/// that adding a new default path only requires editing that file — no Rust
/// changes needed. It is embedded at compile time via `include_str!` and
/// parsed once, then cached.
///
/// Each entry: `name` (display/id) and `path` (relative path from the user's
/// home directory to the agent's `skills` dir). Detection checks whether the
/// **parent** of the skills dir exists (i.e. the agent is installed). The
/// `skills` subfolder itself may not exist yet — it will be created
/// automatically on first apply.
#[derive(Deserialize, Clone)]
struct KnownAgent {
    name: String,
    path: String,
}

/// Load the known-agent registry from `known_agents.json` (embedded at
/// compile time). Parsed lazily on first use and cached for the process
/// lifetime.
fn known_agents() -> &'static [KnownAgent] {
    static AGENTS: OnceLock<Vec<KnownAgent>> = OnceLock::new();
    AGENTS.get_or_init(|| {
        let raw = include_str!("known_agents.json");
        serde_json::from_str(raw).expect("Failed to parse embedded known_agents.json")
    })
}

/// Detect known agent skill directories that exist on this machine.
///
/// For each entry in `known_agents.json`, checks whether the **parent** of
/// the `skills` subfolder exists (meaning the agent is installed).
/// Returns the list of `ToolDirConfig` entries whose parent dirs exist.
#[tauri::command]
fn detect_known_agents() -> Vec<ToolDirConfig> {
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return Vec::new(),
    };
    let mut result = Vec::new();
    for agent in known_agents() {
        let skills_path = home.join(&agent.path);
        // Check parent directory (agent install dir) — the skills
        // subfolder may not exist yet and will be created on apply.
        if let Some(parent) = skills_path.parent() {
            if parent.exists() {
                result.push(ToolDirConfig {
                    name: agent.name.clone(),
                    path: native_path_str(&skills_path.to_string_lossy()),
                });
            }
        }
    }
    result
}

/// Check whether the config file exists on disk.
/// Used by the frontend to decide between onboarding and normal flow.
#[tauri::command]
fn config_file_exists() -> bool {
    get_config_path().exists()
}

/// Check whether a filesystem path exists (file or directory).
/// Used by the onboarding view for real-time directory hints.
#[tauri::command]
fn check_path_exists(path: String) -> bool {
    PathBuf::from(&path).exists()
}

/// Open a filesystem path in the OS file manager (Explorer on Windows,
/// Finder on macOS, xdg-open on Linux). Used by the skill detail view to
/// jump to a skill's folder.
///
/// `spawn()` is used instead of `status()` because `explorer.exe` returns
/// a non-zero exit code even on success, and we don't need to wait for it.
#[tauri::command]
fn open_path(path: String) -> Result<(), String> {
    let p = PathBuf::from(&path);
    if !p.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    #[cfg(target_os = "windows")]
    let cmd = "explorer.exe";
    #[cfg(target_os = "macos")]
    let cmd = "open";
    #[cfg(all(unix, not(target_os = "macos")))]
    let cmd = "xdg-open";

    std::process::Command::new(cmd)
        .arg(&path)
        .spawn()
        .map_err(|e| format!("Failed to open path '{}': {}", path, e))?;
    Ok(())
}

/// Get detailed information about a single tool directory.
///
/// Lists every skill in the shared directory along with whether it
/// is currently linked into this tool directory.
#[tauri::command]
fn get_tool_dir_detail(tool_dir_name: String) -> Result<ToolDirDetail, String> {
    let config = load_config_internal();
    let shared_dir = PathBuf::from(&config.shared_dir);
    if !shared_dir.exists() {
        return Err(format!(
            "Shared directory does not exist: {}",
            shared_dir.display()
        ));
    }

    let tool_dir = config
        .tool_dirs
        .iter()
        .find(|td| td.name == tool_dir_name)
        .ok_or_else(|| format!("Unknown tool directory: {}", tool_dir_name))?;

    let tool_dir_path = PathBuf::from(&tool_dir.path);
    let mut skills: Vec<SkillLinkStatus> = Vec::new();
    // Names of skills that exist in the central repo — used to avoid
    // listing the same skill twice as a "private" one below.
    let mut shared_names: std::collections::HashSet<String> = std::collections::HashSet::new();

    let entries = fs::read_dir(&shared_dir).map_err(|e| {
        format!(
            "Failed to read shared directory '{}': {}",
            shared_dir.display(),
            e
        )
    })?;

    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        shared_names.insert(name.clone());
        let skill_source = shared_dir.join(&name);
        let target = tool_dir_path.join(&name);
        let linked = platform::get_link_target(&target)
            .map(|t| platform::paths_equal(&t, &skill_source))
            .unwrap_or(false);
        skills.push(SkillLinkStatus { name, linked });
    }

    skills.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    // --- Private skills: real (non-link) directories inside this tool dir
    // that are not already present in the central repository. ---
    let mut private_skills: Vec<PrivateSkill> = Vec::new();
    if tool_dir_path.exists() {
        if let Ok(td_entries) = fs::read_dir(&tool_dir_path) {
            for entry in td_entries.flatten() {
                let path = entry.path();
                if !path.is_dir() {
                    continue;
                }
                // Skip any entry that is a link (those are shared skills
                // already covered by the `skills` list above).
                if platform::get_link_target(&path).is_ok() {
                    continue;
                }
                let name = entry.file_name().to_string_lossy().to_string();
                // Skip skills that already exist in the central repository.
                if shared_names.contains(&name) {
                    continue;
                }
                let description = parse_skill_description(&path);
                private_skills.push(PrivateSkill {
                    name,
                    path: path.to_string_lossy().to_string(),
                    description,
                });
            }
        }
    }
    private_skills.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    Ok(ToolDirDetail {
        name: tool_dir_name,
        path: tool_dir.path.clone(),
        skills,
        private_skills,
    })
}

/// Move a private skill (a real folder living directly in a tool
/// directory) into the central repository, then replace it in place with
/// a link pointing back at the repository copy.
///
/// Steps:
///   1. Validate the source is a real (non-link) directory in the tool dir.
///   2. Refuse if a skill of the same name already exists in the repo.
///   3. Copy the folder into the central repo, then remove the original.
///   4. Create a link from the tool dir back to the repo copy.
///
/// After this, the skill appears in the tool dir's "public" (linked) list
/// and is removed from its "private" list.
#[tauri::command]
fn sync_skill(tool_dir_name: String, skill_name: String) -> Result<(), String> {
    let config = load_config_internal();
    let shared_dir = PathBuf::from(&config.shared_dir);
    if !shared_dir.exists() {
        return Err(format!(
            "Central repository directory does not exist: {}",
            shared_dir.display()
        ));
    }

    let tool_dir = config
        .tool_dirs
        .iter()
        .find(|td| td.name == tool_dir_name)
        .ok_or_else(|| format!("Unknown tool directory: {}", tool_dir_name))?;
    let tool_dir_path = PathBuf::from(&tool_dir.path);

    let source = tool_dir_path.join(&skill_name);
    let dest = shared_dir.join(&skill_name);

    if !source.exists() {
        return Err(format!("Private skill not found: {}", skill_name));
    }
    // Safety: only move real folders. A link is already shared.
    if platform::get_link_target(&source).is_ok() {
        return Err(format!(
            "'{}' is already a link to the central repository; nothing to sync.",
            skill_name
        ));
    }
    if !source.is_dir() {
        return Err(format!("'{}' is not a directory; cannot sync.", skill_name));
    }
    if dest.exists() {
        return Err(format!(
            "A skill named '{}' already exists in the central repository.",
            skill_name
        ));
    }

    // Move = copy into the repo, then remove the original. Using copy+
    // remove (instead of a single rename) keeps this safe across
    // filesystems where a cross-device rename would fail.
    copy_dir_recursive(&source, &dest)
        .map_err(|e| format!("Failed to copy skill into central repository: {}", e))?;
    fs::remove_dir_all(&source)
        .map_err(|e| format!("Failed to remove original skill folder: {}", e))?;

    platform::create_link(&dest, &source)
        .map_err(|e| format!("Failed to create link after sync: {}", e))?;

    Ok(())
}

/// Recursively copy a directory tree from `src` to `dst` (which must not
/// already exist). Used by `sync_skill` to move a skill folder into the
/// central repository across any filesystem.
fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let entry_path = entry.path();
        let dest_path = dst.join(entry.file_name());
        if entry_path.is_dir() {
            copy_dir_recursive(&entry_path, &dest_path)?;
        } else {
            fs::copy(&entry_path, &dest_path)?;
        }
    }
    Ok(())
}

// ============================================================
//  App Entry Point
// ============================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            scan_skills,
            get_tool_dirs_info,
            apply_links,
            load_config,
            save_config,
            get_skill_detail,
            remove_link,
            add_link,
            delete_skill,
            remove_tool_dir_links,
            detect_known_agents,
            config_file_exists,
            check_path_exists,
            open_path,
            get_tool_dir_detail,
            sync_skill,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
