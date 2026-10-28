# Companiez

**An office of AI employees, working for your company 24/7.**

Companiez is a local-first desktop app that runs a team of AI agents on your machine.
It wraps the CLI agents you already use (Claude Code, Codex, Gemini CLI, Antigravity,
OpenCode, Grok, Kimi, Qwen, Copilot CLI, Cursor Agent, Pi and more) and organises
them as employees. You see them working on a 2.5D office floor, and an orchestrator
(Michael) routes the work. He escalates to you only for things that cost money, go
public or can't be undone.

> Companiez is a fork of [Munder Difflin](https://github.com/chaitanyagiri/munder-difflin)
> by Chaitanya Giri (MIT). See [NOTICE.md](NOTICE.md). Upstream's full feature
> documentation is kept in [docs/UPSTREAM-README.md](docs/UPSTREAM-README.md), and
> everything in it applies here.

## Set up your company

1. Launch the app and finish onboarding: pick a home folder and an agent CLI.
2. Click **Michael**, then open the **company** tab.
3. **Company profile:** name, one-liner, goals, offer, customers, brand voice,
   channels, and the guardrails nobody may cross without you. Saving writes
   `COMPANY.md` into the hive, and every employee reads it before every task.
4. **Team:** switch on the seats you want: Strategy, Growth, Social Media, Content,
   Sales, Customer Success, Product Engineer, Finance & Ops, Market Research. Name
   each one and choose how often it gets a standing work order.
5. **Run 24/7:** turn on the floor heartbeat and keep-awake.
6. Press **Hire & schedule team**. Each seat's work order is added to
   Triggers → Schedules, and you approve each new hire in the review dialog.

## Develop

Requires **Node 22** (`.nvmrc`; Node 26 breaks `electron-rebuild`) and the Xcode
command-line tools on macOS.

```bash
nvm use
npm install
npm run dev          # Electron app with hot reload
npm run typecheck
npm run test:focused
npm run dist:mac     # package a .dmg
```

## Before you ship releases

Create your GitHub repo, then set:

- `BRAND.repo` in [`src/shared/brand.ts`](src/shared/brand.ts) to `owner/name`.
  This turns on auto-update, the remote Settings hero, and the model-catalog refresh.
- `publish.owner` / `publish.repo` in [`electron-builder.yml`](electron-builder.yml).
- A new app icon: `node tools/make-logo.cjs` regenerates every raster from
  `tools/make-logo.cjs`.

## License

MIT for the code (see [LICENSE](LICENSE), which keeps the upstream copyright).
The pixel-art tilesets are under their own licence: [LICENSE-ASSETS](LICENSE-ASSETS).
