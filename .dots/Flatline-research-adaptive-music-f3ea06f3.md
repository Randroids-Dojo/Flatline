---
title: "research: adaptive music architecture in Web Audio"
status: open
priority: 3
issue-type: task
created-at: "2026-05-05T21:23:27.177044-05:00"
---

Decide architecture for adaptive music intensity (REQ-040 partial). Current cues are all programmatic Web Audio one-shots; there is no sustained stem playing under combat. Decide: (a) procedural sustained oscillators driven by gain envelope (cheapest, no asset), (b) a small set of looped audio buffers (richer but adds asset pipeline), (c) hybrid with a procedural baseline plus an optional asset layer. Output: a one-page architecture note plus a tuning of F-015 with the chosen approach. Recommended default to investigate first: (a) procedural, since Flatline already runs a procedural-cue audio palette and adding asset pipeline is out of scope for the current phase.
