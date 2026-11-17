import picomatch from "picomatch/posix";

export interface GlobEntry {
  glob: string;
  enabled: boolean;
}

export const DEFAULT_GLOBS: readonly GlobEntry[] = [
  { glob: "**/*.{test,spec}.{js,ts,jsx,tsx}", enabled: true },
  { glob: "**/test/**", enabled: true },
  { glob: "**/__test__/**", enabled: true },
  { glob: "**/__tests__/**", enabled: true },
  { glob: "**/__fixture__/**", enabled: true },
  { glob: "**/__fixtures__/**", enabled: true },
];

const MATCH_OPTIONS: picomatch.PicomatchOptions = { dot: true };

export function createPathMatcher(entries: readonly GlobEntry[]): (path: string) => boolean {
  const enabledGlobs = entries.filter((entry) => entry.enabled).map((entry) => entry.glob);
  if (enabledGlobs.length === 0) {
    return () => false;
  }
  return picomatch(enabledGlobs, MATCH_OPTIONS);
}

export function validateGlob(glob: string, entries: readonly GlobEntry[]): string | null {
  const trimmed = glob.trim();
  if (trimmed === "") {
    return "Enter a glob.";
  }
  if (entries.some((entry) => entry.glob === trimmed)) {
    return "This glob is already in the list.";
  }
  try {
    picomatch.makeRe(trimmed, { ...MATCH_OPTIONS, strictBrackets: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return `Invalid glob: ${reason.split(" - ")[0]}`;
  }
  return null;
}

function isGlobEntry(value: unknown): value is GlobEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as GlobEntry).glob === "string" &&
    typeof (value as GlobEntry).enabled === "boolean"
  );
}

export function parseStoredGlobs(value: unknown): GlobEntry[] {
  if (!Array.isArray(value)) {
    return DEFAULT_GLOBS.map((entry) => ({ ...entry }));
  }
  return value.filter(isGlobEntry).map(({ glob, enabled }) => ({ glob, enabled }));
}
