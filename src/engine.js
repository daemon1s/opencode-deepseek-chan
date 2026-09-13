const fs = require("fs");
const path = require("path");
const os = require("os");
const childProcess = require("child_process");
const asar = require("@electron/asar");

const isOpenCodeRunning = () => {
  try {
    const isWindows = process.platform === "win32";
    const command = isWindows
      ? 'tasklist /NH /FI "IMAGENAME eq opencode.exe"'
      : "pgrep -l -i opencode";

    const output = childProcess.execSync(command, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"]
    });

    return /opencode/i.test(output);
  } catch {
    return false;
  }
};

const resolveOpenCodePath = (customBasePath = null) => {
  if (customBasePath && fs.existsSync(customBasePath)) {
    return customBasePath;
  }

  const localAppData = process.env.LOCALAPPDATA || "";
  const candidatePaths = [
    path.join(localAppData, "Programs", "@opencode-aidesktop"),
    path.join(localAppData, "Programs", "OpenCode"),
    path.join(localAppData, "OpenCode")
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
};

const encodeImageToBase64 = (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".svg": "image/svg+xml"
  };
  const mimeType = mimeTypes[extension] || "image/png";
  const buffer = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
};

const generateThemeCss = (isVideo, base64Url) => {
  const backgroundRule = isVideo
    ? `
#opencode-bg-video {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  object-fit: cover !important;
  z-index: -2 !important;
  pointer-events: none !important;
}
`
    : `
body::before {
  content: "" !important;
  position: fixed !important;
  inset: 0 !important;
  background-image: url('${base64Url}') !important;
  background-size: cover !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
  image-rendering: high-quality !important;
  z-index: -2 !important;
  pointer-events: none !important;
}
`;

  return `
:root {
  --background-base: transparent !important;
  --background-weak: rgba(16, 26, 48, 0.65) !important;
  --background-strong: rgba(11, 21, 40, 0.75) !important;
  --background-stronger: rgba(11, 21, 40, 0.85) !important;
  --v2-background-bg-base: transparent !important;
  --v2-background-bg-deep: rgba(11, 21, 40, 0.5) !important;
  --v2-background-bg-layer-01: rgba(16, 26, 48, 0.6) !important;
  --v2-background-bg-layer-02: rgba(22, 32, 53, 0.7) !important;
  --v2-background-bg-layer-03: rgba(30, 42, 68, 0.8) !important;
  --surface-raised-stronger-non-alpha: #0e172a !important;
  --surface-raised-base-hover: rgba(77, 107, 254, 0.35) !important;
}
${backgroundRule}
html,
body,
#root {
  background-color: transparent !important;
  background-image: none !important;
  color: #e2e8f0 !important;
}

#root > div,
#root > div * {
  background-color: transparent !important;
}

#root > div {
  background-color: rgba(10, 14, 26, 0.70) !important;
  z-index: 1 !important;
  position: relative !important;
}

header,
nav,
aside,
[data-slot="titlebar-v2"],
[data-component="tabs"],
[data-titlebar-tab],
.home-session-group-header:after {
  background-color: transparent !important;
  background-image: none !important;
}

[data-titlebar-tab] {
  background: rgba(16, 26, 48, 0.6) !important;
  border: 1px solid rgba(77, 107, 254, 0.25) !important;
  border-radius: 6px !important;
}

[data-titlebar-tab][data-active="true"] {
  background: rgba(30, 45, 75, 0.85) !important;
  border-color: rgba(112, 192, 255, 0.45) !important;
}

[data-role="user"],
[data-message-author="user"] {
  background-color: rgba(77, 107, 254, 0.22) !important;
  border: 1px solid rgba(77, 107, 254, 0.35) !important;
  border-radius: 10px !important;
  padding: 8px 12px !important;
}

[data-role="assistant"],
[data-message-author="assistant"] {
  background-color: rgba(16, 26, 48, 0.75) !important;
  border: 1px solid rgba(112, 192, 255, 0.25) !important;
  border-radius: 10px !important;
  padding: 8px 12px !important;
}

form,
textarea,
input,
select {
  background-color: rgba(20, 27, 45, 0.85) !important;
  border: 1px solid rgba(77, 107, 254, 0.35) !important;
  color: #f8fafc !important;
  border-radius: 8px !important;
}

.monaco-editor,
.monaco-editor-background,
.monaco-editor .margin,
.monaco-editor .overflow-guard,
pre {
  background-color: rgba(11, 21, 40, 0.9) !important;
}

button {
  background-color: rgba(22, 32, 53, 0.8) !important;
  border: 1px solid rgba(77, 107, 254, 0.35) !important;
  color: #f1f5f9 !important;
  border-radius: 8px !important;
}

button:hover {
  background-color: rgba(77, 107, 254, 0.4) !important;
  border-color: #70c0ff !important;
}

[data-component="context-menu-content"],
[data-component="context-menu-sub-content"],
[data-component="dropdown-menu-content"],
[data-component="dropdown-menu-sub-content"],
[data-component="menu-v2-content"],
[role="menu"] {
  background-color: rgba(14, 23, 42, 0.94) !important;
  border: 1px solid rgba(77, 107, 254, 0.35) !important;
  border-radius: 8px !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.65), 0 0 16px rgba(77, 107, 254, 0.25) !important;
  color: #f1f5f9 !important;
}

[data-slot="context-menu-item"],
[data-slot="context-menu-sub-trigger"],
[data-slot="dropdown-menu-item"],
[data-slot="dropdown-menu-sub-trigger"],
[data-component="menu-v2-item"],
[role="menuitem"] {
  color: #e2e8f0 !important;
  border-radius: 4px !important;
}

[data-slot="context-menu-item"]:hover,
[data-slot="context-menu-sub-trigger"]:hover,
[data-slot="dropdown-menu-item"]:hover,
[data-slot="dropdown-menu-sub-trigger"]:hover,
[data-component="menu-v2-item"]:hover,
[role="menuitem"]:hover,
[data-slot="context-menu-sub-trigger"][data-expanded],
[data-slot="dropdown-menu-sub-trigger"][data-expanded],
[data-highlighted] {
  background-color: rgba(77, 107, 254, 0.35) !important;
  color: #ffffff !important;
}

[data-slot="context-menu-separator"],
[data-slot="dropdown-menu-separator"],
[data-slot="menu-v2-separator"] {
  background-color: rgba(77, 107, 254, 0.25) !important;
}
`;
};

