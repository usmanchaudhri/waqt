// Rewrites already-rendered German UI text to English. The screens keep their
// German source strings (tests and comments depend on them); this pass runs in
// the browser after each render when the active locale is English.
import { de } from "./de";
import { en } from "./en";
import type { Locale } from "./locale";
import { PHRASES } from "./phrases";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE"]);
const ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;

type AttrName = (typeof ATTRS)[number];

const originals = new WeakMap<Text, string>();
const attrOriginals = new WeakMap<Element, Partial<Record<AttrName, string>>>();

function bundlePhrases(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(de) as Array<keyof typeof de>) {
    const from = de[key];
    const to = en[key];
    if (typeof from === "string" && typeof to === "string" && from !== to) out[from] = to;
  }
  return out;
}

const EXACT: Record<string, string> = { ...bundlePhrases(), ...PHRASES };

const LONG_PHRASES = Object.entries(EXACT)
  .filter(([from, to]) => from.length >= 8 && from !== to)
  .sort((a, b) => b[0].length - a[0].length)
  .map(([from, to]) => ({
    to,
    re: new RegExp(
      `(?<![\\p{L}\\p{N}])${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`,
      "gu",
    ),
  }));

const GREETING = /^(\s*)Guten (Morgen|Tag|Abend)(,?\s*)(.*)$/;

function mapExact(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const collapsed = trimmed.replace(/\s+/g, " ");
  const mapped = EXACT[trimmed] ?? (collapsed !== trimmed ? EXACT[collapsed] : undefined);
  if (!mapped || mapped === trimmed) return null;
  const lead = raw.slice(0, raw.indexOf(trimmed));
  const trail = raw.slice(lead.length + trimmed.length);
  return lead + mapped + trail;
}

const CALENDAR = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
  "Januar",
  "Februar",
  "März",
  "Mai",
  "Juni",
  "Juli",
  "Oktober",
  "Dezember",
  "erfasst",
  "Anträge",
].flatMap((from) => {
  const to = EXACT[from];
  if (!to) return [];
  return [
    {
      to,
      re: new RegExp(`(?<![\\p{L}\\p{N}])${from}(?![\\p{L}\\p{N}])`, "gu"),
    },
  ];
});

function applyPhrases(raw: string, phrases: { to: string; re: RegExp }[]): string {
  let out = raw;
  for (const phrase of phrases) {
    phrase.re.lastIndex = 0;
    if (!phrase.re.test(out)) continue;
    phrase.re.lastIndex = 0;
    out = out.replace(phrase.re, phrase.to);
  }
  return out;
}

function mapParts(raw: string): string {
  let out = raw;
  const greeting = GREETING.exec(out);
  if (greeting) {
    const when =
      greeting[2] === "Morgen" ? "morning" : greeting[2] === "Abend" ? "evening" : "afternoon";
    out = `${greeting[1]}Good ${when}${greeting[3]}${greeting[4]}`;
  }
  // Whole sentences with a time or a count in the middle. These run before the
  // word list so "Einstempeln" is not pulled out of "Einstempeln um 09:00".
  out = out.replace(/Noch (\S+) bis zum Tagesziel/g, "$1 left until the daily target");
  out = out.replace(/Du stempelst jetzt um (\d{1,2}:\d{2}) ein\./g, "You are clocking in at $1.");
  out = out.replace(/Du stempelst jetzt um (\d{1,2}:\d{2}) aus\./g, "You are clocking out at $1.");
  out = out.replace(/Einstempeln um (\d{1,2}:\d{2})/g, "Clocked in at $1");
  out = out.replace(/Ausstempeln um (\d{1,2}:\d{2})/g, "Clocked out at $1");
  out = out.replace(
    /Mit automatischer Pause: beim Speichern wird eine Pause von (\d+) Min\. eingetragen\./g,
    "With the automatic break: saving records a $1 min break.",
  );
  out = out.replace(/Pauschale: (\d+) Min\./g, "Flat rate: $1 min");
  out = out.replace(/Gesamt: (\d+) Min\./g, "Total: $1 min");
  out = out.replace(
    /Der Zeitraum (\S+)–jetzt wird als Pause erfasst\. Der heutige Eintrag wird dadurch wieder geöffnet, seine Netto-Arbeitszeit sinkt und der Pausenwert wird neu berechnet\./g,
    "The period $1–now is recorded as a break. Today's entry is opened again, its net working time goes down, and the break total is recalculated.",
  );
  out = applyPhrases(out, LONG_PHRASES);
  out = applyPhrases(out, CALENDAR);
  out = out.replace(
    /(\d+) Min\. Pause erforderlich ab 6:00 Std\. Arbeit\./g,
    "$1 min break required from 6:00 hours of work.",
  );
  out = out.replace(
    /(?:Keine Betriebsurlaube|No company shutdowns) für (\d{4}) angelegt\./g,
    "No company shutdowns set up for $1.",
  );
  out = out.replace(/(^|[\s>])Woche (\d{4}-\d{2}-\d{2})/g, "$1Week $2");
  out = out.replace(/\bKW\b/g, "Week");
  out = out.replace(/\bvor (\d+) Min\./g, "$1 min ago");
  out = out.replace(
    /Summe über (\d+) (?:Personen|Person|people|People)/g,
    "Total across $1 people",
  );
  return out;
}

/** German → English for one visible string. Unknown text is returned unchanged. */
export function translateUi(raw: string, loc: Locale): string {
  if (loc !== "en") return raw;
  const exact = mapExact(raw);
  if (exact !== null) return exact;
  const titled = raw.match(/^(\s*)(.+?)(\s+[–-]\s+Clokr\s*)$/);
  if (titled) {
    const inner = mapExact(titled[2]);
    if (inner !== null) return titled[1] + inner.trimEnd() + titled[3];
  }
  const parts = mapParts(raw);
  return parts === raw ? raw : parts;
}

function skipText(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent) return true;
  if (SKIP_TAGS.has(parent.tagName)) return true;
  if (parent.isContentEditable) return true;
  return false;
}

function sourceText(stored: string | undefined, current: string): string {
  if (stored === undefined) return current;
  const translated = translateUi(stored, "en");
  if (current === stored || current === translated) return stored;
  return current;
}

function translateText(node: Text, loc: Locale): void {
  if (skipText(node)) return;
  const source = sourceText(originals.get(node), node.data);
  originals.set(node, source);
  const next = loc === "en" ? translateUi(source, "en") : source;
  if (node.data !== next) node.data = next;
}

function translateAttrs(el: Element, loc: Locale): void {
  let stored = attrOriginals.get(el);
  for (const attr of ATTRS) {
    const current = el.getAttribute(attr);
    if (current === null) continue;
    if (!stored) {
      stored = {};
      attrOriginals.set(el, stored);
    }
    const source = sourceText(stored[attr], current);
    stored[attr] = source;
    const next = loc === "en" ? translateUi(source, "en") : source;
    if (current !== next) el.setAttribute(attr, next);
  }
}

let applying = false;

/** Translate `root` in place. Safe to call after every Svelte update. */
export function applyLocale(root: ParentNode, loc: Locale): void {
  if (applying) return;
  applying = true;
  try {
    if (root instanceof Element) translateAttrs(root, loc);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      if (current.nodeType === Node.TEXT_NODE) translateText(current as Text, loc);
      else translateAttrs(current as Element, loc);
      current = walker.nextNode();
    }
    if (document.documentElement) document.documentElement.lang = loc;
  } finally {
    applying = false;
  }
}
