# 术语表（Glossary）

本文件定义 `Skill Link Manager` 项目中的领域术语，供 ADR 与代码阅读参考。

## Skill（技能）
一个 AI agent 指令文件夹，是系统管理的**最小单元**。
在共享仓库中表现为 `sharedDir/<skillName>` 这样一个子目录；
在工具目录中表现为指向该目录的一个链接（junction / symlink）。
对应类型：`SkillInfo`（`types.ts` / `lib.rs`）。

## Category（分类）
用户为 skill 打的**单一主题标签**，仅作为 UI 元数据存在。
一个 skill 最多归属 1 个分类；来源见 `AppConfig.categories`。
**不是**文件系统结构，不参与链接。

## Uncategorized（未分类）
隐式桶。凡在 `categories` 映射中没有对应条目的 skill，都归入此处。
无需显式存储，由前端在分组时推导。

## Central Repository / Shared Directory（中央仓库 / 共享目录）
由 `AppConfig.shared_dir` 指定的目录（默认 `~/skills`）。
每个子目录即一个 skill。是链接的**源（source）**。
分类映射就存放在此处对应的 `config.json` 中（应用配置层级，而非目录内）。

## Tool Directory（工具目录）
某个 AI 工具存放 skills 的目录（如 opencode / codebuddy / claude 的 skills 目录），
在 `AppConfig.tool_dirs` 中配置。是链接的**目标（target）**。

## Link（链接）
`toolDir/<skillName>` → `sharedDir/<skillName>` 的映射。
Windows 用 junction，macOS / Linux 用符号链接（见 `platform` 模块）。
分类功能**不修改**链接的任何行为。

## Public Skill（公共 Skill）
位于中央仓库、可被链接到各工具目录的 skill（相对"私有 skill"而言）。

## Private Skill（私有 Skill）
直接存在于某个工具目录内、尚未同步到中央仓库的真实文件夹。
通过 `sync_skill` 命令搬入中央仓库并就地替换为链接。

## Config（应用配置）
`AppConfig`，持久化于 `<config_dir>/skill-link-manager/config.json`。
新增的 `categories` 字段即本 ADR 的主题。

## 关系速览

```
AppConfig
 ├─ shared_dir ──────────► Central Repository (skills 源)
 ├─ tool_dirs[] ─────────► Tool Directory   (skills 目标)
 └─ categories[] ────────► Skill ──(0|1)──► Category
                               │
                               └─ 链接 ──► Tool Directory
```
