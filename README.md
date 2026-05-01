# Flatline

An endless single-room Doom-like shooter where hand-drawn flat enemies swarm you from every angle.

## Project Docs

- `GDD.md`: canonical game design document.
- `AGENTS.md`: required operating rules for agentic coding tools.
- `docs/IMPLEMENTATION_PLAN.md`: backlog shape, slice order, loop rules, and definitions of done.
- `docs/WORKING_AGREEMENT.md`: branch, commit, PR, review, CI, and deploy rules.
- `docs/PROGRESS_LOG.md`: newest-first implementation history.
- `docs/OPEN_QUESTIONS.md`: durable design and technical decisions.
- `docs/FOLLOWUPS.md`: deferred work that should survive context loss.
- `docs/GDD_COVERAGE.json`: maps GDD requirements to implementation, tests, and remaining gaps.
- `docs/ART_PIPELINE.md`: implementation-ready visual asset pipeline and first polished art specs.

## Loop Quickstart

```bash
dot ls
dot ready
```

Pick one ready task, turn it on with `dot on <id>`, complete it on a branch, then close it with `dot off <id> -r "<reason>"` after the PR is merged and verified.

The loop is continuous. After a merge, sync `main`, verify CI and production, close the dot with evidence, then immediately restart selection from `dot ready`, `docs/FOLLOWUPS.md`, and `docs/GDD_COVERAGE.json`. Stop only when the backlog is empty or blocked by a documented user decision.

## Shared Leaderboard Setup

Flatline can use Vercel KV through Upstash Redis for shared all-time and daily leaderboards.

Required Vercel environment variables:

```bash
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

Create or attach a Vercel KV store in the Vercel dashboard, confirm those variables exist for Production and Preview, then redeploy. If KV is not configured, the game still runs and keeps the local browser leaderboard.
