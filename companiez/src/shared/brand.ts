/**
 * Brand — the one place that says what this app is called and where it lives.
 *
 * Companiez is a fork of Munder Difflin (MIT, © Chaitanya Giri). The upstream
 * repo is credited in UPSTREAM and in NOTICE.md; nothing at run time talks to it.
 *
 * `repo` is the GitHub `owner/name` that publishes Companiez releases and the
 * two refreshable payloads (`docs/hero.json`, `docs/model-catalog.json`).
 * While it is EMPTY, every network feature that would read from it stays off:
 * auto-update never checks, the Settings hero keeps its baked copy, and the
 * model list keeps the catalog compiled into the app. Set it (and `publish` in
 * electron-builder.yml) once you have a repo, and those features switch on.
 */
export const BRAND = {
  name: 'Companiez',
  upper: 'COMPANIEZ',
  /** Package / file-name slug. */
  slug: 'companiez',
  /** Deep-link URL scheme (`companiez://hire?src=…`). */
  scheme: 'companiez',
  tagline: 'An office of AI employees, working for your company 24/7.',
  repo: '' as string,
  homepage: '' as string
} as const;

export const UPSTREAM = {
  name: 'Munder Difflin',
  author: 'Chaitanya Giri',
  repo: 'chaitanyagiri/munder-difflin',
  license: 'MIT'
} as const;

/** `https://github.com/<repo>` for the Companiez repo, or null when unset. */
export function brandRepoUrl(): string | null {
  return BRAND.repo ? `https://github.com/${BRAND.repo}` : null;
}

/** Raw URL of a file on the Companiez repo's main branch, or null when unset. */
export function brandRawUrl(path: string): string | null {
  return BRAND.repo ? `https://raw.githubusercontent.com/${BRAND.repo}/main/${path}` : null;
}
