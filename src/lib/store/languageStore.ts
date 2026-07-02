import { writable, derived } from 'svelte/store';
import { setLanguageTag, availableLanguageTags, type AvailableLanguageTag } from '$lib/paraglide/runtime.js';

const STORAGE_KEY = 'skull-king-lang';
const PIRATE_KEY = 'skull-king-pirate';

type BaseLang = 'en' | 'fr';

function detectBaseLang(): BaseLang {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'fr') return stored;
  }
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'fr') return 'fr';
  }
  return 'en';
}

function detectPirate(): boolean {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(PIRATE_KEY) === 'true';
  }
  return false;
}

function toTag(base: BaseLang, pirate: boolean): AvailableLanguageTag {
  const tag = pirate ? `${base}-pirate` : base;
  if ((availableLanguageTags as readonly string[]).includes(tag)) {
    return tag as AvailableLanguageTag;
  }
  return base;
}

const initialBase = detectBaseLang();
const initialPirate = detectPirate();
const initialTag = toTag(initialBase, initialPirate);
setLanguageTag(initialTag);

export const baseLangStore = writable<BaseLang>(initialBase);
export const pirateStore = writable<boolean>(initialPirate);

export const languageStore = derived(
  [baseLangStore, pirateStore],
  ([$base, $pirate]) => toTag($base, $pirate),
);

// Keep paraglide in sync whenever languageStore changes
languageStore.subscribe((tag) => setLanguageTag(tag));

export function setLanguage(lang: BaseLang) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang);
  }
  baseLangStore.set(lang);
}

export function togglePirate() {
  pirateStore.update((v) => {
    const next = !v;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PIRATE_KEY, String(next));
    }
    return next;
  });
}
