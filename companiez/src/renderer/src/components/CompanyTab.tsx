import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PixelButton } from './PixelButton';
import { useStore } from '@/store/store';
import {
  Callout, Field, Hint, Muted, Scroll, Select, SubCard, Toggle, TriggerCard,
  fmtInterval, inputStyle, textareaStyle
} from './triggers/ui';
import {
  CADENCE_OPTIONS_MS,
  COMPANY_SPEC_V1,
  COMPANY_STAGES,
  EMPLOYEE_ROLES,
  hireManifestForSeat,
  mergeCompanyMissions,
  type CompanyFile,
  type CompanyProfile,
  type CompanyStage,
  type StaffingChoice
} from '@shared/company';
import type { HireManifest } from '@shared/hire';

/**
 * COMPANY — the business the office works for, and the team it staffs.
 *
 * Three cards, top to bottom in the order an owner fills them in:
 *   profile  — saved to company.json and rendered into <hive>/COMPANY.md, which
 *              every agent reads at the start of every task.
 *   team     — business seats (marketing, social, sales, support…), each with a
 *              name and a standing-work-order cadence.
 *   24/7     — the two existing switches that keep a floor working unattended:
 *              the heartbeat mission and the strong keep-alive.
 *
 * "Hire & schedule" never spawns anything itself: it merges one dispatch mission
 * per seat into the schedules (to god, who routes it) and drops a hire manifest
 * for every seat not yet on the floor into the reviewed hire queue — the owner
 * still approves each spawn in the Add-Agent modal.
 */

type Seat = StaffingChoice & { on: boolean };

const STAGE_KEY: Record<CompanyStage, string> = {
  idea: 'company.stageIdea',
  'pre-revenue': 'company.stagePreRevenue',
  'early-revenue': 'company.stageEarlyRevenue',
  scaling: 'company.stageScaling'
};

const DEFAULT_ON = new Set(['strategy', 'growth', 'social', 'sales']);

function defaultSeats(): Seat[] {
  return EMPLOYEE_ROLES.map((r) => ({
    roleId: r.id,
    name: r.defaultName,
    cadenceMs: r.defaultCadenceMs,
    on: DEFAULT_ON.has(r.id)
  }));
}

/** Overlay saved staffing onto the full role list, so roles added in a later
 *  release still show up (switched off) for a company saved before them. */
function seatsFrom(file: CompanyFile | null): Seat[] {
  if (!file) return defaultSeats();
  const saved = new Map(file.staffing.map((s) => [s.roleId, s] as const));
  return EMPLOYEE_ROLES.map((r) => {
    const s = saved.get(r.id);
    return s ? { ...s, on: true } : { roleId: r.id, name: r.defaultName, cadenceMs: r.defaultCadenceMs, on: false };
  });
}

interface Mission { id: string; enabled: boolean; kind?: string }

