# Flatline Followups

Followups are durable deferred work. Mark finished entries `done`; do not delete them.

### F-001: Add package scaffold and standard verification scripts

- Status: done
- Priority: blocks-release
- Created: 2026-04-30
- Source: Implementation loop setup
- Description: Add the Next.js, React, Three.js, TypeScript, Vitest, and Playwright project scaffold with `lint`, `typecheck`, `test`, `test:e2e`, `build`, and `verify` scripts.
- Completion: Completed in `feat/slice-1-walk-shoot` with standard npm scripts and local verification.

### F-002: Add deployed build smoke once hosting exists

- Status: done
- Priority: high
- Created: 2026-04-30
- Source: Working agreement
- Description: Once the repo has a deploy target, add deploy verification steps and production smoke checks to the loop.
- Completion: Completed in `docs/continuous-loop-coverage` by adding deploy smoke to the loop contract and progress log evidence.

### F-003: Split GDD into section files if it becomes hard to navigate

- Status: open
- Priority: later
- Created: 2026-04-30
- Source: Documentation setup
- Description: `GDD.md` is currently small enough to remain canonical as one file. If it grows, split it into `docs/gdd/` section files with `GDD.md` as the index.
- Completion:
