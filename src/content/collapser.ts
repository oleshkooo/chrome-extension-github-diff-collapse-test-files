import { createPathMatcher } from "@/globs/globs";
import { loadGlobs, onGlobsChanged } from "@/globs/storage";

interface DiffView {
  header: string;
  toggle: string;
  expandedToggle: string;
  readPath: (header: HTMLElement) => string | undefined;
}

interface ClickRecord {
  count: number;
  at: number;
}

const PULL_REQUEST_DIFF_PAGE = /^\/[^/]+\/[^/]+\/pull\/\d+\/(files|changes|commits)(\/|$)/;
const BIDI_MARKS = /[\u200e\u200f\u202a-\u202e]/g;
const RENAME_ARROW = "→";
const RETRY_DELAY_MS = 500;
const MAX_CLICKS = 20;

const CLASSIC_VIEW: DiffView = {
  header: ".file-header[data-path]",
  toggle: "button.js-details-target",
  expandedToggle: 'button.js-details-target[aria-expanded="true"]',
  readPath: (header) => header.dataset.path,
};

const REACT_VIEW: DiffView = {
  header: '[class*="diffHeaderWrapper"]',
  toggle: "button:has(> .octicon-chevron-down, > .octicon-chevron-right)",
  expandedToggle: "button:has(> .octicon-chevron-down)",
  readPath: (header) => {
    const fileLink = header.querySelector('[class*="file-path-section"] a');
    const linkText = fileLink?.textContent.replace(BIDI_MARKS, "") ?? "";
    return linkText.split(RENAME_ARROW).pop()?.trim();
  },
};

const settledPaths = new Set<string>();
const clicksByPath = new Map<string, ClickRecord>();
let isCollapsible = createPathMatcher([]);
let handledPage = "";
let scanQueued = false;
let retryQueued = false;

function settle(path: string) {
  settledPaths.add(path);
  clicksByPath.delete(path);
}

function collapseOnce(view: DiffView, header: HTMLElement) {
  const path = view.readPath(header);
  if (!path || settledPaths.has(path) || !header.querySelector(view.toggle)) {
    return;
  }
  const expandedToggle = header.querySelector<HTMLElement>(view.expandedToggle);
  const clicks = clicksByPath.get(path) ?? { count: 0, at: 0 };
  if (!isCollapsible(path) || !expandedToggle || clicks.count >= MAX_CLICKS) {
    settle(path);
    return;
  }
  if (performance.now() - clicks.at >= RETRY_DELAY_MS) {
    expandedToggle.click();
    clicksByPath.set(path, { count: clicks.count + 1, at: performance.now() });
  }
}

function queueRetry() {
  if (!retryQueued && clicksByPath.size > 0) {
    retryQueued = true;
    setTimeout(() => {
      retryQueued = false;
      queueScan();
    }, RETRY_DELAY_MS);
  }
}

function scan() {
  scanQueued = false;
  if (!PULL_REQUEST_DIFF_PAGE.test(location.pathname)) {
    return;
  }
  const page = location.pathname + location.search;
  if (page !== handledPage) {
    settledPaths.clear();
    clicksByPath.clear();
    handledPage = page;
  }
  for (const view of [CLASSIC_VIEW, REACT_VIEW]) {
    for (const header of document.querySelectorAll<HTMLElement>(view.header)) {
      collapseOnce(view, header);
    }
  }
  queueRetry();
}

function queueScan() {
  if (!scanQueued) {
    scanQueued = true;
    requestAnimationFrame(scan);
  }
}

async function start() {
  isCollapsible = createPathMatcher(await loadGlobs());
  onGlobsChanged((entries) => {
    isCollapsible = createPathMatcher(entries);
  });
  new MutationObserver(queueScan).observe(document, { childList: true, subtree: true });
  queueScan();
}

void start();
