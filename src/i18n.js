const locales = {
  en: {
    bannerTitle: "Cyber Theme for OpenCode Desktop",
    selectPrompt: "Select a background preset:",
    feisha1080: "DeepSeek Féishā",
    zipzip1080: "DeepSeek Maid Whale",
    midnight1080: "DeepSeek Midnight",
    static4k: "DeepSeek Artwork",
    restoreOption: "Restore original OpenCode design",
    exitOption: "Exit",
    downloading: "Downloading asset",
    downloadFallback: "Retrying using mirror accelerator...",
    stepBackup: "Backing up original app.asar",
    stepEncode: "Encoding image asset",
    stepExtract: "Extracting app.asar",
    stepPatch: "Patching renderer index.html",
    stepRepack: "Repacking app.asar",
    opencodeRunning: "OpenCode Desktop is currently running. Please close it before proceeding.",
    installSuccess: "DeepSeek Cyber theme installed successfully.",
    installSuccessNamed: "{theme} theme installed successfully.",
    restoreSuccess: "OpenCode Desktop restored to factory state.",
    pathNotFound: "OpenCode Desktop installation path not found.",
    error: "Error",
    changeLangOption: "Change language / 切换语言 / Cambiar idioma",
    selectLangPrompt: "Select a language:",
    cancelOption: "Cancel and return to main menu"
  },
  zh: {
    bannerTitle: "OpenCode Desktop DeepSeek 赛博主题",
    selectPrompt: "请选择背景预设：",
    feisha1080: "DeepSeek 绯莎",
    zipzip1080: "DeepSeek 深海女仆",
    midnight1080: "DeepSeek 深夜",
    static4k: "DeepSeek 插画",
    restoreOption: "恢复 OpenCode 原始默认样式",
    exitOption: "退出",
    downloading: "正在下载背景资源",
    downloadFallback: "正在尝试使用国内镜像加速下载...",
    stepBackup: "备份原始 app.asar",
    stepEncode: "编码图片资源",
    stepExtract: "解压 app.asar",
    stepPatch: "修改渲染进程 index.html",
    stepRepack: "重新打包 app.asar",
    opencodeRunning: "检测到 OpenCode Desktop 正在运行，请先关闭该程序再执行安装。",
    installSuccess: "DeepSeek 赛博主题安装成功！",
    installSuccessNamed: "{theme} 主题安装成功！",
    restoreSuccess: "OpenCode Desktop 已成功恢复出厂默认状态。",
    pathNotFound: "未找到 OpenCode Desktop 安装路径。",
    error: "错误",
    changeLangOption: "切换语言 / Change language / Cambiar idioma",
    selectLangPrompt: "请选择语言：",
    cancelOption: "取消并返回主菜单"
  },
  es: {
    bannerTitle: "Tema DeepSeek Cyber para OpenCode Desktop",
    selectPrompt: "Selecciona un preset de fondo:",
    feisha1080: "DeepSeek Féishā",
    zipzip1080: "DeepSeek doncella marina",
    midnight1080: "DeepSeek medianoche",
    static4k: "DeepSeek artwork",
    restoreOption: "Restaurar diseno original de fabrica",
    exitOption: "Salir",
    downloading: "Descargando recurso",
    downloadFallback: "Reintentando mediante espejo acelerado...",
    stepBackup: "Respaldando app.asar original",
    stepEncode: "Codificando recurso de imagen",
    stepExtract: "Extrayendo app.asar",
    stepPatch: "Parcheando index.html del renderer",
    stepRepack: "Reempaquetando app.asar",
    opencodeRunning: "OpenCode Desktop esta en ejecucion. Cierralo antes de continuar.",
    installSuccess: "Tema DeepSeek Cyber instalado con exito.",
    installSuccessNamed: "Tema {theme} instalado con exito.",
    restoreSuccess: "OpenCode Desktop ha sido restaurado a su estado original.",
    pathNotFound: "No se detecto la ruta de OpenCode Desktop.",
    error: "Error",
    changeLangOption: "Cambiar idioma / Switch language / 切换语言",
    selectLangPrompt: "Selecciona un idioma:",
    cancelOption: "Cancelar y volver al menu principal"
  }
};

const detectLocale = (explicitLang) => {
  if (explicitLang && typeof explicitLang === "string" && explicitLang.trim().length > 0) {
    const normalized = explicitLang.trim().toLowerCase();
    if (["en", "zh", "es"].includes(normalized)) {
      return normalized;
    }
    return "en";
  }

  return "en";
};

const getLocaleStrings = (locale) => {
  return locales[locale] || locales.en;
};

module.exports = {
  locales,
  detectLocale,
  getLocaleStrings
};
