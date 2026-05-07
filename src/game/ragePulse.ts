/**
 * Sustained rage pulse audio layer.
 *
 * F-011 (the rage / berserk pickup) shipped a one-shot swoop on grant
 * and a screen-edge red tint, but no sustained audio while the buff
 * is active. Without an audio bed the rage state reads as "I had a
 * sound effect" rather than "I am the threat now."
 *
 * The pulse is a single low-frequency square run through a slow LFO
 * so it pulses at ~4 Hz like an angry heartbeat. The frequency sits
 * above the existing music bass layer (60 Hz sawtooth) so the two
 * layers don't muddy each other when both are active. Master gain is
 * low so the cue is felt rather than overwhelming.
 */
export const RAGE_PULSE_BASS_HZ = 80
export const RAGE_PULSE_THROB_HZ = 4
export const RAGE_PULSE_GAIN = 0.05
