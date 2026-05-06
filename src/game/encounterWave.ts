export const WAVE_LULL_MS = 25_000
export const WAVE_SURGE_MS = 18_000
export const WAVE_PEAK_MS = 7_000
export const WAVE_TOTAL_MS = WAVE_LULL_MS + WAVE_SURGE_MS + WAVE_PEAK_MS // 50_000

export type WavePhase = 'lull' | 'surge' | 'peak'

export type WaveSignal = {
  phase: WavePhase
  targetDelta: number
  cadenceScale: number
}

export function encounterWaveSignal(runMs: number): WaveSignal {
  if (runMs < 0) {
    return { phase: 'lull', targetDelta: 0, cadenceScale: 1 }
  }

  const cyclePosition = runMs % WAVE_TOTAL_MS

  if (cyclePosition < WAVE_LULL_MS) {
    return { phase: 'lull', targetDelta: 0, cadenceScale: 1 }
  }

  if (cyclePosition < WAVE_LULL_MS + WAVE_SURGE_MS) {
    return { phase: 'surge', targetDelta: 1, cadenceScale: 0.75 }
  }

  return { phase: 'peak', targetDelta: 2, cadenceScale: 0.55 }
}

// Returns true if a peak phase boundary was crossed between the prior
// run-time tick and the current one. Consumers fire a one-shot horn
// cue when this fires, signalling the player that the wave just hit
// peak intensity.
export function peakStartedBetween(prevRunMs: number, currentRunMs: number): boolean {
  if (prevRunMs < 0 || currentRunMs < prevRunMs) {
    return false
  }

  const peakOffset = WAVE_LULL_MS + WAVE_SURGE_MS
  const prevCycle = Math.floor(prevRunMs / WAVE_TOTAL_MS)
  const currentCycle = Math.floor(currentRunMs / WAVE_TOTAL_MS)
  const prevInCycle = prevRunMs - prevCycle * WAVE_TOTAL_MS
  const currentInCycle = currentRunMs - currentCycle * WAVE_TOTAL_MS

  if (prevCycle !== currentCycle) {
    return currentInCycle >= peakOffset
  }

  return prevInCycle < peakOffset && currentInCycle >= peakOffset
}
