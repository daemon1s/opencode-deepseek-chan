const test = require("node:test");
const assert = require("node:assert/strict");
const {
  interpolateColor,
  generateBannerFrame,
  renderStaticBanner,
  startBannerLoop,
  renderProgressBar,
  bannerLines,
  deepseekPalette
} = require("../src/banner");

const stripAnsi = (text) => text.replace(/\x1b\[[0-9;]*m/g, "");

test("interpolateColor blends between two rgb colors accurately", () => {
  const blue = { r: 0, g: 0, b: 255 };
  const cyan = { r: 0, g: 255, b: 255 };
  const midpoint = interpolateColor(blue, cyan, 0.5);

  assert.equal(midpoint.r, 0);
  assert.equal(midpoint.g, 128);
  assert.equal(midpoint.b, 255);
});

test("interpolateColor bounds factor between zero and one", () => {
  const start = { r: 10, g: 20, b: 30 };
  const end = { r: 100, g: 200, b: 250 };

  const belowZero = interpolateColor(start, end, -0.5);
  assert.deepEqual(belowZero, start);

  const aboveOne = interpolateColor(start, end, 1.5);
  assert.deepEqual(aboveOne, end);
});

test("deepseekPalette defines valid rgb stops", () => {
  assert.ok(Array.isArray(deepseekPalette));
  assert.ok(deepseekPalette.length >= 3);
  for (const stop of deepseekPalette) {
    assert.ok(typeof stop.r === "number" && stop.r >= 0 && stop.r <= 255);
    assert.ok(typeof stop.g === "number" && stop.g >= 0 && stop.g <= 255);
    assert.ok(typeof stop.b === "number" && stop.b >= 0 && stop.b <= 255);
  }
});

test("bannerLines contains deepseek-chan ascii representation", () => {
  assert.ok(Array.isArray(bannerLines));
  assert.ok(bannerLines.length >= 5);
  const plainAscii = bannerLines.join("\n");
  assert.ok(plainAscii.includes("____"));
  assert.ok(plainAscii.includes("___| | __"));
  assert.ok(plainAscii.includes("|_____|"));
  assert.ok(plainAscii.includes("___| |__"));
});

test("generateBannerFrame applies 24-bit ansi truecolor codes", () => {
  const frame = generateBannerFrame(0);
  assert.ok(typeof frame === "string");
  assert.ok(frame.includes("\x1b[38;2;"));
  assert.ok(frame.includes("\x1b[0m"));
});

test("renderStaticBanner includes expected taglines and attribution", () => {
  const output = renderStaticBanner();
  const plain = stripAnsi(output);

  assert.ok(plain.includes("DeepSeek"));
  assert.ok(plain.includes("DeepSeek-chan theme suite for OpenCode Desktop"));
  assert.ok(plain.includes("OpenCode Desktop 的 DeepSeek-chan (深度求索娘) 主题套件"));
  assert.ok(plain.includes("@daemon1s"));
  assert.ok(plain.includes("https://github.com/daemon1s"));
  assert.equal(plain.includes("Tema DeepSeek Cyber"), false);
});

test("startBannerLoop provides non-crashing controller in non-interactive environment", () => {
  const controller = startBannerLoop({ noAnimation: true });
  assert.ok(controller);
  assert.equal(typeof controller.stop, "function");
  assert.doesNotThrow(() => controller.stop());
});

test("renderProgressBar fills blocks proportionally with truecolor gradient", () => {
  const output = renderProgressBar(0.5, 4);
  const plain = stripAnsi(output);
  const filledBlocks = (plain.match(/█/g) || []).length;
  const emptyBlocks = (plain.match(/░/g) || []).length;

  assert.equal(filledBlocks, 2);
  assert.equal(emptyBlocks, 2);
  assert.ok(output.includes("\x1b[38;2;"));
  assert.ok(output.includes("\x1b[0m"));
});

test("renderProgressBar clamps progress outside zero-to-one range", () => {
  const fullBar = renderProgressBar(1.5, 4);
  const emptyBar = renderProgressBar(-0.5, 4);
  const zeroBar = renderProgressBar(0, 4);

  assert.equal((stripAnsi(fullBar).match(/█/g) || []).length, 4);
  assert.equal((stripAnsi(emptyBar).match(/█/g) || []).length, 0);
  assert.equal((stripAnsi(zeroBar).match(/█/g) || []).length, 0);
});
