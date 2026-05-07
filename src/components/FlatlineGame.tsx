'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  CURTAIN_DOOR_HALF_GAP_M,
  CURTAIN_HEIGHT_M,
  CURTAIN_PANEL_COUNT,
  CURTAIN_PANEL_DEPTH_M,
  CURTAIN_SIDE_WIDTH_M,
  ORGAN_DOOR_OFFSET_M,
  ORGAN_PIPE_HEIGHTS_M,
  ORGAN_PIPE_RADIUS_M,
  ORGAN_PIPE_SPACING_M,
  landmarkForWall
} from '@/game/arenaLandmarks'
import { angleToPlayerBucket, angleToPlayerName, type BillboardAngle } from '@/game/billboard'
import { damageDirectionRadians } from '@/game/damageDirection'
import { doorOpenCue, type DoorCueStyle } from '@/game/doorCue'
import { DOOR_TOTAL_MS, doorPhaseVisualAtElapsedMs } from '@/game/doorState'
import { applyDailySpawnOffset, createDailyArenaConfig, createDailySchedulePreview, type DailyArenaConfig, type DailySchedulePreview } from '@/game/dailyArena'
import { createEnemy, createGrunt, damageEnemy, enemyConfigs, enemyTypeForSpawn, tickEnemy, type EnemyEvent, type EnemyModel, type EnemyType } from '@/game/enemies'
import { enemyHurtFlashIntensity, enemyHurtFlashStyle } from '@/game/enemyHurtFlash'
import { enemyWindupCue, type EnemyWindupCueStyle } from '@/game/enemyWindupCue'
import { boomstickPointBlankMultiplier } from '@/game/boomstickPointBlank'
import { cameraKickProgressAtElapsedMs, cameraKickStyle, type CameraKickStyle } from '@/game/cameraKick'
import { comboBreakCue, comboJustBroke, type ComboBreakCueStyle } from '@/game/comboBreakCue'
import { dashReadyAt, dashStep, startDash, type DashState } from '@/game/dash'
import {
  RAGE_DURATION_MS,
  rageBuffActive,
  rageMultipliers,
  rageTintOpacity,
  type RageBuffState
} from '@/game/rageBuff'
import {
  createSpitterProjectile,
  SPITTER_PROJECTILE_RADIUS_M,
  spitterProjectileExpired,
  spitterProjectileHitsPlayer,
  tickSpitterProjectile,
  type SpitterProjectile
} from '@/game/spitterProjectile'
import { hazardCountdownCue, hazardCountdownTicksBetween, type HazardCountdownStyle, type HazardCountdownTick } from '@/game/hazardCountdown'
import { hazardCycleConfigs, hazardDamageAtPosition, hazardStatesForRunMs, roomPressureIntensity, type HazardKind, type HazardPhase, type HazardState } from '@/game/hazards'
import { hitstopScaleAtElapsedMs, hitstopStyle, type HitstopStyle } from '@/game/hitstop'
import { knockbackDistance } from '@/game/knockback'
import {
  hudGrainOpacity,
  hudPillWobbleAmplitudePx,
  hudPillWobblePeriodMs,
  hudPillWobbleRotationDeg,
  hudSplatterIntensity
} from '@/game/hudJitter'
import { updatePlayerPosition } from '@/game/movement'
import { muzzleFlashStyle } from '@/game/muzzleFlash'
import { pickupCue, type PickupCueStyle } from '@/game/pickupCue'
import {
  pickupBounceY,
  pickupGlowIntensity,
  pickupHaloOpacity,
  pickupHaloScale
} from '@/game/pickupReadability'
import { playerDamageCue, type PlayerDamageCueStyle } from '@/game/playerDamageCue'
import { weaponRecoilStyle } from '@/game/weaponRecoil'
import { accuracy, createScoreState, finalScore, recordKill, recordShot, type ScoreState } from '@/game/scoring'
import { fireHitscan, forwardFromYawPitch } from '@/game/shooting'
import { createDirectorState, targetPressureForRunMs, tickDirector, type DirectorState } from '@/game/spawnDirector'
import { encounterWaveSignal, peakStartedBetween } from '@/game/encounterWave'
import {
  MUSIC_BASS_HZ,
  MUSIC_PEAK_GAIN,
  MUSIC_THROB_HZ,
  musicIntensityGain
} from '@/game/musicIntensity'
import {
  RAGE_PULSE_BASS_HZ,
  RAGE_PULSE_GAIN,
  RAGE_PULSE_THROB_HZ
} from '@/game/ragePulse'
import {
  formatScoreFloaterText,
  SCORE_FLOATER_TTL_MS,
  type ScoreFloater
} from '@/game/scoreFloater'
import { SKITTER_DASH_DURATION_MS } from '@/game/skitterDash'
import { spitterChargeIntensity } from '@/game/spitterCharge'
import {
  SCORE_TOKEN_REARM_MS,
  scoreTokenActive,
  scoreTokenMultiplier,
  type ScoreTokenState
} from '@/game/scoreToken'
import { assertValidSpriteAtlas, frameToUvTransform, selectAnimationClip, selectSpriteFrame, type AnimationName, type SpriteAtlas } from '@/game/spriteAtlas'
import type { MovementInput, SphereTarget, Vec3 } from '@/game/types'
import {
  beginJoystick,
  createJoystick,
  endJoystick,
  joystickDeadzone,
  joystickMovedBeyond,
  joystickRadius,
  moveJoystick,
  readJoystick,
  type JoystickState
} from '@/game/virtualJoystick'
import {
  canFireWeaponAt,
  canFireWeapon,
  collectWeaponAmmo,
  createWeaponCooldownState,
  createWeaponAmmo,
  nextWeapon,
  spendWeaponAmmo,
  weaponAmmoLabel,
  weaponConfigs,
  weaponIds,
  type WeaponAmmoState,
  type WeaponCooldownState,
  type WeaponId
} from '@/game/weapons'
import { dailySeed } from '@/lib/dailySeed'
import { bestLocalScore, insertLeaderboardEntry, readLeaderboard, writeLeaderboard, type LeaderboardEntry } from '@/lib/leaderboard'
import { dailyDateKey, type LeaderboardScope, type RankedLeaderboardEntry, type SharedLeaderboardResponse } from '@/lib/sharedLeaderboard'

const cameraHeight = 1.7
const initialPlayerPosition: Vec3 = { x: 0, y: cameraHeight, z: -5.5 }
const initialYaw = Math.PI
const movementConfig = {
  speed: 6.8,
  bounds: {
    minX: -8.5,
    maxX: 8.5,
    minZ: -8.5,
    maxZ: 8.5
  }
}
const weaponIdsForSelect = [...weaponIds]
const enemyTypesForSelect: EnemyType[] = ['grunt', 'skitter', 'brute', 'spitter']
const enemyAtlasTypes: EnemyType[] = ['grunt', 'skitter', 'brute']

const MAX_ENEMIES = 3

// Q-008 recommended default: cross-faction (infighting) damage is 50% of
// player-facing damage. Hazard ticks against enemies and spitter projectile
// crossfire both route through this scale.
const INFIGHTING_DAMAGE_SCALE = 0.5

type EnemyRenderSlot = {
  material: THREE.MeshBasicMaterial
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  arrow: THREE.ArrowHelper
  texture: THREE.Texture | null
  textureType: EnemyType | null
}

type RuntimeRefs = {
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  scene: THREE.Scene
  overhead: THREE.PointLight
  enemySlots: EnemyRenderSlot[]
  doorSignals: Record<string, THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>>
  muzzleLight: THREE.PointLight
  shotGroup: THREE.Group
  hazardMeshes: Record<HazardKind, THREE.Mesh>
  movingCover: THREE.Mesh
  pickup: {
    altar: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>
    halo: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
    restY: number
  }
}

type EnemyVisualAsset = {
  atlas: SpriteAtlas
  texture: THREE.Texture
}

type ShotBolt = {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
  direction: THREE.Vector3
  remainingDistance: number
  ttlMs: number
  hit: boolean
  impactSpawned: boolean
}

type ShotImpact = {
  mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  ageMs: number
  durationMs: number
  startScale: number
  endScale: number
}

type InkProjectile = {
  group: THREE.Group
  core: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
  halo: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
  direction: THREE.Vector3
  remainingDistance: number
  damage: number
  splashRadius: number
  ageMs: number
}

type SpitterProjectileRuntime = {
  state: SpitterProjectile
  group: THREE.Group
  core: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
  halo: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
}

type TouchJoysticks = {
  move: JoystickState
  look: JoystickState
}

type RunSummary = {
  score: number
  survivalMs: number
  kills: number
  accuracy: number
  bestCombo: number
  closeRangeKills: number
  weaponsUsed: number
  bestNoDamageStreak: number
}

type Settings = {
  sensitivity: number
  fov: number
  audio: boolean
}

type SharedLeaderboardStatus = 'loading' | 'ready' | 'unavailable' | 'error'
type SubmitStatus = 'idle' | 'submitting' | 'submitted' | 'unavailable' | 'error'

type FlatlineGameProps = {
  initialLeaderboardScope?: LeaderboardScope
  arenaMode?: 'standard' | 'daily' | 'practice'
}

type PracticeSettings = {
  startingWeapon: WeaponId
  enemyTypes: EnemyType[]
  spawnRate: number
  infiniteAmmo: boolean
  damageEnabled: boolean
  debugOverlays: boolean
  roomStateFrozen: boolean
}

