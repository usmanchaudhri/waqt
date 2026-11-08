// Long dates on the clock card and the time-entry popup. The German pattern
// stays day-first; English uses month-first so the heading does not keep the
// German "8. November" order when the UI language is English.
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import type { Locale } from "./locale";

export function formatLongDate(date: Date, loc: Locale, withYear = false): string {
  if (loc === "de") {
    return format(date, withYear ? "EEEE, d. MMMM yyyy" : "EEEE, d. MMMM", { locale: de });
  }
  return format(date, withYear ? "EEEE, MMMM d, yyyy" : "EEEE, MMMM d", { locale: enUS });
}
