const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const {
  getFallbackUrls,
  verifyFileSize,
  verifyFileIntegrity,
  resolveAssetPath
} = require("../src/downloader");

test("getFallbackUrls generates expected mirror alternatives", () => {
  const originalUrl = "https://github.com/daemon1s/opencode-deepseek-chan/releases/download/v1.0.0/deepseek-anime-1080p.mp4";
  const mirrors = getFallbackUrls(originalUrl);
  assert.ok(Array.isArray(mirrors));
  assert.ok(mirrors.length >= 2);
  assert.equal(mirrors[0], `https://ghproxy.net/${originalUrl}`);
  assert.equal(mirrors[1], `https://mirror.ghproxy.com/${originalUrl}`);
});

test("verifyFileSize checks file byte length correctly", () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "downloader_test_"));
  const sampleFile = path.join(temporaryDirectory, "sample.bin");
  fs.writeFileSync(sampleFile, Buffer.alloc(1024));

  assert.equal(verifyFileSize(sampleFile, 1024), true);
  assert.equal(verifyFileSize(sampleFile, 2048), false);
  assert.equal(verifyFileSize(path.join(temporaryDirectory, "not_found.bin"), 1024), false);

  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

test("verifyFileIntegrity accepts matching sha256 and rejects mismatches", () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "downloader_hash_test_"));
  const sampleFile = path.join(temporaryDirectory, "sample.bin");
  fs.writeFileSync(sampleFile, Buffer.from("opencode-theme-deepseek"));

  const crypto = require("node:crypto");
  const expectedHash = crypto.createHash("sha256").update(Buffer.from("opencode-theme-deepseek")).digest("hex");

  assert.equal(verifyFileIntegrity(sampleFile, expectedHash), true);
  assert.equal(verifyFileIntegrity(sampleFile, expectedHash.toUpperCase()), true);
  assert.equal(verifyFileIntegrity(sampleFile, "0".repeat(64)), false);
  assert.equal(verifyFileIntegrity(sampleFile, null), false);
  assert.equal(verifyFileIntegrity(path.join(temporaryDirectory, "not_found.bin"), expectedHash), false);

  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

test("resolveAssetPath locates local file when present", () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "downloader_local_test_"));
  const sampleFile = path.join(temporaryDirectory, "sample.mp4");
  fs.writeFileSync(sampleFile, Buffer.alloc(500));

  const preset = {
    filename: "sample.mp4",
    expectedSize: 500
  };

  const resolved = resolveAssetPath(preset, temporaryDirectory, path.join(temporaryDirectory, "cache"));
  assert.equal(resolved, sampleFile);

  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});
