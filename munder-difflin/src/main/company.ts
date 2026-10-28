/**
 * The company on disk — `<harnessHome>/company.json` (the editable source) and
 * `<hive>/COMPANY.md` (the brief agents read, rendered from it).
 *
 * Deliberately free of any `electron` import so it can be smoke-tested as a
 * plain Node module (mirrors roster.ts / hire.ts). Writes follow roster.ts's
 * durability rules: temp file + rename, and the previous file is kept as
 * `company.prev.json` so a bad save is one rename away from undone.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderCompanyMd, validateCompanyFile, type CompanyFile } from '../shared/company';

export function companyPath(home: string): string {
  return join(home, 'company.json');
}

/** The shared folder business employees work in (drafts, briefs, sheets). */
export function companyWorkspacePath(home: string): string {
  return join(home, 'company-workspace');
}

export type CompanySaveResult = { ok: true; file: CompanyFile } | { ok: false; errors: string[] };

export class CompanyStore {
  /** `writeBrief` puts the rendered COMPANY.md into the hive (and commits it).
   *  Injected so this module never reaches into HiveManager directly. */
  constructor(
    private readonly getHome: () => string | null,
    private readonly writeBrief: (markdown: string) => void
  ) {}

  private home(): string | null {
    try { return this.getHome(); } catch { return null; }
  }

  /** The saved company, or null when none exists (or it no longer validates). */
  read(): CompanyFile | null {
    const home = this.home();
    if (!home) return null;
    try {
      const p = companyPath(home);
      if (!existsSync(p)) return null;
      const raw = JSON.parse(readFileSync(p, 'utf8')) as { savedAt?: unknown };
      const v = validateCompanyFile(raw);
      if (!v.ok || !v.file) return null;
      return typeof raw.savedAt === 'string' ? { ...v.file, savedAt: raw.savedAt } : v.file;
    } catch {
      return null;
    }
  }

  /** Create (if needed) and return the company workspace folder, or null when
   *  there is no home folder. Every hire needs a working directory; business
   *  roles have no repo of their own, so they share this one. */
  ensureWorkspace(): string | null {
    const home = this.home();
    if (!home) return null;
    const dir = companyWorkspacePath(home);
    try {
      mkdirSync(dir, { recursive: true });
      return dir;
    } catch {
      return null;
    }
  }

  /** Validate, persist, and re-render the hive brief. */
  save(raw: unknown): CompanySaveResult {
    const home = this.home();
    if (!home) return { ok: false, errors: ['choose a home folder first'] };
    const v = validateCompanyFile(raw);
    if (!v.ok || !v.file) return { ok: false, errors: v.errors };
    const file: CompanyFile = { ...v.file, savedAt: new Date().toISOString() };
    const p = companyPath(home);
    try {
      mkdirSync(home, { recursive: true });
      if (existsSync(p)) {
        try { copyFileSync(p, join(home, 'company.prev.json')); } catch { /* a failed backup must never block the save */ }
      }
      const tmp = `${p}.tmp`;
      writeFileSync(tmp, JSON.stringify(file, null, 2), 'utf8');
      renameSync(tmp, p);
    } catch (e) {
      try { rmSync(`${p}.tmp`, { force: true }); } catch { /* noop */ }
      return { ok: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
    try { this.writeBrief(renderCompanyMd(file)); } catch (e) {
      console.warn('[company] saved company.json but could not write COMPANY.md:', e);
    }
    return { ok: true, file };
  }
}
