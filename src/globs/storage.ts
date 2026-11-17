import { type GlobEntry, parseStoredGlobs } from "./globs";

type GlobsListener = (entries: GlobEntry[]) => void;

const STORAGE_KEY = "globs";

export async function loadGlobs(): Promise<GlobEntry[]> {
  const stored = await chrome.storage.sync.get(STORAGE_KEY);
  return parseStoredGlobs(stored[STORAGE_KEY]);
}

export async function saveGlobs(entries: readonly GlobEntry[]): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: entries });
}

export async function resetGlobs(): Promise<void> {
  await chrome.storage.sync.remove(STORAGE_KEY);
}

export function onGlobsChanged(listener: GlobsListener): () => void {
  const handleChange = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === "sync" && STORAGE_KEY in changes) {
      listener(parseStoredGlobs(changes[STORAGE_KEY].newValue));
    }
  };
  chrome.storage.onChanged.addListener(handleChange);
  return () => chrome.storage.onChanged.removeListener(handleChange);
}
