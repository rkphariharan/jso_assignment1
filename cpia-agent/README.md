# Career Portfolio Intelligence Agent (CPIA)

A live AI agent prototype built on JSO (Job Search Optimiser) principles — Phase-2 agentic layer concept.

## What it does

1. **Upload CV** — drop a PDF or paste text, fill in target role + level
2. **CV Analysis** — Claude analyses ATS score, impact, strengths, weaknesses, missing keywords
3. **Agent Analysis** — Career Portfolio Intelligence Agent synthesises all signals (CV score + job strategy + GitHub portfolio + skill gaps) into a prioritised career improvement strategy
4. **Roadmap** — 4-week execution plan with interactive task checklist and progress tracking
5. **HR Consultant Brief** — AI-generated pre-session brief for the consultant with override/annotation capability

## Stack

- Next.js 14 App Router
- Tailwind CSS
- Anthropic Claude (claude-opus-4-5) via `@anthropic-ai/sdk`
- localStorage for state (no DB required for prototype)
- Vercel for deployment

## Quick Start (local)

```bash
cd cpia-agent
npm install
cp .env.local.example .env.local
# Add your Anthropic API key to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

When prompted, set the environment variable:
```
ANTHROPIC_API_KEY = your_key_here
```

Or go to Vercel Dashboard → Project Settings → Environment Variables → add `ANTHROPIC_API_KEY`.

## Get an Anthropic API Key

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign up / log in
3. Settings → API Keys → Create Key
4. Paste it in `.env.local` as `ANTHROPIC_API_KEY=sk-ant-...`

## Project Structure

```
src/
  app/
    page.tsx              # Dashboard (overview + scores + actions)
    upload/page.tsx       # CV upload + profile setup
    agent/page.tsx        # Agent analysis runner + results
    roadmap/page.tsx      # 4-week roadmap + task checklist
    consultant/page.tsx   # HR consultant pre-brief + override
    api/
      extract-pdf/        # PDF text extraction
      analyse-cv/         # CV ATS analysis via Claude
      agent-analyse/      # Full agent career strategy via Claude
      consultant-brief/   # HR session pre-brief via Claude
  components/
    Sidebar.tsx           # Navigation
    AppShell.tsx          # Layout wrapper
    ScoreRing.tsx         # SVG score visualisation
  lib/
    claude.ts             # Claude API client + system prompts
    store.ts              # localStorage state management
    utils.ts              # Colour helpers
```

## Part C Governance (built in)

- All recommendations include explainability notes (what data was used, why it helps)
- HR consultant can override any agent output — overrides are logged
- Truthfulness guardrails in system prompts: agent cannot fabricate experience
- Role-based views: user sees actions, consultant sees brief + override, admin would see audit logs
- Segment-aware: student / graduate / experienced guidance paths