export function FlatlineGame({ initialLeaderboardScope = 'all', arenaMode = 'standard' }: FlatlineGameProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const runtimeRef = useRef<RuntimeRefs | null>(null)
  const animationRef = useRef<number | null>(null)
  const shotBoltsRef = useRef<ShotBolt[]>([])
  const shotImpactsRef = useRef<ShotImpact[]>([])
  const inkProjectilesRef = useRef<InkProjectile[]>([])
  const spitterProjectilesRef = useRef<SpitterProjectileRuntime[]>([])
  const spitterProjectileSeqRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const positionRef = useRef<Vec3>({ ...initialPlayerPosition })
  const yawRef = useRef<number>(initialYaw)
  const pitchRef = useRef<number>(0)
  const keysRef = useRef<MovementInput>({ forward: false, backward: false, left: false, right: false })
  const touchJoysticksRef = useRef<TouchJoysticks>({ move: createJoystick(), look: createJoystick() })
  const touchLookVectorRef = useRef({ x: 0, y: 0 })
  const touchLookStartedAtRef = useRef(0)
  const runningRef = useRef<boolean>(false)
  const pausedRef = useRef<boolean>(false)
  const settingsRef = useRef<Settings>({ sensitivity: 1, fov: 75, audio: true })
  const enemiesRef = useRef<EnemyModel[]>([createGrunt('grunt-1', { x: 0, y: 1.05, z: 3.5 }, initialPlayerPosition)])
  const enemySpawnSeqRef = useRef<number>(1)
  const playerHealthRef = useRef<number>(100)
  const directorRef = useRef<DirectorState>(createDirectorState())
  const roomStateMsRef = useRef<number>(0)
  const scoreRef = useRef<ScoreState>(createScoreState())
  const healthPickupReadyRef = useRef<boolean>(true)
  const healthPickupCooldownRef = useRef<number>(0)
  const hazardDamageCooldownRef = useRef<number>(0)
  const enemyHazardCooldownRef = useRef<number>(0)
  const prevHazardRunMsRef = useRef<number>(-1)
  const prevWaveRunMsRef = useRef<number>(-1)
  const prevActiveComboRef = useRef<number>(0)
  const musicLayerRef = useRef<{
    context: AudioContext
    masterGain: GainNode
    bass: OscillatorNode
    throb: OscillatorNode
    throbGain: GainNode
  } | null>(null)
  const ragePulseLayerRef = useRef<{
    context: AudioContext
    masterGain: GainNode
    bass: OscillatorNode
    throb: OscillatorNode
    throbGain: GainNode
  } | null>(null)
  const tookDamageSinceLastKillRef = useRef<boolean>(false)
  const hitstopStateRef = useRef<{ style: HitstopStyle; startMs: number } | null>(null)
  const cameraKickStateRef = useRef<{ style: CameraKickStyle; startMs: number } | null>(null)
  const lastMountTransformRef = useRef<string>('')
  const dashStateRef = useRef<DashState | null>(null)
  const lastDashStartMsRef = useRef<number>(Number.NEGATIVE_INFINITY)
  const rageBuffStateRef = useRef<RageBuffState | null>(null)
  const nextRageEligibleRunMsRef = useRef<number>(90_000)
  const scoreTokenStateRef = useRef<ScoreTokenState | null>(null)
  const nextScoreTokenEligibleRunMsRef = useRef<number>(70_000)
  const selectedWeaponRef = useRef<WeaponId>('peashooter')
  const weaponAmmoRef = useRef<WeaponAmmoState>(createWeaponAmmo())
  const weaponCooldownRef = useRef<WeaponCooldownState>(createWeaponCooldownState())
  const practiceSettingsRef = useRef<PracticeSettings>(createPracticeSettings())
  const weaponFlashTimeoutRef = useRef<number | null>(null)
  const muzzleFlashTimeoutRef = useRef<number | null>(null)
  const enemyAssetsRef = useRef<Partial<Record<EnemyType, EnemyVisualAsset>>>({})
  // Time elapsed since each door spawned an enemy, in ms. Doors that
  // have never spawned (or whose spawn window has fully closed) sit
  // at or above DOOR_TOTAL_MS, which the door state helper resolves
  // to the `idle` phase.
  const doorSignalTimersRef = useRef<Record<string, number>>({})
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [hits, setHits] = useState(0)
  const [playerHealth, setPlayerHealth] = useState(100)
  const [enemyHealth, setEnemyHealth] = useState(3)
  const [enemyType, setEnemyType] = useState<EnemyModel['type']>('grunt')
  const [score, setScore] = useState(0)
  const [kills, setKills] = useState(0)
  const [combo, setCombo] = useState(0)
  const [runMs, setRunMs] = useState(0)
  const [damagePulse, setDamagePulse] = useState(0)
  const [damageIndicator, setDamageIndicator] = useState<{ key: number; angleRadians: number } | null>(null)
  const [muzzleFlash, setMuzzleFlash] = useState<{ key: number; weapon: WeaponId } | null>(null)
  const [healthPickupReady, setHealthPickupReady] = useState(true)
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponId>('peashooter')
  const [weaponAmmo, setWeaponAmmo] = useState<WeaponAmmoState>(() => createWeaponAmmo())
  const [weaponFiring, setWeaponFiring] = useState(false)
  const [weaponFireKey, setWeaponFireKey] = useState(0)
  const [weaponReady, setWeaponReady] = useState(true)
  const [dashReady, setDashReady] = useState(true)
  const [rageActive, setRageActive] = useState(false)
  const [rageTint, setRageTint] = useState(0)
  const [scoreTokenActiveState, setScoreTokenActiveState] = useState(false)
  const [scoreFloaters, setScoreFloaters] = useState<ScoreFloater[]>([])
  const scoreFloaterSeqRef = useRef<number>(0)
  const [wavePhase, setWavePhase] = useState<'lull' | 'surge' | 'peak'>('lull')
  const [touchJoysticksView, setTouchJoysticksView] = useState<TouchJoysticks>(() => ({
    move: createJoystick(),
    look: createJoystick()
  }))
  const [summary, setSummary] = useState<RunSummary | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() =>
    typeof window === 'undefined' ? [] : readLeaderboard(window.localStorage)
  )
  const [settings, setSettings] = useState<Settings>(() => loadInitialSettings())
  const [practiceSettings, setPracticeSettings] = useState<PracticeSettings>(() => createPracticeSettings())
  const [seed] = useState(() => dailySeed())
  const [dailyConfig] = useState<DailyArenaConfig | null>(() => arenaMode === 'daily' ? createDailyArenaConfig(seed) : null)
  const [dailySchedule] = useState<DailySchedulePreview | null>(() => {
    if (arenaMode !== 'daily') {
      return null
    }

    return createDailySchedulePreview(createDailyArenaConfig(seed))
  })
  const [dailyDate] = useState(() => dailyDateKey())
  const [sharedScope, setSharedScope] = useState<LeaderboardScope>(initialLeaderboardScope)
  const [sharedEntries, setSharedEntries] = useState<RankedLeaderboardEntry[]>([])
  const [sharedStatus, setSharedStatus] = useState<SharedLeaderboardStatus>('loading')
  const [initials, setInitials] = useState(() => loadInitials())
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const [debug, setDebug] = useState<{ angle: BillboardAngle; bucket: number; animation: AnimationName }>({
    angle: 'front',
    bucket: 0,
    animation: 'idle'
  })
  const [status, setStatus] = useState('Start a run to lock the pointer and enter the room.')
  const isPractice = arenaMode === 'practice'

  const damageEnemyById = useCallback(
    (enemyId: string, damage: number, hurtStatus: string, killStatus: string, hitDistance?: number) => {
      const enemies = enemiesRef.current
      const index = enemies.findIndex((candidate) => candidate.id === enemyId)

      if (index === -1) {
        return
      }

      const enemy = enemies[index]

      if (enemy.state === 'dead') {
        return
      }

      const enemyPosition = enemy.position
      const damaged = damageEnemy(enemy, damage)
      enemies[index] = damaged
      hitstopStateRef.current = {
        style: hitstopStyle(selectedWeaponRef.current),
        startMs: performance.now()
      }

      if (damaged.state === 'dead') {
        const playerPos = positionRef.current
        const dx = enemyPosition.x - playerPos.x
        const dz = enemyPosition.z - playerPos.z
        const fallbackDistance = Math.sqrt(dx * dx + dz * dz)
        const distance = hitDistance ?? fallbackDistance
        const previousScore = scoreRef.current.score
        scoreRef.current = recordKill(scoreRef.current, directorRef.current.runMs, {
          distance,
          weapon: selectedWeaponRef.current,
          tookDamageSinceLastKill: tookDamageSinceLastKillRef.current,
          scoreMultiplier: scoreTokenMultiplier(scoreTokenStateRef.current, performance.now())
        })
        const scoreDelta = scoreRef.current.score - previousScore
        tookDamageSinceLastKillRef.current = false
        setScore(scoreRef.current.score)
        setKills(scoreRef.current.kills)
        setCombo(scoreRef.current.combo)
        playCue(90, settingsRef.current.audio)

        const runtime = runtimeRef.current
        if (runtime && scoreDelta > 0) {
          const projected = new THREE.Vector3(enemyPosition.x, enemyPosition.y + 0.6, enemyPosition.z).project(runtime.camera)
          const canvas = runtime.renderer.domElement
          const rect = canvas.getBoundingClientRect()
          const screenX = (projected.x * 0.5 + 0.5) * rect.width
          const screenY = (1 - (projected.y * 0.5 + 0.5)) * rect.height
          const inFront = projected.z < 1
          if (inFront && screenX >= 0 && screenX <= rect.width && screenY >= 0 && screenY <= rect.height) {
            scoreFloaterSeqRef.current += 1
            const floater: ScoreFloater = {
              id: scoreFloaterSeqRef.current,
              text: formatScoreFloaterText(scoreDelta),
              startedAtMs: performance.now(),
              screenX,
              screenY
            }
            setScoreFloaters((current) => [...current, floater])
            window.setTimeout(() => {
              setScoreFloaters((current) => current.filter((entry) => entry.id !== floater.id))
            }, SCORE_FLOATER_TTL_MS + 60)
          }
        }
      } else {
        playCue(320, settingsRef.current.audio)
      }

      setEnemyHealth(damaged.health)
      setEnemyType(damaged.type)
      setStatus(damaged.state === 'dead' ? killStatus : hurtStatus)
    },
    []
  )

  const fire = useCallback(() => {
    const runtime = runtimeRef.current

    if (!runningRef.current || runtime === null) {
      return
    }

    const weapon = selectedWeaponRef.current
    const nowMs = performance.now()
    const buff = rageMultipliers(rageBuffStateRef.current, nowMs)
    const buffedFireIntervalMs = weaponConfigs[weapon].fireIntervalMs / buff.fireRate

    if (nowMs - weaponCooldownRef.current[weapon] < buffedFireIntervalMs) {
      setWeaponReady(false)
      return
    }

    if (!practiceSettingsRef.current.infiniteAmmo && !canFireWeapon(weapon, weaponAmmoRef.current)) {
      setStatus(`${weaponConfigs[weapon].label} is empty. Switch weapons or collect supplies.`)
      return
    }

    weaponCooldownRef.current = {
      ...weaponCooldownRef.current,
      [weapon]: nowMs
    }
    setWeaponReady(false)

    if (!practiceSettingsRef.current.infiniteAmmo) {
      weaponAmmoRef.current = spendWeaponAmmo(weapon, weaponAmmoRef.current)
      setWeaponAmmo(weaponAmmoRef.current)
    }
    runtime.muzzleLight.intensity = weapon === 'boomstick' ? 7 : 4.5
    cameraKickStateRef.current = {
      style: cameraKickStyle(weapon),
      startMs: nowMs
    }
    setWeaponFiring(true)
    setWeaponFireKey((value) => value + 1)

    if (weaponFlashTimeoutRef.current !== null) {
      window.clearTimeout(weaponFlashTimeoutRef.current)
    }

    weaponFlashTimeoutRef.current = window.setTimeout(() => {
      setWeaponFiring(false)
      weaponFlashTimeoutRef.current = null
    }, 220)

    if (muzzleFlashTimeoutRef.current !== null) {
      window.clearTimeout(muzzleFlashTimeoutRef.current)
    }

    const flashStyle = muzzleFlashStyle(weapon)
    setMuzzleFlash({ key: nowMs, weapon })
    muzzleFlashTimeoutRef.current = window.setTimeout(() => {
      setMuzzleFlash(null)
      muzzleFlashTimeoutRef.current = null
    }, flashStyle.durationMs)
    playCue(weapon === 'boomstick' ? 120 : 180, settingsRef.current.audio)

    const direction = forwardFromYawPitch(yawRef.current, pitchRef.current)

    if (weapon === 'inkblaster') {
      spawnInkProjectile(runtime, inkProjectilesRef.current, positionRef.current, direction, weaponConfigs.inkblaster.damage)
      // Count the shotsFired now; shotsHit is added at impact in
      // the animate-loop projectile-tick branch when the projectile
      // actually overlaps an enemy. Counting `true` here would
      // double-count every ink shot whether or not it lands.
      scoreRef.current = recordShot(scoreRef.current, false)
      setStatus('Inkblaster projectile launched.')
      return
    }

    const aliveEnemies = enemiesRef.current.filter((candidate) => candidate.state !== 'dead')
    const targets: SphereTarget[] = aliveEnemies.map((candidate) => ({
      id: candidate.id,
      center: { x: candidate.position.x, y: 1.35, z: candidate.position.z },
      radius: 0.72
    }))
    const spread = weaponConfigs[weapon].spreadRadians
    const hits = spread
      .map((yawOffset) => {
        const pelletDirection = forwardFromYawPitch(yawRef.current + yawOffset, pitchRef.current)
        const hit = fireHitscan(positionRef.current, pelletDirection, targets, 18)
        spawnShotBolt(runtime, shotBoltsRef.current, positionRef.current, pelletDirection, hit?.distance ?? 18, Boolean(hit))
        return hit
      })
      .filter((hit): hit is NonNullable<typeof hit> => hit !== null)

    scoreRef.current = recordShot(scoreRef.current, hits.length > 0)

    if (hits.length > 0) {
      // Group hits by target id so a boomstick burst that lands multiple
      // pellets on the same enemy still applies the per-pellet damage
      // count to that enemy and a different enemy hit by another pellet
      // gets its own damage entry.
      const hitsById = new Map<string, { count: number; closestDistance: number }>()
      for (const hit of hits) {
        const entry = hitsById.get(hit.targetId) ?? { count: 0, closestDistance: Number.POSITIVE_INFINITY }
        entry.count += 1
        entry.closestDistance = Math.min(entry.closestDistance, hit.distance)
        hitsById.set(hit.targetId, entry)
      }

      setHits((value) => value + hits.length)

      const xzLen = Math.hypot(direction.x, direction.z)
      const knockbackDir = xzLen > 0
        ? { x: direction.x / xzLen, y: 0, z: direction.z / xzLen }
        : { x: 0, y: 0, z: 1 }

      for (const [enemyId, entry] of hitsById) {
        const enemyIndex = enemiesRef.current.findIndex((candidate) => candidate.id === enemyId)
        if (enemyIndex === -1) continue

        const enemyBeforeDamage = enemiesRef.current[enemyIndex]
        enemiesRef.current[enemyIndex] = knockEnemyBack(
          enemyBeforeDamage,
          knockbackDir,
          knockbackDistance(weapon, entry.closestDistance, enemyBeforeDamage.type)
        )

        const baseDamage = weapon === 'boomstick' ? entry.count : weaponConfigs.peashooter.damage
        const pointBlankMult = weapon === 'boomstick' ? boomstickPointBlankMultiplier(entry.closestDistance) : 1
        damageEnemyById(
          enemyId,
          Math.max(1, Math.round(baseDamage * buff.damage * pointBlankMult)),
          weapon === 'boomstick' ? 'Boomstick blast landed.' : 'Billboard enemy hurt.',
          weapon === 'boomstick' ? 'Boomstick dropped the enemy.' : 'Billboard enemy dropped.',
          entry.closestDistance
        )
      }
    } else {
      setStatus(`${weaponConfigs[weapon].label} missed. Track the target and fire again.`)
    }
  }, [damageEnemyById])

  const startRun = useCallback(() => {
    const firstEnemyType = practiceEnemyTypeForSpawn(0, practiceSettingsRef.current, isPractice)
    const startingWeapon = practiceSettingsRef.current.startingWeapon
    positionRef.current = { ...initialPlayerPosition }
    yawRef.current = initialYaw
    pitchRef.current = 0
    playerHealthRef.current = 100
    directorRef.current = createDirectorState()
    roomStateMsRef.current = 0
    scoreRef.current = createScoreState()
    enemySpawnSeqRef.current = 1
    enemiesRef.current = [createEnemy(firstEnemyType, `${firstEnemyType}-${enemySpawnSeqRef.current}`, { x: 0, y: 1.05, z: 3.5 }, initialPlayerPosition)]
    healthPickupReadyRef.current = true
    healthPickupCooldownRef.current = 0
    hazardDamageCooldownRef.current = 0
    enemyHazardCooldownRef.current = 0
    prevHazardRunMsRef.current = -1
    prevWaveRunMsRef.current = -1
    prevActiveComboRef.current = 0
    tookDamageSinceLastKillRef.current = false
    hitstopStateRef.current = null
    cameraKickStateRef.current = null
    dashStateRef.current = null
    lastDashStartMsRef.current = Number.NEGATIVE_INFINITY
    rageBuffStateRef.current = null
    nextRageEligibleRunMsRef.current = 90_000
    setRageActive(false)
    setRageTint(0)
    scoreTokenStateRef.current = null
    nextScoreTokenEligibleRunMsRef.current = 70_000
    setScoreTokenActiveState(false)
    setScoreFloaters([])

    if (mountRef.current && lastMountTransformRef.current !== '') {
      mountRef.current.style.transform = ''
      lastMountTransformRef.current = ''
    }

    selectedWeaponRef.current = startingWeapon
    weaponAmmoRef.current = createWeaponAmmo()
    weaponCooldownRef.current = createWeaponCooldownState()
    resetTouchControls(touchJoysticksRef.current, keysRef.current)
    touchLookVectorRef.current = { x: 0, y: 0 }
    doorSignalTimersRef.current = {}
    clearShotBolts(runtimeRef.current, shotBoltsRef.current)
    clearShotImpacts(runtimeRef.current, shotImpactsRef.current)
    clearInkProjectiles(runtimeRef.current, inkProjectilesRef.current)
    clearSpitterProjectiles(runtimeRef.current, spitterProjectilesRef.current)
    runningRef.current = true
    pausedRef.current = false
    setRunning(true)
    setPaused(false)
    setSummary(null)
    setHits(0)
    setPlayerHealth(100)
    setEnemyHealth(enemiesRef.current[0]?.health ?? 0)
    setEnemyType(enemiesRef.current[0]?.type ?? 'grunt')
    setScore(0)
    setKills(0)
    setCombo(0)
    setRunMs(0)
    setHealthPickupReady(true)
    setSelectedWeapon(startingWeapon)
    setWeaponAmmo(weaponAmmoRef.current)
    setWeaponReady(true)
    setDashReady(true)
    setDamageIndicator(null)
    setMuzzleFlash(null)

    if (muzzleFlashTimeoutRef.current !== null) {
      window.clearTimeout(muzzleFlashTimeoutRef.current)
      muzzleFlashTimeoutRef.current = null
    }
    setTouchJoysticksView(cloneTouchJoysticks(touchJoysticksRef.current))
    setStatus(isPractice ? 'Practice run started. Tuning changes apply next run.' : 'WASD moves. Mouse aims. Left click fires.')
    requestPointerLock(runtimeRef.current?.renderer.domElement)

    stopMusicLayer(musicLayerRef.current)
    musicLayerRef.current = settingsRef.current.audio ? startMusicLayer() : null
    stopRagePulseLayer(ragePulseLayerRef.current)
    ragePulseLayerRef.current = null
  }, [isPractice])

  const finishRun = useCallback(() => {
    resetTouchControls(touchJoysticksRef.current, keysRef.current)
    touchLookVectorRef.current = { x: 0, y: 0 }
    setTouchJoysticksView(cloneTouchJoysticks(touchJoysticksRef.current))
    const runSummary = {
      score: finalScore(scoreRef.current, directorRef.current.runMs),
      survivalMs: directorRef.current.runMs,
      kills: scoreRef.current.kills,
      accuracy: accuracy(scoreRef.current),
      bestCombo: scoreRef.current.bestCombo,
      closeRangeKills: scoreRef.current.closeRangeKills,
      weaponsUsed: scoreRef.current.weaponsUsedForKills.length,
      bestNoDamageStreak: scoreRef.current.bestNoDamageStreak
    }
    setSummary(runSummary)

    if (!isPractice && typeof window !== 'undefined') {
      const nextLeaderboard = insertLeaderboardEntry(
        readLeaderboard(window.localStorage),
        {
          playerInitials: 'YOU',
          ...runSummary,
          createdAt: new Date().toISOString()
        }
      )
      writeLeaderboard(window.localStorage, nextLeaderboard)
      setLeaderboard(nextLeaderboard)
    }

    playerHealthRef.current = 0
    setPlayerHealth(0)
    runningRef.current = false
    pausedRef.current = false
    setRunning(false)
    setPaused(false)
    setStatus(isPractice ? 'Practice run ended.' : 'Flatlined.')

    stopMusicLayer(musicLayerRef.current)
    musicLayerRef.current = null
    stopRagePulseLayer(ragePulseLayerRef.current)
    ragePulseLayerRef.current = null
  }, [isPractice])

  const resumeRun = useCallback(() => {
    pausedRef.current = false
    setPaused(false)
    setStatus('Run resumed.')
    requestPointerLock(runtimeRef.current?.renderer.domElement)
  }, [])

  const updateSettings = useCallback((nextSettings: typeof settings) => {
    settingsRef.current = nextSettings
    setSettings(nextSettings)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('flatline.settings.v1', JSON.stringify(nextSettings))
    }
  }, [])

  const updatePracticeSettings = useCallback((nextSettings: PracticeSettings) => {
    const safeSettings = normalizePracticeSettings(nextSettings)
    practiceSettingsRef.current = safeSettings
    setPracticeSettings(safeSettings)
  }, [])

  const fetchSharedLeaderboard = useCallback(async (scope: LeaderboardScope) => {
    if (isPractice) {
      setSharedEntries([])
      setSharedStatus('ready')
      return
    }

    try {
      const params = new URLSearchParams({ scope })

      if (scope === 'daily') {
        params.set('date', dailyDate)
      }

      const response = await fetch(`/api/leaderboard?${params.toString()}`)
      const data = await response.json() as SharedLeaderboardResponse
      setSharedEntries(data.entries)
      setSharedStatus(data.unavailable ? 'unavailable' : 'ready')
    } catch {
      setSharedStatus('error')
    }
  }, [dailyDate, isPractice])

  const switchSharedScope = useCallback((scope: LeaderboardScope) => {
    setSharedScope(scope)
    setSharedStatus('loading')
    fetchSharedLeaderboard(scope)
  }, [fetchSharedLeaderboard])

  const submitSharedScore = useCallback(async () => {
    if (isPractice || !summary || submitStatus === 'submitting') {
      return
    }

    const cleanInitials = normalizeClientInitials(initials)

    if (!cleanInitials) {
      setSubmitStatus('error')
      setStatus('Enter at least one letter for initials.')
      return
    }

    setInitials(cleanInitials)
    window.localStorage.setItem('flatline.initials.v1', cleanInitials)
    setSubmitStatus('submitting')

    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          initials: cleanInitials,
          ...summary,
          scope: sharedScope,
          date: dailyDate
        })
      })

      if (response.status === 503) {
        setSubmitStatus('unavailable')
        setSharedStatus('unavailable')
        setStatus('Shared leaderboard is not configured yet.')
        return
      }

      if (!response.ok) {
        setSubmitStatus('error')
        setStatus('Shared leaderboard submit failed.')
        return
      }

      const data = await response.json() as SharedLeaderboardResponse
      setSharedEntries(data.entries)
      setSharedStatus(data.unavailable ? 'unavailable' : 'ready')
      setSubmitStatus('submitted')
      setStatus('Shared leaderboard updated.')
    } catch {
      setSubmitStatus('error')
      setStatus('Shared leaderboard submit failed.')
    }
  }, [dailyDate, initials, isPractice, sharedScope, submitStatus, summary])

  useEffect(() => {
    const mount = mountRef.current

    if (!mount) {
      return
    }

    const shotBolts = shotBoltsRef.current
    const shotImpacts = shotImpactsRef.current
    const inkProjectiles = inkProjectilesRef.current
    const spitterProjectiles = spitterProjectilesRef.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#101010')
    scene.fog = new THREE.Fog('#101010', 12, 28)

    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(positionRef.current.x, positionRef.current.y, positionRef.current.z)
    camera.rotation.order = 'YXZ'

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.domElement.setAttribute('aria-label', 'Flatline 3D game canvas')
    mount.appendChild(renderer.domElement)

    const ambient = new THREE.HemisphereLight('#f4f1e8', '#171717', 1.7)
    scene.add(ambient)

    const overhead = new THREE.PointLight('#50d1c0', 55, 18)
    overhead.position.set(0, 6, 0)
    overhead.castShadow = true
    scene.add(overhead)

    const muzzleLight = new THREE.PointLight('#f05a4f', 0, 7)
    muzzleLight.position.set(0, 1.4, -4)
    scene.add(muzzleLight)

    const shotGroup = new THREE.Group()
    shotGroup.name = 'shot-bolts'
    scene.add(shotGroup)

    const hazardMeshes = createHazardMeshes()
    Object.values(hazardMeshes).forEach((mesh) => scene.add(mesh))

    const movingCover = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.35, 0.32),
      new THREE.MeshStandardMaterial({ color: '#565248', roughness: 0.86 })
    )
    movingCover.position.set(0, 0.68, 1.35)
    movingCover.castShadow = true
    movingCover.receiveShadow = true
    scene.add(movingCover)

    const roomVisuals = createRoom()
    scene.add(roomVisuals.group)

    const enemySlots: EnemyRenderSlot[] = []

    for (let i = 0; i < MAX_ENEMIES; i += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), material)
      mesh.name = `debug-billboard-enemy-${i}`
      mesh.position.set(0, 1.05, 3.5)
      mesh.renderOrder = 2
      mesh.visible = false
      scene.add(mesh)

      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0, 0.08, 3.5),
        1.15,
        '#f05a4f'
      )
      arrow.visible = false
      scene.add(arrow)

      enemySlots.push({ material, mesh, arrow, texture: null, textureType: null })
    }

    const dummyMarker = new THREE.Mesh(
      new THREE.TorusGeometry(0.82, 0.025, 8, 40),
      new THREE.MeshBasicMaterial({ color: '#50d1c0' })
    )
    dummyMarker.position.set(0, 0.04, 3.5)
    dummyMarker.rotation.x = Math.PI / 2
    scene.add(dummyMarker)

    const blobShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.72, 24),
      new THREE.MeshBasicMaterial({ color: '#050505', transparent: true, opacity: 0.55 })
    )
    blobShadow.position.set(0, 0.015, 3.5)
    blobShadow.rotation.x = -Math.PI / 2
    scene.add(blobShadow)

    runtimeRef.current = {
      renderer,
      camera,
      scene,
      overhead,
      enemySlots,
      doorSignals: roomVisuals.doorSignals,
      muzzleLight,
      shotGroup,
      hazardMeshes,
      movingCover,
      pickup: roomVisuals.pickup
    }

    loadEnemyAtlases().then((assets) => {
      const runtime = runtimeRef.current

      if (!runtime) {
        disposeEnemyAssets(assets)
        return
      }

      enemyAssetsRef.current = assets
    }).catch(() => {
      setStatus('Sprite atlas failed to load.')
    })

    camera.fov = settingsRef.current.fov
    camera.updateProjectionMatrix()

    function resize() {
      if (!mount || !runtimeRef.current) {
        return
      }

      const width = mount.clientWidth
      const height = mount.clientHeight
      runtimeRef.current.camera.aspect = width / height
      runtimeRef.current.camera.updateProjectionMatrix()
      runtimeRef.current.renderer.setSize(width, height)
    }

    const enemyHurtFlashColor = new THREE.Color()
    const spitterChargeColor = new THREE.Color('#f0ffd0')
    const skitterDashColor = new THREE.Color('#ffffff')

    function animate(time: number) {
      animationRef.current = requestAnimationFrame(animate)
      const runtime = runtimeRef.current

      if (!runtime) {
        return
      }

      const viewDelta = Math.min((time - lastTimeRef.current) / 1000 || 0, 0.05)
      lastTimeRef.current = time
      const hitstopState = hitstopStateRef.current
      const hitstopElapsedMs = hitstopState ? performance.now() - hitstopState.startMs : 0
      const hitstopScale = hitstopScaleAtElapsedMs(hitstopState?.style ?? null, hitstopElapsedMs)

      if (hitstopState && hitstopElapsedMs >= hitstopState.style.durationMs) {
        hitstopStateRef.current = null
      }

      // Hitstop scales the simulation delta so movement / AI / projectiles
      // freeze together. View rotation reads viewDelta so camera aim stays
      // responsive on wall-clock time during the freeze.
      const delta = viewDelta * hitstopScale
      const selectedWeaponId = selectedWeaponRef.current
      const selectedWeaponReady = canFireWeaponAt(
        selectedWeaponId,
        weaponCooldownRef.current[selectedWeaponId],
        performance.now()
      )

      setWeaponReady((current) => current === selectedWeaponReady ? current : selectedWeaponReady)

      if (runningRef.current && !pausedRef.current) {
        const touchLook = touchLookVectorRef.current

        if (touchLook.x !== 0 || touchLook.y !== 0) {
          yawRef.current -= touchLook.x * 2.8 * viewDelta * settingsRef.current.sensitivity
          pitchRef.current = clamp(
            pitchRef.current - touchLook.y * 2.35 * viewDelta * settingsRef.current.sensitivity,
            -1.25,
            1.25
          )
        }

        const moveBuff = rageMultipliers(rageBuffStateRef.current, performance.now())
        positionRef.current = updatePlayerPosition(
          positionRef.current,
          yawRef.current,
          keysRef.current,
          delta,
          moveBuff.speed === 1 ? movementConfig : { ...movementConfig, speed: movementConfig.speed * moveBuff.speed }
        )

        const dashFrame = dashStep(dashStateRef.current, performance.now())

        if (dashFrame.active) {
          const bounds = movementConfig.bounds
          const nextX = positionRef.current.x + dashFrame.vx * delta
          const nextZ = positionRef.current.z + dashFrame.vz * delta
          positionRef.current = {
            x: Math.max(bounds.minX, Math.min(bounds.maxX, nextX)),
            y: positionRef.current.y,
            z: Math.max(bounds.minZ, Math.min(bounds.maxZ, nextZ))
          }
        } else if (dashStateRef.current !== null) {
          dashStateRef.current = null
        }

        const dashIsReady = dashReadyAt(performance.now(), lastDashStartMsRef.current)
        setDashReady((current) => (current === dashIsReady ? current : dashIsReady))

        const rageNow = performance.now()
        const rageState = rageBuffStateRef.current
        const rageStillActive = rageBuffActive(rageState, rageNow)
        const rageTintNow = rageTintOpacity(rageState, rageNow)

        if (rageState !== null && !rageStillActive && rageNow - rageState.startMs >= RAGE_DURATION_MS) {
          rageBuffStateRef.current = null
          stopRagePulseLayer(ragePulseLayerRef.current)
          ragePulseLayerRef.current = null
        }

        setRageActive((current) => (current === rageStillActive ? current : rageStillActive))
        setRageTint((current) => (Math.abs(current - rageTintNow) < 0.005 ? current : rageTintNow))

        const tokenState = scoreTokenStateRef.current
        const tokenStillActive = scoreTokenActive(tokenState, rageNow)

        if (tokenState !== null && !tokenStillActive) {
          scoreTokenStateRef.current = null
        }

        setScoreTokenActiveState((current) => (current === tokenStillActive ? current : tokenStillActive))

        if (playerHealthRef.current > 0) {
          directorRef.current.runMs += delta * 1000
          setRunMs(directorRef.current.runMs)
          if (
            prevWaveRunMsRef.current >= 0 &&
            peakStartedBetween(prevWaveRunMsRef.current, directorRef.current.runMs)
          ) {
            playWaveHornCue(settingsRef.current.audio)
            setStatus('Wave peak. Hold ground or reposition.')
          }
          prevWaveRunMsRef.current = directorRef.current.runMs

          const wavePhaseNow = encounterWaveSignal(directorRef.current.runMs).phase
          setWavePhase((current) => (current === wavePhaseNow ? current : wavePhaseNow))

          if (!practiceSettingsRef.current.roomStateFrozen) {
            roomStateMsRef.current += delta * 1000
          }
          hazardDamageCooldownRef.current = Math.max(0, hazardDamageCooldownRef.current - delta * 1000)
          enemyHazardCooldownRef.current = Math.max(0, enemyHazardCooldownRef.current - delta * 1000)
          const hazardRunMs = roomStateMsRef.current + (dailyConfig?.hazardOffsetMs ?? 0)
          const hazards = hazardStatesForRunMs(hazardRunMs)
          applyHazardMeshes(runtime, hazards)
          if (prevHazardRunMsRef.current >= 0 && settingsRef.current.audio) {
            for (const config of hazardCycleConfigs) {
              const ticks = hazardCountdownTicksBetween(config.kind, prevHazardRunMsRef.current, hazardRunMs)

              for (const tick of ticks) {
                playHazardCountdownCue(hazardCountdownCue(tick.kind), tick, settingsRef.current.audio)
              }
            }
          }
          prevHazardRunMsRef.current = hazardRunMs
          runtime.overhead.intensity = 55 + roomPressureIntensity(roomStateMsRef.current) * 35
          runtime.movingCover.position.x = Math.sin(roomStateMsRef.current / 1800) * 2.2

          if (hazardDamageCooldownRef.current === 0) {
            const hazardDamage = hazardDamageAtPosition(positionRef.current, hazards)

            if (hazardDamage > 0 && practiceSettingsRef.current.damageEnabled) {
              playerHealthRef.current = Math.max(0, playerHealthRef.current - hazardDamage)
              hazardDamageCooldownRef.current = 900
              tookDamageSinceLastKillRef.current = true
              setPlayerHealth(playerHealthRef.current)
              setDamagePulse((value) => value + 1)
              setStatus(`Hazard hit for ${hazardDamage}.`)
              playPlayerDamageCue(playerDamageCue('hazard'), settingsRef.current.audio)
            }
          }

          if (enemyHazardCooldownRef.current === 0) {
            const enemiesNow = enemiesRef.current
            let appliedAny = false
            let lastBurnedLabel: string | null = null
            let lastBurnedKilled = false

            for (let i = 0; i < enemiesNow.length; i += 1) {
              const candidate = enemiesNow[i]

              if (candidate.state === 'dead') {
                continue
              }

              const enemyHazardSource = hazardDamageAtPosition(candidate.position, hazards)
              const enemyHazardDamage = Math.max(0, Math.round(enemyHazardSource * INFIGHTING_DAMAGE_SCALE))

              if (enemyHazardDamage > 0) {
                const damaged = damageEnemy(candidate, enemyHazardDamage)
                enemiesNow[i] = damaged
                appliedAny = true
                lastBurnedLabel = enemyLabel(damaged.type)
                lastBurnedKilled = damaged.state === 'dead'
              }
            }

            if (appliedAny && lastBurnedLabel !== null) {
              enemyHazardCooldownRef.current = 900
              setStatus(
                lastBurnedKilled
                  ? `Hazard finished the ${lastBurnedLabel}.`
                  : `Hazard scorched the ${lastBurnedLabel}.`
              )
              playCue(180, settingsRef.current.audio)
              setEnemyHealth(enemiesRef.current[0]?.health ?? 0)
            }
          }

          if (!healthPickupReadyRef.current) {
            healthPickupCooldownRef.current = Math.max(0, healthPickupCooldownRef.current - delta * 1000)

            if (healthPickupCooldownRef.current === 0) {
              healthPickupReadyRef.current = true
              setHealthPickupReady(true)
            }
          }

          const wantsSupply =
            playerHealthRef.current < 100 ||
            weaponAmmoRef.current.boomstick < (weaponConfigs.boomstick.maxAmmo ?? 0) ||
            weaponAmmoRef.current.inkblaster < (weaponConfigs.inkblaster.maxAmmo ?? 0)
          const rageEligibleNow =
            rageBuffStateRef.current === null &&
            directorRef.current.runMs >= nextRageEligibleRunMsRef.current &&
            targetPressureForRunMs(directorRef.current.runMs) >= 2
          const tokenEligibleNow =
            scoreTokenStateRef.current === null &&
            directorRef.current.runMs >= nextScoreTokenEligibleRunMsRef.current &&
            targetPressureForRunMs(directorRef.current.runMs) >= 2 &&
            !rageEligibleNow
          const atAltar = Math.hypot(positionRef.current.x, positionRef.current.z) <= 1.35

          if (healthPickupReadyRef.current && atAltar && (wantsSupply || rageEligibleNow || tokenEligibleNow)) {
            playerHealthRef.current = Math.min(100, playerHealthRef.current + 15)
            weaponAmmoRef.current = collectWeaponAmmo(weaponAmmoRef.current)
            healthPickupReadyRef.current = false
            healthPickupCooldownRef.current = dailyConfig?.supplyCooldownMs ?? 9000
            setPlayerHealth(playerHealthRef.current)
            setWeaponAmmo(weaponAmmoRef.current)
            setHealthPickupReady(false)

            if (rageEligibleNow) {
              rageBuffStateRef.current = { startMs: performance.now() }
              nextRageEligibleRunMsRef.current = directorRef.current.runMs + 90_000
              setRageActive(true)
              setStatus('Rage burst absorbed. Damage and speed amplified.')
              playRageCue(settingsRef.current.audio)
              stopRagePulseLayer(ragePulseLayerRef.current)
              ragePulseLayerRef.current = settingsRef.current.audio ? startRagePulseLayer() : null
              if (ragePulseLayerRef.current) {
                const ctx = ragePulseLayerRef.current.context
                ragePulseLayerRef.current.masterGain.gain.setTargetAtTime(
                  RAGE_PULSE_GAIN,
                  ctx.currentTime,
                  0.08
                )
              }
            } else if (tokenEligibleNow) {
              scoreTokenStateRef.current = { startMs: performance.now() }
              nextScoreTokenEligibleRunMsRef.current = directorRef.current.runMs + SCORE_TOKEN_REARM_MS
              setScoreTokenActiveState(true)
              setStatus('Score token grabbed. 2x scoring window open.')
              playScoreTokenCue(settingsRef.current.audio)
            } else {
              setStatus('Supplies collected.')
            }

            playPickupCue(pickupCue('supply'), settingsRef.current.audio)
          }

          const projectileHits = tickInkProjectiles(
            runtime,
            inkProjectiles,
            enemiesRef.current,
            positionRef.current,
            delta * 1000
          )

          if (projectileHits.length > 0) {
            scoreRef.current = {
              ...scoreRef.current,
              shotsHit: scoreRef.current.shotsHit + projectileHits.length
            }
            setHits((value) => value + projectileHits.length)
            const inkBuff = rageMultipliers(rageBuffStateRef.current, performance.now())

            for (const hit of projectileHits) {
              const enemyIndex = enemiesRef.current.findIndex((candidate) => candidate.id === hit.enemyId)
              if (enemyIndex === -1) continue

              const enemyBefore = enemiesRef.current[enemyIndex]
              const dx = enemyBefore.position.x - positionRef.current.x
              const dz = enemyBefore.position.z - positionRef.current.z
              const hitDistance = Math.hypot(dx, dz)
              const knockbackDir = hitDistance > 0
                ? { x: dx / hitDistance, y: 0, z: dz / hitDistance }
                : { x: 0, y: 0, z: 1 }
              enemiesRef.current[enemyIndex] = knockEnemyBack(
                enemyBefore,
                knockbackDir,
                knockbackDistance('inkblaster', hitDistance, enemyBefore.type)
              )

              damageEnemyById(
                hit.enemyId,
                Math.max(1, Math.round(weaponConfigs.inkblaster.damage * inkBuff.damage)),
                'Ink splash landed.',
                'Inkblaster dropped the enemy.',
                hitDistance
              )
            }
          }

          const playerCombatState = {
            position: positionRef.current,
            radius: 0.4,
            health: practiceSettingsRef.current.damageEnabled ? playerHealthRef.current : 999
          }
          let runningPlayerHealth = playerCombatState.health
          const aggregatedEvents: EnemyEvent[] = []

          const nearbyEnemies = enemiesRef.current
            .filter((candidate) => candidate.state !== 'dead')
            .map((candidate) => ({ id: candidate.id, position: candidate.position, radius: candidate.radius }))

          for (let i = 0; i < enemiesRef.current.length; i += 1) {
            const candidate = enemiesRef.current[i]
            const result = tickEnemy(
              candidate,
              { ...playerCombatState, health: runningPlayerHealth },
              delta * 1000,
              enemyConfigs[candidate.type],
              nearbyEnemies
            )
            enemiesRef.current[i] = result.enemy
            runningPlayerHealth = result.player.health

            for (const event of result.events) {
              aggregatedEvents.push(event)
            }
          }

          if (practiceSettingsRef.current.damageEnabled && runningPlayerHealth !== playerHealthRef.current) {
            playerHealthRef.current = runningPlayerHealth
            tookDamageSinceLastKillRef.current = true
            setPlayerHealth(runningPlayerHealth)
            setDamagePulse((value) => value + 1)
            playPlayerDamageCue(playerDamageCue('enemy'), settingsRef.current.audio)
          }

          for (const event of aggregatedEvents) {
            if (event.type === 'enemyAttackStarted') {
              setStatus('Enemy windup. Backpedal or sidestep.')
              playWindupCue(enemyWindupCue(event.enemyType), settingsRef.current.audio)
            } else if (event.type === 'enemyAttackHit') {
              setStatus(`Enemy hit for ${event.damage}.`)
              const attacker = enemiesRef.current.find((candidate) => candidate.id === event.enemyId)
              if (attacker) {
                const angle = damageDirectionRadians(yawRef.current, attacker.position, positionRef.current)
                setDamageIndicator({ key: performance.now(), angleRadians: angle })
              }
            } else if (event.type === 'enemyAttackMissed') {
              setStatus('Enemy missed.')
            } else if (event.type === 'enemyProjectileFired') {
              spitterProjectileSeqRef.current += 1
              const projectileId = `spitter-projectile-${spitterProjectileSeqRef.current}`
              spawnSpitterProjectile(
                runtime,
                spitterProjectilesRef.current,
                createSpitterProjectile(projectileId, event.origin, event.direction, event.speed, event.damage)
              )
              playSpitterFireCue(settingsRef.current.audio)
              setStatus('Spitter loosed acid. Sidestep.')
            } else if (event.type === 'enemyMeleeArcCrossfire') {
              const idx = enemiesRef.current.findIndex((candidate) => candidate.id === event.targetEnemyId)
              if (idx !== -1 && enemiesRef.current[idx].state !== 'dead') {
                const crossfireDamage = Math.max(1, Math.round(event.damage * INFIGHTING_DAMAGE_SCALE))
                const damaged = damageEnemy(enemiesRef.current[idx], crossfireDamage)
                enemiesRef.current[idx] = damaged

                if (damaged.id === enemiesRef.current[0]?.id) {
                  setEnemyHealth(damaged.health)
                }
              }
            }
          }

          tickAndResolveSpitterProjectiles(
            runtime,
            spitterProjectilesRef.current,
            positionRef.current,
            0.4,
            enemiesRef.current,
            delta * 1000,
            (damage) => {
              if (!practiceSettingsRef.current.damageEnabled) {
                return
              }
              playerHealthRef.current = Math.max(0, playerHealthRef.current - damage)
              tookDamageSinceLastKillRef.current = true
              setPlayerHealth(playerHealthRef.current)
              setDamagePulse((value) => value + 1)
              setStatus(`Spitter splashed for ${damage}.`)
              playPlayerDamageCue(playerDamageCue('hazard'), settingsRef.current.audio)
            },
            (enemyId, damage) => {
              const idx = enemiesRef.current.findIndex((candidate) => candidate.id === enemyId)
              if (idx === -1) {
                return
              }
              const damaged = damageEnemy(enemiesRef.current[idx], damage)
              enemiesRef.current[idx] = damaged
              setStatus(
                damaged.state === 'dead'
                  ? `Crossfire finished the ${enemyLabel(damaged.type)}.`
                  : `Crossfire splashed the ${enemyLabel(damaged.type)}.`
              )
              setEnemyHealth(enemiesRef.current[0]?.health ?? 0)
              playCue(180, settingsRef.current.audio)
            }
          )

          if (practiceSettingsRef.current.damageEnabled && playerHealthRef.current === 0) {
            finishRun()
          }

          const activePressure = enemiesRef.current.reduce((acc, candidate) => {
            return candidate.state === 'dead' ? acc : acc + enemyConfigs[candidate.type].pressureCost
          }, 0)
          const musicLayer = musicLayerRef.current

          if (musicLayer !== null) {
            const wave = encounterWaveSignal(directorRef.current.runMs)
            const baseTarget = targetPressureForRunMs(directorRef.current.runMs) + wave.targetDelta
            const ratio = baseTarget > 0 ? activePressure / baseTarget : 0
            const audioEnabled = settingsRef.current.audio
            const gainNow = audioEnabled ? musicIntensityGain(ratio) * MUSIC_PEAK_GAIN : 0
            musicLayer.masterGain.gain.setTargetAtTime(gainNow, musicLayer.context.currentTime, 0.12)
          }

          const ragePulseLayer = ragePulseLayerRef.current
          if (ragePulseLayer !== null) {
            const audioEnabled = settingsRef.current.audio
            const target = audioEnabled ? RAGE_PULSE_GAIN : 0
            ragePulseLayer.masterGain.gain.setTargetAtTime(target, ragePulseLayer.context.currentTime, 0.08)
          }

          const directorTick = tickDirector(
            directorRef.current,
            0,
            activePressure,
            positionRef.current,
            undefined,
            { cadenceScale: 1 / practiceSettingsRef.current.spawnRate }
          )
          directorRef.current = directorTick.state

          // Cull enemies that have been dead long enough to finish their
          // death animation. Keeps the array tight so render slots can
          // be reused for fresh spawns.
          enemiesRef.current = enemiesRef.current.filter((candidate) => {
            return candidate.state !== 'dead' || candidate.animationTimeMs <= 1000
          })

          const aliveCount = enemiesRef.current.reduce(
            (acc, candidate) => (candidate.state === 'dead' ? acc : acc + 1),
            0
          )

          const hasFreshKill = enemiesRef.current.some(
            (candidate) => candidate.state === 'dead' && candidate.animationTimeMs < 800
          )

          if (directorTick.spawn && aliveCount < MAX_ENEMIES && !hasFreshKill) {
            const nextType = practiceEnemyTypeForSpawn(
              applyDailySpawnOffset(directorRef.current.spawnCount, dailyConfig),
              practiceSettingsRef.current,
              isPractice
            )
            enemySpawnSeqRef.current += 1
            const newEnemy = createEnemy(
              nextType,
              `${nextType}-${enemySpawnSeqRef.current}`,
              directorTick.spawn.door.position,
              positionRef.current
            )
            enemiesRef.current = [...enemiesRef.current, newEnemy]
            doorSignalTimersRef.current[directorTick.spawn.door.id] = 0
            playDoorOpenCue(doorOpenCue(), settingsRef.current.audio)
            setEnemyHealth(newEnemy.health)
            setEnemyType(newEnemy.type)
            setStatus(`${enemyLabel(newEnemy.type)} entered from ${directorTick.spawn.door.id}.`)
          }
        }
      }

      const kickState = cameraKickStateRef.current
      const kickElapsedMs = kickState ? performance.now() - kickState.startMs : 0
      const kickProgress = cameraKickProgressAtElapsedMs(kickState?.style ?? null, kickElapsedMs)

      if (kickState && kickElapsedMs >= kickState.style.durationMs) {
        cameraKickStateRef.current = null
      }

      const baseFovDeg = settingsRef.current.fov
      const kickFovDeg = kickState ? kickProgress * kickState.style.fovDeltaDeg : 0
      const nextFovDeg = baseFovDeg + kickFovDeg

      if (Math.abs(runtime.camera.fov - nextFovDeg) > 0.0001) {
        runtime.camera.fov = nextFovDeg
        runtime.camera.updateProjectionMatrix()
      }

      const nextMountTransform = kickState && kickProgress > 0
        ? `translateY(${kickProgress * kickState.style.kickPx}px)`
        : ''

      if (mount && lastMountTransformRef.current !== nextMountTransform) {
        mount.style.transform = nextMountTransform
        lastMountTransformRef.current = nextMountTransform
      }

      runtime.camera.position.set(positionRef.current.x, positionRef.current.y, positionRef.current.z)
      runtime.camera.rotation.set(pitchRef.current, yawRef.current, 0)
      runtime.muzzleLight.position.copy(runtime.camera.position)
      runtime.muzzleLight.intensity = Math.max(0, runtime.muzzleLight.intensity - delta * 22)
      applyDoorSignals(runtime, doorSignalTimersRef.current, delta * 1000)
      applyPickupReadability(runtime, time, healthPickupReadyRef.current)
      tickShotBolts(runtime, shotBolts, shotImpacts, delta * 1000)
      tickShotImpacts(runtime, shotImpacts, delta * 1000)
      const activeCombo = directorRef.current.runMs <= scoreRef.current.comboExpiresAtMs ? scoreRef.current.combo : 0
      if (comboJustBroke(prevActiveComboRef.current, activeCombo)) {
        playComboBreakCue(comboBreakCue(), settingsRef.current.audio)
      }
      prevActiveComboRef.current = activeCombo
      setCombo((current) => current === activeCombo ? current : activeCombo)

      const enemiesNow = enemiesRef.current
      const debugBillboardEnemy = enemiesNow[0] ?? null
      let debugAngle: BillboardAngle = 'front'
      let debugBucket = 0
      let debugAnimation: AnimationName = 'idle'
      const debugOverlays = runningRef.current && practiceSettingsRef.current.debugOverlays

      for (let i = 0; i < runtime.enemySlots.length; i += 1) {
        const slot = runtime.enemySlots[i]
        const enemy = i < enemiesNow.length ? enemiesNow[i] : null

        if (enemy === null) {
          slot.mesh.visible = false
          slot.arrow.visible = false
          continue
        }

        const baseTint = enemyConfigs[enemy.type].tint

        if (enemy.state === 'hurt' || enemy.state === 'dead') {
          const flashStyle = enemyHurtFlashStyle(enemy.type)
          const intensity = enemyHurtFlashIntensity(flashStyle, enemy.animationTimeMs)
          enemyHurtFlashColor.setRGB(flashStyle.flashColor.r, flashStyle.flashColor.g, flashStyle.flashColor.b)
          slot.material.color.set(baseTint).lerp(enemyHurtFlashColor, intensity)
        } else if (enemy.type === 'spitter' && enemy.state === 'attackWindup') {
          const charge = spitterChargeIntensity(enemy.state, enemy.animationTimeMs, enemyConfigs.spitter.attackWindupMs)
          slot.material.color.set(baseTint).lerp(spitterChargeColor, charge)
        } else if (enemy.type === 'skitter' && enemy.dashBurstMsRemaining > 0) {
          // Telegraph the dash burst: lerp toward white at the leading edge.
          const intensity = Math.min(1, enemy.dashBurstMsRemaining / SKITTER_DASH_DURATION_MS)
          slot.material.color.set(baseTint).lerp(skitterDashColor, 0.5 * intensity)
        } else {
          slot.material.color.set(baseTint)
        }

        const angle = angleToPlayerName(enemy.position, enemy.facingAngle, positionRef.current)
        const animation = animationForEnemyState(enemy.state)
        const enemyAsset = enemyAssetsRef.current[enemy.type] ?? enemyAssetsRef.current.grunt ?? null

        if (enemyAsset) {
          setEnemySlotAsset(slot, enemy.type, enemyAsset)
        }

        applyEnemyFrame(slot, enemyAsset?.atlas ?? null, animation, angle, enemy.animationTimeMs)
        slot.mesh.position.set(enemy.position.x, enemy.position.y, enemy.position.z)
        slot.mesh.scale.setScalar(enemyConfigs[enemy.type].scale)
        slot.mesh.lookAt(runtime.camera.position)
        slot.mesh.visible = enemy.state !== 'dead' || enemy.animationTimeMs < 1000
        slot.arrow.position.set(enemy.position.x, 0.08, enemy.position.z)
        slot.arrow.setDirection(new THREE.Vector3(Math.cos(enemy.facingAngle), 0, Math.sin(enemy.facingAngle)))
        slot.arrow.visible = debugOverlays && enemy.state !== 'dead'

        if (debugBillboardEnemy !== null && enemy.id === debugBillboardEnemy.id) {
          debugAngle = angle
          debugBucket = angleToPlayerBucket(enemy.position, enemy.facingAngle, positionRef.current)
          debugAnimation = animation
        }
      }

      if (debugBillboardEnemy !== null) {
        dummyMarker.position.set(debugBillboardEnemy.position.x, 0.04, debugBillboardEnemy.position.z)
        dummyMarker.visible = debugBillboardEnemy.state !== 'dead'
      } else {
        dummyMarker.visible = false
      }

      dummyMarker.rotation.z += delta * 1.4

      setDebug((current) => {
        if (current.angle === debugAngle && current.bucket === debugBucket && current.animation === debugAnimation) {
          return current
        }

        return { angle: debugAngle, bucket: debugBucket, animation: debugAnimation }
      })
      runtime.renderer.render(runtime.scene, runtime.camera)
    }

    window.addEventListener('resize', resize)
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)

      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }

      clearShotBolts(runtimeRef.current, shotBolts)
      clearShotImpacts(runtimeRef.current, shotImpacts)
      clearInkProjectiles(runtimeRef.current, inkProjectiles)
      clearSpitterProjectiles(runtimeRef.current, spitterProjectiles)
      stopMusicLayer(musicLayerRef.current)
      musicLayerRef.current = null
      stopRagePulseLayer(ragePulseLayerRef.current)
      ragePulseLayerRef.current = null
      if (runtimeRef.current) {
        disposeEnemySlots(runtimeRef.current.enemySlots)
      }
      disposeEnemyAssets(enemyAssetsRef.current)
      enemyAssetsRef.current = {}
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      runtimeRef.current = null
    }
  }, [dailyConfig, damageEnemyById, finishRun, isPractice])

  useEffect(() => {
    function updateKey(event: KeyboardEvent, pressed: boolean) {
      if (event.code === 'KeyW') {
        keysRef.current.forward = pressed
      }
      if (event.code === 'KeyS') {
        keysRef.current.backward = pressed
      }
      if (event.code === 'KeyA') {
        keysRef.current.left = pressed
      }
      if (event.code === 'KeyD') {
        keysRef.current.right = pressed
      }
      if (event.code === 'Space' && pressed) {
        event.preventDefault()
        fire()
      }
      if (event.code === 'Digit1' && pressed) {
        selectWeapon('peashooter', selectedWeaponRef, setSelectedWeapon, setStatus)
      }
      if (event.code === 'Digit2' && pressed) {
        selectWeapon('boomstick', selectedWeaponRef, setSelectedWeapon, setStatus)
      }
      if (event.code === 'Digit3' && pressed) {
        selectWeapon('inkblaster', selectedWeaponRef, setSelectedWeapon, setStatus)
      }
      if (event.code === 'KeyQ' && pressed) {
        selectWeapon(nextWeapon(selectedWeaponRef.current), selectedWeaponRef, setSelectedWeapon, setStatus)
      }
      if (event.code === 'Escape' && pressed && runningRef.current) {
        pausedRef.current = !pausedRef.current
        setPaused(pausedRef.current)
        setStatus(pausedRef.current ? 'Paused.' : 'Run resumed.')
      }
      if ((event.code === 'ShiftLeft' || event.code === 'ShiftRight') && pressed) {
        if (runningRef.current && !pausedRef.current) {
          const now = performance.now()

          if (dashReadyAt(now, lastDashStartMsRef.current)) {
            dashStateRef.current = startDash(now, keysRef.current, yawRef.current)
            lastDashStartMsRef.current = now
            setDashReady(false)
            playDashCue(settingsRef.current.audio)
          }
        }
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      updateKey(event, true)
    }

    function onKeyUp(event: KeyboardEvent) {
      updateKey(event, false)
    }

    function onMouseMove(event: MouseEvent) {
      const canvas = runtimeRef.current?.renderer.domElement

      if (document.pointerLockElement !== canvas) {
        return
      }

      yawRef.current -= event.movementX * 0.0024 * settingsRef.current.sensitivity
      pitchRef.current = clamp(
        pitchRef.current - event.movementY * 0.002 * settingsRef.current.sensitivity,
        -1.25,
        1.25
      )
    }

    function onPointerLockChange() {
      if (runningRef.current && document.pointerLockElement === null) {
        setStatus('Pointer released. Click the room to lock again.')
      }
    }

    function onMouseDown(event: MouseEvent) {
      if (event.button !== 0) {
        return
      }

      const canvas = runtimeRef.current?.renderer.domElement

      if (runningRef.current && document.pointerLockElement !== canvas) {
        requestPointerLock(canvas)
      }

      fire()
    }

    function onForceDeath() {
      if (!runningRef.current) {
        return
      }

      finishRun()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('flatline:force-death', onForceDeath)
    document.addEventListener('pointerlockchange', onPointerLockChange)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('flatline:force-death', onForceDeath)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
    }
  }, [fire, finishRun])

  useEffect(() => {
    const joysticks = touchJoysticksRef.current
    const keys = keysRef.current

    function rerenderTouchControls() {
      setTouchJoysticksView(cloneTouchJoysticks(joysticks))
    }

    function applyMoveJoystick() {
      const move = readJoystick(joysticks.move)
      keys.left = move.x < -joystickDeadzone
      keys.right = move.x > joystickDeadzone
      keys.forward = move.y < -joystickDeadzone
      keys.backward = move.y > joystickDeadzone
    }

    function applyLookJoystick() {
      const look = readJoystick(joysticks.look)
      touchLookVectorRef.current = {
        x: Math.abs(look.x) > joystickDeadzone ? look.x : 0,
        y: Math.abs(look.y) > joystickDeadzone ? look.y : 0
      }
    }

    function isInteractiveTarget(target: EventTarget | null): boolean {
      if (!(target instanceof Element)) {
        return false
      }

      return target.closest('button, input, textarea, select, a') !== null
    }

    function beginTouch(pointerId: number, x: number, y: number): boolean {
      if (x < window.innerWidth / 2) {
        if (joysticks.move.active) {
          return false
        }

        beginJoystick(joysticks.move, pointerId, x, y)
        applyMoveJoystick()
      } else {
        if (joysticks.look.active) {
          return false
        }

        beginJoystick(joysticks.look, pointerId, x, y)
        touchLookStartedAtRef.current = performance.now()
        applyLookJoystick()
      }

      rerenderTouchControls()
      return true
    }

    function rebaseOriginIfStale(joystick: JoystickState, x: number, y: number) {
      if (joystick.originX === 0 && joystick.originY === 0 && (x !== 0 || y !== 0)) {
        joystick.originX = x
        joystick.originY = y
        joystick.currentX = x
        joystick.currentY = y
      }
    }

    function moveTouch(pointerId: number, x: number, y: number) {
      if (joysticks.move.pointerId === pointerId) {
        rebaseOriginIfStale(joysticks.move, x, y)
        moveJoystick(joysticks.move, x, y)
        applyMoveJoystick()
        rerenderTouchControls()
        return
      }

      if (joysticks.look.pointerId === pointerId) {
        rebaseOriginIfStale(joysticks.look, x, y)
        moveJoystick(joysticks.look, x, y)
        applyLookJoystick()
        rerenderTouchControls()
      }
    }

    function endTouch(pointerId: number) {
      if (joysticks.move.pointerId === pointerId) {
        endJoystick(joysticks.move)
        applyMoveJoystick()
        rerenderTouchControls()
      }

      if (joysticks.look.pointerId === pointerId) {
        const wasTap = !joystickMovedBeyond(joysticks.look, 14) && performance.now() - touchLookStartedAtRef.current < 260
        endJoystick(joysticks.look)
        applyLookJoystick()
        rerenderTouchControls()

        if (wasTap && runningRef.current && !pausedRef.current) {
          fire()
        }
      }
    }

    function onTouchStart(event: TouchEvent) {
      if (!runningRef.current || pausedRef.current || isInteractiveTarget(event.target)) {
        return
      }

      let claimedAny = false

      for (let i = 0; i < event.changedTouches.length; i += 1) {
        const touch = event.changedTouches[i]

        if (beginTouch(touch.identifier, touch.clientX, touch.clientY)) {
          claimedAny = true
        }
      }

      if (claimedAny) {
        event.preventDefault()
      }
    }

    function onTouchMove(event: TouchEvent) {
      let claimedAny = false

      for (let i = 0; i < event.changedTouches.length; i += 1) {
        const touch = event.changedTouches[i]

        if (joysticks.move.pointerId === touch.identifier || joysticks.look.pointerId === touch.identifier) {
          claimedAny = true
          moveTouch(touch.identifier, touch.clientX, touch.clientY)
        }
      }

      if (claimedAny) {
        event.preventDefault()
      }
    }

    function onTouchEnd(event: TouchEvent) {
      for (let i = 0; i < event.changedTouches.length; i += 1) {
        const touch = event.changedTouches[i]

        if (joysticks.move.pointerId === touch.identifier || joysticks.look.pointerId === touch.identifier) {
          endTouch(touch.identifier)
        }
      }
    }

    function releaseAllTouches() {
      const wasActive = joysticks.move.active || joysticks.look.active
      resetTouchControls(joysticks, keys)
      touchLookVectorRef.current = { x: 0, y: 0 }

      if (wasActive) {
        rerenderTouchControls()
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        releaseAllTouches()
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchEnd)
    window.addEventListener('blur', releaseAllTouches)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      window.removeEventListener('blur', releaseAllTouches)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      releaseAllTouches()
    }
  }, [fire])

  useEffect(() => () => {
    if (weaponFlashTimeoutRef.current !== null) {
      window.clearTimeout(weaponFlashTimeoutRef.current)
    }

    if (muzzleFlashTimeoutRef.current !== null) {
      window.clearTimeout(muzzleFlashTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const runtime = runtimeRef.current

    if (!runtime) {
      return
    }

    runtime.camera.fov = settings.fov
    runtime.camera.updateProjectionMatrix()
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    void Promise.resolve().then(() => fetchSharedLeaderboard(sharedScope))
  }, [fetchSharedLeaderboard, sharedScope])

  return (
    <main className="game-shell">
      <div ref={mountRef} className="render-root" data-testid="render-root" />
      {running && scoreFloaters.length > 0 ? (
        <div className="score-floaters-layer">
          {scoreFloaters.map((floater) => (
            <span
              key={floater.id}
              className="score-floater"
              data-testid="score-floater"
              style={{ left: `${floater.screenX}px`, top: `${floater.screenY}px` }}
            >
              {floater.text}
            </span>
          ))}
        </div>
      ) : null}
      {running ? (
        <div
          className="hud"
          data-testid="hud"
          style={{
            ['--hud-wobble-px' as string]: `${hudPillWobbleAmplitudePx(playerHealth)}px`,
            ['--hud-wobble-deg' as string]: `${hudPillWobbleRotationDeg(playerHealth)}deg`,
            ['--hud-wobble-period' as string]: `${hudPillWobblePeriodMs()}ms`
          }}
        >
          <div className="hud-pill">
            Health
            <strong>{playerHealth}</strong>
          </div>
          <div className="hud-pill">
            Weapon
            <strong>{weaponConfigs[selectedWeapon].label}</strong>
          </div>
          <div className={`hud-pill weapon-ready-pill${weaponReady ? '' : ' weapon-recovering'}`} data-testid="weapon-ready">
            Fire
            <strong>{weaponReady ? 'Ready' : 'Recovering'}</strong>
          </div>
          <div className={`hud-pill dash-pill${dashReady ? '' : ' dash-cooling'}`} data-testid="dash-ready">
            Dash
            <strong>{dashReady ? 'Ready' : 'Cooling'}</strong>
          </div>
          {rageActive ? (
            <div className="hud-pill rage-pill" data-testid="rage-pill">
              Rage
              <strong>Active</strong>
            </div>
          ) : null}
          {scoreTokenActiveState ? (
            <div className="hud-pill score-token-pill" data-testid="score-token-pill">
              Score
              <strong>2x</strong>
            </div>
          ) : null}
          <div className={`hud-pill wave-pill wave-${wavePhase}`} data-testid="wave-pill">
            Wave
            <strong>{wavePhase === 'lull' ? 'Lull' : wavePhase === 'surge' ? 'Surge' : 'Peak'}</strong>
          </div>
          <div className="hud-pill">
            Ammo
            <strong>{weaponAmmoLabel(selectedWeapon, weaponAmmo)}</strong>
          </div>
          <div className="hud-pill">
            Score
            <strong>{score}</strong>
          </div>
          <div className="hud-pill combo-pill" data-testid="combo-pill">
            Combo
            <strong>{combo}</strong>
          </div>
          <div className="hud-pill">
            Kills
            <strong>{kills}</strong>
          </div>
          <div className="hud-pill">
            Time
            <strong>{formatTime(runMs)}</strong>
          </div>
          <div className="hud-pill">
            Enemy
            <strong>{enemyLabel(enemyType)} {enemyHealth}</strong>
          </div>
          <div className="hud-pill">
            Hits
            <strong>{hits}</strong>
          </div>
          {practiceSettings.debugOverlays ? (
            <div className="hud-pill debug-pill" data-testid="billboard-debug">
              Bucket {debug.bucket}
              <strong>{debug.angle}</strong>
              <span>{debug.animation}</span>
            </div>
          ) : null}
          <div className="hud-pill">
            Supplies
            <strong>{healthPickupReady ? 'Ready' : 'Wait'}</strong>
          </div>
        </div>
      ) : (
        <section className="start-panel">
          <div className="start-panel-inner">
            <h1>Flatline</h1>
            {!isPractice && bestLocalScore(leaderboard) !== null ? (
              <p className="best-score" data-testid="best-score">
                Best <strong>{bestLocalScore(leaderboard)}</strong>
              </p>
            ) : null}
            {summary ? (
              <div className="summary" data-testid="run-summary">
                <p>Score {summary.score}</p>
                <p>Kills {summary.kills}</p>
                <p>Time {formatTime(summary.survivalMs)}</p>
                <p>Accuracy {Math.round(summary.accuracy * 100)}%</p>
                <p>Best combo {summary.bestCombo}</p>
                <p>Close-range kills {summary.closeRangeKills}</p>
                <p>Weapons used {summary.weaponsUsed}</p>
                <p>No-damage streak {summary.bestNoDamageStreak}</p>
              </div>
            ) : isPractice ? (
              <p>Practice room. Tune the run, test weapons, and rehearse pressure without score submission.</p>
            ) : (
              <p>Daily seed {seed}. One room. Endless pressure. Move fast, aim clean, and stay alive.</p>
            )}
            {!summary && dailySchedule ? <DailySchedulePanel preview={dailySchedule} /> : null}
            {summary && !isPractice ? (
              <div className="submit-panel" data-testid="shared-submit">
                <label>
                  Initials
                  <input
                    value={initials}
                    maxLength={3}
                    onChange={(event) => {
                      setInitials(normalizeClientInitials(event.target.value))
                      setSubmitStatus('idle')
                    }}
                  />
                </label>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={submitStatus === 'submitting' || submitStatus === 'submitted'}
                  onClick={submitSharedScore}
                >
                  {submitButtonLabel(submitStatus)}
                </button>
              </div>
            ) : null}
            <SettingsPanel settings={settings} onChange={updateSettings} />
            {isPractice ? (
              <PracticePanel settings={practiceSettings} onChange={updatePracticeSettings} />
            ) : (
              <SharedLeaderboardPanel
                entries={sharedEntries}
                scope={sharedScope}
                status={sharedStatus}
                onScopeChange={switchSharedScope}
              />
            )}
            {!isPractice && leaderboard.length > 0 ? <LocalLeaderboard entries={leaderboard} /> : null}
            <button className="start-button" type="button" onClick={startRun}>
              {summary ? 'Restart run' : 'Start run'}
            </button>
          </div>
        </section>
      )}
      {paused ? (
        <section className="pause-panel" data-testid="pause-menu">
          <div className="pause-panel-inner">
            <h2>Paused</h2>
            <SettingsPanel settings={settings} onChange={updateSettings} />
            {isPractice ? (
              <PracticePanel settings={practiceSettings} onChange={updatePracticeSettings} disabled />
            ) : (
              <SharedLeaderboardPanel
                entries={sharedEntries}
                scope={sharedScope}
                status={sharedStatus}
                onScopeChange={switchSharedScope}
              />
            )}
            {!isPractice && leaderboard.length > 0 ? <LocalLeaderboard entries={leaderboard} /> : null}
            <button className="start-button" type="button" onClick={resumeRun}>
              Resume
            </button>
          </div>
        </section>
      ) : null}
      <div className="crosshair" data-testid="crosshair" />
      {running ? (
        <div
          className="hud-grain"
          data-testid="hud-grain"
          aria-hidden="true"
          style={{ ['--hud-grain-opacity' as string]: hudGrainOpacity(playerHealth).toFixed(3) }}
        />
      ) : null}
      {running && hudSplatterIntensity(playerHealth) > 0 ? (
        <div
          className="hud-splatter"
          data-testid="hud-splatter"
          aria-hidden="true"
          style={{ ['--hud-splatter-intensity' as string]: hudSplatterIntensity(playerHealth).toFixed(3) }}
        />
      ) : null}
      {damagePulse > 0 ? <div key={damagePulse} className="damage-flash" data-testid="damage-flash" aria-hidden="true" /> : null}
      {rageTint > 0 ? (
        <div
          className="rage-tint"
          data-testid="rage-tint"
          aria-hidden="true"
          style={{ ['--rage-tint-opacity' as string]: rageTint.toFixed(3) }}
        />
      ) : null}
      {damageIndicator ? (
        <div
          key={damageIndicator.key}
          className="damage-indicator"
          data-testid="damage-indicator"
          aria-hidden="true"
          style={{ transform: `translate(-50%, -50%) rotate(${damageIndicator.angleRadians}rad)` }}
        />
      ) : null}
      {(() => {
        const recoilStyle = weaponRecoilStyle(selectedWeapon)
        return (
          <div
            key={`weapon-${selectedWeapon}-${weaponFiring ? 'firing' : 'idle'}-${weaponFireKey}`}
            className={`weapon weapon-${selectedWeapon}${weaponFiring ? ' weapon-firing' : ''}`}
            data-testid="weapon-sprite"
            aria-hidden="true"
            style={{
              ['--weapon-recoil-kick' as string]: `${recoilStyle.kickPx}px`,
              ['--weapon-recoil-rotate' as string]: `${recoilStyle.rotateDeg}deg`,
              ['--weapon-recoil-duration' as string]: `${recoilStyle.durationMs}ms`
            }}
          />
        )
      })()}
      {muzzleFlash ? (
        (() => {
          const flashStyle = muzzleFlashStyle(muzzleFlash.weapon)
          return (
            <div
              key={muzzleFlash.key}
              className={`muzzle-flash muzzle-flash-${muzzleFlash.weapon}`}
              data-testid="muzzle-flash"
              aria-hidden="true"
              style={{
                ['--muzzle-color' as string]: flashStyle.color,
                ['--muzzle-scale' as string]: String(flashStyle.scale),
                ['--muzzle-duration' as string]: `${flashStyle.durationMs}ms`
              }}
            />
          )
        })()
      ) : null}
      {running && !paused ? <TouchControls joysticks={touchJoysticksView} /> : null}
      <div className="status-line" data-testid="status-line">
        {status}
      </div>
    </main>
  )
}

function TouchControls({ joysticks }: { joysticks: TouchJoysticks }) {
  return (
    <div className="touch-controls" data-testid="touch-controls" aria-hidden="true">
      <JoystickVisual joystick={joysticks.move} label="Move" className="move" />
      <JoystickVisual joystick={joysticks.look} label="Aim" className="look" />
    </div>
  )
}

function JoystickVisual({
  joystick,
  label,
  className
}: {
  joystick: JoystickState
  label: string
  className: string
}) {
  if (!joystick.active) {
    return null
  }

  const dx = joystick.currentX - joystick.originX
  const dy = joystick.currentY - joystick.originY
  const length = Math.hypot(dx, dy)
  const scale = length > joystickRadius ? joystickRadius / length : 1
  const knobX = joystick.originX + dx * scale
  const knobY = joystick.originY + dy * scale

  return (
    <>
      <div
        className={`touch-stick touch-stick-${className}`}
        style={{
          left: `${joystick.originX - joystickRadius}px`,
          top: `${joystick.originY - joystickRadius}px`,
          width: `${joystickRadius * 2}px`,
          height: `${joystickRadius * 2}px`
        }}
      >
        <span>{label}</span>
      </div>
      <div
        className={`touch-knob touch-knob-${className}`}
        style={{
          left: `${knobX - 24}px`,
          top: `${knobY - 24}px`
        }}
      />
    </>
  )
}

function resetTouchControls(joysticks: TouchJoysticks, keys: MovementInput) {
  endJoystick(joysticks.move)
  endJoystick(joysticks.look)
  keys.forward = false
  keys.backward = false
  keys.left = false
  keys.right = false
}

function cloneTouchJoysticks(joysticks: TouchJoysticks): TouchJoysticks {
  return {
    move: { ...joysticks.move },
    look: { ...joysticks.look }
  }
}

function createRoom() {
  const group = new THREE.Group()
  const doorSignals: Record<string, THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>> = {}
  const floorMaterial = new THREE.MeshStandardMaterial({ color: '#242424', roughness: 0.94 })
  const wallMaterial = new THREE.MeshStandardMaterial({ color: '#4a4740', roughness: 0.9 })
  const doorMaterial = new THREE.MeshStandardMaterial({ color: '#171717', roughness: 0.82 })
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: '#50d1c0',
    emissive: '#123d39',
    roughness: 0.72
  })
  const pickupMaterial = new THREE.MeshStandardMaterial({
    color: '#50d1c0',
    emissive: '#1f8e84',
    emissiveIntensity: 0.6,
    roughness: 0.5
  })
  const dangerMaterial = new THREE.MeshStandardMaterial({
    color: '#f05a4f',
    emissive: '#40110f',
    roughness: 0.7
  })

  const floor = new THREE.Mesh(new THREE.BoxGeometry(20, 0.2, 20), floorMaterial)
  floor.position.y = -0.1
  floor.receiveShadow = true
  group.add(floor)

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(20, 0.2, 20), wallMaterial)
  ceiling.position.y = 4.2
  group.add(ceiling)

  const wallGeometry = new THREE.BoxGeometry(20, 4.2, 0.35)
  const northWall = new THREE.Mesh(wallGeometry, wallMaterial)
  northWall.position.set(0, 2, 10)
  group.add(northWall)

  const southWall = new THREE.Mesh(wallGeometry, wallMaterial)
  southWall.position.set(0, 2, -10)
  group.add(southWall)

  const sideWallGeometry = new THREE.BoxGeometry(0.35, 4.2, 20)
  const eastWall = new THREE.Mesh(sideWallGeometry, wallMaterial)
  eastWall.position.set(10, 2, 0)
  group.add(eastWall)

  const westWall = new THREE.Mesh(sideWallGeometry, wallMaterial)
  westWall.position.set(-10, 2, 0)
  group.add(westWall)

  const pillarGeometry = new THREE.CylinderGeometry(0.45, 0.58, 3.2, 8)

  for (const [x, z] of [
    [-3.5, -1.8],
    [3.5, -1.8],
    [-3.5, 2.1],
    [3.5, 2.1]
  ]) {
    const pillar = new THREE.Mesh(pillarGeometry, wallMaterial)
    pillar.position.set(x, 1.6, z)
    pillar.castShadow = true
    pillar.receiveShadow = true
    group.add(pillar)
  }

  const altar = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.6, 0.45, 24), pickupMaterial)
  altar.position.set(0, 0.22, 0)
  altar.receiveShadow = true
  group.add(altar)
  const altarRestY = altar.position.y

  const pickupHaloMaterial = new THREE.MeshBasicMaterial({
    color: '#7ff0e0',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  })
  const pickupHalo = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.62, 48), pickupHaloMaterial)
  pickupHalo.position.set(0, 0.045, 0)
  pickupHalo.rotation.x = -Math.PI / 2
  pickupHalo.renderOrder = 1
  group.add(pickupHalo)

  const clockLandmark = landmarkForWall('north')!
  const clock = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.045, 12, 60), accentMaterial)
  clock.position.set(clockLandmark.position.x, clockLandmark.position.y, clockLandmark.position.z)
  group.add(clock)

  const clockHand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.04), accentMaterial)
  clockHand.position.set(clockLandmark.position.x, clockLandmark.position.y + 0.35, clockLandmark.position.z - 0.04)
  clockHand.rotation.z = Math.PI / 8
  group.add(clockHand)

  const furnaceLandmark = landmarkForWall('east')!
  const furnaceLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.7, 1.4), dangerMaterial)
  furnaceLeft.position.set(furnaceLandmark.position.x, furnaceLandmark.position.y, furnaceLandmark.position.z - 1)
  group.add(furnaceLeft)

  const furnaceRight = furnaceLeft.clone()
  furnaceRight.position.z = furnaceLandmark.position.z + 1
  group.add(furnaceRight)

  const curtainLandmark = landmarkForWall('south')!
  const curtainMaterial = new THREE.MeshStandardMaterial({
    color: '#8a2828',
    emissive: '#220606',
    roughness: 0.95
  })
  const curtainPanelSpacing = CURTAIN_SIDE_WIDTH_M / CURTAIN_PANEL_COUNT
  const curtainPanelWidth = curtainPanelSpacing * 0.92
  const curtainBaseY = curtainLandmark.position.y
  const curtainZ = curtainLandmark.position.z + 0.18
  for (const sideSign of [-1, 1] as const) {
    for (let i = 0; i < CURTAIN_PANEL_COUNT; i += 1) {
      // First panel sits just outside the door gap; subsequent panels move
      // outward toward the corners.
      const offsetFromDoor = CURTAIN_DOOR_HALF_GAP_M + (i + 0.5) * curtainPanelSpacing
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(curtainPanelWidth, CURTAIN_HEIGHT_M, CURTAIN_PANEL_DEPTH_M),
        curtainMaterial
      )
      panel.position.set(
        curtainLandmark.position.x + sideSign * offsetFromDoor,
        curtainBaseY,
        curtainZ
      )
      group.add(panel)
    }
  }
  const curtainRailMaterial = new THREE.MeshStandardMaterial({
    color: '#c9a23a',
    emissive: '#3a2c0c',
    roughness: 0.6
  })
  const curtainRailLength = (CURTAIN_DOOR_HALF_GAP_M + CURTAIN_SIDE_WIDTH_M) * 2 + 0.4
  const curtainRail = new THREE.Mesh(
    new THREE.BoxGeometry(curtainRailLength, 0.12, 0.18),
    curtainRailMaterial
  )
  curtainRail.position.set(
    curtainLandmark.position.x,
    curtainBaseY + CURTAIN_HEIGHT_M / 2 + 0.06,
    curtainZ
  )
  group.add(curtainRail)

  const organLandmark = landmarkForWall('west')!
  const organPipeMaterial = new THREE.MeshStandardMaterial({
    color: '#9aa7b4',
    emissive: '#1a2530',
    roughness: 0.55,
    metalness: 0.45
  })
  const organBaseMaterial = new THREE.MeshStandardMaterial({
    color: '#3c2f24',
    roughness: 0.85
  })
  const organCenterZ = organLandmark.position.z
  const organSurfaceX = organLandmark.position.x + 0.22
  for (const sideSign of [-1, 1] as const) {
    for (let i = 0; i < ORGAN_PIPE_HEIGHTS_M.length; i += 1) {
      const height = ORGAN_PIPE_HEIGHTS_M[i]
      const offsetFromDoor = ORGAN_DOOR_OFFSET_M + i * ORGAN_PIPE_SPACING_M
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(ORGAN_PIPE_RADIUS_M, ORGAN_PIPE_RADIUS_M, height, 14),
        organPipeMaterial
      )
      pipe.position.set(organSurfaceX, height / 2, organCenterZ + sideSign * offsetFromDoor)
      group.add(pipe)
    }
  }
  for (const sideSign of [-1, 1] as const) {
    const baseLength = (ORGAN_PIPE_HEIGHTS_M.length - 1) * ORGAN_PIPE_SPACING_M + ORGAN_PIPE_RADIUS_M * 2 + 0.2
    const baseCenterOffset = ORGAN_DOOR_OFFSET_M + (ORGAN_PIPE_HEIGHTS_M.length - 1) * ORGAN_PIPE_SPACING_M / 2
    const organBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.32, baseLength),
      organBaseMaterial
    )
    organBase.position.set(organSurfaceX, 0.16, organCenterZ + sideSign * baseCenterOffset)
    group.add(organBase)
  }

  addDoorVisual(group, doorSignals, 'north', { x: 0, y: 1.12, z: 9.78 }, new THREE.BoxGeometry(2.25, 1.8, 0.08), doorMaterial)
  addDoorVisual(group, doorSignals, 'south', { x: 0, y: 1.12, z: -9.78 }, new THREE.BoxGeometry(2.25, 1.8, 0.08), doorMaterial)
  addDoorVisual(group, doorSignals, 'east', { x: 9.78, y: 1.12, z: 0 }, new THREE.BoxGeometry(0.08, 1.8, 2.25), doorMaterial)
  addDoorVisual(group, doorSignals, 'west', { x: -9.78, y: 1.12, z: 0 }, new THREE.BoxGeometry(0.08, 1.8, 2.25), doorMaterial)

  return { group, doorSignals, pickup: { altar, halo: pickupHalo, restY: altarRestY } }
}

