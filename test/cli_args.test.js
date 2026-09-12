const test = require("node:test");
const assert = require("node:assert/strict");
const { parseCliArguments } = require("../bin/cli");

test("parseCliArguments parses no-animation flag", () => {
  const originalArgv = process.argv;
  process.argv = ["node", "cli.js", "--no-animation"];
  const parsed = parseCliArguments();
  process.argv = originalArgv;

  assert.equal(parsed.noAnimation, true);
});

test("parseCliArguments parses custom language flag", () => {
  const originalArgv = process.argv;
  process.argv = ["node", "cli.js", "--lang", "zh"];
  const parsed = parseCliArguments();
  process.argv = originalArgv;

  assert.equal(parsed.lang, "zh");
});

test("parseCliArguments parses preset flag", () => {
  const originalArgv = process.argv;
  process.argv = ["node", "cli.js", "-p", "feisha1080"];
  const parsed = parseCliArguments();
  process.argv = originalArgv;

  assert.equal(parsed.preset, "feisha1080");
});
