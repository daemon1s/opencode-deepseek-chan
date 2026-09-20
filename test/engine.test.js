const test = require("node:test");
const assert = require("node:assert/strict");
const { generateThemeCss, installTheme } = require("../src/engine");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const asar = require("@electron/asar");

test("generateThemeCss produces video styles when isVideo is true", () => {
  const css = generateThemeCss(true, "");
  assert.ok(css.includes("#opencode-bg-video"));
  assert.ok(css.includes("position: fixed !important;"));
  assert.ok(css.includes("--background-base: transparent !important;"));
});

test("generateThemeCss produces body background styles when isVideo is false", () => {
  const sampleBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const css = generateThemeCss(false, sampleBase64);
  assert.ok(css.includes("body::before"));
  assert.ok(css.includes(sampleBase64));
  assert.ok(!css.includes("#opencode-bg-video"));
});

test("generateThemeCss styles the @ mention popover with an opaque dark beam", () => {
  const css = generateThemeCss(true, "");
  assert.ok(css.includes('[class*="inset-x-0"][class*="max-h-80"][class*="-translate-y-full"]'));
  assert.ok(css.includes("linear-gradient(#0e172a, #0e172a) padding-box"));
  assert.ok(css.includes("rgba(30, 41, 82, 0.9) 12%"));
  assert.ok(css.includes("#1e2952 25%"));
  assert.ok(!css.includes("rgba(77, 107, 254, 0.85) 12%"));
  assert.ok(css.includes("@keyframes deepseek-beam-spin"));
  assert.ok(css.includes('[data-slot*="mention-list"]'));
});

test("generateThemeCss applies the dark beam to prompt context file chips", () => {
  const css = generateThemeCss(true, "");
  assert.ok(css.includes('[class*="flex-nowrap"][class*="overflow-x-auto"][class*="no-scrollbar"] [class*="max-w-[200px]"]'));
  assert.ok(css.includes('[class*="bg-surface-interactive-hover"]'));
  assert.ok(css.includes("animation: deepseek-beam-spin 4s linear infinite"));
});

test("generateThemeCss styles the session title as a beam pill", () => {
  const css = generateThemeCss(true, "");
  assert.ok(css.includes('[data-session-title] [data-slot="session-title-child"]'));
  assert.ok(css.includes('linear-gradient(rgba(14, 23, 42, 0.9), rgba(14, 23, 42, 0.9)) padding-box'));
  assert.ok(css.includes("rgba(77, 107, 254, 0.25) 30%"));
  assert.ok(css.includes("animation: deepseek-beam-spin 3.5s linear infinite"));
});

test("generateThemeCss styles tool trigger pills with beam and feed spacing", () => {
  const css = generateThemeCss(true, "");
  assert.ok(css.includes('[data-component="tool-trigger"]'));
  assert.ok(css.includes('linear-gradient(rgba(77, 107, 254, 0.18), rgba(77, 107, 254, 0.18)) border-box'));
  assert.ok(css.includes("rgba(77, 107, 254, 0.25) 30%"));
  assert.ok(css.includes("rgba(77, 107, 254, 0.25) 50%"));
  assert.ok(css.includes('[data-component="tool-trigger"]:has([data-component="text-shimmer"][data-active="true"])'));
  assert.ok(css.includes('[data-component="tool-trigger"]:has([data-component="spinner"])'));
  assert.ok(css.includes('[data-component="tool-part-wrapper"] > [data-component="collapsible"].tool-collapsible'));
  assert.ok(css.includes("margin-block: 4px !important"));
});

test("generateThemeCss styles the context tool group summary with beam states", () => {
  const css = generateThemeCss(true, "");
  assert.ok(css.includes('[data-component="context-tool-group-trigger"]'));
  assert.ok(css.includes('linear-gradient(rgba(77, 107, 254, 0.18), rgba(77, 107, 254, 0.18)) border-box'));
  assert.ok(css.includes("rgba(77, 107, 254, 0.25) 50%"));
  assert.ok(css.includes('[data-component="context-tool-group-trigger"]:has([data-slot="tool-status-active"])'));
  assert.ok(css.includes('[data-component="context-tool-group-list"]'));
  assert.ok(css.includes("gap: 8px !important"));
});

test("installTheme creates atomic repack and cleans up temporary archives", async () => {
  const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), "engine_test_"));
  const resourcesDirectory = path.join(testRoot, "resources");
  fs.mkdirSync(resourcesDirectory, { recursive: true });

  const stagingDirectory = path.join(testRoot, "staging", "out", "renderer");
  fs.mkdirSync(stagingDirectory, { recursive: true });
  fs.writeFileSync(path.join(stagingDirectory, "index.html"), "<html><head></head><body></body></html>");

  const appAsarPath = path.join(resourcesDirectory, "app.asar");
  await asar.createPackage(path.join(testRoot, "staging"), appAsarPath);

  const sampleImage = path.join(testRoot, "sample.png");
  fs.writeFileSync(sampleImage, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  await installTheme("image", sampleImage, () => {}, testRoot);

  const resourceFiles = fs.readdirSync(resourcesDirectory);
  assert.ok(resourceFiles.includes("app.asar"));
  assert.ok(resourceFiles.includes("app.asar.bak"));
  assert.equal(resourceFiles.filter(name => name.includes(".tmp")).length, 0);

  fs.rmSync(testRoot, { recursive: true, force: true });
});

test("installTheme preserves app.asar untouched when repack throws an error", async () => {
  const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), "engine_adversarial_"));
  const resourcesDirectory = path.join(testRoot, "resources");
  fs.mkdirSync(resourcesDirectory, { recursive: true });

  const stagingDirectory = path.join(testRoot, "staging", "out", "renderer");
  fs.mkdirSync(stagingDirectory, { recursive: true });
  fs.writeFileSync(path.join(stagingDirectory, "index.html"), "<html><head></head><body></body></html>");

  const appAsarPath = path.join(resourcesDirectory, "app.asar");
  await asar.createPackage(path.join(testRoot, "staging"), appAsarPath);
  const originalBuffer = fs.readFileSync(appAsarPath);

  const sampleImage = path.join(testRoot, "sample.png");
  fs.writeFileSync(sampleImage, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  const originalCreatePackage = asar.createPackage;
  asar.createPackage = async (source, destination) => {
    fs.writeFileSync(destination, "partial corrupted content");
    throw new Error("SIMULATED_REPACK_ERROR");
  };

  try {
    await assert.rejects(
      async () => {
        await installTheme("image", sampleImage, () => {}, testRoot);
      },
      /SIMULATED_REPACK_ERROR/
    );

    const currentBuffer = fs.readFileSync(appAsarPath);
    assert.deepEqual(currentBuffer, originalBuffer);

    const resourceFiles = fs.readdirSync(resourcesDirectory);
    assert.equal(resourceFiles.filter(name => name.includes(".tmp")).length, 0);
  } finally {
    asar.createPackage = originalCreatePackage;
    fs.rmSync(testRoot, { recursive: true, force: true });
  }
});