function addDoorVisual(
  group: THREE.Group,
  doorSignals: Record<string, THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>>,
  id: string,
  position: Vec3,
  geometry: THREE.BoxGeometry,
  doorMaterial: THREE.MeshStandardMaterial
) {
  const panel = new THREE.Mesh(geometry, doorMaterial)
  panel.position.set(position.x, position.y, position.z)
  group.add(panel)

  const signal = new THREE.Mesh(
    geometry.clone(),
    new THREE.MeshBasicMaterial({
      color: '#50d1c0',
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  )
  signal.position.copy(panel.position)
  signal.scale.set(0.74, 0.58, 0.74)
  signal.renderOrder = 1
  group.add(signal)
  doorSignals[id] = signal
}

function createHazardMeshes(): Record<HazardKind, THREE.Mesh> {
  const flameLane = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.035, 17),
    new THREE.MeshBasicMaterial({ color: '#f05a4f', transparent: true, opacity: 0 })
  )
  flameLane.position.set(0, 0.035, 0)

  const inkPool = new THREE.Mesh(
    new THREE.CircleGeometry(1.45, 32),
    new THREE.MeshBasicMaterial({ color: '#50d1c0', transparent: true, opacity: 0 })
  )
  inkPool.position.set(2.8, 0.045, -1.8)
  inkPool.rotation.x = -Math.PI / 2

  const fallingLight = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 1.1, 32),
    new THREE.MeshBasicMaterial({ color: '#f4f1e8', transparent: true, opacity: 0 })
  )
  fallingLight.position.set(-2.4, 0.055, 2.1)
  fallingLight.rotation.x = -Math.PI / 2

  return {
    flameLane,
    inkPool,
    fallingLight
  }
}

