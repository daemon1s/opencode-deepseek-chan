const test = require("node:test");
const assert = require("node:assert/strict");
const { detectLocale, getLocaleStrings, locales } = require("../src/i18n");
const { presets } = require("../src/presets");

test("detectLocale respects explicit supported languages", () => {
  assert.equal(detectLocale("zh"), "zh");
  assert.equal(detectLocale("es"), "es");
  assert.equal(detectLocale("en"), "en");
});

test("detectLocale falls back to en for unknown languages", () => {
  assert.equal(detectLocale("fr"), "en");
  assert.equal(detectLocale("de"), "en");
  assert.equal(detectLocale("it"), "en");
});

test("detectLocale defaults to en when no argument is specified", () => {
  assert.equal(detectLocale(), "en");
  assert.equal(detectLocale(null), "en");
  assert.equal(detectLocale(""), "en");
});

test("all supported locales contain required interface keys", () => {
  const supportedLocales = ["en", "zh", "es"];
  const requiredKeys = [
    "bannerTitle",
    "selectPrompt",
    "restoreOption",
    "exitOption",
    "downloading",
    "downloadFallback",
    "opencodeRunning",
    "installSuccess",
    "restoreSuccess",
    "pathNotFound",
    "error",
    "changeLangOption",
    "selectLangPrompt",
    "cancelOption"
  ];

  for (const locale of supportedLocales) {
    const strings = getLocaleStrings(locale);
    for (const key of requiredKeys) {
      assert.ok(strings[key], `Locale ${locale} missing key ${key}`);
    }
  }
});

test("locales do not contain deprecated customOption", () => {
  const supportedLocales = ["en", "zh", "es"];
  for (const locale of supportedLocales) {
    const strings = getLocaleStrings(locale);
    assert.equal(strings.customOption, undefined);
  }
});

test("all presets have translated titles in all supported locales", () => {
  const supportedLocales = ["en", "zh", "es"];
  for (const preset of presets) {
    for (const locale of supportedLocales) {
      const strings = getLocaleStrings(locale);
      assert.ok(
        strings[preset.titleKey],
        `Locale ${locale} missing preset translation for ${preset.titleKey}`
      );
    }
  }
});
