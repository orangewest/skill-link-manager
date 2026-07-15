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
  | "deleteSkillSuccess";

export const translations: Record<Language, Record<TranslationKey, string>> = {
  zh: {
    appTitle: "Skill Link Manager",
    appSubtitle: "\u7ba1\u7406\u8de8\u5de5\u5177\u76ee\u5f55\u7684 Skill \u94fe\u63a5",
    settings: "\u8bbe\u7f6e",
    back: "\u8fd4\u56de",
    home: "\u9996\u9875",
    searchPlaceholder: "\u641c\u7d22 Skill...",
    noSkills: "\u5171\u4eab\u76ee\u5f55\u4e2d\u6ca1\u6709\u627e\u5230 Skill\u3002",
    noSearchResults: "\u6ca1\u6709\u5339\u914d\u7684 Skill\u3002",
    unlinked: "\u672a\u94fe\u63a5",
    linkedCount: "{linked}/{total} \u5df2\u94fe\u63a5",
    applyToAll: "\u5e94\u7528\u5230\u5168\u90e8",
    addLink: "\u6dfb\u52a0\u94fe\u63a5",
    removeLink: "\u79fb\u9664\u94fe\u63a5",
    linkedStatus: "\u5df2\u94fe\u63a5",
    unlinkedStatus: "\u672a\u94fe\u63a5",
    settingsTitle: "\u8bbe\u7f6e",
    sharedDirConfig: "\u4e3b Skill \u76ee\u5f55",
    sharedDirPlaceholder: "\u8f93\u5165\u5171\u4eab\u76ee\u5f55\u8def\u5f84",
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
    clickToViewDetail: "\u70b9\u51fb\u67e5\u770b\u8be6\u60c5",
    onboardingTitle: "\u521d\u59cb\u8bbe\u7f6e",
    onboardingWelcome: "\u6b22\u8fce\u4f7f\u7528 Skill Link Manager\uff0c\u8bf7\u5b8c\u6210\u4ee5\u4e0b\u521d\u59cb\u914d\u7f6e\u3002",
    onboardingSharedDirHint: "\u8be5\u76ee\u5f55\u7528\u4e8e\u5b58\u653e\u6240\u6709\u5171\u4eab\u7684 Skill \u6587\u4ef6\u5939\u3002",
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
    deleteSkillConfirmBody: "\u6b64\u64cd\u4f5c\u5c06\u89e3\u9664\u8be5 Skill \u5728\u6240\u6709\u5de5\u5177\u76ee\u5f55\u4e2d\u7684\u94fe\u63a5\uff0c\u5e76\u6c38\u4e45\u5220\u9664\u5171\u4eab\u76ee\u5f55\u4e0b\u7684 Skill \u6587\u4ef6\u5939\u3002\u6b64\u64cd\u4f5c\u4e0d\u53ef\u64a4\u9500\u3002",
    continueButton: "\u7ee7\u7eed",
    deleteSkillFinalTitle: "\u786e\u8ba4\u5220\u9664",
    deleteSkillFinalBody: "\u8bf7\u8f93\u5165 Skill \u540d\u79f0\u4ee5\u786e\u8ba4\u6c38\u4e45\u5220\u9664\uff1a",
    deleting: "\u5220\u9664\u4e2d...",
    deleteSkillSuccess: "\u5df2\u5220\u9664 Skill '{name}'\uff0c\u5e76\u89e3\u9664 {count} \u4e2a\u94fe\u63a5",
  },
  en: {
    appTitle: "Skill Link Manager",
    appSubtitle: "Manage skill links across tool directories",
    settings: "Settings",
    back: "Back",
    home: "Home",
    searchPlaceholder: "Search skills...",
    noSkills: "No skills found in the shared directory.",
    noSearchResults: "No skills match your search.",
    unlinked: "unlinked",
    linkedCount: "{linked}/{total} linked",
    applyToAll: "Apply to All",
    addLink: "Add Link",
    removeLink: "Remove Link",
    linkedStatus: "Linked",
    unlinkedStatus: "Not Linked",
    settingsTitle: "Settings",
    sharedDirConfig: "Shared Skill Directory",
    sharedDirPlaceholder: "Enter shared directory path",
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
    clickToViewDetail: "Click to view detail",
    onboardingTitle: "Initial Setup",
    onboardingWelcome: "Welcome to Skill Link Manager. Please complete the initial setup below.",
    onboardingSharedDirHint: "This directory stores all shared skill folders.",
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
    deleteSkillConfirmBody: "This will unlink the skill from all tool directories and permanently delete its folder in the shared directory. This action cannot be undone.",
    continueButton: "Continue",
    deleteSkillFinalTitle: "Confirm Deletion",
    deleteSkillFinalBody: "Type the skill name to confirm permanent deletion:",
    deleting: "Deleting...",
    deleteSkillSuccess: "Deleted skill '{name}' and removed {count} link(s)",
  },
};
