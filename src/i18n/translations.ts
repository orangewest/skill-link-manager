export type Language = "zh" | "en";

export type TranslationKey =
  | "appTitle"
  | "appSubtitle"
  | "settings"
  | "back"
  | "home"
  | "searchPlaceholder"
  | "noSkills"
  | "noSearchResults"
  | "unlinked"
  | "linkedCount"
  | "applyToAll"
  | "addLink"
  | "removeLink"
  | "linkedStatus"
  | "unlinkedStatus"
  | "settingsTitle"
  | "sharedDirConfig"
  | "sharedDirPlaceholder"
  | "save"
  | "saved"
  | "toolDirManagement"
  | "toolDirName"
  | "toolDirPath"
  | "edit"
  | "delete"
  | "add"
  | "cancel"
  | "error"
  | "loading"
  | "loadingConfig"
  | "confirmDelete"
  | "applying"
  | "linkAll"
  | "unlinkAll"
  | "clickToViewDetail"
  | "onboardingTitle"
  | "onboardingWelcome"
  | "onboardingSharedDirHint"
  | "dirExists"
  | "dirNotExists"
  | "onboardingDetected"
  | "onboardingNoAgents"
  | "onboardingManualAdd"
  | "onboardingComplete"
  | "onboardingFinishing"
  | "browse"
  | "openFolder"
  | "theme"
  | "themeLight"
  | "themeDark"
  | "themeSystem"
  | "confirmDeleteLinks"
  | "linksRemoved"
  | "confirm"
  | "deleteLinks"
  | "keepLinks"
  | "pathExists"
  | "refresh"
  | "deleteSkill"
  | "deleteSkillConfirmBody"
  | "continueButton"
  | "deleteSkillFinalTitle"
  | "deleteSkillFinalBody"
  | "deleting"
  | "deleteSkillSuccess"
  | "publicSkills"
  | "privateSkills"
  | "privateSkillsHint"
  | "syncSkill"
  | "syncing"
  | "searchInToolDir"
  | "noPrivateSkills"
  | "noPublicSkills"
  | "syncSuccess"
  | "alreadyInRepo"
  | "notPrivateSkill"
  | "redetectAgents"
  | "redetecting"
  | "redetectAdded"
  | "redetectNoNew"
  | "redetectTitle"
  | "redetectSelectHint"
  | "addSelected"
  | "redetectAddedNone"
  | "category"
  | "uncategorized"
  | "manageCategories"
  | "addCategory"
  | "categoryName"
  | "renameCategory"
  | "deleteCategory"
  | "confirmDeleteCategory"
  | "createCategoryHint"
  | "noCategories"
  | "dragToReorder"
  | "dragToReorderHint"
  | "rename"
  | "addSkillToCategory"
  | "skillsInCategory"
  | "noSkillsInCategory"
  | "searchSkills"
  | "selectedCount"
  | "done"
  | "removeFromCategory"
  | "categoryMembers"
  | "showCategorized"
  | "hideCategorized"
  | "inCategory"
  | "selectAll"
  | "selectNone"
  | "languageSwitch"
  | "categories"
  | "allSkills";

