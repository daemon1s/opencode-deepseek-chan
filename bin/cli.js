#!/usr/bin/env node

const path = require("path");
const readline = require("readline");
const { presets, getPresetById } = require("../src/presets");
const { detectLocale, getLocaleStrings } = require("../src/i18n");
const {
  resolveAssetPath,
  getUserCacheDirectory,
  downloadWithFallback
} = require("../src/downloader");
const {
  isOpenCodeRunning,
  resolveOpenCodePath,
  installTheme,
  restoreTheme
} = require("../src/engine");
const { renderStaticBanner, startBannerLoop } = require("../src/banner");

const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m"
};

const printBanner = () => {
  process.stdout.write(renderStaticBanner() + "\n");
};

const parseCliArguments = () => {
  const args = process.argv.slice(2);
  const parsed = {
    help: false,
    lang: null,
    preset: null,
    install: null,
    restore: false,
    noAnimation: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    if (current === "--help" || current === "-h") {
      parsed.help = true;
    } else if (current === "--no-animation") {
      parsed.noAnimation = true;
    } else if (current === "--lang" || current === "-l") {
      parsed.lang = args[index + 1] || null;
      index += 1;
    } else if (current === "--preset" || current === "-p") {
      parsed.preset = args[index + 1] || null;
      index += 1;
    } else if (current === "--install" || current === "-i") {
      parsed.install = args[index + 1] || true;
      if (args[index + 1] && !args[index + 1].startsWith("-")) {
        index += 1;
      }
    } else if (
      current === "--uninstall" ||
      current === "-u" ||
      current === "--restore" ||
      current === "-r"
    ) {
      parsed.restore = true;
    }
  }

  return parsed;
};

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const obtainAssetFile = async (preset, localeStrings) => {
  const workspaceAssetsDir = path.join(__dirname, "..", "assets");
  const userCacheDir = getUserCacheDirectory();

  const existingFile = resolveAssetPath(
    preset,
    workspaceAssetsDir,
    userCacheDir
  );

  if (existingFile) {
    return existingFile;
  }

  const destinationPath = path.join(userCacheDir, preset.filename);
  console.log(`${colors.cyan}${localeStrings.downloading}: ${preset.filename}${colors.reset}`);

  let previousRenderLength = 0;
  const onProgress = (downloaded, total) => {
    const percentage = total > 0 ? Math.round((downloaded / total) * 100) : 0;
    const progressText = `  [${percentage}%] ${formatBytes(downloaded)} / ${formatBytes(total || preset.expectedSize)}`;
    process.stdout.write(`\r${progressText}`);
    previousRenderLength = progressText.length;
  };

  const onFallback = () => {
    process.stdout.write("\n");
    console.log(`${colors.yellow}${localeStrings.downloadFallback}${colors.reset}`);
  };

  await downloadWithFallback(preset, destinationPath, onProgress, onFallback);
  process.stdout.write("\n\n");
  return destinationPath;
};

const executeInstall = async (itemType, filePath, localeStrings) => {
  if (isOpenCodeRunning()) {
    console.log(`${colors.red}${localeStrings.opencodeRunning}${colors.reset}`);
    process.exit(1);
  }

  const openCodePath = resolveOpenCodePath();
  if (!openCodePath) {
    console.log(`${colors.red}${localeStrings.pathNotFound}${colors.reset}`);
    process.exit(1);
  }

  try {
    await installTheme(itemType, filePath);
    console.log(`${colors.green}${colors.bold}${localeStrings.installSuccess}${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}${localeStrings.error}: ${error.message}${colors.reset}`);
    process.exit(1);
  }
};

const executeRestore = (localeStrings) => {
  if (isOpenCodeRunning()) {
    console.log(`${colors.red}${localeStrings.opencodeRunning}${colors.reset}`);
    process.exit(1);
  }

  try {
    restoreTheme();
    console.log(`${colors.green}${colors.bold}${localeStrings.restoreSuccess}${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}${localeStrings.error}: ${error.message}${colors.reset}`);
    process.exit(1);
  }
};

const promptLanguageSelection = (readlineInterface, localeStrings, cliArgs, onSelected) => {
  const langBannerLoop = startBannerLoop({ noAnimation: cliArgs?.noAnimation });
  console.log(`\n${colors.cyan}${localeStrings.selectLangPrompt}${colors.reset}\n`);
  console.log(`  ${colors.bold}1)${colors.reset} English (en)`);
  console.log(`  ${colors.bold}2)${colors.reset} 中文 (zh)`);
  console.log(`  ${colors.bold}3)${colors.reset} Español (es)`);
  console.log(`  ${colors.bold}4)${colors.reset} ${localeStrings.cancelOption}\n`);

  readlineInterface.question(`> `, (answer) => {
    langBannerLoop.stop();
    const trimmed = answer.trim();
    if (trimmed === "1") {
      onSelected("en");
    } else if (trimmed === "2") {
      onSelected("zh");
    } else if (trimmed === "3") {
      onSelected("es");
    } else {
      onSelected(null);
    }
  });
};

