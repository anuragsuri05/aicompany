/**
 * Company HQ — the business the whole office works for, and the team it staffs.
 *
 * Two halves, one dependency-free module shared by main (validation + the
 * `COMPANY.md` render written into the hive) and renderer (the Company tab):
 *
 *   profile   — what the business is: offer, customers, goals, voice, guardrails.
 *               Rendered to `<hive>/COMPANY.md`, which every agent is told to read
 *               at the start of each task (see HiveManager.injectedPrompt).
 *   staffing  — which business roles the owner wants on the floor and how often
 *               each one gets a standing work order.
 *
 * SECURITY MODEL — same rules as shared hires (src/shared/hire.ts):
 *   - Staffing NEVER spawns anything by itself. "Hire the team" builds ordinary
 *     hire manifests and drops them into the human-reviewed hire queue; the owner
 *     sees the full command in the Add-Agent modal and clicks spawn for each.
 *   - Every manifest built here is passed back through `validateHireManifest`,
 *     so a role template can never carry a flag, skill or MCP id that a shared
 *     hire could not.
 *   - Standing work orders are plain hive messages to the orchestrator (`to:
 *     'god'`), never PTY input, so they ride the existing routing + escalation.
 */

import { HIRE_SPEC_V1, validateHireManifest, type HireManifest, type HireProvider } from './hire';

export const COMPANY_SPEC_V1 = 'munder-difflin/company@1';

export type CompanyStage = 'idea' | 'pre-revenue' | 'early-revenue' | 'scaling';
export const COMPANY_STAGES: readonly CompanyStage[] = ['idea', 'pre-revenue', 'early-revenue', 'scaling'];

export interface CompanyProfile {
  name: string;
  /** One sentence: what the company does and for whom. */
  oneLiner: string;
  website?: string;
  industry?: string;
  stage?: CompanyStage;
  /** Products / services and pricing, freeform. */
  offer?: string;
  /** Ideal customers and the problem they pay to solve. */
  customers?: string;
  /** North star + the current milestone ("$1B company; next: first $10k MRR"). */
  goals?: string;
  /** How the company sounds in public. */
  brandVoice?: string;
  competitors?: string;
  /** Social handles / channels the team may work on. */
  channels?: string;
  /** Hard rules: things no employee may do without the owner. */
  guardrails?: string;
  notes?: string;
}

/** One hired seat on the team. */
export interface StaffingChoice {
  roleId: string;
  /** Display name for the agent (also seeds its hive id). */
  name: string;
  provider?: HireProvider;
  model?: string;
  /** How often the orchestrator hands this employee its standing work order. */
  cadenceMs: number;
}

export interface CompanyFile {
  spec: typeof COMPANY_SPEC_V1;
  savedAt?: string;
  profile: CompanyProfile;
  staffing: StaffingChoice[];
}

export interface CompanyValidation {
  ok: boolean;
  file?: CompanyFile;
  errors: string[];
}

/* ───────────────────────────── role catalog ───────────────────────────── */

export interface EmployeeRole {
  id: string;
  title: string;
  /** Default name offered in the picker. */
  defaultName: string;
  character: string;
  accent: string;
  capabilities: string[];
  /** What the employee owns, in one line (lands in identity.md + the card). */
  description: string;
  /** The recurring work cycle, written as an instruction to the employee. */
  cycle: string;
  defaultCadenceMs: number;
}

const HOUR = 3_600_000;

/** The business roles the Company tab offers. Deliberately non-coding: the
 *  office already knows how to staff engineers; these are the seats a company
 *  needs to grow. Each cycle ends with "report to god" so work lands on the
 *  board instead of in a terminal nobody reads. */
