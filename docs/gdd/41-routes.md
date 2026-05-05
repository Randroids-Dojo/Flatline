# Routes

**Status:** done

```text
/
  Landing page and main playable arena (also serves as the default endless run)

/arena/daily
  Daily challenge

/arena/practice
  Practice mode

/api/leaderboard
  GET fetches the leaderboard (all-time or daily scope by query param)
  POST submits a run
```

The original GDD draft proposed a separate `/arena` page plus dedicated `/api/runs` and `/api/daily` endpoints. The implementation consolidated: the landing page at `/` is also the main arena, and `/api/leaderboard` handles both score submission (POST) and leaderboard / daily-scope fetch (GET). The split-route design from the draft is preserved in `docs/_archive/2026-05-03-pre-spiral/GDD.md` section 17.

### Build log

- 2026-05-03: Split out of `GDD.md`. Pre-spiral implementation: `app/page.tsx`, `app/arena/daily/page.tsx`, `app/arena/practice/page.tsx`, `app/api/leaderboard/route.ts` (with both `GET` and `POST` handlers). Routes-spec updated 2026-05-03 (PR #47 review feedback) to match shipped routes rather than the original GDD draft taxonomy.
