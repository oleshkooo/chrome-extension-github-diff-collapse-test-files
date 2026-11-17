import { describe, expect, test } from "vite-plus/test";

import { createPathMatcher, DEFAULT_GLOBS, parseStoredGlobs, validateGlob } from "./globs";

describe("createPathMatcher with the default globs", () => {
  const isCollapsible = createPathMatcher(DEFAULT_GLOBS);

  test.each([
    "src/data-sources/__tests__/bagel.spec.ts",
    "src/app.test.js",
    "web/Button.spec.jsx",
    "web/Button.test.tsx",
    "curiosity-center.spec.ts",
  ])("collapses the spec or test file %s", (path) => {
    expect(isCollapsible(path)).toBe(true);
  });

  test.each([
    "src/helpers/curiosity-ancestor/__fixtures__/synthetic.ts",
    "src/__fixture__/tree.json",
    "src/__test__/helpers.ts",
    "src/services/__tests__/snapshots/output.json",
    "__tests__/setup.js",
    "test/fixtures-capture/curiosity-ancestor.ts",
    "packages/forms/signals/test/web/form_field.ts",
    "test/data/places.json",
  ])("collapses %s inside a test or fixture folder", (path) => {
    expect(isCollapsible(path)).toBe(true);
  });

  test.each([
    "src/data-sources/bagel.ts",
    "src/common/cache-keys.constants.ts",
    "src/data/curiosity-ancestor/places.json",
    "tests/setup.ts",
    "src/test-utils/render.ts",
    "src/contest/test.ts",
    "src/test.ts",
    "src/app.spec.json",
    "src/app.spec.ts.snap",
    "src/latest.ts",
    "src/my__tests__/helper.ts",
    "src/__tests__.ts",
    "CLAUDE.md",
  ])("keeps %s expanded", (path) => {
    expect(isCollapsible(path)).toBe(false);
  });
});

describe("createPathMatcher with custom globs", () => {
  test("ignores disabled globs", () => {
    const isCollapsible = createPathMatcher([
      { glob: "**/*.snap", enabled: true },
      { glob: "**/test/**", enabled: false },
    ]);

    expect(isCollapsible("src/__snapshots__/app.snap")).toBe(true);
    expect(isCollapsible("test/setup.ts")).toBe(false);
  });

  test("matches nothing when the list is empty", () => {
    expect(createPathMatcher([])("src/app.spec.ts")).toBe(false);
  });

  test("matches dotfiles and dot folders", () => {
    const isCollapsible = createPathMatcher([{ glob: "**/test/**", enabled: true }]);

    expect(isCollapsible(".github/test/workflow.yml")).toBe(true);
  });
});

describe("validateGlob", () => {
  const entries = [{ glob: "**/test/**", enabled: true }];

  test("accepts a new glob", () => {
    expect(validateGlob("**/*.snap", entries)).toBeNull();
  });

  test("rejects an empty glob", () => {
    expect(validateGlob("   ", entries)).toBe("Enter a glob.");
  });

  test("rejects a glob already in the list", () => {
    expect(validateGlob(" **/test/** ", entries)).toBe("This glob is already in the list.");
  });

  test("rejects a glob with an unclosed bracket", () => {
    expect(validateGlob("src/[abc.ts", entries)).toBe('Invalid glob: Missing closing: "]"');
  });
});

describe("parseStoredGlobs", () => {
  test("falls back to the default globs when nothing is stored", () => {
    expect(parseStoredGlobs(undefined)).toEqual(DEFAULT_GLOBS);
  });

  test("keeps a stored list, even an empty one", () => {
    const stored = [{ glob: "**/*.snap", enabled: false }];

    expect(parseStoredGlobs(stored)).toEqual(stored);
    expect(parseStoredGlobs([])).toEqual([]);
  });

  test("drops malformed entries", () => {
    expect(
      parseStoredGlobs([{ glob: "**/*.snap", enabled: true }, { glob: 1 }, "x", null]),
    ).toEqual([{ glob: "**/*.snap", enabled: true }]);
  });
});
