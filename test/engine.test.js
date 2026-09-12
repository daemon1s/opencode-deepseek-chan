const test = require("node:test");
const assert = require("node:assert/strict");
const { generateThemeCss } = require("../src/engine");

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
