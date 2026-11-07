<script lang="ts">
  import { locale, type Locale } from "$lib/i18n/locale";

  /**
   * LanguageToggle. English is the default. Deutsch switches the visible UI
   * back to the original German strings. Used in the topbar (compact) and
   * Admin Themes (segmented).
   */
  interface Props {
    variant?: "segmented" | "compact";
  }

  let { variant = "segmented" }: Props = $props();

  function select(next: Locale) {
    locale.set(next);
  }

  function toggle() {
    locale.set($locale === "en" ? "de" : "en");
  }
</script>

{#if variant === "segmented"}
  <div class="seg" role="group" aria-label="Sprache auswählen">
    <button
      type="button"
      class="seg-btn"
      class:active={$locale === "de"}
      aria-pressed={$locale === "de"}
      onclick={() => select("de")}
    >
      Deutsch
    </button>
    <button
      type="button"
      class="seg-btn"
      class:active={$locale === "en"}
      aria-pressed={$locale === "en"}
      onclick={() => select("en")}
    >
      English
    </button>
  </div>
{:else}
  <button
    type="button"
    class="lang-btn"
    onclick={toggle}
    title="Sprache"
    aria-label="Sprache wechseln"
  >
    {$locale === "en" ? "EN" : "DE"}
  </button>
{/if}

<style>
  /* Segmented variant — mirrors the .seg/.seg-btn recipe from /admin/themes. */
  .seg {
    display: inline-flex;
    padding: 2px;
    gap: 2px;
    background: var(--bg-subtle);
    border-radius: var(--r-pill);
  }
  .seg-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border: 0;
    background: transparent;
    color: var(--text-muted);
    border-radius: var(--r-pill);
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background 120ms var(--ease-out),
      color 120ms var(--ease-out);
  }
  .seg-btn:hover {
    color: var(--text);
  }
  .seg-btn:focus-visible {
    outline: 2px solid var(--brand-light);
    outline-offset: 2px;
  }
  .seg-btn.active {
    background: var(--bg-card);
    color: var(--text);
    box-shadow: var(--shadow-sm);
  }

  /* Compact variant — matches the .lang-btn recipe from Topbar.svelte. */
  .lang-btn {
    width: 36px;
    height: 36px;
    border-radius: var(--r-sm);
    border: 1px solid transparent;
    background: transparent;
    display: grid;
    place-items: center;
    color: var(--text-muted);
    cursor: pointer;
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0.06em;
    transition:
      background 120ms var(--ease-out),
      color 120ms var(--ease-out);
  }
  .lang-btn:hover {
    background: var(--bg-subtle);
    color: var(--text);
  }
  .lang-btn:focus-visible {
    outline: 2px solid var(--brand-light);
    outline-offset: 2px;
  }
</style>
