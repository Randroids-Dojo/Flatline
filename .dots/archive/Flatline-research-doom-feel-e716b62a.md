---
title: "research: Doom-feel slice ordering and tuning targets"
status: closed
priority: 1
issue-type: task
created-at: "\"2026-05-05T21:23:22.436450-05:00\""
closed-at: "2026-05-06T20:59:43.588088-05:00"
close-reason: "Resolved by FUN_FACTOR_AUDIT and gameplay rounds PR #64 through #93, covering hitstop, knockback, dash, and tuned feel followups."
---

Verify the assumed Doom-feel slice ordering survives a closer read. Cross-check: (1) does hitstop visibly mask the existing weaponRecoil + muzzleFlash + impact ring stack or compose with it cleanly? (2) does enemy knockback combined with the existing enemy chase ticker produce a feel of weight or just a stutter? (3) does the dash cooldown of 1.4s read as fair against the brute attackWindupMs of 620 and the brute attackCooldownMs of 980? Output: a tuning sheet in docs/_archive (or inline notes on the existing implement: dots) with adjusted starting numbers for hitstop, knockback, dash, and any spec edits needed for the implementor to start cheap.
