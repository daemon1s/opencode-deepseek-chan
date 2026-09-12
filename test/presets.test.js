const test = require("node:test");
const assert = require("node:assert/strict");
const { presets, getPresetById } = require("../src/presets");

test("presets catalog contains four configured presets", () => {
  assert.equal(presets.length, 4);
});

test("all presets have valid contract properties", () => {
  const expectedKeys = ["id", "titleKey", "type", "filename", "expectedSize", "sha256", "remoteUrl"];
  for (const preset of presets) {
    for (const key of expectedKeys) {
      assert.ok(preset[key], `Preset ${preset.id} missing ${key}`);
    }
    assert.ok(typeof preset.expectedSize === "number");
    assert.ok(preset.expectedSize > 0);
    assert.ok(["video", "image"].includes(preset.type));
  }
});

test("getPresetById resolves presets by id case-insensitively", () => {
  const preset = getPresetById("FEISHA-1080P");
  assert.ok(preset);
  assert.equal(preset.id, "feisha-1080p");
  assert.equal(preset.titleKey, "feisha1080");
});

test("getPresetById returns null for unknown preset id", () => {
  const preset = getPresetById("non-existent-preset");
  assert.equal(preset, null);
});