function applyHazardMeshes(runtime: RuntimeRefs, hazards: HazardState[]) {
  hazards.forEach((hazard) => {
    const mesh = runtime.hazardMeshes[hazard.kind]
    const material = mesh.material as THREE.MeshBasicMaterial
    material.opacity = opacityForHazardPhase(hazard.phase)
    material.color.set(colorForHazardPhase(hazard.kind, hazard.phase))
    mesh.visible = hazard.phase !== 'idle'
    mesh.scale.setScalar(scaleForHazardPhase(hazard.phase))
  })
}

function applyDoorSignals(runtime: RuntimeRefs, timers: Record<string, number>, deltaMs: number) {
  for (const [id, signal] of Object.entries(runtime.doorSignals)) {
    const elapsedMs = (timers[id] ?? DOOR_TOTAL_MS) + deltaMs
    timers[id] = Math.min(DOOR_TOTAL_MS, elapsedMs)
    const visual = doorPhaseVisualAtElapsedMs(elapsedMs)
    const material = signal.material
    material.opacity = visual.opacity
    material.color.set(visual.color)
    signal.scale.y = visual.scaleY
  }
}

function applyPickupReadability(runtime: RuntimeRefs, elapsedMs: number, ready: boolean) {
  const { altar, halo, restY } = runtime.pickup
  altar.position.y = restY + pickupBounceY(elapsedMs, ready)
  altar.material.emissiveIntensity = pickupGlowIntensity(elapsedMs, ready)

  const haloScale = pickupHaloScale(elapsedMs)
  halo.scale.set(haloScale, haloScale, 1)
  halo.material.opacity = pickupHaloOpacity(elapsedMs, ready)
}

