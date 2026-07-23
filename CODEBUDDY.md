# CODEBUDDY.md

This file provides guidance to CodeBuddy Code when working with code in this repository.

## What this project is

**Skill Link Manager** is a Tauri 2 desktop app (Windows, macOS, Linux) that keeps "skills" (AI agent instruction folders) synchronized across many AI coding tools. The core idea:

- There is one **shared skills directory** (default `~/skills`); each subfolder is one skill.
- Each AI tool (opencode, codebuddy, claude, cursor, etc.) keeps its skills in `<tool>/.config/.../skills` or `<tool>/.codebuddy/skills`, etc.
- The app creates a **link** in each tool's `skills/<name>` folder pointing at the shared `skills/<name>` folder. A skill is edited once in the shared dir and appears linked in every tool.

The link type is chosen per platform at compile time via `#[cfg(...)]` (see the `platform` module in `lib.rs`): **directory junctions** on Windows (no admin/Developer Mode needed), **symbolic links** on macOS and Linux. Tauri's `bundle.targets: "all"` packages the build for the host OS (msi/nsis on Windows, dmg/app on macOS, deb/AppImage on Linux) with no extra configuration.

## Architecture

It is a Tauri 2 app with two sides that communicate exclusively through Tauri's IPC (`invoke`):

**Frontend — `src/` (React 18 + TypeScript + Vite, styled with Tailwind)**
- `src/main.tsx` → mounts `<App>` inside `<I18nProvider>`.
- `src/App.tsx` — top-level state machine. Holds the current page (`home | detail | settings | toolDirDetail | onboarding`), the loaded `config`, and the scanned `skills`. On first mount it calls `config_file_exists`; if no config, it shows onboarding instead of loading. All backend data goes through `invoke(...)` from `@tauri-apps/api/core`.
- `src/components/` — `SkillCard` (home grid), `SkillDetail` (per-skill link toggles across tool dirs), `SettingsPage` (edit shared dir + tool dirs), `ToolDirDetail` (per-tool-dir list of all skills), `Onboarding` (first-run setup with agent auto-detection).
- `src/types.ts` — TypeScript mirrors of the Rust structs. **Keep these in sync with `src-tauri/src/lib.rs`.**
- `src/i18n/` — `translations.ts` defines a `Language` (`"zh" | "en"`) and a `TranslationKey` union; `I18nContext.tsx` provides `t(key, params?)`. New UI strings must be added to the `TranslationKey` union AND both `zh`/`en` maps, or `t()` will fail type-check.

**Backend — `src-tauri/src/lib.rs` (Rust)**
- All logic lives in this single file. It defines the serde structs (also in `types.ts`), config load/save, skill description parsing, and the Tauri commands.
- `fn run()` at the bottom registers every command via `tauri::generate_handler!`. **Any new `#[tauri::command]` must be added to that list or it is unreachable from the frontend.**
- Config persistence: `<config_dir>/skill-link-manager/config.json` (`get_config_path`, where `config_dir` is `%APPDATA%` on Windows, `~/Library/Application Support` on macOS, `~/.config` on Linux). `load_config` is backward-compatible (missing fields fall back to `AppConfig::default()`, default `shared_dir = ~/skills`).
- Link status is computed by checking whether a link exists at `toolDir/<skillName>` whose target equals `sharedDir/<skillName>`. All link operations go through the `platform` module: `create_link`, `get_link_target`, `remove_link`, `paths_equal`. Path comparison is case-insensitive on Windows and macOS, case-sensitive on Linux; separators/normalization are platform-specific (see `platform::normalize`).

**Tauri commands (the backend API):** `config_file_exists`, `load_config`, `save_config`, `scan_skills`, `get_skill_detail`, `get_tool_dirs_info`, `get_tool_dir_detail`, `detect_known_agents`, `check_path_exists`, `apply_links`, `add_link`, `remove_link`. The frontend calls them by these exact names via `invoke`.

**Standalone scripts (pre-dated the app, kept for reference/ad-hoc use):**
- `link-skills.ps1` + `run.bat` — PowerShell that reproduces the `apply_links` logic outside the app.
- `generate-icon.cjs` — Node script that writes the vector `src-tauri/icons/source.svg` (accent tile + white line "link" brand mark); then regenerate all platform icons with `npx tauri icon src-tauri/icons/source.svg`.

## Commands

```bash
npm install                                   # install deps (frontend + @tauri-apps/cli)

# Frontend type-check + production build (tsc is strict: noUnusedLocals/noUnusedParameters)
npm run build                                 # tsc && vite build  → outputs to dist/

# Develop the full desktop app (starts Vite dev server on :5173, then the Tauri webview)
npm run tauri dev

# Build the bundled installer / app (runs npm run build, then compiles Rust + bundles)
npm run tauri build

# Other Tauri CLI subcommands (icon, info, conf, etc.)
npm run tauri <subcommand>

npm run preview                               # preview the built frontend only
```

There is **no test suite and no linter** configured. Type safety is the only gate, enforced by `tsc` (run via `npm run build`). To type-check without emitting: `npx tsc --noEmit` (uses `tsconfig.json`, which `include`s `src`). Rust compiles through the `tauri` CLI.

## Important notes when editing

- **Frontend↔backend contract:** the `invoke("command_name", { arg })` call in a component must match a Rust `#[tauri::command] fn command_name(arg)` signature, and the JSON payload field names must match exactly. There is no shared IDL — mismatches surface only at runtime.
- When you add/remove/rename a Tauri command, update both `lib.rs` (the function + `generate_handler!` list) and the corresponding `invoke` call site.
- When you add UI text, update `TranslationKey` in `src/i18n/translations.ts` plus both `zh` and `en` dictionaries; `t()` is keyed by that union type.
- Keep `src/types.ts` structs aligned with the serde structs in `lib.rs` (field names/types must match what the commands return).
- Config path is `<config_dir>/skill-link-manager/config.json` (`%APPDATA%` on Windows, `~/Library/Application Support` on macOS, `~/.config` on Linux); deleting it resets the app to first-run onboarding.
- `vite.config.ts` sets `strictPort: true` on 5173 and ignores `src-tauri/**` in its file watcher, so frontend HMR never rebuilds Rust.