export const EMPLOYEE_ROLES: readonly EmployeeRole[] = [
  {
    id: 'strategy',
    title: 'Chief of Staff / Strategy',
    defaultName: 'Toby',
    character: 'toby',
    accent: 'lilac',
    capabilities: ['strategy', 'planning', 'okrs', 'research'],
    description: 'Turns the company goals into a weekly plan and measurable milestones.',
    cycle: 'Review progress against the goals in COMPANY.md, update the quarterly milestones, pick the three highest-leverage priorities for the next cycle, and propose task cards for them to god.',
    defaultCadenceMs: 24 * HOUR
  },
  {
    id: 'growth',
    title: 'Growth Marketer',
    defaultName: 'Andy',
    character: 'andy',
    accent: 'peach',
    capabilities: ['marketing', 'growth', 'campaigns', 'seo', 'analytics'],
    description: 'Finds and runs the channels that bring in customers.',
    cycle: 'Pick one growth experiment (channel, offer, landing page, SEO topic), write the brief and the assets for it, and report expected impact and how it will be measured.',
    defaultCadenceMs: 6 * HOUR
  },
  {
    id: 'social',
    title: 'Social Media Manager',
    defaultName: 'Ryan',
    character: 'ryan',
    accent: 'sky',
    capabilities: ['social-media', 'copywriting', 'community', 'content-calendar'],
    description: 'Keeps the brand active and on-voice on every channel listed in COMPANY.md.',
    cycle: "Draft the next batch of posts for each channel in COMPANY.md in the brand voice, with a posting schedule. Do NOT publish or reply publicly yourself — put drafts on the board for the owner's approval unless the guardrails say otherwise.",
    defaultCadenceMs: 4 * HOUR
  },
  {
    id: 'content',
    title: 'Content Writer',
    defaultName: 'Pam',
    character: 'pam',
    accent: 'mint',
    capabilities: ['writing', 'blog', 'newsletter', 'seo'],
    description: 'Writes long-form content: blog posts, newsletters, case studies.',
    cycle: 'Write or improve one long-form piece (blog post, newsletter, case study) aimed at the customers in COMPANY.md, save it as a file in your working directory, and report its path.',
    defaultCadenceMs: 12 * HOUR
  },
  {
    id: 'sales',
    title: 'Sales / Business Development',
    defaultName: 'Dwight',
    character: 'dwight',
    accent: 'lemon',
    capabilities: ['sales', 'outreach', 'prospecting', 'crm'],
    description: 'Builds the pipeline: prospects, outreach sequences, partnerships.',
    cycle: "Research ten new prospects or partners matching the ideal customer in COMPANY.md, draft personalised outreach for each, and add them to the pipeline file. Never send outreach without the owner's approval.",
    defaultCadenceMs: 8 * HOUR
  },
  {
    id: 'support',
    title: 'Customer Success',
    defaultName: 'Kelly',
    character: 'kelly',
    accent: 'mint',
    capabilities: ['support', 'faq', 'onboarding', 'retention'],
    description: 'Keeps customers happy: FAQ, help docs, onboarding, churn signals.',
    cycle: 'Improve the FAQ / help docs from what you know about the offer and customers, draft replies for any open customer questions you have been sent, and flag churn risks to god.',
    defaultCadenceMs: 6 * HOUR
  },
  {
    id: 'product',
    title: 'Product Engineer',
    defaultName: 'Jim',
    character: 'jim',
    accent: 'sky',
    capabilities: ['engineering', 'product', 'frontend', 'backend'],
    description: 'Ships the product and website improvements the plan calls for.',
    cycle: 'Take the highest-priority product or website task from the board, ship it in your working directory with tests where it makes sense, and report what changed.',
    defaultCadenceMs: 4 * HOUR
  },
  {
    id: 'finance',
    title: 'Finance & Ops Analyst',
    defaultName: 'Oscar',
    character: 'oscar',
    accent: 'lemon',
    capabilities: ['finance', 'operations', 'metrics', 'pricing'],
    description: 'Tracks the numbers: revenue, costs, unit economics, pricing.',
    cycle: 'Update the metrics sheet (revenue, costs, runway, unit economics) from the information you have, spot one cost or pricing improvement, and report the numbers that changed.',
    defaultCadenceMs: 24 * HOUR
  },
  {
    id: 'research',
    title: 'Market Researcher',
    defaultName: 'Angela',
    character: 'angela',
    accent: 'coral',
    capabilities: ['research', 'competitors', 'market', 'trends'],
    description: 'Watches the market, competitors, and trends the company should act on.',
    cycle: 'Research one competitor or market trend from COMPANY.md, write a short brief with what it means for the company, and propose any action to god.',
    defaultCadenceMs: 24 * HOUR
  }
];

export function employeeRole(id: string): EmployeeRole | undefined {
  return EMPLOYEE_ROLES.find((r) => r.id === id);
}

/** Cadences the picker offers for standing work orders. */
export const CADENCE_OPTIONS_MS: readonly number[] = [HOUR, 2 * HOUR, 4 * HOUR, 6 * HOUR, 8 * HOUR, 12 * HOUR, 24 * HOUR];

/* ───────────────────────────── validation ───────────────────────────── */

const PROFILE_LIMITS: Record<keyof CompanyProfile, number> = {
  name: 80,
  oneLiner: 300,
  website: 300,
  industry: 80,
  stage: 20,
  offer: 4000,
  customers: 4000,
  goals: 4000,
  brandVoice: 2000,
  competitors: 2000,
  channels: 2000,
  guardrails: 4000,
  notes: 8000
};

