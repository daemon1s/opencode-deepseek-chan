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
