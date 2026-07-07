# Audio

**Status:** partial

Everything is synthesized with WebAudio, no assets: per-weapon noise-burst gunshots, cartoon slide-whistle enemy deaths, squeak pain cues, coin dings, door creaks, a locked-door thunk, explosion rumble. Ambience is a looping vinyl-crackle buffer with a lazy two-note swing bass. Mute toggle on title and pause, persisted per session only.

Not yet done: audio degradation tied to the film preset (the reference game degrades audio in lockstep with grain), positional panning, and a proper swing combo. See F-028.

### Build log

- 2026-07-07: synthesized sfx and crackle-plus-bass ambience. Files: `src/audio/sfx.ts`. PR #pending.
