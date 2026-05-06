---
title: "research: Doom-feel slice ordering and tuning targets"
status: open
priority: 1
issue-type: task
created-at: "2026-05-05T21:23:22.436450-05:00"
---

Verify the assumed Doom-feel slice ordering survives a closer read. Cross-check: (1) does hitstop visibly mask the existing weaponRecoil + muzzleFlash + impact ring stack or compose with it cleanly? (2) does enemy knockback combined with the existing enemy chase ticker produce a feel of weight or just a stutter? (3) does the dash cooldown of 1.4s read as fair against the brute attackWindupMs of 620 and the brute attackCooldownMs of 980? Output: a tuning sheet in docs/_archive (or inline notes on the existing implement: dots) with adjusted starting numbers for hitstop, knockback, dash, and any spec edits needed for the implementor to start cheap.