export const translations: Record<Language, Record<TranslationKey, string>> = {
  zh: {
    appTitle: "Skill Link Manager",
    appSubtitle: "\u7ba1\u7406\u8de8\u5de5\u5177\u76ee\u5f55\u7684 Skill \u94fe\u63a5",
    settings: "\u8bbe\u7f6e",
    back: "\u8fd4\u56de",
    home: "\u9996\u9875",
    searchPlaceholder: "\u641c\u7d22 Skill...",
    noSkills: "\u4e2d\u592e\u4ed3\u5e93\u76ee\u5f55\u4e2d\u6ca1\u6709\u627e\u5230 Skill\u3002",
    noSearchResults: "\u6ca1\u6709\u5339\u914d\u7684 Skill\u3002",
    unlinked: "\u672a\u94fe\u63a5",
    linkedCount: "{linked}/{total} \u5df2\u94fe\u63a5",
    applyToAll: "\u5e94\u7528\u5230\u5168\u90e8",
    addLink: "\u6dfb\u52a0\u94fe\u63a5",
    removeLink: "\u79fb\u9664\u94fe\u63a5",
    linkedStatus: "\u5df2\u94fe\u63a5",
    unlinkedStatus: "\u672a\u94fe\u63a5",
    settingsTitle: "\u8bbe\u7f6e",
    sharedDirConfig: "\u4e2d\u592e\u4ed3\u5e93\u76ee\u5f55",
    sharedDirPlaceholder: "\u8f93\u5165\u4e2d\u592e\u4ed3\u5e93\u76ee\u5f55\u8def\u5f84",
    save: "\u4fdd\u5b58",
    saved: "\u5df2\u4fdd\u5b58",
    toolDirManagement: "\u5de5\u5177\u76ee\u5f55\u7ba1\u7406",
    toolDirName: "\u540d\u79f0",
    toolDirPath: "\u8def\u5f84",
    edit: "\u7f16\u8f91",
    delete: "\u5220\u9664",
    add: "\u6dfb\u52a0",
    cancel: "\u53d6\u6d88",
    error: "\u9519\u8bef",
    loading: "\u52a0\u8f7d\u4e2d...",
    loadingConfig: "\u6b63\u5728\u52a0\u8f7d Skill \u548c\u914d\u7f6e...",
    confirmDelete: "\u786e\u5b9a\u8981\u5220\u9664\u6b64\u5de5\u5177\u76ee\u5f55\u5417\uff1f",
    applying: "\u5e94\u7528\u4e2d...",
    linkAll: "\u5168\u90e8\u94fe\u63a5",
    unlinkAll: "\u5168\u90e8\u53d6\u6d88\u94fe\u63a5",
    clickToViewDetail: "\u70b9\u51fb\u67e5\u770b\u8be6\u60c5",
    onboardingTitle: "\u521d\u59cb\u8bbe\u7f6e",
    onboardingWelcome: "\u6b22\u8fce\u4f7f\u7528 Skill Link Manager\uff0c\u8bf7\u5b8c\u6210\u4ee5\u4e0b\u521d\u59cb\u914d\u7f6e\u3002",
    onboardingSharedDirHint: "\u8be5\u76ee\u5f55\u4f5c\u4e3a\u4e2d\u592e\u4ed3\u5e93\uff0c\u7528\u4e8e\u5b58\u653e\u6240\u6709\u5171\u4eab\u7684 Skill \u6587\u4ef6\u5939\u3002",
    dirExists: "\u76ee\u5f55\u5df2\u5b58\u5728",
    dirNotExists: "\u76ee\u5f55\u4e0d\u5b58\u5728\uff08\u5e94\u7528\u65f6\u5c06\u81ea\u52a8\u521b\u5efa\uff09",
    onboardingDetected: "\u68c0\u6d4b\u5230\u4ee5\u4e0b\u5df2\u5b89\u88c5\u7684\u5de5\u5177\uff0c\u9884\u52fe\u9009\u53ef\u53d6\u6d88\u52fe\u9009\uff1a",
    onboardingNoAgents: "\u672a\u68c0\u6d4b\u5230\u5df2\u5b89\u88c5\u7684\u5de5\u5177\uff0c\u8bf7\u624b\u52a8\u6dfb\u52a0\u5de5\u5177\u76ee\u5f55\u3002",
    onboardingManualAdd: "\u624b\u52a8\u6dfb\u52a0\u5de5\u5177\u76ee\u5f55",
    onboardingComplete: "\u5b8c\u6210",
    onboardingFinishing: "\u4fdd\u5b58\u4e2d...",
    browse: "\u9009\u62e9\u76ee\u5f55",
    openFolder: "\u6253\u5f00\u76ee\u5f55",
    theme: "\u4e3b\u9898",
    themeLight: "\u65e5\u95f4\u6a21\u5f0f",
    themeDark: "\u591c\u95f4\u6a21\u5f0f",
    themeSystem: "\u8ddf\u968f\u7cfb\u7edf",
    confirmDeleteLinks: "\u662f\u5426\u540c\u65f6\u5220\u9664\u8be5\u76ee\u5f55\u4e0b\u5df2\u521b\u5efa\u7684\u94fe\u63a5\uff1f",
    linksRemoved: "\u5df2\u5220\u9664 {count} \u4e2a\u94fe\u63a5",
    confirm: "\u786e\u8ba4",
    deleteLinks: "\u5220\u9664\u94fe\u63a5",
    keepLinks: "\u4fdd\u7559\u94fe\u63a5",
    pathExists: "\u8be5\u8def\u5f84\u5df2\u5b58\u5728",
    refresh: "\u5237\u65b0",
    deleteSkill: "\u5220\u9664 Skill",
    deleteSkillConfirmBody: "\u6b64\u64cd\u4f5c\u5c06\u89e3\u9664\u8be5 Skill \u5728\u6240\u6709\u5de5\u5177\u76ee\u5f55\u4e2d\u7684\u94fe\u63a5\uff0c\u5e76\u6c38\u4e45\u5220\u9664\u4e2d\u592e\u4ed3\u5e93\u76ee\u5f55\u4e0b\u7684 Skill \u6587\u4ef6\u5939\u3002\u6b64\u64cd\u4f5c\u4e0d\u53ef\u64a4\u9500\u3002",
    continueButton: "\u7ee7\u7eed",
    deleteSkillFinalTitle: "\u786e\u8ba4\u5220\u9664",
    deleteSkillFinalBody: "\u8bf7\u8f93\u5165 Skill \u540d\u79f0\u4ee5\u786e\u8ba4\u6c38\u4e45\u5220\u9664\uff1a",
    deleting: "\u5220\u9664\u4e2d...",
    deleteSkillSuccess: "\u5df2\u5220\u9664 Skill '{name}'\uff0c\u5e76\u89e3\u9664 {count} \u4e2a\u94fe\u63a5",
    publicSkills: "\u516c\u5171 Skill",
    privateSkills: "\u79c1\u6709 Skill",
    privateSkillsHint: "\u672c\u76ee\u5f55\u72ec\u6709\u7684\u3001\u5c1a\u672a\u540c\u6b65\u5230\u4e2d\u592e\u4ed3\u5e93\u7684 Skill\u3002",
    syncSkill: "\u540c\u6b65\u5230\u4e2d\u592e\u4ed3\u5e93",
    syncing: "\u540c\u6b65\u4e2d...",
    searchInToolDir: "\u641c\u7d22\u672c\u76ee\u5f55\u7684 Skill...",
    noPrivateSkills: "\u6ca1\u6709\u79c1\u6709 Skill\u3002",
    noPublicSkills: "\u4e2d\u592e\u4ed3\u5e93\u4e2d\u6ca1\u6709\u53ef\u94fe\u63a5\u7684 Skill\u3002",
    syncSuccess: "\u5df2\u5c06 '{name}' \u540c\u6b65\u5230\u4e2d\u592e\u4ed3\u5e93",
    alreadyInRepo: "\u4e2d\u592e\u4ed3\u5e93\u4e2d\u5df2\u5b58\u5728\u540c\u540d Skill",
    notPrivateSkill: "\u8be5 Skill \u4e0d\u662f\u79c1\u6709 Skill\uff0c\u65e0\u9700\u540c\u6b65",
    redetectAgents: "\u91cd\u65b0\u68c0\u6d4b",
    redetecting: "\u68c0\u6d4b\u4e2d...",
    redetectAdded: "\u68c0\u6d4b\u5230 {count} \u4e2a\u65b0\u5de5\u5177\u5e76\u6dfb\u52a0",
    redetectNoNew: "\u6ca1\u6709\u68c0\u6d4b\u5230\u65b0\u7684 agent \u76ee\u5f55",
    redetectTitle: "\u68c0\u6d4b\u5230\u672a\u6dfb\u52a0\u7684 agent \u76ee\u5f55",
    redetectSelectHint: "\u52fe\u9009\u8981\u6dfb\u52a0\u7684\u76ee\u5f55\uff0c\u7136\u540e\u70b9\u51fb\u4fdd\u5b58",
    addSelected: "\u6dfb\u52a0\u9009\u4e2d",
    redetectAddedNone: "\u672a\u6dfb\u52a0\u4efb\u4f55\u76ee\u5f55",
    category: "\u5206\u7c7b",
    uncategorized: "\u672a\u5206\u7c7b",
    manageCategories: "\u7ba1\u7406\u5206\u7c7b",
    addCategory: "\u65b0\u589e\u5206\u7c7b",
    categoryName: "\u5206\u7c7b\u540d\u79f0",
    renameCategory: "\u91cd\u547d\u540d\u5206\u7c7b",
    deleteCategory: "\u5220\u9664\u5206\u7c7b",
    confirmDeleteCategory: "\u5220\u9664\u8be5\u5206\u7c7b\u540e\uff0c\u5176\u4e0b\u7684 skill \u5c06\u5f52\u5165\u300c\u672a\u5206\u7c7b\u300d\u3002\u662f\u5426\u7ee7\u7eed\uff1f",
    createCategoryHint: "\u70b9\u51fb\u300c\u65b0\u589e\u5206\u7c7b\u300d\uff0c\u5728\u5f39\u51fa\u7684\u5bf9\u8bdd\u6846\u4e2d\u8f93\u5165\u540d\u79f0\u5373\u53ef\u521b\u5efa\u3002",
    noCategories: "\u8fd8\u6ca1\u6709\u5206\u7c7b\uff0c\u70b9\u51fb\u4e0a\u65b9\u7684\u300c\u65b0\u589e\u5206\u7c7b\u300d\u5373\u53ef\u521b\u5efa\u3002",
    dragToReorder: "\u62d6\u52a8\u6392\u5e8f",
    dragToReorderHint: "\u62d6\u52a8\u6bcf\u4e2a\u5206\u7c7b\u5de6\u4fa7\u7684\u22ee\u22ee \u53ef\u8c03\u6574\u987a\u5e8f\u3002",
    rename: "\u91cd\u547d\u540d",
    addSkillToCategory: "\u6dfb\u52a0 Skill",
    skillsInCategory: "\u8be5\u5206\u7c7b\u4e0b\u7684 Skill",
    noSkillsInCategory: "\u8be5\u5206\u7c7b\u4e0b\u8fd8\u6ca1\u6709 Skill\u3002",
    searchSkills: "\u641c\u7d22 Skill...",
    selectedCount: "\u5df2\u9009\u62e9 {count} \u4e2a",
    done: "\u5b8c\u6210",
    removeFromCategory: "\u79fb\u51fa\u8be5\u5206\u7c7b",
    categoryMembers: "\u7ba1\u7406\u300c{name}\u300d\u5206\u7c7b\u4e0b\u7684 Skill",
    showCategorized: "\u663e\u793a\u5df2\u5206\u7c7b\u7684 Skill",
    hideCategorized: "\u9690\u85cf\u5df2\u5206\u7c7b\u7684 Skill",
    inCategory: "\u5df2\u5728\u300c{name}\u300d",
    selectAll: "\u5168\u9009",
    selectNone: "\u5168\u4e0d\u9009",
    languageSwitch: "\u5207\u6362\u8bed\u8a00",
    categories: "\u5206\u7c7b",
    allSkills: "\u5168\u90e8 Skill",
  },
  en: {
    appTitle: "Skill Link Manager",
    appSubtitle: "Manage skill links across tool directories",
    settings: "Settings",
    back: "Back",
    home: "Home",
    searchPlaceholder: "Search skills...",
    noSkills: "No skills found in the central repository directory.",
    noSearchResults: "No skills match your search.",
    unlinked: "unlinked",
    linkedCount: "{linked}/{total} linked",
    applyToAll: "Apply to All",
    addLink: "Add Link",
    removeLink: "Remove Link",
    linkedStatus: "Linked",
    unlinkedStatus: "Not Linked",
    settingsTitle: "Settings",
    sharedDirConfig: "Central Repository Directory",
    sharedDirPlaceholder: "Enter central repository directory path",
    save: "Save",
    saved: "Saved",
    toolDirManagement: "Tool Directory Management",
    toolDirName: "Name",
    toolDirPath: "Path",
    edit: "Edit",
    delete: "Delete",
    add: "Add",
    cancel: "Cancel",
    error: "Error",
    loading: "Loading...",
    loadingConfig: "Loading skills and configuration...",
    confirmDelete: "Are you sure you want to delete this tool directory?",
    applying: "Applying...",
    linkAll: "Link All",
    unlinkAll: "Unlink All",
    clickToViewDetail: "Click to view detail",
    onboardingTitle: "Initial Setup",
    onboardingWelcome: "Welcome to Skill Link Manager. Please complete the initial setup below.",
    onboardingSharedDirHint: "This directory acts as the central repository storing all shared skill folders.",
    dirExists: "Directory exists",
    dirNotExists: "Directory does not exist (will be created on apply)",
    onboardingDetected: "Detected the following installed tools (pre-selected, you can uncheck):",
    onboardingNoAgents: "No installed tools detected. Please add tool directories manually.",
    onboardingManualAdd: "Add tool directory manually",
    onboardingComplete: "Complete",
    onboardingFinishing: "Saving...",
    browse: "Browse",
    openFolder: "Open Folder",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    confirmDeleteLinks: "Also delete the created links in this directory?",
    linksRemoved: "Removed {count} link(s)",
    confirm: "Confirm",
    deleteLinks: "Delete Links",
    keepLinks: "Keep Links",
    pathExists: "Path already exists",
    refresh: "Refresh",
    deleteSkill: "Delete Skill",
    deleteSkillConfirmBody: "This will unlink the skill from all tool directories and permanently delete its folder in the central repository directory. This action cannot be undone.",
    continueButton: "Continue",
    deleteSkillFinalTitle: "Confirm Deletion",
    deleteSkillFinalBody: "Type the skill name to confirm permanent deletion:",
    deleting: "Deleting...",
    deleteSkillSuccess: "Deleted skill '{name}' and removed {count} link(s)",
    publicSkills: "Public Skills",
    privateSkills: "Private Skills",
    privateSkillsHint: "Skills unique to this directory that are not yet synced to the central repository.",
    syncSkill: "Sync to Repository",
    syncing: "Syncing...",
    searchInToolDir: "Search skills in this directory...",
    noPrivateSkills: "No private skills.",
    noPublicSkills: "No linkable skills in the central repository.",
    syncSuccess: "Synced '{name}' to the central repository",
    alreadyInRepo: "A skill with the same name already exists in the central repository",
    notPrivateSkill: "This skill is not private; no sync needed",
    redetectAgents: "Re-detect",
    redetecting: "Detecting...",
    redetectAdded: "Detected and added {count} new agent(s)",
    redetectNoNew: "No new agent directories detected",
    redetectTitle: "Detected agent directories not yet added",
    redetectSelectHint: "Check the directories to add, then click Save.",
    addSelected: "Add Selected",
    redetectAddedNone: "No directories were added",
    category: "Category",
    uncategorized: "Uncategorized",
    manageCategories: "Manage Categories",
    addCategory: "Add Category",
    categoryName: "Category name",
    renameCategory: "Rename Category",
    deleteCategory: "Delete Category",
    confirmDeleteCategory: "After deleting this category, its skills will become \"Uncategorized\". Continue?",
    createCategoryHint: "Click \"Add Category\" and type a name in the dialog to create one.",
    noCategories: "No categories yet. Click \"Add Category\" above to create one.",
    dragToReorder: "Drag to reorder",
    dragToReorderHint: "Drag the ⋮⋮ handle on the left of each category to reorder.",
    rename: "Rename",
    addSkillToCategory: "Add Skill",
    skillsInCategory: "Skills in this category",
    noSkillsInCategory: "No skills in this category yet.",
    searchSkills: "Search skills...",
    selectedCount: "{count} selected",
    done: "Done",
    removeFromCategory: "Remove from category",
    categoryMembers: "Manage skills in \u201c{name}\u201d",
    showCategorized: "Show categorized skills",
    hideCategorized: "Hide categorized skills",
    inCategory: "In \u201c{name}\u201d",
    selectAll: "Select All",
    selectNone: "Select None",
    languageSwitch: "Switch language",
    categories: "Categories",
    allSkills: "All Skills",
  },
};