const runInteractiveMenu = async (localeStrings, currentLocale = "en", cliArgs = {}) => {
  if (process.stdout.isTTY && !cliArgs.noAnimation) {
    process.stdout.write("\x1b[2J\x1b[1;1H");
  }
  printBanner();

  const bannerLoop = startBannerLoop({ noAnimation: cliArgs.noAnimation });

  const readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const changeLangOptionNumber = presets.length + 1;
  const restoreOptionNumber = presets.length + 2;
  const exitOptionNumber = presets.length + 3;

  console.log(`${localeStrings.selectPrompt}\n`);
  presets.forEach((preset, index) => {
    const title = localeStrings[preset.titleKey] || preset.id;
    console.log(`  ${colors.bold}${index + 1})${colors.reset} ${title}`);
  });
  console.log(`  ${colors.bold}${changeLangOptionNumber})${colors.reset} ${localeStrings.changeLangOption}`);
  console.log(`  ${colors.bold}${restoreOptionNumber})${colors.reset} ${localeStrings.restoreOption}`);
  console.log(`  ${colors.bold}${exitOptionNumber})${colors.reset} ${localeStrings.exitOption}\n`);

  readlineInterface.question(`> `, async (answer) => {
    bannerLoop.stop();
    const trimmed = answer.trim();
    const numericChoice = parseInt(trimmed, 10);

    if (numericChoice >= 1 && numericChoice <= presets.length) {
      readlineInterface.close();
      const chosenPreset = presets[numericChoice - 1];
      const title = localeStrings[chosenPreset.titleKey] || chosenPreset.id;
      console.log(`\n${colors.cyan}${title}${colors.reset}\n`);
      const assetPath = await obtainAssetFile(chosenPreset, localeStrings);
      await executeInstall(chosenPreset.type, assetPath, localeStrings);
    } else if (numericChoice === changeLangOptionNumber) {
      promptLanguageSelection(readlineInterface, localeStrings, cliArgs, async (selectedLanguage) => {
        readlineInterface.close();
        if (selectedLanguage && selectedLanguage !== currentLocale) {
          const updatedStrings = getLocaleStrings(selectedLanguage);
          await runInteractiveMenu(updatedStrings, selectedLanguage, cliArgs);
        } else {
          await runInteractiveMenu(localeStrings, currentLocale, cliArgs);
        }
      });
    } else if (numericChoice === restoreOptionNumber) {
      readlineInterface.close();
      executeRestore(localeStrings);
    } else {
      readlineInterface.close();
      process.exit(0);
    }
  });
};

const main = async () => {
  const cliArgs = parseCliArguments();
  const currentLocale = detectLocale(cliArgs.lang);
  const localeStrings = getLocaleStrings(currentLocale);

  if (cliArgs.help) {
    printBanner();
    console.log("Usage:");
    console.log("  npx opencode-deepseek-chan");
    console.log("  npx opencode-deepseek-chan --preset <id|1-4>");
    console.log("  npx opencode-deepseek-chan --install <file-path>");
    console.log("  npx opencode-deepseek-chan --restore");
    console.log("  npx opencode-deepseek-chan --lang <en|zh|es>");
    console.log("  npx opencode-deepseek-chan --no-animation\n");
    console.log("Available presets:");
    presets.forEach((preset, index) => {
      const title = localeStrings[preset.titleKey] || preset.id;
      console.log(`  ${index + 1}) ${preset.id.padEnd(16)} ${title}`);
    });
    console.log("");
    return;
  }

  if (cliArgs.restore) {
    printBanner();
    executeRestore(localeStrings);
    return;
  }

  if (cliArgs.preset) {
    printBanner();
    const numericIndex = parseInt(cliArgs.preset, 10);
    let chosenPreset = null;

    if (!isNaN(numericIndex) && numericIndex >= 1 && numericIndex <= presets.length) {
      chosenPreset = presets[numericIndex - 1];
    } else {
      chosenPreset = getPresetById(cliArgs.preset);
    }

    if (!chosenPreset) {
      console.log(`${colors.red}${localeStrings.error}: Unknown preset ${cliArgs.preset}${colors.reset}\n`);
      return;
    }

    const title = localeStrings[chosenPreset.titleKey] || chosenPreset.id;
    console.log(`${colors.cyan}${title}${colors.reset}\n`);
    const assetPath = await obtainAssetFile(chosenPreset, localeStrings);
    await executeInstall(chosenPreset.type, assetPath, localeStrings);
    return;
  }

  if (cliArgs.install) {
    printBanner();
    if (typeof cliArgs.install === "string") {
      const cleaned = cliArgs.install.trim().replace(/^["']|["']$/g, "");
      const extension = path.extname(cleaned).toLowerCase();
      const isVideo = [".mp4", ".webm", ".mkv"].includes(extension);
      await executeInstall(isVideo ? "video" : "image", cleaned, localeStrings);
    } else {
      const defaultPreset = presets[0];
      const assetPath = await obtainAssetFile(defaultPreset, localeStrings);
      await executeInstall(defaultPreset.type, assetPath, localeStrings);
    }
    return;
  }

  await runInteractiveMenu(localeStrings, currentLocale, cliArgs);
};

if (require.main === module) {
  main().catch((error) => {
    console.error(`\x1b[31m${error.message}\x1b[0m`);
    process.exit(1);
  });
}

module.exports = {
  parseCliArguments,
  runInteractiveMenu,
  main
};
