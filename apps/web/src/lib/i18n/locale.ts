// Active UI language. English is the default so the app reads in English
// without a settings visit. "de" is still available from the language toggle.
import { writable } from "svelte/store";

export type Locale = "de" | "en";

const STORAGE_KEY = "clokr.locale";

function initialLocale(): Locale {
  if (typeof localStorage === "undefined") return "en";
  return localStorage.getItem(STORAGE_KEY) === "de" ? "de" : "en";
}

export const locale = writable<Locale>(initialLocale());

locale.subscribe((value) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, value);
});
