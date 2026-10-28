'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, existsSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const loadTs = require('./load-ts.cjs');

const {
  COMPANY_SPEC_V1,
  EMPLOYEE_ROLES,
  validateCompanyFile,
  renderCompanyMd,
  hireManifestForSeat,
  missionForSeat,
  mergeCompanyMissions
} = loadTs('src/shared/company.ts');
const { validateHireManifest } = loadTs('src/shared/hire.ts');
const { CompanyStore } = loadTs('src/main/company.ts');

const company = (staffing = []) => ({
  spec: COMPANY_SPEC_V1,
  profile: {
    name: 'Acme Robotics',
    oneLiner: 'Warehouse robots for small retailers.',
    goals: 'Become a $1B company. Next: first 10 paying customers.',
    channels: 'X @acme, LinkedIn /company/acme'
  },
  staffing
});

test('a minimal company validates; name and one-liner are required', () => {
  assert.equal(validateCompanyFile(company()).ok, true);
  const bad = validateCompanyFile({ profile: { name: ' ' } });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some((e) => /name/.test(e)));
  assert.ok(bad.errors.some((e) => /oneLiner/.test(e)));
});

test('validation rejects unknown roles, duplicate names, bad providers and non-http websites', () => {
  const v = validateCompanyFile({
    ...company([
      { roleId: 'growth', name: 'Andy', cadenceMs: 3_600_000 },
      { roleId: 'social', name: 'andy', cadenceMs: 3_600_000 },
      { roleId: 'astronaut', name: 'Neil', cadenceMs: 3_600_000 },
      { roleId: 'sales', name: 'Dwight', cadenceMs: 3_600_000, provider: 'custom' }
    ]),
    profile: { ...company().profile, website: 'javascript:alert(1)' }
  });
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => /both named/.test(e)));
  assert.ok(v.errors.some((e) => /unknown role/.test(e)));
  assert.ok(v.errors.some((e) => /unknown provider/.test(e)));
  assert.ok(v.errors.some((e) => /website/.test(e)));
});

test('cadence is clamped to [15 min, 7 days]', () => {
  const v = validateCompanyFile(company([
    { roleId: 'growth', name: 'Andy', cadenceMs: 1 },
    { roleId: 'social', name: 'Ryan', cadenceMs: 1e12 }
  ]));
  assert.equal(v.ok, true);
  assert.equal(v.file.staffing[0].cadenceMs, 15 * 60_000);
  assert.equal(v.file.staffing[1].cadenceMs, 7 * 24 * 3_600_000);
});