const installTheme = async (itemType, filePath, logFunction, customBasePath = null) => {
  const log = logFunction || (() => {});

  const stepKeys =
    itemType === "video"
      ? ["backup", "extract", "patch", "repack"]
      : ["backup", "encode", "extract", "patch", "repack"];
  let stepIndex = 0;
  const emitStep = (key) => {
    stepIndex += 1;
    log(key, stepIndex, stepKeys.length);
  };

  if (!customBasePath && isOpenCodeRunning()) {
    throw new Error("OPENCODE_RUNNING");
  }

  const openCodeBasePath = resolveOpenCodePath(customBasePath);
  if (!openCodeBasePath) {
    throw new Error("PATH_NOT_FOUND");
  }

  const resourcesDirectory = path.join(openCodeBasePath, "resources");
  const appAsarPath = path.join(resourcesDirectory, "app.asar");
  const appAsarBackupPath = path.join(resourcesDirectory, "app.asar.bak");

  if (!fs.existsSync(appAsarPath) && !fs.existsSync(appAsarBackupPath)) {
    throw new Error(`app.asar not found in ${resourcesDirectory}`);
  }

  emitStep("backup");
  if (fs.existsSync(appAsarBackupPath)) {
    fs.copyFileSync(appAsarBackupPath, appAsarPath);
  } else {
    fs.copyFileSync(appAsarPath, appAsarBackupPath);
  }

  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`Background asset not found at: ${filePath}`);
  }

  const isVideo = itemType === "video";
  let base64Url = "";
  if (!isVideo) {
    emitStep("encode");
    base64Url = encodeImageToBase64(filePath);
  }

  const themeCss = generateThemeCss(isVideo, base64Url);

  const temporaryExtractionPath = path.join(
    os.tmpdir(),
    `opencode_patch_${Date.now()}`
  );
  const appAsarTempPath = path.join(
    resourcesDirectory,
    `app.asar.tmp_${Date.now()}`
  );

  try {
    emitStep("extract");
    asar.extractAll(appAsarPath, temporaryExtractionPath);

    const indexHtmlPath = path.join(
      temporaryExtractionPath,
      "out",
      "renderer",
      "index.html"
    );

    if (!fs.existsSync(indexHtmlPath)) {
      throw new Error("index.html not found inside app.asar");
    }

    let indexHtmlContent = fs.readFileSync(indexHtmlPath, "utf8");

    indexHtmlContent = indexHtmlContent.replace(
      /<video id="opencode-bg-video"[^>]*><\/video>\s*/gi,
      ""
    );

    if (isVideo) {
      const rendererAssetsDir = path.join(
        temporaryExtractionPath,
        "out",
        "renderer",
        "assets"
      );
      if (!fs.existsSync(rendererAssetsDir)) {
        fs.mkdirSync(rendererAssetsDir, { recursive: true });
      }
      const targetVideoPath = path.join(rendererAssetsDir, "deepseek-bg.mp4");
      fs.copyFileSync(filePath, targetVideoPath);

      const videoTag = `<video id="opencode-bg-video" autoplay loop muted playsinline src="./assets/deepseek-bg.mp4"></video>`;
      indexHtmlContent = indexHtmlContent.replace(
        /(<body[^>]*>)/i,
        `$1\n    ${videoTag}`
      );
    }

    const styleBlock = `<style id="opencode-bg-correct-override">${themeCss}</style>\n</head>`;
    emitStep("patch");
    indexHtmlContent = indexHtmlContent.replace("</head>", styleBlock);
    fs.writeFileSync(indexHtmlPath, indexHtmlContent, "utf8");

    emitStep("repack");
    await asar.createPackage(temporaryExtractionPath, appAsarTempPath);
    fs.renameSync(appAsarTempPath, appAsarPath);
  } finally {
    if (fs.existsSync(appAsarTempPath)) {
      fs.rmSync(appAsarTempPath, { force: true });
    }
    if (fs.existsSync(temporaryExtractionPath)) {
      fs.rmSync(temporaryExtractionPath, { recursive: true, force: true });
    }
  }
};

const restoreTheme = (customBasePath = null) => {
  if (!customBasePath && isOpenCodeRunning()) {
    throw new Error("OPENCODE_RUNNING");
  }

  const openCodeBasePath = resolveOpenCodePath(customBasePath);
  if (!openCodeBasePath) {
    throw new Error("PATH_NOT_FOUND");
  }

  const resourcesDirectory = path.join(openCodeBasePath, "resources");
  const appAsarPath = path.join(resourcesDirectory, "app.asar");
  const appAsarBackupPath = path.join(resourcesDirectory, "app.asar.bak");

  if (!fs.existsSync(appAsarBackupPath)) {
    throw new Error("BACKUP_NOT_FOUND");
  }

  fs.copyFileSync(appAsarBackupPath, appAsarPath);
};

module.exports = {
  isOpenCodeRunning,
  resolveOpenCodePath,
  encodeImageToBase64,
  generateThemeCss,
  installTheme,
  restoreTheme
};