function opacityForHazardPhase(phase: HazardPhase): number {
  if (phase === 'active') {
    return 0.72
  }

  if (phase === 'warning') {
    return 0.28
  }

  return 0
}

function scaleForHazardPhase(phase: HazardPhase): number {
  if (phase === 'active') {
    return 1.08
  }

  if (phase === 'warning') {
    return 0.9
  }

  return 1
}

function colorForHazardPhase(kind: HazardKind, phase: HazardPhase): string {
  if (phase === 'active') {
    return kind === 'inkPool' ? '#5be7d6' : '#f05a4f'
  }

  if (kind === 'fallingLight') {
    return '#f4f1e8'
  }

  if (kind === 'inkPool') {
    return '#50d1c0'
  }

  return '#ffb04f'
}

function spawnShotBolt(
  runtime: RuntimeRefs,
  bolts: ShotBolt[],
  origin: Vec3,
  direction: Vec3,
  distance: number,
  hit: boolean
) {
  const start = new THREE.Vector3(origin.x, origin.y - 0.16, origin.z)
  const travelDirection = new THREE.Vector3(direction.x, direction.y, direction.z).normalize()
  start.addScaledVector(travelDirection, 0.55)

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(hit ? 0.085 : 0.065, 10, 10),
    new THREE.MeshBasicMaterial({
      color: hit ? '#f05a4f' : '#50d1c0',
      transparent: true,
      opacity: 0.92
    })
  )
  mesh.position.copy(start)
  mesh.renderOrder = 4
  runtime.shotGroup.add(mesh)
  shotBoltsLimit(runtime, bolts)
  const travelDistance = Math.max(0.35, distance - 0.55)
  // Bolt step is deltaMs * 0.075, so travelDistance / 0.075 ms hits the impact point.
  // Add a fade buffer so the visual ring opacity has time to drop after spawn.
  const travelMs = travelDistance / 0.075
  const fadeBufferMs = hit ? 120 : 180
  bolts.push({
    mesh,
    direction: travelDirection,
    remainingDistance: travelDistance,
    ttlMs: travelMs + fadeBufferMs,
    hit,
    impactSpawned: false
  })
}