const PROVIDERS: readonly string[] = ['claude', 'antigravity', 'codex', 'cursor'];
const MAX_STAFF = 24;
const MIN_CADENCE_MS = 15 * 60_000;
const MAX_CADENCE_MS = 7 * 24 * HOUR;

function trimmed(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

/** Validate an untrusted value (IPC payload or company.json) into a CompanyFile.
 *  Pure; no I/O. Unknown keys are dropped. */
export function validateCompanyFile(raw: unknown): CompanyValidation {
  const errors: string[] = [];
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: ['company must be a JSON object'] };
  }
  const o = raw as Record<string, unknown>;
  const p = (typeof o.profile === 'object' && o.profile !== null ? o.profile : {}) as Record<string, unknown>;

  const profile = {} as CompanyProfile;
  for (const key of Object.keys(PROFILE_LIMITS) as (keyof CompanyProfile)[]) {
    if (p[key] !== undefined && p[key] !== null && typeof p[key] !== 'string') {
      errors.push(`"${key}" must be a string`);
      continue;
    }
    const v = trimmed(p[key]);
    if (v === undefined) continue;
    if (v.length > PROFILE_LIMITS[key]) { errors.push(`"${key}" exceeds ${PROFILE_LIMITS[key]} chars`); continue; }
    (profile as unknown as Record<string, string>)[key] = v;
  }
  if (!profile.name) errors.push('"name" is required');
  if (!profile.oneLiner) errors.push('"oneLiner" is required');
  if (profile.stage && !COMPANY_STAGES.includes(profile.stage)) errors.push(`"stage" must be one of ${COMPANY_STAGES.join(', ')}`);
  if (profile.website && !/^https?:\/\//i.test(profile.website)) errors.push('"website" must start with http:// or https://');

  const staffing: StaffingChoice[] = [];
  if (o.staffing !== undefined) {
    if (!Array.isArray(o.staffing) || o.staffing.length > MAX_STAFF) {
      errors.push(`"staffing" must be an array of at most ${MAX_STAFF} seats`);
    } else {
      const names = new Set<string>();
      for (const s of o.staffing as unknown[]) {
        const seat = (typeof s === 'object' && s !== null ? s : {}) as Record<string, unknown>;
        const roleId = trimmed(seat.roleId);
        const name = trimmed(seat.name);
        if (!roleId || !employeeRole(roleId)) { errors.push(`unknown role ${JSON.stringify(seat.roleId)}`); continue; }
        if (!name || name.length > 40) { errors.push(`seat "${roleId}" needs a name of at most 40 chars`); continue; }
        const key = name.toLowerCase();
        if (names.has(key)) { errors.push(`two seats are both named "${name}"`); continue; }
        names.add(key);
        const cadenceMs = typeof seat.cadenceMs === 'number' && Number.isFinite(seat.cadenceMs)
          ? Math.min(MAX_CADENCE_MS, Math.max(MIN_CADENCE_MS, Math.round(seat.cadenceMs)))
          : employeeRole(roleId)!.defaultCadenceMs;
        const provider = trimmed(seat.provider);
        if (provider && !PROVIDERS.includes(provider)) { errors.push(`seat "${name}": unknown provider "${provider}"`); continue; }
        const model = trimmed(seat.model);
        staffing.push({
          roleId,
          name,
          cadenceMs,
          ...(provider ? { provider: provider as HireProvider } : {}),
          ...(model ? { model } : {})
        });
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, errors: [], file: { spec: COMPANY_SPEC_V1, profile, staffing } };
}

/* ───────────────────────────── renders ───────────────────────────── */

const STAGE_LABEL: Record<CompanyStage, string> = {
  idea: 'Idea',
  'pre-revenue': 'Pre-revenue',
  'early-revenue': 'Early revenue',
  scaling: 'Scaling'
};

/** The hive's `COMPANY.md` — the brief every agent reads before every task. */
export function renderCompanyMd(file: CompanyFile): string {
  const p = file.profile;
  const section = (title: string, body?: string): string => (body ? `## ${title}\n\n${body}` : '');
  const facts = [
    p.website ? `- Website: ${p.website}` : '',
    p.industry ? `- Industry: ${p.industry}` : '',
    p.stage ? `- Stage: ${STAGE_LABEL[p.stage]}` : ''
  ].filter(Boolean).join('\n');
  const team = file.staffing
    .map((s) => {
      const role = employeeRole(s.roleId);
      return role ? `- **${s.name}** — ${role.title}: ${role.description}` : '';
    })
    .filter(Boolean)
    .join('\n');

  // One entry per Markdown BLOCK, joined by a blank line; empty blocks drop out.
  return [
    '<!-- Written by Munder Difflin from Command Center → Company. Edit it there; local edits are replaced on the next save. -->',
    `# ${p.name}`,
    `> ${p.oneLiner}`,
    facts,
    'Everyone on this floor works for this company. Read this brief at the start of every task, and make every decision serve the goals below, in the brand voice, inside the guardrails.',
    section('Goals', p.goals),
    section('What we sell', p.offer),
    section('Who we serve', p.customers),
    section('Brand voice', p.brandVoice),
    section('Competitors', p.competitors),
    section('Channels', p.channels),
    section('Guardrails — never without the owner', p.guardrails ?? 'Spending money, publishing or messaging anyone outside the company, signing anything, and deleting data all need the owner\'s approval. Ask god, who asks the owner.'),
    section('The team', team),
    section('Notes', p.notes)
  ].filter(Boolean).join('\n\n') + '\n';
}

/** A hire manifest for one seat — ready for the human-reviewed hire queue.
 *  Returns null if the seat would not validate as a shared hire (it always
 *  should; this is defense in depth, not a code path the UI relies on). */
export function hireManifestForSeat(seat: StaffingChoice, profile: CompanyProfile): HireManifest | null {
  const role = employeeRole(seat.roleId);
  if (!role) return null;
  const goal = [
    `You are ${seat.name}, the ${role.title} at ${profile.name}. ${role.description}`,
    'Read COMPANY.md in the hive before every task: it holds the goals, offer, customers, brand voice and guardrails you work within.',
    `Standing work cycle (god sends it to you on a schedule): ${role.cycle}`,
    'When a cycle is done, report the outcome to god with a "done" message and record durable learnings in memory.md. Anything that spends money, publishes, contacts people outside the company, or deletes data goes to god for the owner\'s approval first.'
  ].join('\n\n');
  const v = validateHireManifest({
    spec: HIRE_SPEC_V1,
    name: seat.name,
    description: role.title,
    goal,
    character: role.character,
    accent: role.accent,
    capabilities: role.capabilities,
    ...(seat.provider ? { provider: seat.provider } : {}),
    ...(seat.model ? { model: seat.model } : {}),
    author: `${profile.name} — Company HQ`
  });
  return v.ok && v.manifest ? v.manifest : null;
}

/** Stable mission id for a seat, so re-applying the team updates its schedule
 *  instead of stacking duplicates. */
export function companyMissionId(seat: StaffingChoice): string {
  const slug = seat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'seat';
  return `company-${seat.roleId}-${slug}`;
}

export const COMPANY_MISSION_PREFIX = 'company-';

/** The standing work order for a seat: a dispatch mission to god, who routes it
 *  to the named employee (or, if they are not on the floor yet, asks the owner
 *  to hire them). */
export function missionForSeat(seat: StaffingChoice, profile: CompanyProfile): {
  id: string; label: string; intervalMs: number; to: string; body: string; enabled: boolean;
} | null {
  const role = employeeRole(seat.roleId);
  if (!role) return null;
  return {
    id: companyMissionId(seat),
    label: `${seat.name} — ${role.title}`,
    intervalMs: seat.cadenceMs,
    to: 'god',
    body:
      `Standing work order for ${seat.name} (${role.title}) at ${profile.name}. ` +
      `Dispatch this cycle to ${seat.name} as a task card with them as assignee: ${role.cycle} ` +
      `If ${seat.name} is not on the floor, do not do the work yourself — add a blocked card asking the owner to hire them from Command Center → Company.`,
    enabled: true
  };
}

/** Merge a company's standing work orders into an existing mission list:
 *  company missions for seats that still exist are updated in place (keeping
 *  their enabled flag and lastFiredAt), new seats are appended, and company
 *  missions for removed seats are dropped. Every non-company mission is kept
 *  untouched and in order. */
export function mergeCompanyMissions<M extends { id: string; enabled: boolean }>(
  existing: readonly M[],
  file: CompanyFile
): (M | NonNullable<ReturnType<typeof missionForSeat>>)[] {
  const wanted = file.staffing
    .map((s) => missionForSeat(s, file.profile))
    .filter((m): m is NonNullable<ReturnType<typeof missionForSeat>> => m !== null);
  const wantedById = new Map(wanted.map((m) => [m.id, m] as const));
  const out: (M | NonNullable<ReturnType<typeof missionForSeat>>)[] = [];
  const seen = new Set<string>();
  for (const m of existing) {
    if (!m.id.startsWith(COMPANY_MISSION_PREFIX)) { out.push(m); continue; }
    const next = wantedById.get(m.id);
    if (!next) continue; // seat removed
    out.push({ ...m, ...next, enabled: m.enabled });
    seen.add(m.id);
  }
  for (const m of wanted) if (!seen.has(m.id)) out.push(m);
  return out;
}
