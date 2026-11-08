// The What's New drawer no longer opens by itself after sign-in. The version line in the
// sidebar and the mobile More sheet can still open it. The layout cannot be mounted here
// (`$app/navigation`, no `$app` alias), so the "does not auto-open" pin reads the source.
// Manual opening is a real mount of MobileMoreSheet.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/svelte";
import { renderWithTheme } from "$tests/test-utils";
import { whatsNewOpen } from "$stores/release-notes";
import { versionStore } from "$stores/version";

vi.mock("$stores/auth", () => ({ authStore: { subscribe: () => () => {} } }));

// fileURLToPath decodes the %28/%29 that the "(app)" route group produces in import.meta.url.
function readRouteFile(relativeFromHere: string, relativeFromCwd: string): string {
  try {
    return readFileSync(fileURLToPath(new URL(relativeFromHere, import.meta.url)), "utf8");
  } catch {
    // Fallback: `pnpm --filter @clokr/web test` runs with cwd `apps/web`.
    return readFileSync(resolve(process.cwd(), relativeFromCwd), "utf8");
  }
}

const APP_LAYOUT = readRouteFile(
  "../routes/(app)/+layout.svelte",
  "src/routes/(app)/+layout.svelte",
);

describe("(app)/+layout.svelte does not auto-open What's New", () => {
  it("never opens the drawer from the app layout", () => {
    expect(APP_LAYOUT).not.toContain("whatsNewOpen.set(true)");
    expect(APP_LAYOUT).not.toContain("hasUnreadReleaseNotes");
    expect(APP_LAYOUT).not.toContain("isMobileViewport");
  });
});

describe("Manual opening at phone width is not collateral damage (prove-it #2)", () => {
  afterEach(() => {
    whatsNewOpen.set(false);
    versionStore.set("");
  });

  it("clicking the version-line button in MobileMoreSheet still opens the drawer while window.innerWidth is at phone width", async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", {
      value: 390,
      configurable: true,
      writable: true,
    });

    try {
      versionStore.set("1.9.18");
      const { default: MobileMoreSheet } =
        await import("$lib/components/layout/MobileMoreSheet.svelte");
      renderWithTheme(MobileMoreSheet, { open: true, sections: [], currentPath: "/dashboard" });

      expect(whatsNewOpen).toBeDefined();
      let open = false;
      whatsNewOpen.subscribe((v) => (open = v))();
      expect(open).toBe(false);

      await fireEvent.click(screen.getByLabelText("Was ist neu in Version 1.9.18"));

      whatsNewOpen.subscribe((v) => (open = v))();
      expect(open).toBe(true);
    } finally {
      Object.defineProperty(window, "innerWidth", {
        value: originalWidth,
        configurable: true,
        writable: true,
      });
    }
  });
});