function tickShotBolts(runtime: RuntimeRefs, bolts: ShotBolt[], impacts: ShotImpact[], deltaMs: number) {
  for (let index = bolts.length - 1; index >= 0; index -= 1) {
    const bolt = bolts[index]
    const step = Math.min(bolt.remainingDistance, deltaMs * 0.075)
    bolt.mesh.position.addScaledVector(bolt.direction, step)
    bolt.remainingDistance -= step
    bolt.ttlMs -= deltaMs
    bolt.mesh.material.opacity = Math.max(0, Math.min(0.92, bolt.ttlMs / 120))

    if (bolt.remainingDistance <= 0 && !bolt.impactSpawned) {
      bolt.impactSpawned = true
      spawnShotImpact(runtime, impacts, bolt.mesh.position, bolt.direction, bolt.hit)
    }

    if (bolt.remainingDistance <= 0 || bolt.ttlMs <= 0) {
      runtime.shotGroup.remove(bolt.mesh)
      bolt.mesh.geometry.dispose()
      bolt.mesh.material.dispose()
      bolts.splice(index, 1)
    }
  }
}

function spawnShotImpact(
  runtime: RuntimeRefs,
  impacts: ShotImpact[],
  position: THREE.Vector3,
  direction: THREE.Vector3,
  hit: boolean
) {
  const innerRadius = hit ? 0.04 : 0.03
  const outerRadius = hit ? 0.16 : 0.1
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(innerRadius, outerRadius, 18),
    new THREE.MeshBasicMaterial({
      color: hit ? '#ff6f63' : '#7be0d2',
      transparent: true,
      opacity: hit ? 0.95 : 0.7,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  )
  mesh.position.copy(position)
  const lookTarget = new THREE.Vector3().copy(position).addScaledVector(direction, -1)
  mesh.lookAt(lookTarget)
  mesh.renderOrder = 5
  runtime.shotGroup.add(mesh)
  shotImpactsLimit(runtime, impacts)
  impacts.push({
    mesh,
    ageMs: 0,
    durationMs: hit ? 220 : 160,
    startScale: hit ? 0.6 : 0.5,
    endScale: hit ? 2.4 : 1.6
  })
}

function tickShotImpacts(runtime: RuntimeRefs, impacts: ShotImpact[], deltaMs: number) {
  for (let index = impacts.length - 1; index >= 0; index -= 1) {
    const impact = impacts[index]
    impact.ageMs += deltaMs
    const t = Math.min(1, impact.ageMs / impact.durationMs)
    const scale = impact.startScale + (impact.endScale - impact.startScale) * t
    impact.mesh.scale.setScalar(scale)
    impact.mesh.material.opacity = Math.max(0, impact.mesh.material.opacity * (1 - t * 0.18) - deltaMs * 0.0015)

    if (impact.ageMs >= impact.durationMs) {
      runtime.shotGroup.remove(impact.mesh)
      impact.mesh.geometry.dispose()
      impact.mesh.material.dispose()
      impacts.splice(index, 1)
    }
  }
}

function shotImpactsLimit(runtime: RuntimeRefs, impacts: ShotImpact[]) {
  while (impacts.length >= 12) {
    const impact = impacts.shift()

    if (!impact) {
      return
    }

    runtime.shotGroup.remove(impact.mesh)
    impact.mesh.geometry.dispose()
    impact.mesh.material.dispose()
  }
}

function clearShotImpacts(runtime: RuntimeRefs | null, impacts: ShotImpact[]) {
  while (impacts.length > 0) {
    const impact = impacts.pop()

    if (!impact) {
      return
    }

    runtime?.shotGroup.remove(impact.mesh)
    impact.mesh.geometry.dispose()
    impact.mesh.material.dispose()
  }
}

function shotBoltsLimit(runtime: RuntimeRefs, bolts: ShotBolt[]) {
  while (bolts.length > 20) {
    const bolt = bolts.shift()

    if (!bolt) {
      return
    }

    runtime.shotGroup.remove(bolt.mesh)
    bolt.mesh.geometry.dispose()
    bolt.mesh.material.dispose()
  }
}

function clearShotBolts(runtime: RuntimeRefs | null, bolts: ShotBolt[]) {
  while (bolts.length > 0) {
    const bolt = bolts.pop()

    if (!bolt) {
      return
    }

    runtime?.shotGroup.remove(bolt.mesh)
    bolt.mesh.geometry.dispose()
    bolt.mesh.material.dispose()
  }
}

function spawnInkProjectile(
  runtime: RuntimeRefs,
  projectiles: InkProjectile[],
  origin: Vec3,
  direction: Vec3,
  damage: number
) {
  const start = new THREE.Vector3(origin.x, origin.y - 0.12, origin.z)
  const travelDirection = new THREE.Vector3(direction.x, direction.y, direction.z).normalize()
  start.addScaledVector(travelDirection, 0.65)

  const group = new THREE.Group()
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshBasicMaterial({
      color: '#50d1c0',
      transparent: true,
      opacity: 0.96
    })
  )
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 16, 16),
    new THREE.MeshBasicMaterial({
      color: '#50d1c0',
      transparent: true,
      opacity: 0.24,
      wireframe: true
    })
  )
  core.renderOrder = 5
  halo.renderOrder = 4
  group.add(core, halo)
  group.position.copy(start)
  runtime.shotGroup.add(group)
  projectiles.push({
    group,
    core,
    halo,
    direction: travelDirection,
    remainingDistance: 16,
    damage,
    splashRadius: 0.95,
    ageMs: 0
  })
}

