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

## Loop Quickstart

```bash
dot ls
dot ready
```

Pick one ready task, turn it on with `dot on <id>`, complete it on a branch, then close it with `dot off <id> -r "<reason>"` after the PR is merged and verified.
