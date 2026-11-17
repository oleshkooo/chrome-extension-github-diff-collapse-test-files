import { XIcon } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { type GlobEntry, validateGlob } from "@/globs/globs";
import { loadGlobs, onGlobsChanged, resetGlobs, saveGlobs } from "@/globs/storage";

const ERROR_ID = "glob-error";

export function Popup() {
  const [entries, setEntries] = useState<GlobEntry[] | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadGlobs().then(setEntries);
    return onGlobsChanged(setEntries);
  }, []);

  if (!entries) {
    return null;
  }

  const update = (next: GlobEntry[]) => {
    setEntries(next);
    void saveGlobs(next);
  };

  const toggle = (glob: string, enabled: boolean) => {
    update(entries.map((entry) => (entry.glob === glob ? { ...entry, enabled } : entry)));
  };

  const remove = (glob: string) => {
    update(entries.filter((entry) => entry.glob !== glob));
  };

  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problem = validateGlob(draft, entries);
    setError(problem);
    if (!problem) {
      update([...entries, { glob: draft.trim(), enabled: true }]);
      setDraft("");
    }
  };

  const enabledCount = entries.filter((entry) => entry.enabled).length;

  return (
    <main className="w-[360px] p-4">
      <h1 className="text-sm font-semibold tracking-tight">Collapse Test Files</h1>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Files that match these globs collapse in pull request diffs. Turn a glob off to keep its
        files open.
      </p>

      {entries.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
          No globs yet. Add one below or press Reset.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-1.5">
          {entries.map((entry) => (
            <li
              key={entry.glob}
              className="flex items-center gap-2.5 rounded-md border py-1 pr-1 pl-2.5"
            >
              <Switch
                size="sm"
                checked={entry.enabled}
                onCheckedChange={(enabled) => toggle(entry.glob, enabled)}
                aria-label={`Collapse files matching ${entry.glob}`}
              />
              <span
                className={`flex-1 font-mono text-xs break-all ${entry.enabled ? "" : "text-muted-foreground line-through"}`}
              >
                {entry.glob}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground"
                onClick={() => remove(entry.glob)}
                aria-label={`Remove ${entry.glob}`}
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form className="mt-3 flex gap-2" onSubmit={add}>
        <Input
          className="h-8 font-mono text-xs md:text-xs"
          placeholder="**/*.snap"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          aria-label="New glob"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? ERROR_ID : undefined}
        />
        <Button type="submit" size="sm">
          Add
        </Button>
      </form>
      {error && (
        <p id={ERROR_ID} className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}

      <footer className="mt-4 flex items-center justify-between border-t pt-3">
        <span className="text-xs text-muted-foreground">
          {enabledCount} of {entries.length} enabled
        </span>
        <Button variant="outline" size="sm" onClick={() => void resetGlobs()}>
          Reset
        </Button>
      </footer>
    </main>
  );
}
