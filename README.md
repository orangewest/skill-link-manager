# Skill Link Manager（技能链接管理器）

一个基于 Tauri 2 开发的桌面应用（支持 Windows、macOS、Linux），用于将「技能」（AI 智能体的指令文件夹）在多个 AI 编码工具之间保持同步。

## 核心思路

- 存在一个**共享技能目录**（默认 `~/skills`），每个子文件夹就是一个技能。
- 每个 AI 工具（opencode、codebuddy、claude、cursor 等）都会在自身的配置目录下存放自己的技能。
- 本应用在各个工具的 `skills/<名称>` 目录中创建一个**链接**，指向共享目录里的 `skills/<名称>` 文件夹。只需在共享目录中编辑一次技能，它就会在所有工具中以链接的形式出现。

链接类型在编译时按平台自动选择：

- **Windows** → 目录联接（junction），无需管理员权限或开发者模式
- **macOS 与 Linux** → 符号链接（symlink）

## 技术栈

- **前端：** React 18 + TypeScript + Vite，使用 Tailwind CSS 美化样式
- **后端：** 基于 Tauri 2 的 Rust
- **打包：** Tauri `bundle.targets: "all"`（Windows 生成 msi/nsis，macOS 生成 dmg/app，Linux 生成 deb/AppImage）

## 项目结构

```
skill-link-manager/
├── src/                 # React + TypeScript 前端
│   ├── App.tsx          # 顶层页面与状态机
│   ├── components/      # SkillCard、SkillDetail、SettingsPage、ToolDirDetail、Onboarding
│   ├── i18n/            # 中文 / 英文翻译
│   ├── types.ts         # Rust 结构体的 TypeScript 镜像
│   └── main.tsx         # 入口文件
├── src-tauri/           # Rust 后端 + Tauri 配置
│   ├── src/lib.rs       # 全部后端逻辑与 Tauri 命令
│   ├── Cargo.toml
│   └── tauri.conf.json
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

前端与后端仅通过 Tauri 的 IPC（`invoke`）进行通信。二者之间没有共享的接口定义文件，因此需要手动保持命令名与 `types.ts` 的同步。

## 环境要求

- [Node.js](https://nodejs.org/)（用于前端工具链）
- [Rust](https://www.rust-lang.org/tools/install)（稳定版，并安装对应平台的目标）
- Tauri 2 的平台构建依赖（参见 [Tauri 环境准备指南](https://tauri.app/start/prerequisites/)）

## 快速开始

```bash
# 安装前端依赖
npm install

# 运行完整桌面应用（Vite 开发服务器监听 :5173 + Tauri 窗口）
npm run tauri dev

# 仅进行类型检查并构建前端
npm run build

# 构建打包后的安装程序 / 应用
npm run tauri build

# 仅预览已构建的前端
npm run preview
```

> 类型安全是本项目的唯一校验关卡，由 `tsc` 负责（`npm run build` 执行 `tsc && vite build`）。本项目未配置测试套件或代码检查工具。

## 配置说明

配置保存在 `<配置目录>/skill-link-manager/config.json`：

- Windows：`%APPDATA%`
- macOS：`~/Library/Application Support`
- Linux：`~/.config`

删除该文件即可将应用重置为首次启动的引导流程。默认的 `shared_dir` 为 `~/skills`。

## 独立脚本

这些脚本早于本应用存在，用于在特定场景下复现其部分逻辑：

- `link-skills.ps1` + `run.bat` —— 在应用之外，用 PowerShell 复现 `apply_links` 的逻辑。
- `generate-icon.cjs` —— 生成 `src-tauri/icons/source.png`；执行 `npx tauri icon src-tauri/icons/source.png` 可重新生成所有平台的图标。
