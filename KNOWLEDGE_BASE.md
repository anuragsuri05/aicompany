# AI Employee Company: Knowledge Base

> **Purpose:** A reference for building a 24/7 multi-agent "AI employee company" platform. A business signs up, adds its details, and the system learns from them. The owner hires AI employees for specific roles, watches what they do, and monitors the company. Employees run on Claude, OpenAI, or Gemini and can act on social media.
>
> **Compiled:** 2026-10-25. Star counts and versions come from web snapshots and change daily. Items marked ⚠️ were not checked against the primary repo, so verify before depending on them.

---

## 1. Product vision → required capabilities

| Need | Capability layer | Section |
|---|---|---|
| "Company" with employees, roles, reporting lines | **Company orchestration** (org chart, tickets, approvals, budgets) | §3 |
| Each employee does real work | **Agent runtime / harness** (Claude Code, Codex, Agent SDKs) | §4, §5 |
| Pre-made roles (marketer, SDR, support…) | **Role/persona libraries** | §6 |
| Runs 24/7, survives crashes | **Scheduler + durable execution** | §7 |
| Learns the business from its details | **Knowledge ingestion (RAG) + long-term memory** | §8 |
| Works on social media | **Social publishing + browser automation + integrations** | §9, §10 |
| Uses Claude / OpenAI / Gemini | **LLM gateway / model routing** | §11 |
| See what employees are doing and how the company runs | **Observability + dashboard** | §12 |
| Safe for real businesses | **Sandboxing, approvals, secrets, budgets** | §13 |

---

## 2. TL;DR: recommended starting stack

