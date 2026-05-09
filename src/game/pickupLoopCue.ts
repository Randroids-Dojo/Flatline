/**
 * Subtle looping audio cue for the central altar pickup.
 *
 * The art is mostly grayscale (Q-001), so audio replaces some color cues.
 * REQ-036 (pickup readability) calls for a "subtle looping sound" alongside
 * the bounce, glow, and rim-light pickup readability cues that already
 * ship via `src/game/pickupReadability.ts`. The loop is meant to draw the
 * ear toward the altar without competing with combat audio: it hums when
 * supplies are ready and mutes during the cooldown so the player can hear
 * it come back.
 *
 * `frequencyHz` is the carrier sine frequency. A low hum sits below the
 * spitter charge and player damage cues so the loop can run continuously
 * without masking critical combat audio.
 * `breathHz` is the rate at which the gain breathes around its baseline.
 * Slow breath (sub-1 Hz) so the cue reads as a calm "open for supplies"
 * presence, not as a warning pulse.
 * `breathDepth` is the +/- amplitude of the breath modulation, in units of
 * `baseGain`. A depth less than 1 keeps the loop audible at all phases of
 * the breath.
 * `baseGain` is the average gain when the pickup is ready. Lower than the
 * loudest enemy windup cue so the loop never drowns out combat events.
 * `cooldownGain` is the target gain while the pickup cools down. Zero so
 * the player can hear the loop come back when supplies refresh.
 */
export type PickupLoopStyle = {
  frequencyHz: number
  breathHz: number
  breathDepth: number
  baseGain: number
  cooldownGain: number
}

const supplyLoop: PickupLoopStyle = {
  frequencyHz: 110,
  breathHz: 0.6,
  breathDepth: 0.55,
  baseGain: 0.012,
  cooldownGain: 0
}

export function pickupLoopStyle(): PickupLoopStyle {
  return supplyLoop
}

/**
 * Target gain for the loop oscillator at a given elapsed time.
 *
 * When the pickup is on cooldown the target collapses to `cooldownGain`
 * so the consumer can ramp it down via `setTargetAtTime`. When ready,
 * the target breathes around `baseGain` at `breathHz`, never falling
 * below 0 so the multiplied gain stays well-defined.
 */
export function pickupLoopGain(style: PickupLoopStyle, elapsedMs: number, ready: boolean): number {
  if (!ready) {
    return style.cooldownGain
  }

  const phase = (elapsedMs / 1000) * style.breathHz * 2 * Math.PI
  const modulation = Math.sin(phase) * style.breathDepth
  const target = style.baseGain * (1 + modulation)

  return Math.max(0, target)
}