test('COMPANY.md carries goals, channels, default guardrails and the team', () => {
  const md = renderCompanyMd(validateCompanyFile(company([{ roleId: 'social', name: 'Ryan', cadenceMs: 3_600_000 }])).file);
  assert.match(md, /^<!-- Written by Munder Difflin/);
  assert.match(md, /# Acme Robotics/);
  assert.match(md, /-->\n\n# Acme Robotics\n\n> Warehouse robots[^\n]*\n\n/, 'title, one-liner and body are separate blocks');
  assert.match(md, /inside the guardrails\.\n\n## Goals/, 'the intro paragraph is its own block');
  assert.match(md, /## Goals\n\nBecome a \$1B company/);
  assert.match(md, /## Channels/);
  assert.match(md, /## Guardrails — never without the owner\n\nSpending money/);
  assert.match(md, /\*\*Ryan\*\* — Social Media Manager/);
  assert.doesNotMatch(md, /\n{3,}/);
});

test('every role builds a hire manifest that passes the shared-hire validator', () => {
  const { profile } = company();
  for (const role of EMPLOYEE_ROLES) {
    const m = hireManifestForSeat({ roleId: role.id, name: role.defaultName, cadenceMs: role.defaultCadenceMs }, profile);
    assert.ok(m, `${role.id} produced no manifest`);
    assert.equal(validateHireManifest(m).ok, true, `${role.id} manifest does not validate`);
    assert.equal(m.commandFlags, undefined, 'a company hire must not carry spawn flags');
    assert.match(m.goal, /COMPANY\.md/);
  }
});

test('mission ids are stable per seat and target god', () => {
  const seat = { roleId: 'social', name: 'Ryan Howard', cadenceMs: 4 * 3_600_000 };
  const m = missionForSeat(seat, company().profile);
  assert.equal(m.id, 'company-social-ryan-howard');
  assert.equal(m.to, 'god');
  assert.equal(m.intervalMs, 4 * 3_600_000);
  assert.match(m.body, /Ryan Howard/);
});

test('merging company missions updates, appends and drops seats but never touches other missions', () => {
  const first = validateCompanyFile(company([
    { roleId: 'growth', name: 'Andy', cadenceMs: 3_600_000 },
    { roleId: 'social', name: 'Ryan', cadenceMs: 3_600_000 }
  ])).file;
  const standup = { id: 'ops-standup', enabled: true, label: 'Hourly ops standup' };
  const merged1 = mergeCompanyMissions([standup], first);
  assert.deepEqual(merged1.map((m) => m.id), ['ops-standup', 'company-growth-andy', 'company-social-ryan']);

  // The owner paused Andy's schedule; the scheduler stamped lastFiredAt.
  const edited = merged1.map((m) => (m.id === 'company-growth-andy' ? { ...m, enabled: false, lastFiredAt: 42 } : m));
  const second = validateCompanyFile(company([
    { roleId: 'growth', name: 'Andy', cadenceMs: 7_200_000 },
    { roleId: 'sales', name: 'Dwight', cadenceMs: 3_600_000 }
  ])).file;
  const merged2 = mergeCompanyMissions(edited, second);
  assert.deepEqual(merged2.map((m) => m.id), ['ops-standup', 'company-growth-andy', 'company-sales-dwight']);
  const andy = merged2.find((m) => m.id === 'company-growth-andy');
  assert.equal(andy.enabled, false, 'a paused seat stays paused');
  assert.equal(andy.lastFiredAt, 42);
  assert.equal(andy.intervalMs, 7_200_000);
  assert.equal(merged2[0], standup, 'non-company missions are passed through untouched');
});

test('CompanyStore saves company.json, keeps a backup, and renders the brief', () => {
  const home = mkdtempSync(join(tmpdir(), 'munder-company-'));
  try {
    const briefs = [];
    const store = new CompanyStore(() => home, (md) => briefs.push(md));
    assert.equal(store.read(), null);

    assert.equal(store.save({ profile: { name: 'x' } }).ok, false);
    assert.equal(existsSync(join(home, 'company.json')), false, 'an invalid save writes nothing');

    const res = store.save(company([{ roleId: 'support', name: 'Kelly', cadenceMs: 3_600_000 }]));
    assert.equal(res.ok, true);
    assert.equal(briefs.length, 1);
    assert.match(briefs[0], /Kelly/);
    const back = store.read();
    assert.equal(back.profile.name, 'Acme Robotics');
    assert.equal(typeof back.savedAt, 'string');

    store.save(company());
    assert.equal(JSON.parse(readFileSync(join(home, 'company.prev.json'), 'utf8')).staffing.length, 1);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('CompanyStore refuses to save without a home folder', () => {
  const store = new CompanyStore(() => null, () => { throw new Error('should not write'); });
  assert.deepEqual(store.save(company()), { ok: false, errors: ['choose a home folder first'] });
});

test('CompanyStore.ensureWorkspace creates the shared hire folder inside the home', () => {
  const home = mkdtempSync(join(tmpdir(), 'munder-company-ws-'));
  try {
    const store = new CompanyStore(() => home, () => {});
    const ws = store.ensureWorkspace();
    assert.equal(ws, join(home, 'company-workspace'));
    assert.equal(existsSync(ws), true);
    assert.equal(store.ensureWorkspace(), ws, 'idempotent');
    assert.equal(new CompanyStore(() => null, () => {}).ensureWorkspace(), null);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