type InkProjectileHit = {
  enemyId: string
  hitDistance: number
}

function tickInkProjectiles(
  runtime: RuntimeRefs,
  projectiles: InkProjectile[],
  enemies: EnemyModel[],
  playerPosition: Vec3,
  deltaMs: number
): InkProjectileHit[] {
  const hits: InkProjectileHit[] = []

  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = projectiles[index]
    const step = Math.min(projectile.remainingDistance, deltaMs * 0.028)
    projectile.ageMs += deltaMs
    projectile.group.position.addScaledVector(projectile.direction, step)
    projectile.remainingDistance -= step
    const pulse = 1 + Math.sin(projectile.ageMs / 72) * 0.16
    projectile.halo.scale.setScalar(pulse)

    let hitEnemyId: string | null = null

    for (const candidate of enemies) {
      if (candidate.state === 'dead') {
        continue
      }

      const candidateDistance = Math.hypot(
        projectile.group.position.x - candidate.position.x,
        projectile.group.position.z - candidate.position.z
      )

      if (candidateDistance <= candidate.radius + projectile.splashRadius) {
        hitEnemyId = candidate.id
        break
      }
    }

    if (hitEnemyId !== null) {
      const target = enemies.find((candidate) => candidate.id === hitEnemyId)
      const hitDistance = target
        ? Math.hypot(target.position.x - playerPosition.x, target.position.z - playerPosition.z)
        : 0
      hits.push({ enemyId: hitEnemyId, hitDistance })
    }

    if (hitEnemyId !== null || projectile.remainingDistance <= 0) {
      disposeInkProjectile(runtime, projectile)
      projectiles.splice(index, 1)
    }
  }

  return hits
}

function clearInkProjectiles(runtime: RuntimeRefs | null, projectiles: InkProjectile[]) {
  while (projectiles.length > 0) {
    const projectile = projectiles.pop()

    if (!projectile) {
      return
    }

    disposeInkProjectile(runtime, projectile)
  }
}

function disposeInkProjectile(runtime: RuntimeRefs | null, projectile: InkProjectile) {
  runtime?.shotGroup.remove(projectile.group)
  projectile.core.geometry.dispose()
  projectile.core.material.dispose()
  projectile.halo.geometry.dispose()
  projectile.halo.material.dispose()
}

function spawnSpitterProjectile(
  runtime: RuntimeRefs,
  projectiles: SpitterProjectileRuntime[],
  state: SpitterProjectile
) {
  const group = new THREE.Group()
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 14, 14),
    new THREE.MeshBasicMaterial({ color: '#a8e07a', transparent: true, opacity: 0.96 })
  )
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 14, 14),
    new THREE.MeshBasicMaterial({ color: '#a8e07a', transparent: true, opacity: 0.22, wireframe: true })
  )
  core.renderOrder = 5
  halo.renderOrder = 4
  group.add(core, halo)
  group.position.set(state.position.x, state.position.y, state.position.z)
  runtime.shotGroup.add(group)
  projectiles.push({ state, group, core, halo })
}

function tickAndResolveSpitterProjectiles(
  runtime: RuntimeRefs,
  projectiles: SpitterProjectileRuntime[],
  playerPosition: Vec3,
  playerRadius: number,
  enemies: EnemyModel[],
  deltaMs: number,
  onPlayerHit: (damage: number) => void,
  onEnemyHit: (enemyId: string, damage: number) => void
) {
  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = projectiles[index]
    projectile.state = tickSpitterProjectile(projectile.state, deltaMs)
    projectile.group.position.set(
      projectile.state.position.x,
      projectile.state.position.y,
      projectile.state.position.z
    )
    const pulse = 1 + Math.sin(projectile.state.ageMs / 64) * 0.18
    projectile.halo.scale.setScalar(pulse)

    if (spitterProjectileHitsPlayer(projectile.state, playerPosition, playerRadius)) {
      onPlayerHit(projectile.state.damage)
      disposeSpitterProjectile(runtime, projectile)
      projectiles.splice(index, 1)
      continue
    }

    let crossfireHitId: string | null = null

    for (const candidate of enemies) {
      if (candidate.state === 'dead') {
        continue
      }

      // Skip the spitter that fired the projectile so its own splash
      // does not blast itself in the back.
      if (candidate.type === 'spitter') {
        const projectileFromCandidate = Math.hypot(
          projectile.state.position.x - candidate.position.x,
          projectile.state.position.z - candidate.position.z
        )
        if (projectileFromCandidate < candidate.radius + 0.6) {
          continue
        }
      }

      const candidateDistance = Math.hypot(
        projectile.state.position.x - candidate.position.x,
        projectile.state.position.z - candidate.position.z
      )

      if (candidateDistance <= candidate.radius + SPITTER_PROJECTILE_RADIUS_M) {
        crossfireHitId = candidate.id
        break
      }
    }

    if (crossfireHitId !== null) {
      const crossfireDamage = Math.max(1, Math.round(projectile.state.damage * INFIGHTING_DAMAGE_SCALE))
      onEnemyHit(crossfireHitId, crossfireDamage)
      disposeSpitterProjectile(runtime, projectile)
      projectiles.splice(index, 1)
      continue
    }

    if (spitterProjectileExpired(projectile.state)) {
      disposeSpitterProjectile(runtime, projectile)
      projectiles.splice(index, 1)
    }
  }
}

function clearSpitterProjectiles(runtime: RuntimeRefs | null, projectiles: SpitterProjectileRuntime[]) {
  while (projectiles.length > 0) {
    const projectile = projectiles.pop()

    if (!projectile) {
      return
    }

    disposeSpitterProjectile(runtime, projectile)
  }
}

function disposeSpitterProjectile(runtime: RuntimeRefs | null, projectile: SpitterProjectileRuntime) {
  runtime?.shotGroup.remove(projectile.group)
  projectile.core.geometry.dispose()
  projectile.core.material.dispose()
  projectile.halo.geometry.dispose()
  projectile.halo.material.dispose()
}

function startMusicLayer(): {
  context: AudioContext
  masterGain: GainNode
  bass: OscillatorNode
  throb: OscillatorNode
  throbGain: GainNode
} | null {
  if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
    return null
  }

  const context = new window.AudioContext()
  const masterGain = context.createGain()
  masterGain.gain.value = 0
  masterGain.connect(context.destination)

  const bass = context.createOscillator()
  bass.type = 'sawtooth'
  bass.frequency.value = MUSIC_BASS_HZ

  // Throb LFO modulates an inner gain node so the bass tone pulses
  // at MUSIC_THROB_HZ. The LFO's depth is +/- 0.5 around a 0.5
  // baseline so the throb modulates between 0 and 1 of the inner
  // gain. Master gain then sets the audible volume.
  const throb = context.createOscillator()
  throb.type = 'sine'
  throb.frequency.value = MUSIC_THROB_HZ
  const throbGain = context.createGain()
  throbGain.gain.value = 0.5
  const throbDepth = context.createGain()
  throbDepth.gain.value = 0.5
  throb.connect(throbDepth)
  throbDepth.connect(throbGain.gain)

  bass.connect(throbGain)
  throbGain.connect(masterGain)

  bass.start()
  throb.start()

  return { context, masterGain, bass, throb, throbGain }
}

function stopMusicLayer(layer: {
  context: AudioContext
  masterGain: GainNode
  bass: OscillatorNode
  throb: OscillatorNode
  throbGain: GainNode
} | null) {
  if (layer === null) {
    return
  }

  try {
    layer.bass.stop()
  } catch {
    // already stopped
  }

  try {
    layer.throb.stop()
  } catch {
    // already stopped
  }

  void layer.context.close().catch(() => {
    // noop
  })
}

function startRagePulseLayer(): {
  context: AudioContext
  masterGain: GainNode
  bass: OscillatorNode
  throb: OscillatorNode
  throbGain: GainNode
} | null {
  if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
    return null
  }

  const context = new window.AudioContext()
  const masterGain = context.createGain()
  masterGain.gain.value = 0
  masterGain.connect(context.destination)

  const bass = context.createOscillator()
  bass.type = 'square'
  bass.frequency.value = RAGE_PULSE_BASS_HZ

  const throb = context.createOscillator()
  throb.type = 'sine'
  throb.frequency.value = RAGE_PULSE_THROB_HZ
  const throbGain = context.createGain()
  throbGain.gain.value = 0.5
  const throbDepth = context.createGain()
  throbDepth.gain.value = 0.5
  throb.connect(throbDepth)
  throbDepth.connect(throbGain.gain)

  bass.connect(throbGain)
  throbGain.connect(masterGain)

  bass.start()
  throb.start()

  return { context, masterGain, bass, throb, throbGain }
}

function stopRagePulseLayer(layer: {
  context: AudioContext
  masterGain: GainNode
  bass: OscillatorNode
  throb: OscillatorNode
  throbGain: GainNode
} | null) {
  if (layer === null) {
    return
  }

  try {
    layer.bass.stop()
  } catch {
    // already stopped
  }

  try {
    layer.throb.stop()
  } catch {
    // already stopped
  }

  void layer.context.close().catch(() => {
    // noop
  })
}

function playScoreTokenCue(enabled: boolean) {
  if (!enabled || typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
    return
  }

  const context = new window.AudioContext()
  const tones = [660, 990, 1320]
  const toneDurationMs = 220 / 3
  let toneStart = context.currentTime
  let lastOscillator: OscillatorNode | null = null

  for (const frequency of tones) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    const stopTime = toneStart + toneDurationMs / 1000
    gain.gain.setValueAtTime(0, toneStart)
    gain.gain.linearRampToValueAtTime(0.04, toneStart + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(toneStart)
    oscillator.stop(stopTime)
    toneStart = stopTime
    lastOscillator = oscillator
  }

  if (lastOscillator !== null) {
    lastOscillator.addEventListener('ended', () => {
      context.close()
    })
  }
}

function playWaveHornCue(enabled: boolean) {
  if (!enabled || typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
    return
  }

  const context = new window.AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sawtooth'
  const startTime = context.currentTime
  const durationMs = 220
  const stopTime = startTime + durationMs / 1000
  oscillator.frequency.setValueAtTime(90, startTime)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(0.05, startTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, stopTime)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(startTime)
  oscillator.stop(stopTime)
  oscillator.addEventListener('ended', () => {
    context.close()
  })
}

function playRageCue(enabled: boolean) {
  if (!enabled || typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
    return
  }

  const context = new window.AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sawtooth'
  const startTime = context.currentTime
  const durationMs = 480
  const stopTime = startTime + durationMs / 1000
  oscillator.frequency.setValueAtTime(180, startTime)
  oscillator.frequency.exponentialRampToValueAtTime(360, stopTime)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(0.06, startTime + 0.05)
  gain.gain.exponentialRampToValueAtTime(0.0001, stopTime)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(startTime)
  oscillator.stop(stopTime)
  oscillator.addEventListener('ended', () => {
    context.close()
  })
}

function playSpitterFireCue(enabled: boolean) {
  if (!enabled || typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
    return
  }

  const context = new window.AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'square'
  const startTime = context.currentTime
  const durationMs = 140
  const stopTime = startTime + durationMs / 1000
  oscillator.frequency.setValueAtTime(620, startTime)
  oscillator.frequency.exponentialRampToValueAtTime(280, stopTime)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(0.034, startTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, stopTime)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(startTime)
  oscillator.stop(stopTime)
  oscillator.addEventListener('ended', () => {
    context.close()
  })
}

function knockEnemyBack(enemy: EnemyModel, direction: Vec3, distance: number): EnemyModel {
  if (enemy.state === 'dead') {
    return enemy
  }

  return {
    ...enemy,
    position: {
      x: clamp(enemy.position.x + direction.x * distance, movementConfig.bounds.minX, movementConfig.bounds.maxX),
      y: enemy.position.y,
      z: clamp(enemy.position.z + direction.z * distance, movementConfig.bounds.minZ, movementConfig.bounds.maxZ)
    }
  }
}

function selectWeapon(
  weapon: WeaponId,
  selectedRef: { current: WeaponId },
  setSelectedWeapon: (weapon: WeaponId) => void,
  setStatus: (status: string) => void
) {
  selectedRef.current = weapon
  setSelectedWeapon(weapon)
  setStatus(`${weaponConfigs[weapon].label} ready.`)
}

function SettingsPanel({
  settings,
  onChange
}: {
  settings: Settings
  onChange: (settings: Settings) => void
}) {
  return (
    <div className="settings-panel" data-testid="settings-panel">
      <label>
        Sensitivity
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={settings.sensitivity}
          onChange={(event) => onChange({ ...settings, sensitivity: Number(event.target.value) })}
        />
      </label>
      <label>
        FOV
        <input
          type="range"
          min="65"
          max="95"
          step="1"
          value={settings.fov}
          onChange={(event) => onChange({ ...settings, fov: Number(event.target.value) })}
        />
      </label>
      <label className="audio-toggle">
        <input
          type="checkbox"
          checked={settings.audio}
          onChange={(event) => onChange({ ...settings, audio: event.target.checked })}
        />
        Audio
      </label>
    </div>
  )
}

