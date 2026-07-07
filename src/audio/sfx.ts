// Procedural WebAudio sound: no assets, everything synthesized. The mix
// leans 1930s: gunshots are dry noise bursts, hurt cues are cartoon squeaks,
// and the ambience is a vinyl-crackle loop with a lazy swing bass.

import type { WeaponId } from '@/game/weapons'

export class Sfx {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private crackleSource: AudioBufferSourceNode | null = null
  private bassTimer: number | null = null
  private muted = false

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null
    }
    if (!this.ctx) {
      const Ctor = window.AudioContext
      if (!Ctor) {
        return null
      }
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.5
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (this.master) {
      this.master.gain.value = muted ? 0 : 0.5
    }
  }

  isMuted(): boolean {
    return this.muted
  }

  private noiseBuffer(seconds: number): AudioBuffer | null {
    const ctx = this.ensure()
    if (!ctx) {
      return null
    }
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * seconds)), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1
    }
    return buffer
  }

  private burst(duration: number, filterHz: number, gain: number, type: BiquadFilterType = 'lowpass') {
    const ctx = this.ensure()
    if (!ctx || !this.master) {
      return
    }
    const buffer = this.noiseBuffer(duration)
    if (!buffer) {
      return
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.value = filterHz
    const env = ctx.createGain()
    env.gain.setValueAtTime(gain, ctx.currentTime)
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    source.connect(filter).connect(env).connect(this.master)
    source.start()
  }

  private sweep(fromHz: number, toHz: number, duration: number, gain: number, type: OscillatorType = 'square') {
    const ctx = this.ensure()
    if (!ctx || !this.master) {
      return
    }
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(fromHz, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), ctx.currentTime + duration)
    const env = ctx.createGain()
    env.gain.setValueAtTime(gain, ctx.currentTime)
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(env).connect(this.master)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  }

  fire(weapon: WeaponId) {
    switch (weapon) {
      case 'paws':
        this.burst(0.08, 500, 0.25)
        break
      case 'snub':
        this.burst(0.14, 1800, 0.5)
        break
      case 'scattergun':
        this.burst(0.3, 900, 0.7)
        break
      case 'chatter':
        this.burst(0.07, 2200, 0.35)
        break
      case 'lobber':
        this.burst(0.12, 600, 0.4)
        this.sweep(300, 80, 0.3, 0.1, 'triangle')
        break
      case 'raygun':
        this.sweep(1400, 300, 0.16, 0.2, 'sawtooth')
        break
      case 'bigcheese':
        this.sweep(90, 700, 0.5, 0.3, 'sawtooth')
        this.burst(0.5, 400, 0.4)
        break
    }
  }

  explosion() {
    this.burst(0.7, 300, 0.9)
    this.sweep(160, 30, 0.6, 0.4, 'triangle')
  }

  enemyPain() {
    this.sweep(900, 1400, 0.12, 0.15)
  }

  enemyDie() {
    // Slide-whistle down: pure cartoon.
    this.sweep(1200, 180, 0.5, 0.2, 'triangle')
  }

  playerHurt() {
    this.sweep(500, 200, 0.25, 0.3, 'square')
  }

  pickup() {
    this.sweep(700, 1300, 0.1, 0.18, 'triangle')
  }

  coin() {
    this.sweep(1500, 2200, 0.09, 0.14, 'sine')
  }

  doorOpen() {
    this.sweep(80, 200, 0.6, 0.15, 'sawtooth')
  }

  doorLocked() {
    this.burst(0.08, 400, 0.3)
    this.sweep(220, 160, 0.18, 0.2, 'square')
  }

  keyPickup() {
    this.sweep(900, 1800, 0.3, 0.2, 'triangle')
  }

  // Ambient layer: vinyl crackle plus a lazy two-note swing bass.
  startAmbience() {
    const ctx = this.ensure()
    if (!ctx || !this.master || this.crackleSource) {
      return
    }
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() < 0.001 ? (Math.random() * 2 - 1) * 0.6 : (Math.random() * 2 - 1) * 0.015
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const gain = ctx.createGain()
    gain.gain.value = 0.5
    source.connect(gain).connect(this.master)
    source.start()
    this.crackleSource = source

    const bassNotes = [82.4, 82.4, 110, 98, 82.4, 73.4, 110, 98]
    let step = 0
    const playStep = () => {
      const swing = step % 2 === 0 ? 0.42 : 0.28
      this.sweep(bassNotes[step % bassNotes.length], bassNotes[step % bassNotes.length] * 0.99, 0.3, 0.05, 'sine')
      step++
      this.bassTimer = window.setTimeout(playStep, swing * 1000)
    }
    playStep()
  }

  stopAmbience() {
    if (this.crackleSource) {
      this.crackleSource.stop()
      this.crackleSource = null
    }
    if (this.bassTimer !== null) {
      window.clearTimeout(this.bassTimer)
      this.bassTimer = null
    }
  }
}
