/**
 * Derive a tool directory name from a filesystem path.
 *
 * Strategy:
 * - Take the last path segment (basename), handling both `/` and `\`.
 * - If the basename is "skills" (case-insensitive), use the parent segment
 *   instead — this matches the common pattern `<agent>/skills` where the
 *   agent name is the useful identifier (e.g. `.codebuddy/skills` → `codebuddy`).
 * - Strip a leading dot (e.g. `.codebuddy` → `codebuddy`) so the generated
 *   name doesn't start with a dot.
 */
export function deriveNameFromPath(path: string): string {
  if (!path) return "";
  // Split on runs of / or \ and drop empty segments
  const parts = path.split(/[\\/]+/).filter(Boolean);
  if (parts.length === 0) return "";

  let name = parts[parts.length - 1];
  // If the basename is "skills", use the parent segment so we get the
  // tool name rather than the literal word "skills".
  if (name.toLowerCase() === "skills" && parts.length >= 2) {
    name = parts[parts.length - 2];
  }

  // Strip leading dots (e.g. ".codebuddy" → "codebuddy")
  name = name.replace(/^\.+/, "");

  return name;
}

/**
 * Detect the host OS from the webview's `navigator` info.
 *
 * The Tauri app is bundled per-platform (`bundle.targets: "all"`), so the
 * webview's OS always matches the backend's OS. This mirrors the Rust
 * `platform::paths_equal` rules: case-insensitive on Windows and macOS,
 * case-sensitive on Linux.
 */
function getOsKind(): "windows" | "macos" | "linux" {
  if (typeof navigator !== "undefined") {
    const platform = navigator.platform || "";
    const ua = navigator.userAgent || "";
    if (platform.indexOf("Win") !== -1 || ua.indexOf("Windows") !== -1) return "windows";
    if (platform.indexOf("Mac") !== -1 || ua.indexOf("Mac") !== -1) return "macos";
    if (platform.indexOf("Linux") !== -1 || ua.indexOf("Linux") !== -1) return "linux";
  }
  return "linux";
}

/**
 * Normalise a path for equality comparison, mirroring the Rust
 * `platform::normalize` used by `paths_equal`:
 * - separators collapsed / normalised
 * - Windows `\\?\` long-path prefix stripped
 * - trailing separators trimmed
 * - lower-cased on Windows and macOS (case-insensitive filesystems)
 */
export function normalizePathForCompare(path: string): string {
  let s = (path ?? "").trim();
  // Collapse runs of / or \ to a single /
  s = s.replace(/[\\/]+/g, "/");
  // Strip Windows long-path prefix \\?\
  s = s.replace(/^\\\\\\\?\\/, "");
  // Trim trailing separators
  s = s.replace(/\/+$/, "");
  if (getOsKind() !== "linux") {
    s = s.toLowerCase();
  }
  return s;
}

/**
 * Compare two filesystem paths for equality, matching the backend's
 * `platform::paths_equal` semantics (case-insensitive on Windows/macOS).
 */
export function pathsEqual(a: string, b: string): boolean {
  return normalizePathForCompare(a) === normalizePathForCompare(b);
}