function PracticePanel({
  settings,
  onChange,
  disabled = false
}: {
  settings: PracticeSettings
  onChange: (settings: PracticeSettings) => void
  disabled?: boolean
}) {
  return (
    <div className="practice-panel" data-testid="practice-panel">
      <label>
        Start weapon
        <select
          disabled={disabled}
          value={settings.startingWeapon}
          onChange={(event) => onChange({ ...settings, startingWeapon: event.target.value as WeaponId })}
        >
          {weaponIdsForSelect.map((weapon) => (
            <option key={weapon} value={weapon}>
              {weaponConfigs[weapon].label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Spawn rate
        <input
          disabled={disabled}
          type="range"
          min="0.5"
          max="2"
          step="0.25"
          value={settings.spawnRate}
          onChange={(event) => onChange({ ...settings, spawnRate: Number(event.target.value) })}
        />
      </label>
      <fieldset>
        <legend>Enemies</legend>
        {enemyTypesForSelect.map((enemyType) => (
          <label key={enemyType} className="toggle-row">
            <input
              disabled={disabled}
              type="checkbox"
              checked={settings.enemyTypes.includes(enemyType)}
              onChange={(event) => {
                const enemyTypes = event.target.checked
                  ? [...settings.enemyTypes, enemyType]
                  : settings.enemyTypes.filter((type) => type !== enemyType)
                onChange({ ...settings, enemyTypes })
              }}
            />
            {enemyLabel(enemyType)}
          </label>
        ))}
      </fieldset>
      <label className="toggle-row">
        <input
          disabled={disabled}
          type="checkbox"
          checked={settings.infiniteAmmo}
          onChange={(event) => onChange({ ...settings, infiniteAmmo: event.target.checked })}
        />
        Infinite ammo
      </label>
      <label className="toggle-row">
        <input
          disabled={disabled}
          type="checkbox"
          checked={settings.damageEnabled}
          onChange={(event) => onChange({ ...settings, damageEnabled: event.target.checked })}
        />
        Damage
      </label>
      <label className="toggle-row">
        <input
          disabled={disabled}
          type="checkbox"
          checked={settings.debugOverlays}
          onChange={(event) => onChange({ ...settings, debugOverlays: event.target.checked })}
        />
        Billboard debug
      </label>
      <label className="toggle-row">
        <input
          disabled={disabled}
          type="checkbox"
          checked={settings.roomStateFrozen}
          onChange={(event) => onChange({ ...settings, roomStateFrozen: event.target.checked })}
        />
        Freeze room
      </label>
    </div>
  )
}

function SharedLeaderboardPanel({
  entries,
  scope,
  status,
  onScopeChange
}: {
  entries: RankedLeaderboardEntry[]
  scope: LeaderboardScope
  status: SharedLeaderboardStatus
  onScopeChange: (scope: LeaderboardScope) => void
}) {
  return (
    <div className="shared-leaderboard" data-testid="shared-leaderboard">
      <div className="leaderboard-tabs">
        <button
          className={scope === 'all' ? 'active' : ''}
          type="button"
          onClick={() => onScopeChange('all')}
        >
          All-time
        </button>
        <button
          className={scope === 'daily' ? 'active' : ''}
          type="button"
          onClick={() => onScopeChange('daily')}
        >
          Daily
        </button>
      </div>
      {status === 'loading' ? <p>Loading shared board.</p> : null}
      {status === 'unavailable' ? <p>Shared board unavailable.</p> : null}
      {status === 'error' ? <p>Shared board failed to load.</p> : null}
      {status === 'ready' && entries.length === 0 ? <p>No shared scores yet.</p> : null}
      {entries.length > 0 ? (
        <ol className="leaderboard">
          {entries.map((entry) => (
            <li key={entry.id}>
              <span>#{entry.rank} {entry.playerInitials}</span>
              <strong>{entry.score}</strong>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}

function DailySchedulePanel({ preview }: { preview: DailySchedulePreview }) {
  return (
    <div className="daily-schedule" data-testid="daily-schedule">
      <div className="schedule-row">
        <span>Spawn offset</span>
        <strong>+{preview.spawnTypeOffset}</strong>
      </div>
      <div className="schedule-row">
        <span>Supply cooldown</span>
        <strong>{formatTime(preview.supplyCooldownMs)}</strong>
      </div>
      <div className="schedule-strip" aria-label="Daily spawn order">
        {preview.spawnOrder.map((spawn) => (
          <span key={spawn.spawnNumber}>{enemyLabel(spawn.enemyType)}</span>
        ))}
      </div>
      <ol className="schedule-hazards" aria-label="Daily hazard schedule">
        {preview.hazards.map((hazard) => (
          <li key={hazard.kind}>
            <span>{hazardLabel(hazard.kind)}</span>
            <strong>{formatTime(hazard.firstWarningMs)}</strong>
          </li>
        ))}
      </ol>
    </div>
  )
}

function LocalLeaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <ol className="leaderboard" data-testid="leaderboard" aria-label="Local leaderboard">
      {entries.map((entry, index) => (
        <li key={`${entry.createdAt}-${index}`}>
          <span>{entry.playerInitials}</span>
          <strong>{entry.score}</strong>
        </li>
      ))}
    </ol>
  )
}

function loadInitials(): string {
  if (typeof window === 'undefined') {
    return 'YOU'
  }

  return normalizeClientInitials(window.localStorage.getItem('flatline.initials.v1') ?? 'YOU') || 'YOU'
}

function normalizeClientInitials(value: string): string {
  return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
}

function submitButtonLabel(status: SubmitStatus): string {
  if (status === 'submitting') {
    return 'Submitting'
  }

  if (status === 'submitted') {
    return 'Submitted'
  }

  if (status === 'unavailable') {
    return 'Unavailable'
  }

  return 'Submit score'
}

function loadInitialSettings(): Settings {
  if (typeof window === 'undefined') {
    return { sensitivity: 1, fov: 75, audio: true }
  }

  const savedSettings = window.localStorage.getItem('flatline.settings.v1')

  if (!savedSettings) {
    return { sensitivity: 1, fov: 75, audio: true }
  }

  try {
    return JSON.parse(savedSettings) as Settings
  } catch {
    window.localStorage.removeItem('flatline.settings.v1')
    return { sensitivity: 1, fov: 75, audio: true }
  }
}

function createPracticeSettings(): PracticeSettings {
  return {
    startingWeapon: 'peashooter',
    enemyTypes: ['grunt', 'skitter', 'brute', 'spitter'],
    spawnRate: 1,
    infiniteAmmo: false,
    damageEnabled: true,
    debugOverlays: true,
    roomStateFrozen: false
  }
}

function normalizePracticeSettings(settings: PracticeSettings): PracticeSettings {
  const enemyTypes = enemyTypesForSelect.filter((enemyType) => settings.enemyTypes.includes(enemyType))

  return {
    startingWeapon: weaponIds.includes(settings.startingWeapon) ? settings.startingWeapon : 'peashooter',
    enemyTypes: enemyTypes.length > 0 ? enemyTypes : ['grunt'],
    spawnRate: clamp(settings.spawnRate, 0.5, 2),
    infiniteAmmo: settings.infiniteAmmo,
    damageEnabled: settings.damageEnabled,
    debugOverlays: settings.debugOverlays,
    roomStateFrozen: settings.roomStateFrozen
  }
}

function practiceEnemyTypeForSpawn(spawnCount: number, settings: PracticeSettings, isPractice: boolean): EnemyType {
  if (!isPractice) {
    return enemyTypeForSpawn(spawnCount)
  }

  const enemyTypes = normalizePracticeSettings(settings).enemyTypes
  return enemyTypes[spawnCount % enemyTypes.length]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function animationForEnemyState(state: EnemyModel['state']): AnimationName {
  if (state === 'dead') {
    return 'death'
  }

  if (state === 'hurt' || state === 'attackWindup' || state === 'attackRelease') {
    return 'hurt'
  }

  return 'idle'
}

function enemyLabel(type: EnemyModel['type']): string {
  if (type === 'skitter') {
    return 'Skitter'
  }

  if (type === 'brute') {
    return 'Brute'
  }

  if (type === 'spitter') {
    return 'Spitter'
  }

  return 'Grunt'
}

function hazardLabel(kind: HazardKind): string {
  if (kind === 'flameLane') {
    return 'Flame lane'
  }

  if (kind === 'inkPool') {
    return 'Ink pool'
  }

  return 'Falling light'
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60).toString()
  const remainder = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainder}`
}

function playCue(frequency: number, enabled: boolean) {
  if (!enabled || typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
    return
  }

  const context = new window.AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.frequency.value = frequency
  gain.gain.value = 0.025
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.06)
  oscillator.addEventListener('ended', () => {
    context.close()
  })
}

function playWindupCue(cue: EnemyWindupCueStyle, enabled: boolean) {
  if (!enabled || typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
    return
  }

  const context = new window.AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = cue.waveform
  oscillator.frequency.value = cue.frequency
  const peak = cue.gain
  const startTime = context.currentTime
  const stopTime = startTime + cue.durationMs / 1000
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(peak, startTime + Math.min(0.02, cue.durationMs / 1000 / 4))
  gain.gain.exponentialRampToValueAtTime(0.0001, stopTime)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(startTime)
  oscillator.stop(stopTime)
  oscillator.addEventListener('ended', () => {
    context.close()
  })
}

function playHazardCountdownCue(cue: HazardCountdownStyle, tick: HazardCountdownTick, enabled: boolean) {
  if (!enabled || typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
    return
  }

  const context = new window.AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = cue.waveform
  oscillator.frequency.value = tick.isFinal ? cue.finalFrequency : cue.frequency
  const peak = tick.isFinal ? cue.finalGain : cue.gain
  const startTime = context.currentTime
  const stopTime = startTime + cue.durationMs / 1000
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(peak, startTime + Math.min(0.01, cue.durationMs / 1000 / 4))
  gain.gain.exponentialRampToValueAtTime(0.0001, stopTime)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(startTime)
  oscillator.stop(stopTime)
  oscillator.addEventListener('ended', () => {
    context.close()
  })
}

function playPickupCue(cue: PickupCueStyle, enabled: boolean) {
  if (!enabled || typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
    return
  }

  const context = new window.AudioContext()
  const startTime = context.currentTime
  const firstStop = startTime + cue.firstDurationMs / 1000
  const secondStart = firstStop
  const secondStop = secondStart + cue.secondDurationMs / 1000

  const firstOsc = context.createOscillator()
  const firstGain = context.createGain()
  firstOsc.type = cue.waveform
  firstOsc.frequency.value = cue.firstFrequency
  firstGain.gain.setValueAtTime(0, startTime)
  firstGain.gain.linearRampToValueAtTime(cue.gain, startTime + Math.min(0.012, cue.firstDurationMs / 1000 / 5))
  firstGain.gain.exponentialRampToValueAtTime(0.0001, firstStop)
  firstOsc.connect(firstGain)
  firstGain.connect(context.destination)
  firstOsc.start(startTime)
  firstOsc.stop(firstStop)

  const secondOsc = context.createOscillator()
  const secondGain = context.createGain()
  secondOsc.type = cue.waveform
  secondOsc.frequency.value = cue.secondFrequency
  secondGain.gain.setValueAtTime(0, secondStart)
  secondGain.gain.linearRampToValueAtTime(cue.gain, secondStart + Math.min(0.012, cue.secondDurationMs / 1000 / 5))
  secondGain.gain.exponentialRampToValueAtTime(0.0001, secondStop)
  secondOsc.connect(secondGain)
  secondGain.connect(context.destination)
  secondOsc.start(secondStart)
  secondOsc.stop(secondStop)

  secondOsc.addEventListener('ended', () => {
    context.close()
  })
}

function playDoorOpenCue(cue: DoorCueStyle, enabled: boolean) {
  if (!enabled || typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
    return
  }

  const context = new window.AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = cue.waveform
  oscillator.frequency.value = cue.frequency
  const peak = cue.gain
  const startTime = context.currentTime
  const stopTime = startTime + cue.durationMs / 1000
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(peak, startTime + Math.min(0.012, cue.durationMs / 1000 / 5))
  gain.gain.exponentialRampToValueAtTime(0.0001, stopTime)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(startTime)
  oscillator.stop(stopTime)
  oscillator.addEventListener('ended', () => {
    context.close()
  })
}

function playDashCue(enabled: boolean) {
  if (!enabled || typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
    return
  }

  const context = new window.AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sine'
  const startTime = context.currentTime
  const durationMs = 180
  const stopTime = startTime + durationMs / 1000
  oscillator.frequency.setValueAtTime(1100, startTime)
  oscillator.frequency.exponentialRampToValueAtTime(700, stopTime)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(0.038, startTime + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, stopTime)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(startTime)
  oscillator.stop(stopTime)
  oscillator.addEventListener('ended', () => {
    context.close()
  })
}

function playComboBreakCue(style: ComboBreakCueStyle, enabled: boolean) {
  if (!enabled || typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
    return
  }

  const context = new window.AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = style.waveform
  const startTime = context.currentTime
  const firstSeconds = style.firstDurationMs / 1000
  const secondSeconds = style.secondDurationMs / 1000
  const stopTime = startTime + firstSeconds + secondSeconds
  oscillator.frequency.setValueAtTime(style.firstFrequency, startTime)
  oscillator.frequency.setValueAtTime(style.secondFrequency, startTime + firstSeconds)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(style.gain, startTime + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, stopTime)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(startTime)
  oscillator.stop(stopTime)
  oscillator.addEventListener('ended', () => {
    context.close()
  })
}

function playPlayerDamageCue(cue: PlayerDamageCueStyle, enabled: boolean) {
  if (!enabled || typeof window === 'undefined' || typeof window.AudioContext !== 'function') {
    return
  }

  const context = new window.AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = cue.waveform
  oscillator.frequency.value = cue.frequency
  const peak = cue.gain
  const startTime = context.currentTime
  const stopTime = startTime + cue.durationMs / 1000
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(peak, startTime + Math.min(0.015, cue.durationMs / 1000 / 5))
  gain.gain.exponentialRampToValueAtTime(0.0001, stopTime)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(startTime)
  oscillator.stop(stopTime)
  oscillator.addEventListener('ended', () => {
    context.close()
  })
}

async function loadEnemyAtlases(): Promise<Record<EnemyType, EnemyVisualAsset>> {
  const loadedAssets = await Promise.all(enemyAtlasTypes.map((type) => loadEnemyAtlas(type)))

  return loadedAssets.reduce((assets, [type, asset]) => {
    assets[type] = asset
    return assets
  }, {} as Record<EnemyType, EnemyVisualAsset>)
}

async function loadEnemyAtlas(type: EnemyType): Promise<[EnemyType, EnemyVisualAsset]> {
  const atlasResponse = await fetch(`/assets/enemies/${type}/${type}.atlas.json`)
  const atlas = await atlasResponse.json() as SpriteAtlas
  assertValidSpriteAtlas(atlas)
  const texture = await new THREE.TextureLoader().loadAsync(`/assets/enemies/${type}/${atlas.image}`)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping

  return [type, { atlas, texture }]
}

function setEnemySlotAsset(slot: EnemyRenderSlot, type: EnemyType, asset: EnemyVisualAsset) {
  if (slot.textureType === type && slot.texture !== null) {
    return
  }

  if (slot.texture !== null) {
    slot.texture.dispose()
  }

  const cloned = asset.texture.clone()
  cloned.needsUpdate = true
  slot.texture = cloned
  slot.textureType = type
  slot.material.map = cloned
  slot.material.needsUpdate = true
}

function disposeEnemyAssets(assets: Partial<Record<EnemyType, EnemyVisualAsset>>) {
  for (const asset of Object.values(assets)) {
    asset?.texture.dispose()
  }
}

function applyEnemyFrame(
  slot: EnemyRenderSlot,
  atlas: SpriteAtlas | null,
  animationName: AnimationName,
  angle: BillboardAngle,
  timeMs: number
) {
  if (!atlas || !slot.texture) {
    return
  }

  const clip = selectAnimationClip(atlas, animationName, angle)
  const frame = selectSpriteFrame(clip, timeMs)
  const transform = frameToUvTransform(frame, atlas.imageWidth, atlas.imageHeight)
  slot.texture.repeat.set(transform.repeatX, transform.repeatY)
  slot.texture.offset.set(transform.offsetX, transform.offsetY)
}

function disposeEnemySlots(slots: EnemyRenderSlot[]) {
  for (const slot of slots) {
    if (slot.texture !== null) {
      slot.texture.dispose()
      slot.texture = null
      slot.textureType = null
    }
    slot.material.dispose()
    slot.mesh.geometry.dispose()
  }
}

function requestPointerLock(canvas: HTMLCanvasElement | undefined) {
  if (!canvas || typeof canvas.requestPointerLock !== 'function') {
    return
  }

  const request = canvas.requestPointerLock()

  if (request instanceof Promise) {
    request.catch(() => {
      // Some automated and embedded browsers reject pointer lock. The run still starts.
    })
  }
}
