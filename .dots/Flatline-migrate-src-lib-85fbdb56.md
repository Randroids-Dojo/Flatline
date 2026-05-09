---
title: Migrate src/lib/kv.ts and signing/rate-limit to @randroids-dojo/vibekit/server
status: open
priority: 2
issue-type: task
created-at: "2026-05-08T23:28:15.368317-05:00"
---

Flatline has its own src/lib/kv.ts plus likely token/rate-limit helpers. Once @randroids-dojo/vibekit is added as a file:../VibeKit dep, replace internals with getKv / readKv / writeKv / signToken / verifyToken / incrementWithExpiry. Server modules live under @randroids-dojo/vibekit/server (subpath import) so client bundles never accidentally pull node:crypto.
