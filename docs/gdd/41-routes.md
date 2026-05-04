# Routes

**Status:** done

```text
/
  Landing page

/arena
  Main playable arena

/arena/daily
  Daily challenge

/arena/practice
  Practice mode

/api/runs
  Submit score

/api/leaderboard
  Fetch leaderboard

/api/daily
  Fetch daily seed
```

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `app/page.tsx`, `app/arena/daily/page.tsx`, `app/arena/practice/page.tsx`, `app/api/leaderboard/route.ts`. The dedicated `/arena` standalone route, `/api/runs`, and `/api/daily` may share a single endpoint or live inline; full route taxonomy not separately audited.
