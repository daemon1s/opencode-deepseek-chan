const deepseekPalette = [
  { r: 13, g: 37, b: 90 },
  { r: 29, g: 99, b: 255 },
  { r: 0, g: 210, b: 255 },
  { r: 139, g: 233, b: 253 },
  { r: 240, g: 248, b: 255 },
  { r: 0, g: 210, b: 255 },
  { r: 29, g: 99, b: 255 }
];

const bannerLines = [
  "  ____                  ____            _                _                 ",
  " |  _ \\  ___  ___ _ __ / ___|  ___  ___| | __        ___| |__   __ _ _ __  ",
  " | | | |/ _ \\/ _ \\ '_ \\\\___ \\ / _ \\/ _ \\ |/ / _____ / __| '_ \\ / _` | '_ \\  ",
  " | |_| |  __/  __/ |_) |___) |  __/  __/   < |_____| (__| | | | (_| | | | |",
  " |____/ \\___|\\___| .__/|____/ \\___|\\___|_|\\_\\       \\___|_| |_|\\__,_|_| |_|",
  "                 |_|                                                       "
];

const interpolateColor = (colorA, colorB, factor) => {
  const clampedFactor = Math.max(0, Math.min(1, factor));
  return {
    r: Math.round(colorA.r + (colorB.r - colorA.r) * clampedFactor),
    g: Math.round(colorA.g + (colorB.g - colorA.g) * clampedFactor),
    b: Math.round(colorA.b + (colorB.b - colorA.b) * clampedFactor)
  };
};

const getMultiStopColor = (palette, progress) => {
  const normalized = ((progress % 1) + 1) % 1;
  const segments = palette.length - 1;
  const position = normalized * segments;
  const index = Math.floor(position);
  const nextIndex = Math.min(index + 1, palette.length - 1);
  const localFactor = position - index;
  return interpolateColor(palette[index], palette[nextIndex], localFactor);
};

const colorTextRgb = (text, r, g, b) => {
  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
};

const renderProgressBar = (progress, width = 24) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const filledCount = Math.round(clampedProgress * width);
  let bar = "[";
  for (let index = 0; index < width; index += 1) {
    if (index < filledCount) {
      const color = getMultiStopColor(deepseekPalette, index / width);
      bar += `\x1b[38;2;${color.r};${color.g};${color.b}m█`;
    } else {
      bar += "\x1b[90m░\x1b[0m";
    }
  }
  bar += "\x1b[0m]";
  return bar;
};

const generateBannerFrame = (offset = 0) => {
  const maxWidth = bannerLines.reduce((max, line) => Math.max(max, line.length), 0);
  const coloredLines = bannerLines.map((line) => {
    let coloredLine = "";
    for (let charIndex = 0; charIndex < line.length; charIndex += 1) {
      const char = line[charIndex];
      if (char === " ") {
        coloredLine += " ";
      } else {
        const progress = (charIndex / maxWidth + offset) % 1;
        const color = getMultiStopColor(deepseekPalette, progress);
        coloredLine += `\x1b[38;2;${color.r};${color.g};${color.b}m${char}`;
      }
    }
    return `${coloredLine}\x1b[0m`;
  });
  return coloredLines.join("\n");
};

const renderStaticBanner = () => {
  const asciiBanner = generateBannerFrame(0.15);
  const cyanCode = "\x1b[36m";
  const grayCode = "\x1b[90m";
  const whiteCode = "\x1b[97m";
  const resetCode = "\x1b[0m";

  const englishTagline = `  ${cyanCode}›${resetCode} ${whiteCode}DeepSeek-chan theme suite for OpenCode Desktop${resetCode}`;
  const chineseTagline = `  ${cyanCode}›${resetCode} ${grayCode}OpenCode Desktop 的 DeepSeek-chan (深度求索娘) 主题套件${resetCode}`;
  const authorLine = `  ${cyanCode}›${resetCode} ${grayCode}Author: ${whiteCode}@daemon1s${resetCode} ${grayCode}(https://github.com/daemon1s)${resetCode}`;

  return `${asciiBanner}\n\n${englishTagline}\n${chineseTagline}\n${authorLine}\n`;
};

const startBannerLoop = (options = {}) => {
  const isInteractiveTty = Boolean(process.stdout.isTTY) && !options.noAnimation;
  if (!isInteractiveTty) {
    return {
      stop: () => {}
    };
  }

  let offset = 0;
  const frameInterval = 60;

  const timer = setInterval(() => {
    offset = (offset + 0.025) % 1;
    const frameLines = generateBannerFrame(offset).split("\n");
    let buffer = "\x1b7";
    for (let index = 0; index < frameLines.length; index += 1) {
      buffer += `\x1b[${index + 1};1H${frameLines[index]}\x1b[K`;
    }
    buffer += "\x1b8";
    process.stdout.write(buffer);
  }, frameInterval);

  return {
    stop: () => {
      clearInterval(timer);
    }
  };
};

module.exports = {
  deepseekPalette,
  bannerLines,
  interpolateColor,
  getMultiStopColor,
  colorTextRgb,
  generateBannerFrame,
  renderStaticBanner,
  startBannerLoop,
  renderProgressBar
};
