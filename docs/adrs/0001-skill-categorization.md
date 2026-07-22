# ADR 0001: Skill 分类（Categorization）

- **状态（Status）**: 已采纳（Accepted）
- **日期（Date）**: 2026-07-20
- **决策者（Deciders）**: 用户 + CodeBuddy（grill-with-docs / domain-modeling 会话）

## 背景（Context）

`Skill Link Manager` 主页（`src/App.tsx` 的 home 视图，`src/components/SkillCard.tsx`）
当前把所有 `SkillInfo[]` **平铺**在一个网格里，没有分组。随着共享仓库里的 skill
数量增长，用户希望按主题对 skill 进行分类，以便在主页上分组浏览。

核心约束：链接机制（`src-tauri/src/lib.rs`）要求 `sharedDir/<skillName>` 是直属子目录，
每个工具目录里的链接形如 `toolDir/<skillName>` → `sharedDir/<skillName>`。分类设计**绝对不能**
破坏这个扁平的链接模型。

## 决策（Decision）

采用 **方案 A —— 配置映射（config mapping）** 作为分类的"真相来源"：

- 在 `AppConfig`（`lib.rs` / `types.ts`）新增字段
  `categories: Record<skillName, categoryName>`（Rust: `HashMap<String, String>`）。
- 分类是**纯 UI 元数据**，不参与文件系统、不影响链接的创建/检测/删除。
- 一个 skill **最多属于 1 个**分类；无归属的 skill 归入隐式桶 **"未分类"（Uncategorized）**。
- 分类为**用户自定义、自由命名**：可在 UI 中新增 / 改名 / 删除。
  （分类的集合 = `categories` 映射中所有出现过的值。给某个 skill 赋一个新名字即"创建"该分类。）
- skill 的归类通过**每张 SkillCard 上的小分类选择器**完成（MVP），拖拽进区块作为后续增强。
- 分组**仅作用于主页**（可折叠的分类区块 + 数量统计 + 搜索过滤）；`ToolDirDetail` /
  `SkillDetail` 暂不动。

持久化复用已有的 `save_config` 命令，无需新增后端命令。`scan_skills` 不返回分类，
主页直接结合 `config.categories` 与 `skills` 数组在内存中分组。

## 被否决的备选（Considered Alternatives）

- **方案 B：在 `shared_dir` 下按分类建子文件夹**（`shared_dir/<分类>/<skill>`）。
  ❌ 会破坏核心链接模型（`toolDir/<name>` → `sharedDir/<name>`），让扫描与链接变复杂，
  并允许跨分类重名。需要重做链接逻辑，风险高，否决。
- **方案 C：把分类写进每个 skill 文件夹内**（`SKILL.md` 前置字段 / `skill.json`）。
  ❌ 解析不稳定；很多 skill 没有统一元数据格式；且会让分类"逃逸"到每个工具里。
  代价大于收益，否决。
- **多标签（many-to-many）**：更灵活但 UI 更重，MVP 不做，否决。

## 后果（Consequences）

**正向**
- 完全向后兼容：旧 `config.json` 缺 `categories` 字段时，经 `AppConfigPartial` /
  `Default` / `parse_config` 走默认值（空映射 → 全部"未分类"）。
- 不触碰链接文件系统模型，回归风险极低；后端仅需 4 处小改动。
- 分类可回退：清空映射即恢复原平铺布局。

**负向 / 待办**
- 分类集合是"值的集合"，空分类（无任何 skill）无法独立存在——MVP 接受。
- 删除 skill 时其分类条目会成为孤儿（`SkillDetail` 不更新 config）。无害，建议在
  `delete_skill` 前端回调中顺手清理（见实现计划，可选）。
- 重命名 / 删除分类需重写映射中所有对应条目。

## 实现要点（Implementation Notes）

后端（`src-tauri/src/lib.rs`）：
1. `AppConfig` 增加 `pub categories: HashMap<String, String>`，并加 `#[serde(default)]`。
2. `AppConfigPartial` 增加 `#[serde(default)] categories: Option<HashMap<String, String>>`。
3. `Default for AppConfig` 增加 `categories: HashMap::new()`。
4. `parse_config` 合并 `categories: partial.categories.unwrap_or(default.categories)`。

前端：
- `src/types.ts`：`AppConfig` 增加 `categories: Record<string, string>`。
- `src/i18n/translations.ts`：新增 `category` / `uncategorized` / `addCategory` /
  `categoryName` / `renameCategory` / `deleteCategory` / `confirmDeleteCategory` /
  `manageCategories` 等键（中英都要）。
- `src/App.tsx`：基于 `config.categories` 把 `skenned skills` 分组；渲染可折叠区块（含数量）；
  搜索过滤后再分组；提供"管理分类"入口；实现 `handleCategoryChange` /
  `handleAddCategory` / `handleRenameCategory` / `handleDeleteCategory`，均经 `save_config` 持久化。
- `src/components/SkillCard.tsx`：增加分类选择器（props：`category`、`categoryOptions`、
  `onCategoryChange`），可选"新建分类"项。

## 参考（References）

- `src-tauri/src/lib.rs` — `AppConfig` / `parse_config` / `save_config`
- `src/App.tsx` — home 视图与 config 状态
- `src/types.ts` — `AppConfig` 镜像
- `docs/glossary.md` — 领域术语

## 修订（Revision, 2026-07-20）

实现反馈后调整数据模型，以支持「独立建分类」与「拖拽/上下调整顺序」：

- 新增 `category_order: string[]`（`AppConfig` / `types.ts`），作为**用户显式维护的有序分类列表**。
  - 它驱动主页分组顺序，并允许分类在「尚未挂载任何 skill」时独立存在（解决原模型
    "分类集合 = 赋值映射中的值" 无法独立建空分类的问题）。
  - 原 `categories: Record<skillName, categoryName>` 仍只负责「skill → 分类」的赋值。
- 「新建分类」入口从每个 SkillCard 的下拉移除，统一收口到「管理分类」弹窗内的输入框
  （修复原生 `prompt()` 的丑陋体验）。
- 「管理分类」弹窗新增：输入框 + 添加按钮、每条分类的 ↑/↓ 排序按钮、改名（内联）、删除。
- `categoryNames`（主页与卡片下拉的可选项）由 `category_order` 推导，并补入仍在赋值中
  但意外缺失于 order 的分类，避免孤儿。

向后兼容：`category_order` 缺字段时默认空数组；旧数据无 order 时仍可正常显示与归类。