export function CompanyTab() {
  const { t } = useTranslation();
  const agents = useStore((s) => s.agents);
  const enqueuePendingHires = useStore((s) => s.enqueuePendingHires);
  const setAddAgentOpen = useStore((s) => s.setAddAgentOpen);

  const [profile, setProfile] = useState<CompanyProfile>({ name: '', oneLiner: '' });
  const [seats, setSeats] = useState<Seat[]>(defaultSeats);
  const [status, setStatus] = useState<{ tone: 'note' | 'warn'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [keepAwake, setKeepAwake] = useState(false);

  useEffect(() => {
    void window.cth.getCompany().then((file) => {
      if (!file) return;
      setProfile(file.profile);
      setSeats(seatsFrom(file));
    }).catch(() => { /* noop — an empty form is the right fallback */ });
    void window.cth.getConfig().then((c) => setKeepAwake(c.strongKeepalive === true)).catch(() => { /* noop */ });
    const loadMissions = () => { window.cth.listMissions().then(setMissions).catch(() => { /* noop */ }); };
    loadMissions();
    return window.cth.onMissionsUpdated(loadMissions);
  }, []);

  const setField = <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));
  const patchSeat = (roleId: string, fields: Partial<Seat>) =>
    setSeats((all) => all.map((s) => (s.roleId === roleId ? { ...s, ...fields } : s)));

  const staffed = seats.filter((s) => s.on);
  const file: CompanyFile = useMemo(() => ({
    spec: COMPANY_SPEC_V1,
    profile,
    staffing: seats.filter((s) => s.on).map(({ on: _on, ...seat }) => seat)
  }), [profile, seats]);
  const profileReady = !!profile.name?.trim() && !!profile.oneLiner?.trim();

  const save = async (): Promise<CompanyFile | null> => {
    if (!profileReady) { setStatus({ tone: 'warn', text: t('company.needsProfile') }); return null; }
    setBusy(true);
    try {
      const res = await window.cth.saveCompany(file);
      if (!res.ok) { setStatus({ tone: 'warn', text: t('company.saveFailed', { errors: res.errors.join('; ') }) }); return null; }
      setStatus({ tone: 'note', text: t('company.saved') });
      return res.file;
    } catch (e) {
      setStatus({ tone: 'warn', text: t('company.saveFailed', { errors: String(e) }) });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const hireAndSchedule = async () => {
    const saved = await save();
    if (!saved) return;
    setBusy(true);
    try {
      const current = await window.cth.listMissions();
      const next = mergeCompanyMissions(current, saved);
      await window.cth.saveMissions(next as typeof current);
      setMissions(next);

      const onFloor = new Set(agents.map((a) => a.name.trim().toLowerCase()));
      const manifests = saved.staffing
        .filter((s) => !onFloor.has(s.name.toLowerCase()))
        .map((s) => hireManifestForSeat(s, saved.profile))
        .filter((m): m is HireManifest => m !== null);
      if (manifests.length > 0) {
        // Every hire needs a working folder and business roles have no repo, so
        // put the shared company workspace first in the project quick-picks —
        // the hire review opens with it already selected.
        const workspace = await window.cth.companyWorkspace();
        if (workspace) {
          const cfg = await window.cth.getConfig();
          const repos = cfg.registeredRepos ?? [];
          if (repos[0] !== workspace) {
            await window.cth.updateConfig({ registeredRepos: [workspace, ...repos.filter((r) => r !== workspace)] });
          }
        }
        enqueuePendingHires(manifests);
        setAddAgentOpen(true);
      }
      setStatus({
        tone: 'note',
        text: manifests.length > 0
          ? t('company.hired', { scheduled: saved.staffing.length, queued: manifests.length })
          : t('company.allOnFloor', { scheduled: saved.staffing.length })
      });
    } catch (e) {
      setStatus({ tone: 'warn', text: t('company.saveFailed', { errors: String(e) }) });
    } finally {
      setBusy(false);
    }
  };

  const heartbeat = missions.find((m) => m.id === 'heartbeat' || m.kind === 'heartbeat');
  const toggleHeartbeat = () => {
    if (!heartbeat) return;
    const next = missions.map((m) => (m === heartbeat ? { ...m, enabled: !m.enabled } : m));
    setMissions(next);
    void window.cth.saveMissions(next as Parameters<typeof window.cth.saveMissions>[0]).catch(() => { /* noop */ });
  };
  const toggleKeepAwake = async () => {
    try { setKeepAwake((await window.cth.updateConfig({ strongKeepalive: !keepAwake })).strongKeepalive === true); } catch { /* noop */ }
  };

  const text = (key: keyof CompanyProfile, label: string, placeholder?: string) => (
    <Field label={label}>
      <input
        value={(profile[key] as string | undefined) ?? ''}
        onChange={(e) => setField(key, e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </Field>
  );
  const area = (key: keyof CompanyProfile, label: string, placeholder?: string, rows = 3) => (
    <Field label={label}>
      <textarea
        value={(profile[key] as string | undefined) ?? ''}
        onChange={(e) => setField(key, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...textareaStyle, fontFamily: 'var(--cth-font-ui)' }}
      />
    </Field>
  );

  return (
    <Scroll>
      <Muted>{t('company.intro')}</Muted>
      <div style={{ height: 8 }} />

      <TriggerCard
        title={t('company.profile')}
        blurb={t('company.profileBlurb')}
        summary={profile.name?.trim() || undefined}
        defaultOpen
      >
        {text('name', t('company.name'))}
        {text('oneLiner', t('company.oneLiner'), t('company.oneLinerPlaceholder'))}
        {text('website', t('company.website'), 'https://')}
        {text('industry', t('company.industry'))}
        <Field label={t('company.stage')}>
          <Select value={profile.stage ?? ''} onChange={(v) => setField('stage', (v || undefined) as CompanyStage | undefined)}>
            <option value="">—</option>
            {COMPANY_STAGES.map((s) => <option key={s} value={s}>{t(STAGE_KEY[s])}</option>)}
          </Select>
        </Field>
        {area('goals', t('company.goals'), t('company.goalsPlaceholder'))}
        {area('offer', t('company.offer'), t('company.offerPlaceholder'))}
        {area('customers', t('company.customers'), t('company.customersPlaceholder'))}
        {area('brandVoice', t('company.brandVoice'), t('company.brandVoicePlaceholder'), 2)}
        {area('competitors', t('company.competitors'), undefined, 2)}
        {area('channels', t('company.channels'), t('company.channelsPlaceholder'), 2)}
        {area('guardrails', t('company.guardrails'), undefined, 3)}
        <Hint>{t('company.guardrailsHint')}</Hint>
        {area('notes', t('company.notes'), undefined, 3)}
      </TriggerCard>

      <TriggerCard
        title={t('company.team')}
        blurb={t('company.teamBlurb')}
        summary={t('company.teamSummary', { count: staffed.length })}
        defaultOpen
      >
        {EMPLOYEE_ROLES.map((role) => {
          const seat = seats.find((s) => s.roleId === role.id)!;
          return (
            <SubCard key={role.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontFamily: 'var(--cth-font-display)', fontSize: 8, lineHeight: '12px', color: 'var(--cth-ink-900)' }}>
                    {t(`company.roles.${role.id}.title`)}
                  </span>
                  <span style={{ display: 'block', fontSize: 12, lineHeight: '16px', color: 'var(--cth-ink-500)', marginTop: 2 }}>
                    {t(`company.roles.${role.id}.blurb`)}
                  </span>
                </span>
                <Toggle on={seat.on} onClick={() => patchSeat(role.id, { on: !seat.on })} />
              </div>
              {seat.on && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Field label={t('company.seatName')}>
                      <input
                        value={seat.name}
                        maxLength={40}
                        onChange={(e) => patchSeat(role.id, { name: e.target.value })}
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                  <Field label={t('company.cadence')}>
                    <Select value={String(seat.cadenceMs)} onChange={(v) => patchSeat(role.id, { cadenceMs: Number(v) })}>
                      {CADENCE_OPTIONS_MS.map((ms) => (
                        <option key={ms} value={ms}>{t('company.every', { interval: fmtInterval(ms) })}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
              )}
            </SubCard>
          );
        })}
      </TriggerCard>

      <TriggerCard
        title={t('company.alwaysOn')}
        blurb={t('company.alwaysOnBlurb')}
        summary={heartbeat?.enabled && keepAwake ? t('common.on') : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ flex: 1, fontSize: 12 }}>{t('company.heartbeat')}</span>
          <Toggle on={!!heartbeat?.enabled} onClick={toggleHeartbeat} />
        </div>
        <Hint>{t('company.heartbeatHint')}</Hint>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <span style={{ flex: 1, fontSize: 12 }}>{t('company.keepAwake')}</span>
          <Toggle on={keepAwake} onClick={() => { void toggleKeepAwake(); }} />
        </div>
        <Hint>{t('company.keepAwakeHint')}</Hint>
      </TriggerCard>

      {status && <div style={{ marginBottom: 8 }}><Callout tone={status.tone}>{status.text}</Callout></div>}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <PixelButton variant="secondary" size="sm" disabled={busy} onClick={() => { void save(); }}>
          {busy ? t('company.saving') : t('company.save')}
        </PixelButton>
        <PixelButton size="sm" disabled={busy || staffed.length === 0} onClick={() => { void hireAndSchedule(); }}>
          {t('company.hire')}
        </PixelButton>
      </div>
      <Hint>{t('company.hireHint')}</Hint>
      <div style={{ height: 6 }} />
      <Muted>{t('company.approvalNote')}</Muted>
    </Scroll>
  );
}