1. **Fork or build on [Paperclip](https://github.com/paperclipai/paperclip)** as the company-orchestration core. It is MIT licensed, has about 107k stars, and already ships org charts, heartbeats, budgets, governance, tickets, routines, multi-org support, and adapters for Claude Code, Codex, Gemini CLI, OpenClaw, and Hermes. It is the closest existing match to this product.
1b. **Borrow the hive, GOD agent, and office-floor design from [Munder Difflin](https://github.com/chaitanyagiri/munder-difflin)** (MIT, ~9k stars, Electron). It provides a file-based "hive" (inboxes, outboxes, blackboard, task ledger, event log), a supervising GOD agent that escalates only critical items, FIPA-style messages with hop caps, Stop-hook inbox loops, a steer → constrain → stop circuit breaker, and a live 2D office where avatars are real terminal sessions. See **§17** for the deep dive.
2. **Employee runtimes:** use the Claude Agent SDK, OpenAI Agents SDK, and Google ADK for in-house "hosted" employees. Paperclip adapters let you plug in Claude Code, Codex, Gemini CLI, OpenClaw, or Hermes as alternative brains.
3. **Roles:** seed the talent catalog from [agency-agents](https://github.com/msitarzewski/agency-agents) personas (12 divisions, about 147 roles).
4. **Business learning:** use [RAGFlow](https://github.com/infiniflow/ragflow) or LlamaIndex to ingest documents, websites, and Drive/Notion. Use [Mem0](https://github.com/mem0ai/mem0) or [Graphiti](https://github.com/getzep/graphiti) for per-employee and per-company long-term memory.
5. **Social media:** use [Postiz](https://github.com/gitroomhq/postiz-app) as the publishing backbone (self-hosted, 20+ channels, MCP server). Use [Composio](https://github.com/ComposioHQ/composio) for OAuth'd SaaS tools. Use [Browser Use](https://github.com/browser-use/browser-use) or [Stagehand](https://github.com/browserbase/stagehand) only where no API exists.
6. **Models:** route through [LiteLLM](https://github.com/BerriAI/litellm), which you self-host, or OpenRouter, which is hosted. Either gives one API for Claude, OpenAI, and Gemini, with per-tenant keys, budgets, and fallbacks.
7. **24/7 reliability:** use Paperclip heartbeats and routines for scheduling. Use [Temporal](https://github.com/temporalio/temporal), [Inngest](https://github.com/inngest/inngest), or [Trigger.dev](https://github.com/triggerdotdev/trigger.dev) for durable, long-running workflows.
8. **Observability:** use [Langfuse](https://github.com/langfuse/langfuse) (MIT) for traces, cost, and evals, plus an activity feed in the dashboard.

---

## 3. Company-orchestration platforms ("the company layer")

These repos model the company itself: org chart, hiring, tickets, budgets, approvals, and a dashboard. **This is the most important category.**

### 3.1 Paperclip ⭐ primary candidate
- **Repo:** https://github.com/paperclipai/paperclip · **License:** MIT (Paperclip Labs, Inc.) · **Stars:** ~107k, 17.8k forks (Oct 2026)
- **Tagline:** "If OpenClaw is an *employee*, Paperclip is the *company*." It provides orchestration for "zero-human companies."
- **Stack:** Node.js 24.11+, TypeScript, pnpm, React UI on `localhost:3100`, embedded PostgreSQL (or your own Postgres in production), local or S3 file storage, Vitest/Playwright, Docker, an optional Rust runner, and opt-in OpenTelemetry/Sentry.
- **Core concepts:**
  - **Heartbeats:** agents wake on a schedule or event, check for assigned work, and act. Any agent that can receive a heartbeat can be "hired."
  - **Org chart:** roles, titles, reporting lines, and permissions. Work is delegated up and down the hierarchy.
  - **Tickets:** threads, plans, blockers, and run history. Atomic checkout gives each task a single assignee, so runs never compete.
  - **Budgets:** monthly limits per company, agent, and project, with threshold alerts and auto-pause.
  - **Governance:** review and approval stages, approval for new hires, and pause/reassign/stop controls.
  - Goal alignment, scheduled **routines**, shared **skills**, connected apps, artifacts, **multi-organization** support, and portable **company templates** (import/export).
- **Adapters:** OpenClaw, Claude Code, Codex, Cursor (plus cloud), Gemini CLI, OpenCode, Pi, Hermes (plus gateway), Grok Build, Kimi Code, plus custom processes, HTTP endpoints, and adapter plugins.
- **Shipped:** plugin system, skills manager, routines, budgeting, approvals, multi-user access, cloud/sandbox agents, MCP tool gateway, secrets manager, and activity log.
- **In progress:** memory/knowledge, Agent Chat, and cloud deployments. **Planned:** "Maximizer mode," work queues, self-organization, automatic organizational learning, a desktop app, and Asana/Linear/Jira sync.
- **Install:** `npx paperclipai@latest onboard --yes`, or clone and run `pnpm install && pnpm dev`.
- **Fit:** covers about 60% of the product out of the box. Gaps to build: business onboarding and knowledge learning (memory is still in progress), social-media employees, an SMB-friendly UX, and SaaS multi-tenancy, billing, and hosting.

### 3.1b Munder Difflin ⭐ primary reference design (see §17)
- **Repo:** https://github.com/chaitanyagiri/munder-difflin (also listed as `HarnessMD/munder-difflin`; the clone URL points to chaitanyagiri) · **License:** MIT (code). The pixel-art assets carry a separate LimeZu licence. · **Stars:** ~9k, 1.3k forks · **Version:** 0.5.6 (pre-release) · Site: harnessmd.com
- An Electron desktop "agent harness to run an office of your clones." It wraps 12+ terminal agent CLIs, such as Claude Code, Codex, and Gemini CLI, on **your existing subscriptions**. A **GOD agent** routes, adjudicates, and escalates. Each session appears as an avatar on a **Pixi.js 2D office floor**, and clicking a desk opens the live terminal.
- **Strengths for our product:** coordination protocol, supervision and escalation, cost circuit breaker, and the "watch your employees work" UI.
- **Gaps:** desktop and local only (not multi-tenant SaaS), coding-centric, no social-media layer, and its 24/7 model depends on the desktop app staying open.

### 3.2 OneManCompany (OMC)
- **Repo:** https://github.com/1mancompany/OneManCompany · **License:** Apache-2.0 · ~450 stars (small but feature-rich)
- An "agentic OS" in which you are the CEO and the only human. Python 3.12 (UV), a Node launcher, and Supabase.
- **Ideas worth copying:**
  - **Vessel + Talent model.** The Vessel is the execution container (retries, timeouts, tools, comms). The Talent is the capability package (skills, knowledge, personality). An employee is a Vessel plus a Talent.
  - A founding team (EA, HR, COO, CSO) plus a community **Talent Market** for hiring.
  - **Event-driven dispatch** instead of heartbeat polling.
  - **Pixel-art office UI** showing employees working and meeting live, which works well for the "see what they are doing" requirement.
  - HR mechanics: hiring/firing, quarterly reviews, probation, PIPs, and 1-on-1 coaching saved as experience.
  - Retrospectives and workflow distillation (self-evolution), file-change approvals, per-project LLM cost, and a knowledge base of SOPs.
- **Models:** a built-in hosted agent via OpenRouter, Claude Code, OpenClaw (experimental), and Azure.
- **Install:** `npx @1mancompany/onemancompany`, then open `http://localhost:8000`.

### 3.3 Other "AI company / AI employee" repos (smaller, useful for ideas)
| Repo | Notes |
|---|---|
| [5dive-ai/5dive](https://github.com/5dive-ai/5dive) | MIT. Bash, systemd, and SQLite on Ubuntu. Each agent is a Linux service and Linux user (strong isolation). Org chart, shared backlog, peer review, scheduled loops, a team wiki, a marketplace of team packs, delegated git push (tokens never reach agents), and phone notifications only when a human must decide. |
| [CronusL-1141/AI-company](https://github.com/CronusL-1141/AI-company) | Claude Code–native team OS: 108 MCP tools, 40+ agent templates, lifecycle hooks, pipelines, structured meetings, a task wall, and a React dashboard. |
| [777genius/agent-teams-ai](https://github.com/777genius/agent-teams-ai) | Kanban-board "you're the boss." Agents message and review each other. Works with Codex, Claude, OpenCode, Cursor, and 300+ models. |
| [Anil-matcha/open-duet](https://github.com/Anil-matcha/open-duet) | ~6.1k stars. Named AI coworkers with memory, routines, their own isolated computer, and approval before acting. |
| [markfulton/ai-employees](https://github.com/markfulton/ai-employees) | 8 scheduled business roles and 60 routines on Claude Code plus 10 other harnesses. A good source of business routines. |
| [zeenie-ai/OpenCompany](https://github.com/zeenie-ai/OpenCompany) | "Self-improving AI employees for everyone." |
| [markus-global/markus](https://github.com/markus-global/markus) | All-in-one platform for AI agent teams. |
| [ragleap/ragleap-core](https://github.com/ragleap/ragleap-core) | MIT. 46 business roles. Asks before acting. |
| [OpenInsightHQ/openinsight](https://github.com/OpenInsightHQ/openinsight) | Self-hosted enterprise agent OS whose employees learn business processes (open core). |
| [OpenLabor/openlabor](https://github.com/OpenLabor/openlabor) | Employee roles, skills, and missions as Markdown files. A useful schema idea. |
| GitHub topics | [ai-employees](https://github.com/topics/ai-employees), [ai-team](https://github.com/topics/ai-team), [multi-agent-orchestration](https://github.com/topics/multi-agent-orchestration) |

⚠️ The ai-employees topic also lists **fake "AnyDesk" installer repos (likely malware)**. Never run downloads from them.

### 3.4 Classic research frameworks for "software companies"
| Repo | Notes |
|---|---|
| [FoundationAgents/MetaGPT](https://github.com/FoundationAgents/MetaGPT) | ~66k stars. "Code = SOP(Team)." Simulates a software company with PM, architect, and engineer roles. Its SOP-driven role handoffs are worth studying. (It was formerly at geekan/MetaGPT.) |
| [OpenBMB/ChatDev](https://github.com/OpenBMB/ChatDev) | A virtual software company (CEO, CTO, programmer, tester) that runs on chat chains. ChatDev 2.0 generalized it to configurable multi-agent workflows. ⚠️ Check its current status. |
| [camel-ai/camel](https://github.com/camel-ai/camel) | Role-playing agent societies. Its sibling project, OWL, handles workforce-style task automation. |
| [joonspk-research/generative_agents](https://github.com/joonspk-research/generative_agents) / [a16z-infra/ai-town](https://github.com/a16z-infra/ai-town) | Simulated agent "towns." Inspiration for a live office visualization. |

---

## 4. Agent harnesses ("the employee's brain and hands")

Each AI employee needs a harness that loops: think, call tools, observe, repeat.

### 4.1 Always-on personal agents (24/7 employees)
| Repo | Notes |
|---|---|
| **OpenClaw**: [openclaw/openclaw](https://github.com/openclaw/openclaw) | MIT, by Peter Steinberger (formerly Clawdbot/Moltbot). 250k–350k+ stars. A self-hosted, 24/7 autonomous assistant reached through Slack, Telegram, WhatsApp, and other chat apps. 49 built-in skills, thousands of community skills on **ClawHub**, plus MCP. Community skills cover a Reddit digest, a YouTube digest, X account analysis, and more. Paperclip treats an OpenClaw instance as an "employee." ⚠️ **Community skills have had serious security vulnerabilities, so vet every skill.** |
| **Hermes Agent**: [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) | MIT. ~150k+ stars ⚠️. A self-improving agent with a **built-in learning loop**: it creates skills from experience, refines them, and models the user across sessions. Runs as a persistent daemon with scheduled automations and a messaging gateway (Telegram, Discord, Slack). Deploys to a VPS or serverless backends such as Modal or Daytona. 70+ tools (v0.13, May 2026 ⚠️). A good model for "employees that learn the business." |

### 4.2 Coding and agentic CLIs (adapters in Paperclip)
- **Claude Code** (Anthropic): the strongest general agent harness. Its subagents in `~/.claude/agents/`, skills, hooks, and MCP make it usable for non-coding work too.
- **Codex CLI**: [openai/codex](https://github.com/openai/codex)
- **Gemini CLI**: [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)
- **OpenCode**: [sst/opencode](https://github.com/sst/opencode), model-agnostic.
- **OpenHands**: [All-Hands-AI/OpenHands](https://github.com/All-Hands-AI/OpenHands), a sandboxed software agent platform.
- **Ruflo (formerly claude-flow)**: [ruvnet/claude-flow](https://github.com/ruvnet/claude-flow). Swarm orchestration on top of Claude Code (queen-led hierarchical/mesh topologies, HNSW vector memory, hooks). ⚠️ A third-party review says parts are stubbed and the benchmarks are unverified.

---

## 5. Agent SDKs and frameworks (to build hosted employees)

### 5.1 First-party SDKs from the three model vendors
| SDK | Repo | Notes |
|---|---|---|
| **Claude Agent SDK** | [anthropics/claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python), [anthropics/claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript) (npm `@anthropic-ai/claude-agent-sdk`) | The Claude Code engine as a library: `query()` and `ClaudeSDKClient`, tools, MCP, subagents, hooks, and permissions. ⚠️ **Anthropic does not let third-party products offer claude.ai login or subscription rate limits.** A SaaS must use **API keys** (yours or the customer's). |
| **OpenAI Agents SDK** | [openai/openai-agents-python](https://github.com/openai/openai-agents-python), [openai/openai-agents-js](https://github.com/openai/openai-agents-js) | Agents, handoffs, guardrails, sessions, and tracing. Lightweight multi-agent support. |
| **Google ADK** | [google/adk-python](https://github.com/google/adk-python) (also Java/Go) | Multi-agent hierarchies, workflow agents (sequential, parallel, loop), Gemini-first but model-agnostic, and deployment to Vertex Agent Engine. Supports the A2A protocol. |

### 5.2 Multi-agent frameworks
| Framework | Repo | Best for |
|---|---|---|
| LangGraph | [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | Explicit state graphs, checkpointing, human-in-the-loop gates. The strongest production record (25–34k stars). |
| CrewAI | [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) | Role-based "crews" plus Flows. An intuitive employee metaphor (~42–59k stars). |
| Microsoft Agent Framework | [microsoft/agent-framework](https://github.com/microsoft/agent-framework) | The successor to **AutoGen + Semantic Kernel** (announced Oct 2025, GA around Mar 2026 ⚠️). Python and .NET. AutoGen is in maintenance mode. |
| AutoGen (legacy) | [microsoft/autogen](https://github.com/microsoft/autogen) | Group-chat multi-agent. Don't start new work on it. |
| Mastra | [mastra-ai/mastra](https://github.com/mastra-ai/mastra) | TypeScript-first. 1.0 shipped Jan 2026. Workflows, memory, evals. Good fit if the stack is TypeScript like Paperclip's. |
| Agno | [agno-agi/agno](https://github.com/agno-agi/agno) | Fast Python agents and teams (formerly phidata). |
| Dify | [langgenius/dify](https://github.com/langgenius/dify) | 130–144k stars. A low-code visual agent/workflow builder. Could serve as a no-code "employee builder." |
| Langflow / Flowise | [langflow-ai/langflow](https://github.com/langflow-ai/langflow), [FlowiseAI/Flowise](https://github.com/FlowiseAI/Flowise) | Visual builders. Flowise was acquired by Workday in Aug 2025. |
| Swarms | [kyegomez/swarms](https://github.com/kyegomez/swarms) | Enterprise swarm patterns (hierarchical, mixture, and more). |
| elizaOS | [elizaOS/eliza](https://github.com/elizaOS/eliza) | MIT. **Social-native agents**: built-in X/Twitter, Discord, Telegram, and Farcaster connectors, persona "character files," multi-agent support, and OpenAI/Anthropic/Gemini/Ollama models. Good reference for social-media employee personas. |

### 5.3 Interop protocols
- **MCP (Model Context Protocol):** the standard way to give employees tools. Postiz, Composio, Paperclip's tool gateway, and others speak it.
- **A2A (Agent2Agent):** a Google-led, Linux Foundation protocol for agent-to-agent calls across frameworks.

---

## 6. Role and persona libraries (seed the "Talent Market")

| Repo | Notes |
|---|---|
| [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) | MIT. ~147 personas in 12 divisions: engineering, design, paid media, sales, marketing, product, project management, testing, support, spatial computing, specialized, finance, and game development. Each has a personality, workflow, and deliverables. Examples include "Reddit Community Ninja," "Brand Guardian," and "Reality Checker." Installs into Claude Code (`~/.claude/agents/`), Cursor, Gemini CLI, OpenCode, and others. |
| [markfulton/ai-employees](https://github.com/markfulton/ai-employees) | Business roles with scheduled routines. |
| [easonwang00/Startup-Agents](https://github.com/easonwang00/Startup-Agents) | 19 startup employees. |
| [joyozhang333-lgtm/awesome-ai-organization](https://github.com/joyozhang333-lgtm/awesome-ai-organization) | Frameworks, role templates, and playbooks. |
| [akshitkrnagpal/awesome-ai-employees](https://github.com/akshitkrnagpal/awesome-ai-employees) | Commercial "AI employee" companies, useful for competitor research. |

**Suggested employee schema** (combining OMC's Vessel/Talent split, OpenLabor's Markdown roles, and Paperclip's agent model):
```yaml
employee:
  name: "Maya"            # display persona
  role: social_media_manager
  reports_to: cmo
  brain: { provider: anthropic, model: claude-sonnet-5-5, fallback: openai/gpt-x }
  talent:                 # capability package
    persona_prompt: talents/social_media_manager.md
    skills: [content-calendar, post-writer, image-gen, engagement-replies]
    tools: [postiz.mcp, composio.linkedin, browser.readonly]
    knowledge_scopes: [company/brand, company/products, company/faq]
  vessel:                 # execution container
    schedule: "heartbeat every 30m; routine daily 09:00 'plan today's posts'"
    budget_usd_month: 40
    approvals: { publish_post: owner, reply_dm: auto_if_confidence>0.8 }
    sandbox: container
```

---

## 7. 24/7 runtime: scheduling and durable execution

| Option | Repo | Notes |
|---|---|---|
| Paperclip heartbeats and routines | (built in) | Simplest option. Agents wake periodically and on events. |
| Temporal | [temporalio/temporal](https://github.com/temporalio/temporal) | Deterministic-replay workflows that survive crashes and can run for months. Polyglot. Steeper learning curve. The best audit trail. |
| Inngest | [inngest/inngest](https://github.com/inngest/inngest) | Event-driven durable steps, sleeps, and waits. Calls your HTTP endpoints. Billed per step. |
| Trigger.dev | [triggerdotdev/trigger.dev](https://github.com/triggerdotdev/trigger.dev) | TypeScript-first. Checkpoint-resume, no determinism rules, no timeouts. |
| BullMQ / Redis queues | [taskforcesh/bullmq](https://github.com/taskforcesh/bullmq) | A lightweight job queue for Node. |

**Pattern:** each employee is a long-lived actor that runs on a heartbeat loop: check the inbox and tickets → plan → act with tools → log → sleep. Events such as a new DM, a mention, or a webhook wake it early. A durable workflow wraps each multi-step job so retries are safe.

---

## 8. Business learning: knowledge ingestion and memory

"Anyone can add their business and the system learns from it" needs two separate systems.

### 8.1 Company knowledge (RAG)
| Repo | Notes |
|---|---|
| [infiniflow/ragflow](https://github.com/infiniflow/ragflow) | Apache-2.0, ~83–85k stars. Deep document parsing (tables, OCR, Word, slides, Excel, scans, web), connectors for Confluence, S3, Notion, Discord, and Google Drive, plus an orchestrable ingestion pipeline. |
| [run-llama/llama_index](https://github.com/run-llama/llama_index) | A data framework for ingestion and indexing, with LlamaParse for documents. |
| [HKUDS/LightRAG](https://github.com/HKUDS/LightRAG) | Graph plus vector RAG. Lightweight. |
| [microsoft/graphrag](https://github.com/microsoft/graphrag) | Knowledge-graph RAG for "global" questions about a corpus. |
| [mendableai/firecrawl](https://github.com/mendableai/firecrawl) / [unclecode/crawl4ai](https://github.com/unclecode/crawl4ai) | Crawl the business's **website** into LLM-ready Markdown during onboarding. |
| Vector DBs | [pgvector](https://github.com/pgvector/pgvector) (fits Paperclip's Postgres), [qdrant](https://github.com/qdrant/qdrant), [weaviate](https://github.com/weaviate/weaviate) |

### 8.2 Long-term memory (per employee and per company)
| Repo | Notes |
|---|---|
| [mem0ai/mem0](https://github.com/mem0ai/mem0) | Easy memory API (user, agent, and session scopes). Commonly recommended. |
| [getzep/graphiti](https://github.com/getzep/graphiti) | Temporal knowledge graph: entities and relationships that change over time. Good for customers, deals, and campaigns. |
| [letta-ai/letta](https://github.com/letta-ai/letta) | Formerly MemGPT. A stateful agent runtime with self-editing memory. Opinionated, since it is a full runtime. |
| [topoteretes/cognee](https://github.com/topoteretes/cognee) | Graph-native memory that can run fully locally. |

**Onboarding flow:** business form (name, industry, offer, ICP, tone, competitors, goals) → crawl the website → upload documents and connect Drive/Notion → auto-generate a **Company Brain**: a brand voice guide, product catalog, FAQ, and SOPs → each employee retrieves from scoped knowledge → feedback, approvals, and results write back to memory, so the company "learns."

---

## 9. Social media layer

### 9.1 Publishing and scheduling backbones
| Repo | Notes |
|---|---|
| [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) ⭐ | Open source and self-hosted. Supports 20–30+ channels (X, LinkedIn, Instagram, Facebook, TikTok, YouTube, Threads, Bluesky, Pinterest, Reddit, Mastodon…). Has a public API and an **MCP server** (8 tools: list accounts, schedule or draft posts, generate images and video). It handles the painful OAuth app setup for every platform. ⚠️ Check the license (AGPL-3.0, last known) before embedding it in a SaaS. |
| [inovector/mixpost](https://github.com/inovector/mixpost) | Laravel/PHP. Covers Facebook, Instagram, Threads, Mastodon, LinkedIn, Pinterest, YouTube, TikTok, X, Bluesky, and Google Business. The Lite edition is MIT. Pro and Enterprise are paid perpetual licenses ($269–$1,199). |
| [elizaOS/eliza](https://github.com/elizaOS/eliza) | Conversational presence on X, Discord, Telegram, and Farcaster (replies and community management). |
| OpenClaw / Hermes gateways | Telegram, Slack, Discord, and WhatsApp chat surfaces for employees. |

### 9.2 Platform realities (⚠️ verify current terms)
- **X/Twitter:** the API is paid and tiered. Automation must follow the automation rules and label bot accounts.
- **Meta (Facebook/Instagram/Threads):** Graph API access requires app review. Only business or creator accounts can publish, and DMs go through the Messenger/IG messaging APIs with time-window rules.
- **LinkedIn:** posting through API scopes requires approval for company pages. Scraping and automating personal profiles violates the ToS.
- **TikTok and YouTube:** content-posting APIs need app audits.
- **Rule of thumb:** use **official APIs** (through Postiz or Composio) for posting and replies. Use browser automation only for read-only research or platforms without APIs, since UI automation risks account bans.

---

## 10. Tools and integrations (email, CRM, docs, browser)

| Repo | Notes |
|---|---|
| [ComposioHQ/composio](https://github.com/ComposioHQ/composio) | 250+ apps (Gmail, Slack, HubSpot, Salesforce, Notion, Linear, GitHub, LinkedIn…) behind one API or MCP, with **managed OAuth per end user**. This matters for multi-tenant SaaS. Free tier around 20k calls/month ⚠️. |
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | A workflow automation engine with AI agent nodes, MCP, and 400+ integrations. Sustainable-use (fair-code) license. Can serve as the employees' "hands" for deterministic workflows. |
| [activepieces/activepieces](https://github.com/activepieces/activepieces) | MIT. Every "piece" is an MCP server. A more permissive alternative to n8n. |
| [browser-use/browser-use](https://github.com/browser-use/browser-use) | ~78k+ stars. Autonomous, goal-driven browser agent. |
| [browserbase/stagehand](https://github.com/browserbase/stagehand) | Code-first Playwright with `act()`, `extract()`, and `observe()`. More deterministic. |
| [Skyvern-AI/skyvern](https://github.com/Skyvern-AI/skyvern) | Vision-based workflow browser agent. ⚠️ AGPL-3.0. |
| [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | A browser exposed as an MCP server. |
| Sandboxes | [e2b-dev/E2B](https://github.com/e2b-dev/E2B), Daytona, Modal: isolated compute per employee. |

---

## 11. Multi-model layer (Claude, OpenAI, Gemini)

| Option | Notes |
|---|---|
| [BerriAI/litellm](https://github.com/BerriAI/litellm) | Self-hosted proxy and SDK with one OpenAI-compatible API for 100+ providers. Virtual keys per tenant, budgets, rate limits, fallbacks, and cost tracking. **Recommended for a multi-tenant SaaS.** |
| [OpenRouter](https://openrouter.ai) | Hosted, not a repo. 400+ models and 60+ providers behind one endpoint, with auto-fallback and unified billing. Easiest to start with. OMC uses it by default. |
| Portkey gateway | [Portkey-AI/gateway](https://github.com/Portkey-AI/gateway). An open-source gateway with guardrails. |

**Routing policy idea:** use cheap or fast models (Haiku-class, Gemini Flash, mini models) for heartbeats, triage, and classification. Use frontier models (Opus or Sonnet, GPT frontier, Gemini Pro) for strategy, long writing, and complex tool use. Each employee gets a primary model plus a fallback.

---

## 12. Observability and "see what employees are doing"

| Repo | Notes |
|---|---|
| [langfuse/langfuse](https://github.com/langfuse/langfuse) | MIT. Traces, sessions, cost, prompt management, and evals. Self-hostable. **Recommended.** |
| [comet-ml/opik](https://github.com/comet-ml/opik) | Apache-2.0. Tracing plus LLM-as-judge evals. |
| [Arize-ai/phoenix](https://github.com/Arize-ai/phoenix) | Elastic License 2.0, source-available. Built on OpenTelemetry/OpenInference. |
| [AgentOps-AI/agentops](https://github.com/AgentOps-AI/agentops) | Agent session replay. |
| OpenTelemetry GenAI semantic conventions | Paperclip already emits OTel when opted in. |

**Dashboard views to build:** an org-chart view with live status (working, idle, blocked, awaiting approval); a per-employee timeline of actions, tool calls, and outputs; a ticket/Kanban board; an approvals inbox; budget and cost burn by employee; KPIs (posts published, engagement, leads, tickets closed); an optional "office" visualization like OMC's pixel office or AI Town.

---

## 13. Safety, governance, multi-tenancy

- **Human-in-the-loop:** risky actions need approval: publishing, DMs to customers, spending money, deleting data. Paperclip governance and OMC file approvals already work this way.
- **Budgets:** hard monthly caps per employee and company, with auto-pause (Paperclip).
- **Isolation:** one container or sandbox per employee (E2B, Docker), or one Linux user each (5dive's model). Agents never see raw tokens. Use a secrets manager plus delegated actions.
- **Skill and supply-chain vetting:** OpenClaw community skills have had critical vulnerabilities. Pin and review every skill and MCP server.
- **Tenant isolation:** separate orgs, row-level security in Postgres, per-tenant LLM keys (LiteLLM virtual keys), and per-tenant OAuth (Composio).
- **Platform compliance:** follow social ToS, label AI content and bots where required, and observe GDPR/CCPA for customer data.
- **Claude subscription caveat:** a commercial product must call Claude through the **API** with your key or the customer's, not through consumer Claude Pro/Max logins.

---

## 14. Reference architecture

```
┌────────────────────────── Owner Dashboard (React) ───────────────────────────┐
│ Onboarding wizard │ Org chart │ Live activity │ Approvals │ KPIs │ Budgets     │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │
┌─────────────── Company Orchestrator (Paperclip core, multi-tenant) ──────────┐
│ Orgs · Employees · Tickets · Goals · Routines/Heartbeats · Governance        │
│ Budgets · Secrets · Activity log · Plugin/Adapter system · MCP tool gateway  │
└───────┬───────────────┬───────────────────┬────────────────────┬─────────────┘
        │               │                   │                    │
 ┌──────▼──────┐ ┌──────▼───────┐ ┌─────────▼────────┐ ┌─────────▼─────────┐
 │ Employee     │ │ Company Brain│ │ Tool layer       │ │ Durable runtime   │
 │ runtimes     │ │ RAGFlow/     │ │ Postiz (social)  │ │ Temporal/Inngest/ │
 │ Claude SDK / │ │ LlamaIndex + │ │ Composio (SaaS)  │ │ Trigger.dev       │
 │ OpenAI SDK / │ │ pgvector +   │ │ n8n/Activepieces │ └───────────────────┘
 │ Google ADK / │ │ Mem0/Graphiti│ │ Browser Use /    │
 │ Claude Code /│ └──────────────┘ │ Stagehand (E2B)  │
 │ Codex/Gemini │                  └──────────────────┘
 │ CLI/OpenClaw/│
 │ Hermes       │──────► LiteLLM / OpenRouter ──► Claude · OpenAI · Gemini
 └──────────────┘
        └─────► Langfuse / OTel (traces, cost, evals) ──► dashboard
```

---

## 15. Phased build plan

1. **Phase 0 (spike, about 1 week):** run Paperclip locally, hire a Claude Code employee and a Codex employee, and test heartbeats, tickets, budgets, and approvals. Run OMC to compare UX ideas.
2. **Phase 1 (MVP):** an onboarding wizard → Company Brain (crawl, upload, RAG) → 3 template employees (Social Media Manager, Content Writer, Customer Support) built on the Claude Agent SDK plus LiteLLM → Postiz MCP for posting with owner approval → Langfuse tracing → a dashboard (org chart, activity, approvals).
3. **Phase 2:** a Talent Market seeded from agency-agents, Composio integrations (Gmail, HubSpot, Slack), memory (Mem0 or Graphiti), durable workflows, and KPI reporting with weekly "CEO reports" written by a Chief-of-Staff agent.
4. **Phase 3:** self-improvement (Hermes-style skill learning, OMC-style retrospectives and SOP distillation), auto-scaling employees, a marketplace, SaaS billing, and hosted multi-tenant deployment.

---

## 16. Open questions to decide
- Build on Paperclip (TypeScript/Node) or write our own core with ideas from OMC/5dive? **Recommendation:** start from Paperclip, because it has the most momentum, an MIT license, and the right primitives.
- Self-hosted product, hosted SaaS, or both?
- Bring-your-own-key or a managed model bill (LiteLLM metering)?
- Postiz license (⚠️ AGPL?) versus building posting through Composio or native APIs.
- How much autonomy to allow by default for public actions (approval-first is recommended).

---

## 17. Deep dive: Munder Difflin (reference design)

**Repo:** https://github.com/chaitanyagiri/munder-difflin · **Docs in repo:** `README.md`, `SPEC.md` (original MVP spec), `HIVE.md` (multi-agent protocol), `docs/ARCHITECTURE.md`, `DESIGN.md`, `MEMORY_GRAPH_SPEC.md`, `TELEMETRY.md`, `SECURITY.md`.

### 17.1 What it is
- An Electron desktop app (macOS, Windows, Linux) that runs a team of **real terminal agent processes** as an "office." Your clone, **Michael**, is the single agent you brief. The **GOD agent** sits in Michael's office (`desk-ceo`) and supervises everyone.
- **Supported CLIs:** `claude`, `agy` (Antigravity), `codex`, `grok`, `kimi`, `gemini`, `qwen`, `opencode`, `crush`, `pi`, `copilot`, `cursor-agent`, and any custom command. Local models via Ollama, LM Studio, or vLLM. BYO API keys live in a **write-only secret broker**.
- **Business model:** the open-source core is free and runs on users' CLI subscriptions. **Pro** (~$150/yr, adjusted by country) adds Capabilities, agent files, and the "Stapler" voice/meeting capture. A **Teams** plan adds shared offices and cloud sandboxes per teammate.

### 17.2 Architecture
- **Two data planes feed one renderer:**
  - **Terminal plane:** `node-pty` processes managed by `PtyManager` (`src/main/pty.ts`). Output streams over IPC channel `pty:data:<id>` to xterm.js. (The original MVP spec used tmux `pipe-pane`.)
  - **Event plane:** provider hook shims (`cth-hook` for Claude Code, `agy-hook` for Antigravity) POST lifecycle events to a **hook server** (`src/main/hooks.ts`, Unix domain socket). The **hive** and **router** live in `src/main/hive.ts`.
- **Process model:** the main process (`src/main/`) owns PTYs, the filesystem, git, the hive, and hooks. The renderer (`src/renderer/src/`, React, with Pixi scene in `scene/office/`) talks to it only through a typed preload bridge, `window.cth` (`src/preload/index.ts`).
- **Main modules:** `memory.ts` (semantic memory wrapper that degrades to a no-op), `reflect.ts` (`MemoryReflector`, which condenses memory), `breaker.ts` + `control.ts` (circuit breaker and HITL gate), `transcript.ts` (parses `~/.claude/projects/*.jsonl` for token and cost data), `telemetry.ts` (OTel collector), `usage.ts` + `pricing.ts` (per-model cost attribution), `db.ts` (SQLite: history plus a **durable cost ledger**), `github.ts` (issues and CI via `gh`), `fs.ts` / `git.ts` (sandboxed bridges), `config.ts`.
- **Stack:** Electron, electron-vite, React, TypeScript, Pixi.js, xterm.js, node-pty, Monaco/CodeMirror, SQLite, and bundled Whisper.

### 17.3 The hive: coordination protocol (most reusable part)
The hive is a **git repo of plain files** at `<harnessHome>/hive/`:
```
hive/
├── PROTOCOL.md        # agent-facing contract for memory + messaging
├── registry.json      # roster: agents, roles, capabilities, status, seats
├── board.md           # shared blackboard (GOD is the only writer)
├── tasks.json         # task ledger: id, assignee, spec, status, result ref
├── log.jsonl          # append-only event feed → UI activity stream
└── agents/<agentId>/
    ├── identity.md    # role + capabilities, read at start
    ├── memory.md      # long-term memory (read at task start, appended)
    ├── inbox/ (.done/)# delivered messages; processed ones moved to .done
    ├── outbox/        # messages the agent wants to send
    └── cursor.json    # last processed message id (idempotency)
```
- **Message schema (FIPA-lite):** `id`, `conversation`, `in_reply_to`, `from`, `to` (an agent, `god`, or `broadcast`), `act` (`request` | `inform` | `propose` | `query` | `agree` | `refuse` | `done`), `subject`, `body`, `hops`, `requires_reply`, `needs_human`, `created_at`. Each message is one JSON file `<ts>-<msgid>.json`, written to a temp file and then **atomically renamed**.
- **Router:** agents write only to their own `outbox/`, and the harness delivers to recipients' `inbox/`. Idle and inbox wakeups keep workers processing mail.
- **Anti-livelock:** only `request`, `query`, and `propose` require replies. Each reply increments `hops`, and at the **hop cap the GOD agent escalates** instead of letting agents loop. The cursor makes reprocessing a no-op.
- **Single committer:** agents never run git. Only the main process commits, with retry/backoff and stale-lock cleanup, which avoids `.git/index.lock` corruption. Optional **per-agent git worktrees** keep parallel work on separate branches.

### 17.4 GOD agent (supervisor) behaviour
- It is an ordinary `claude` process flagged `isGod`. It reads `registry.json` to know who can do what.
- **Routine:** it answers clarifications itself and routes work to specialists with **self-contained task specs**. It owns `board.md` and `tasks.json`, where it assigns, tracks, retries, and checkpoints.
- **Escalate to the human only for critical items:** destructive operations, spend, scope changes, and conflicts it can't resolve. Messages addressed to `human` go to GOD.
- **Escalation policy lives in GOD's system prompt**, so you tune behaviour by editing the prompt, not the code.

### 17.5 Keeping agents working: hooks
- A **Stop-hook inbox loop:** when an agent finishes, the `Stop` hook checks its inbox. If mail is waiting, it returns a "block" decision with the messages as the reason, so the agent keeps working. `stop_hook_active` and `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` prevent infinite loops.
- `PreToolUse` / `PostToolUse` events move avatars to stations (desk, file shelf, terminal, web portal, MCP corner, task board, mailbox).
- Hooks are written to `<cwd>/.claude/settings.local.json`. The shim is attached with `--settings`.
- **Avatar state machine** (from SPEC): `idle → alert → thinking → working → success | blocked → ghost (30s) → archived`. A `Notification` hook sends the avatar to the mailbox as `blocked`, meaning it needs the user.

### 17.6 Safety, cost, and governance
- **Approvals queue** for spend, scope, and destructive operations. You can **steer mid-flight** or stop a run gracefully.
- **Circuit breaker ladder: steer → constrain → stop.** It is triggered by loops, error storms, or budget overruns.
- **Per-agent token budgets** and period token limits. Cost is reconstructed from real transcripts, recorded in a durable ledger, and shown with OTel spans and a tool-call waterfall.
- **Per-agent autonomy settings.** The MVP permission modes were `default`, `acceptEdits`, `bypassPermissions`, and `plan`.

### 17.7 Memory
- Markdown first: each agent has a `memory.md`, plus an optional SQLite FTS index.
- **Semantic layer:** wraps the **MemPalace** CLI, with one shared "palace" and one wing per agent (`MEMPALACE_PALACE_PATH`). Each agent's `memory.md` is mined into it when its mtime changes. The default embedding is `minilm`, with `embeddinggemma` opt-in. Condensation is handled by `reflect.ts`.
- An **Enterprise Knowledge Graph** holds the user's documents and policies, and every agent can query it (`MEMORY_GRAPH_SPEC.md`). ⚠️ Per HIVE.md, end-to-end retrieval was not yet validated.

### 17.8 Command Center and integrations
- **Command Center:** kanban with task dependencies and ticket keys (e.g. `V53-299`), **scheduled missions with heartbeat**, weekday schedules, fleet monitoring, memory search, activity log, and a CI watcher.
- Also included: a Monaco IDE with git rails, a Skills browser, an **Agent Gallery** of shareable role presets, and a Capabilities marketplace (Pro).
- **Slack:** one bot answers in chosen channels and DMs. Michael **spawns an ephemeral worker**, replies in-thread, then tears it down.
- **Inbound webhooks** from GitHub, Linear, Telegram, or custom sources, each assigned to an answering agent. Telegram and richer chat bridges are on the roadmap. **No social-media publishing.**

### 17.9 What to adopt for the AI Employee Company
| Munder Difflin pattern | How we apply it |
|---|---|
| Hive (registry, inboxes/outboxes, blackboard, task ledger, event log) | Same model, but stored in **Postgres tables** for multi-tenant SaaS (`agents`, `messages`, `tasks`, `board`, `events`), with an optional git-backed export per company for auditability. |
| FIPA-lite speech acts + `hops` cap + `needs_human` | Adopt as-is for employee-to-employee messages. The hop cap escalates to the GOD/COO agent. |
| GOD agent with escalation policy in its prompt | A per-company **"Chief of Staff / COO" agent** that routes work and escalates to the business owner. The owner edits the policy in plain language in settings. |
| Agents write files, a single committer does side effects | Employees **propose** external actions (post, DM, email, spend). A single **Action Executor** service performs them after policy and approval checks, which gives us idempotency and an audit log. |
| Stop-hook inbox loop and idle wakeups | A heartbeat plus event wakeups. When a run ends and mail is waiting, the employee continues, with a block cap. |
| Circuit breaker steer → constrain → stop | Apply per employee on cost, error rate, loop detection, and **social-specific signals** (spike in negative replies, rate-limit hits). |
| Cost ledger from transcripts + OTel | Combine with LiteLLM spend logs and Langfuse traces into one per-company ledger. |
| Avatar state machine + stations | Map to **web dashboard** states. Stations become business stations: Social desk, Inbox, CRM, Research web portal, Approvals mailbox. |
| Agent Gallery / Capabilities marketplace | Seeds our **Talent Market** (combined with agency-agents personas). |
| Slack ephemeral worker per thread | The same pattern for inbound social DMs and comments: spawn a short-lived responder with company knowledge, then reply. |
| BYO CLI subscriptions | Useful for local or self-hosted editions only. **The SaaS must use API keys** (Anthropic forbids third-party products from using claude.ai logins). |
| Desktop-only, process-per-agent | Replace with **server-side workers** (containers or E2B sandboxes) so the company runs 24/7 without the owner's laptop. |

### 17.10 Positioning versus Paperclip and OMC
- **Paperclip:** the strongest *company and governance* model (org chart, budgets, multi-org, adapters), server-based. **Use it as the backbone.**
- **Munder Difflin:** the strongest *agent-to-agent protocol, supervision, and live "office" observability*. **Copy the protocol and UX.**
- **OMC:** the strongest *HR metaphor* (talent market, reviews, retros, self-evolution). **Copy the employee lifecycle.**

---

## 18. Sources consulted (Oct 2026)
- Munder Difflin: https://github.com/chaitanyagiri/munder-difflin (README, `HIVE.md`, `SPEC.md`, `docs/ARCHITECTURE.md`) · https://themenonlab.blog/blog/munder-difflin-office-of-coding-agents · https://mer.vin/news/munder-difflin-turns-coding-agents-into-a-self-running-office/ · https://www.sourcepulse.org/projects/31011690
- Paperclip: https://github.com/paperclipai/paperclip · https://www.mindstudio.ai/blog/what-is-paperclip-zero-human-ai-company-framework-3 · https://zeabur.com/blogs/deploy-paperclip-ai-agent-orchestration · https://www.zenml.io/llmops-database/open-source-agent-orchestration-platform-for-multi-agent-business-automation
- OneManCompany: https://github.com/1mancompany/OneManCompany
- 5dive: https://github.com/5dive-ai/5dive · AI-company: https://github.com/CronusL-1141/AI-company · agent-teams-ai: https://github.com/777genius/agent-teams-ai
- ai-employees topic: https://github.com/topics/ai-employees
- OpenClaw: https://towardsdatascience.com/use-openclaw-to-make-a-personal-ai-assistant · https://allclaw.org/blog/openclaw-use-cases
- Hermes Agent: https://hermes-agent.nousresearch.com/docs · https://landscape.jimmysong.io/projects/hermes-agent/
- agency-agents: https://jimmysong.io/ai/agency-agents/ · https://dev.to/preecha/what-is-the-agency-agents-3lio
- Frameworks: https://fungies.io/top-github-repositories-ai-agent-frameworks-2026/ · https://www.braintrust.dev/articles/best-ai-agent-frameworks-2026 · https://zenml.io/blog/crewai-vs-autogen
- Microsoft Agent Framework: https://visualstudiomagazine.com/Articles/2025/10/01/Semantic-Kernel-AutoGen--Open-Source-Microsoft-Agent-Framework.aspx
- Claude Agent SDK: https://code.claude.com/docs/en/agent-sdk.md
- Ruflo: https://www.augmentcode.com/learn/ruflo-claude-code-multi-agent-orchestration
- Memory: https://www.cognee.ai/blog/guides/best-ai-memory-layers-for-ai-agents-in-2026-comparison · https://powerdrill.ai/blog/best-free-memory-layer-for-ai-agents
- RAGFlow: https://www.respan.ai/market-map/ragflow
- Browser agents: https://noqta.tn/blog/ai-browser-agents-browser-use-stagehand-web-automation-2026 · https://devtoollab.com/blog/best-ai-browser-automation-tools
- Social: https://docs.postiz.com/mcp/introduction · https://railway.com/deploy/mixpost · https://www.mintlify.com/elizaos/eliza
- Integrations: https://docs.composio.dev/resources/model-context-protocol · https://composio.dev/content/top-n8n-alternatives
- Gateways: https://gateway.orq.ai/blog/openrouter-vs-litellm
- Durable execution: https://www.zenml.io/blog/inngest-vs-temporal · https://www.noqta.tn/blog/durable-execution-ai-agents-inngest-trigger-temporal-2026
- Observability: https://www.morphllm.com/ai-agent-observability-tools · https://latitude.so/blog/best-ai-agent-observability-tools-2026-comparison
