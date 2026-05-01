'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { angleToPlayerBucket, angleToPlayerName, type BillboardAngle } from '@/game/billboard'
import { applyDailySpawnOffset, createDailyArenaConfig, type DailyArenaConfig } from '@/game/dailyArena'
import { createEnemy, createGrunt, damageEnemy, enemyConfigs, enemyTypeForSpawn, tickEnemy, type EnemyModel, type EnemyType } from '@/game/enemies'
import { hazardDamageAtPosition, hazardStatesForRunMs, roomPressureIntensity, type HazardKind, type HazardPhase, type HazardState } from '@/game/hazards'
import { updatePlayerPosition } from '@/game/movement'
import { accuracy, createScoreState, finalScore, recordKill, recordShot, type ScoreState } from '@/game/scoring'
import { fireHitscan, forwardFromYawPitch } from '@/game/shooting'
import { createDirectorState, tickDirector, type DirectorState } from '@/game/spawnDirector'
import { frameToUvTransform, selectAnimationClip, selectSpriteFrame, type AnimationName, type SpriteAtlas } from '@/game/spriteAtlas'
import type { MovementInput, SphereTarget, Vec3 } from '@/game/types'
import {
  canFireWeapon,
  collectWeaponAmmo,
  createWeaponAmmo,
  nextWeapon,
  spendWeaponAmmo,
  weaponAmmoLabel,
  weaponConfigs,
  weaponIds,
  type WeaponAmmoState,
  type WeaponId
} from '@/game/weapons'
import { dailySeed } from '@/lib/dailySeed'
import { insertLeaderboardEntry, readLeaderboard, writeLeaderboard, type LeaderboardEntry } from '@/lib/leaderboard'
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
const enemyTypesForSelect: EnemyType[] = ['grunt', 'skitter', 'brute']

type RuntimeRefs = {
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  scene: THREE.Scene
  overhead: THREE.PointLight
  enemyMaterial: THREE.MeshBasicMaterial
  enemyTexture: THREE.Texture | null
  enemyMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  enemyFacingArrow: THREE.ArrowHelper
  muzzleLight: THREE.PointLight
  shotGroup: THREE.Group
  hazardMeshes: Record<HazardKind, THREE.Mesh>
  movingCover: THREE.Mesh
}

type ShotBolt = {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
  direction: THREE.Vector3
  remainingDistance: number
  ttlMs: number
}

type InkProjectile = {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
  direction: THREE.Vector3
  remainingDistance: number
  damage: number
  splashRadius: number
}

type RunSummary = {
  score: number
  survivalMs: number
  kills: number
  accuracy: number
  bestCombo: number
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
}

export function FlatlineGame({ initialLeaderboardScope = 'all', arenaMode = 'standard' }: FlatlineGameProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const runtimeRef = useRef<RuntimeRefs | null>(null)
  const animationRef = useRef<number | null>(null)
  const shotBoltsRef = useRef<ShotBolt[]>([])
  const inkProjectilesRef = useRef<InkProjectile[]>([])
  const lastTimeRef = useRef<number>(0)
  const positionRef = useRef<Vec3>({ ...initialPlayerPosition })
  const yawRef = useRef<number>(initialYaw)
  const pitchRef = useRef<number>(0)
  const keysRef = useRef<MovementInput>({ forward: false, backward: false, left: false, right: false })
  const runningRef = useRef<boolean>(false)
  const pausedRef = useRef<boolean>(false)
  const settingsRef = useRef<Settings>({ sensitivity: 1, fov: 75, audio: true })
  const enemyRef = useRef<EnemyModel>(createGrunt('grunt-1', { x: 0, y: 1.05, z: 3.5 }, initialPlayerPosition))
  const playerHealthRef = useRef<number>(100)
  const directorRef = useRef<DirectorState>(createDirectorState())
  const scoreRef = useRef<ScoreState>(createScoreState())
  const healthPickupReadyRef = useRef<boolean>(true)
  const healthPickupCooldownRef = useRef<number>(0)
  const hazardDamageCooldownRef = useRef<number>(0)
  const selectedWeaponRef = useRef<WeaponId>('peashooter')
  const weaponAmmoRef = useRef<WeaponAmmoState>(createWeaponAmmo())
  const practiceSettingsRef = useRef<PracticeSettings>(createPracticeSettings())
  const atlasRef = useRef<SpriteAtlas | null>(null)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [hits, setHits] = useState(0)
  const [playerHealth, setPlayerHealth] = useState(100)
  const [enemyHealth, setEnemyHealth] = useState(3)
  const [enemyType, setEnemyType] = useState<EnemyModel['type']>('grunt')
  const [score, setScore] = useState(0)
  const [kills, setKills] = useState(0)
  const [runMs, setRunMs] = useState(0)
  const [healthPickupReady, setHealthPickupReady] = useState(true)
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponId>('peashooter')
  const [weaponAmmo, setWeaponAmmo] = useState<WeaponAmmoState>(() => createWeaponAmmo())
  const [summary, setSummary] = useState<RunSummary | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() =>
    typeof window === 'undefined' ? [] : readLeaderboard(window.localStorage)
  )
  const [settings, setSettings] = useState<Settings>(() => loadInitialSettings())
  const [practiceSettings, setPracticeSettings] = useState<PracticeSettings>(() => createPracticeSettings())
  const [seed] = useState(() => dailySeed())
  const [dailyConfig] = useState<DailyArenaConfig | null>(() => arenaMode === 'daily' ? createDailyArenaConfig(seed) : null)
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

  const damageCurrentEnemy = useCallback((damage: number, hurtStatus: string, killStatus: string) => {
    const enemy = enemyRef.current
    const runtime = runtimeRef.current

    if (enemy.state !== 'dead') {
      const wasAlive = enemyRef.current.state !== 'dead'
      enemyRef.current = damageEnemy(enemyRef.current, damage)
      setEnemyHealth(enemyRef.current.health)

      if (wasAlive && enemyRef.current.state === 'dead') {
        scoreRef.current = recordKill(scoreRef.current, directorRef.current.runMs)
        setScore(scoreRef.current.score)
        setKills(scoreRef.current.kills)
        playCue(90, settingsRef.current.audio)
      } else {
        playCue(320, settingsRef.current.audio)
      }

      setStatus(enemyRef.current.state === 'dead' ? killStatus : hurtStatus)
      runtime?.enemyMaterial.color.set('#f05a4f')
    }
  }, [])

  const fire = useCallback(() => {
    const runtime = runtimeRef.current

    if (!runningRef.current || runtime === null) {
      return
    }

    const weapon = selectedWeaponRef.current

    if (!practiceSettingsRef.current.infiniteAmmo && !canFireWeapon(weapon, weaponAmmoRef.current)) {
      setStatus(`${weaponConfigs[weapon].label} is empty. Switch weapons or collect supplies.`)
      return
    }

    if (!practiceSettingsRef.current.infiniteAmmo) {
      weaponAmmoRef.current = spendWeaponAmmo(weapon, weaponAmmoRef.current)
      setWeaponAmmo(weaponAmmoRef.current)
    }
    runtime.muzzleLight.intensity = weapon === 'boomstick' ? 7 : 4.5
    playCue(weapon === 'boomstick' ? 120 : 180, settingsRef.current.audio)

    const direction = forwardFromYawPitch(yawRef.current, pitchRef.current)

    if (weapon === 'inkblaster') {
      spawnInkProjectile(runtime, inkProjectilesRef.current, positionRef.current, direction, weaponConfigs.inkblaster.damage)
      scoreRef.current = recordShot(scoreRef.current, true)
      setStatus('Inkblaster projectile launched.')
      return
    }

    const enemy = enemyRef.current
    const targets: SphereTarget[] = enemy.state === 'dead'
      ? []
      : [
          {
            id: enemy.id,
            center: { x: enemy.position.x, y: 1.35, z: enemy.position.z },
            radius: 0.72
          }
        ]
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
      setHits((value) => value + hits.length)
      damageCurrentEnemy(
        weapon === 'boomstick' ? hits.length : weaponConfigs.peashooter.damage,
        weapon === 'boomstick' ? 'Boomstick blast landed.' : 'Billboard enemy hurt.',
        weapon === 'boomstick' ? 'Boomstick dropped the enemy.' : 'Billboard enemy dropped.'
      )

      if (weapon === 'boomstick') {
        enemyRef.current = knockEnemyBack(enemyRef.current, direction, 0.65)
      }
    } else {
      setStatus(`${weaponConfigs[weapon].label} missed. Track the target and fire again.`)
    }
  }, [damageCurrentEnemy])

  const startRun = useCallback(() => {
    const firstEnemyType = practiceEnemyTypeForSpawn(0, practiceSettingsRef.current, isPractice)
    const startingWeapon = practiceSettingsRef.current.startingWeapon
    positionRef.current = { ...initialPlayerPosition }
    yawRef.current = initialYaw
    pitchRef.current = 0
    playerHealthRef.current = 100
    directorRef.current = createDirectorState()
    scoreRef.current = createScoreState()
    enemyRef.current = createEnemy(firstEnemyType, `${firstEnemyType}-1`, { x: 0, y: 1.05, z: 3.5 }, initialPlayerPosition)
    healthPickupReadyRef.current = true
    healthPickupCooldownRef.current = 0
    hazardDamageCooldownRef.current = 0
    selectedWeaponRef.current = startingWeapon
    weaponAmmoRef.current = createWeaponAmmo()
    clearShotBolts(runtimeRef.current, shotBoltsRef.current)
    clearInkProjectiles(runtimeRef.current, inkProjectilesRef.current)
    runningRef.current = true
    pausedRef.current = false
    setRunning(true)
    setPaused(false)
    setSummary(null)
    setHits(0)
    setPlayerHealth(100)
    setEnemyHealth(enemyRef.current.health)
    setEnemyType(enemyRef.current.type)
    setScore(0)
    setKills(0)
    setRunMs(0)
    setHealthPickupReady(true)
    setSelectedWeapon(startingWeapon)
    setWeaponAmmo(weaponAmmoRef.current)
    setStatus(isPractice ? 'Practice run started. Tuning changes apply next run.' : 'WASD moves. Mouse aims. Left click fires.')
    requestPointerLock(runtimeRef.current?.renderer.domElement)
  }, [isPractice])

  const finishRun = useCallback(() => {
    const runSummary = {
      score: finalScore(scoreRef.current, directorRef.current.runMs),
      survivalMs: directorRef.current.runMs,
      kills: scoreRef.current.kills,
      accuracy: accuracy(scoreRef.current),
      bestCombo: scoreRef.current.bestCombo
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
    const inkProjectiles = inkProjectilesRef.current
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

    scene.add(createRoom())

    const enemyMaterial = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    })
    const enemyMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), enemyMaterial)
    enemyMesh.name = 'debug-billboard-enemy'
    enemyMesh.position.set(0, 1.05, 3.5)
    enemyMesh.renderOrder = 2
    scene.add(enemyMesh)

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

    const enemyFacingArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0.08, 3.5),
      1.15,
      '#f05a4f'
    )
    scene.add(enemyFacingArrow)

    runtimeRef.current = {
      renderer,
      camera,
      scene,
      overhead,
      enemyMaterial,
      enemyTexture: null,
      enemyMesh,
      enemyFacingArrow,
      muzzleLight,
      shotGroup,
      hazardMeshes,
      movingCover
    }

    loadGruntAtlas().then(({ atlas, texture }) => {
      const runtime = runtimeRef.current

      if (!runtime) {
        return
      }

      atlasRef.current = atlas
      runtime.enemyTexture = texture
      runtime.enemyMaterial.map = texture
      runtime.enemyMaterial.needsUpdate = true
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

    function animate(time: number) {
      animationRef.current = requestAnimationFrame(animate)
      const runtime = runtimeRef.current

      if (!runtime) {
        return
      }

      const delta = Math.min((time - lastTimeRef.current) / 1000 || 0, 0.05)
      lastTimeRef.current = time

      if (runningRef.current && !pausedRef.current) {
        positionRef.current = updatePlayerPosition(
          positionRef.current,
          yawRef.current,
          keysRef.current,
          delta,
          movementConfig
        )

        if (playerHealthRef.current > 0) {
          directorRef.current.runMs += delta * 1000
          setRunMs(directorRef.current.runMs)
          hazardDamageCooldownRef.current = Math.max(0, hazardDamageCooldownRef.current - delta * 1000)
          const hazards = hazardStatesForRunMs(directorRef.current.runMs + (dailyConfig?.hazardOffsetMs ?? 0))
          applyHazardMeshes(runtime, hazards)
          runtime.overhead.intensity = 55 + roomPressureIntensity(directorRef.current.runMs) * 35
          runtime.movingCover.position.x = Math.sin(directorRef.current.runMs / 1800) * 2.2

          if (hazardDamageCooldownRef.current === 0) {
            const hazardDamage = hazardDamageAtPosition(positionRef.current, hazards)

            if (hazardDamage > 0 && practiceSettingsRef.current.damageEnabled) {
              playerHealthRef.current = Math.max(0, playerHealthRef.current - hazardDamage)
              hazardDamageCooldownRef.current = 900
              setPlayerHealth(playerHealthRef.current)
              setStatus(`Hazard hit for ${hazardDamage}.`)
              playCue(70, settingsRef.current.audio)
            }
          }

          if (!healthPickupReadyRef.current) {
            healthPickupCooldownRef.current = Math.max(0, healthPickupCooldownRef.current - delta * 1000)

            if (healthPickupCooldownRef.current === 0) {
              healthPickupReadyRef.current = true
              setHealthPickupReady(true)
            }
          }

          if (
            healthPickupReadyRef.current &&
            (playerHealthRef.current < 100 ||
              weaponAmmoRef.current.boomstick < (weaponConfigs.boomstick.maxAmmo ?? 0) ||
              weaponAmmoRef.current.inkblaster < (weaponConfigs.inkblaster.maxAmmo ?? 0)) &&
            Math.hypot(positionRef.current.x, positionRef.current.z) <= 1.35
          ) {
            playerHealthRef.current = Math.min(100, playerHealthRef.current + 15)
            weaponAmmoRef.current = collectWeaponAmmo(weaponAmmoRef.current)
            healthPickupReadyRef.current = false
            healthPickupCooldownRef.current = dailyConfig?.supplyCooldownMs ?? 9000
            setPlayerHealth(playerHealthRef.current)
            setWeaponAmmo(weaponAmmoRef.current)
            setHealthPickupReady(false)
            setStatus('Supplies collected.')
            playCue(520, settingsRef.current.audio)
          }

          const projectileHits = tickInkProjectiles(runtime, inkProjectiles, enemyRef.current, delta * 1000)

          if (projectileHits > 0) {
            scoreRef.current = {
              ...scoreRef.current,
              shotsHit: scoreRef.current.shotsHit + projectileHits
            }
            setHits((value) => value + projectileHits)
            damageCurrentEnemy(projectileHits * weaponConfigs.inkblaster.damage, 'Ink splash landed.', 'Inkblaster dropped the enemy.')
          }

          const result = tickEnemy(
            enemyRef.current,
            {
              position: positionRef.current,
              radius: 0.4,
              health: practiceSettingsRef.current.damageEnabled ? playerHealthRef.current : 999
            },
            delta * 1000,
            enemyConfigs[enemyRef.current.type]
          )
          enemyRef.current = result.enemy

          if (practiceSettingsRef.current.damageEnabled && result.player.health !== playerHealthRef.current) {
            playerHealthRef.current = result.player.health
            setPlayerHealth(result.player.health)
          }

          for (const event of result.events) {
            if (event.type === 'enemyAttackStarted') {
              setStatus('Enemy windup. Backpedal or sidestep.')
            }

            if (event.type === 'enemyAttackHit') {
              setStatus(`Enemy hit for ${event.damage}.`)
            }

            if (event.type === 'enemyAttackMissed') {
              setStatus('Enemy missed.')
            }
          }

          if (practiceSettingsRef.current.damageEnabled && result.player.health === 0) {
            finishRun()
          }

          const activePressure = enemyRef.current.state === 'dead' ? 0 : 1
          const directorTick = tickDirector(
            directorRef.current,
            0,
            activePressure,
            positionRef.current,
            undefined,
            { cadenceScale: 1 / practiceSettingsRef.current.spawnRate }
          )
          directorRef.current = directorTick.state

          if (directorTick.spawn && enemyRef.current.state === 'dead' && enemyRef.current.animationTimeMs > 800) {
            const nextType = practiceEnemyTypeForSpawn(
              applyDailySpawnOffset(directorRef.current.spawnCount, dailyConfig),
              practiceSettingsRef.current,
              isPractice
            )
            enemyRef.current = createEnemy(
              nextType,
              `${nextType}-${directorRef.current.spawnCount}`,
              directorTick.spawn.door.position,
              positionRef.current
            )
            setEnemyHealth(enemyRef.current.health)
            setEnemyType(enemyRef.current.type)
            setStatus(`${enemyLabel(enemyRef.current.type)} entered from ${directorTick.spawn.door.id}.`)
          }
        }
      }

      runtime.camera.position.set(positionRef.current.x, positionRef.current.y, positionRef.current.z)
      runtime.camera.rotation.set(pitchRef.current, yawRef.current, 0)
      runtime.muzzleLight.position.copy(runtime.camera.position)
      runtime.muzzleLight.intensity = Math.max(0, runtime.muzzleLight.intensity - delta * 22)
      tickShotBolts(runtime, shotBolts, delta * 1000)
      const enemy = enemyRef.current
      const animation = animationForEnemyState(enemy.state)

      if (enemy.state !== 'hurt') {
        runtime.enemyMaterial.color.set(enemyConfigs[enemy.type].tint)
      }

      const bucket = angleToPlayerBucket(enemy.position, enemy.facingAngle, positionRef.current)
      const angle = angleToPlayerName(enemy.position, enemy.facingAngle, positionRef.current)
      applyEnemyFrame(runtime, atlasRef.current, animation, angle, enemy.animationTimeMs)
      runtime.enemyMesh.position.set(enemy.position.x, enemy.position.y, enemy.position.z)
      runtime.enemyMesh.scale.setScalar(enemyConfigs[enemy.type].scale)
      runtime.enemyMesh.lookAt(runtime.camera.position)
      runtime.enemyFacingArrow.position.set(enemy.position.x, 0.08, enemy.position.z)
      runtime.enemyFacingArrow.setDirection(new THREE.Vector3(Math.cos(enemy.facingAngle), 0, Math.sin(enemy.facingAngle)))
      dummyMarker.position.set(enemy.position.x, 0.04, enemy.position.z)
      dummyMarker.rotation.z += delta * 1.4
      dummyMarker.visible = enemy.state !== 'dead'
      runtime.enemyMesh.visible = enemy.state !== 'dead' || enemy.animationTimeMs < 1000
      runtime.enemyFacingArrow.visible = runningRef.current && practiceSettingsRef.current.debugOverlays
      setDebug((current) => {
        if (current.angle === angle && current.bucket === bucket && current.animation === animation) {
          return current
        }

        return { angle, bucket, animation }
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
      clearInkProjectiles(runtimeRef.current, inkProjectiles)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      runtimeRef.current = null
    }
  }, [dailyConfig, damageCurrentEnemy, finishRun, isPractice])

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
      {running ? (
        <div className="hud" data-testid="hud">
          <div className="hud-pill">
            Health
            <strong>{playerHealth}</strong>
          </div>
          <div className="hud-pill">
            Weapon
            <strong>{weaponConfigs[selectedWeapon].label}</strong>
          </div>
          <div className="hud-pill">
            Ammo
            <strong>{weaponAmmoLabel(selectedWeapon, weaponAmmo)}</strong>
          </div>
          <div className="hud-pill">
            Score
            <strong>{score}</strong>
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
            {summary ? (
              <div className="summary" data-testid="run-summary">
                <p>Score {summary.score}</p>
                <p>Kills {summary.kills}</p>
                <p>Time {formatTime(summary.survivalMs)}</p>
                <p>Accuracy {Math.round(summary.accuracy * 100)}%</p>
                <p>Best combo {summary.bestCombo}</p>
              </div>
            ) : isPractice ? (
              <p>Practice room. Tune the run, test weapons, and rehearse pressure without score submission.</p>
            ) : (
              <p>Daily seed {seed}. One room. Endless pressure. Move fast, aim clean, and stay alive.</p>
            )}
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
      <div className="weapon" aria-hidden="true" />
      <div className="status-line" data-testid="status-line">
        {status}
      </div>
    </main>
  )
}

function createRoom() {
  const group = new THREE.Group()
  const floorMaterial = new THREE.MeshStandardMaterial({ color: '#242424', roughness: 0.94 })
  const wallMaterial = new THREE.MeshStandardMaterial({ color: '#4a4740', roughness: 0.9 })
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: '#50d1c0',
    emissive: '#123d39',
    roughness: 0.72
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

  const altar = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.6, 0.45, 24), accentMaterial)
  altar.position.set(0, 0.22, 0)
  altar.receiveShadow = true
  group.add(altar)

  const clock = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.045, 12, 60), accentMaterial)
  clock.position.set(0, 2.4, 9.8)
  group.add(clock)

  const furnaceLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.7, 1.4), dangerMaterial)
  furnaceLeft.position.set(9.8, 1, -1)
  group.add(furnaceLeft)

  const furnaceRight = furnaceLeft.clone()
  furnaceRight.position.z = 1
  group.add(furnaceRight)

  return group
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
    const material = runtime.hazardMeshes[hazard.kind].material as THREE.MeshBasicMaterial
    material.opacity = opacityForHazardPhase(hazard.phase)
    runtime.hazardMeshes[hazard.kind].visible = hazard.phase !== 'idle'
  })
}

function opacityForHazardPhase(phase: HazardPhase): number {
  if (phase === 'active') {
    return 0.58
  }

  if (phase === 'warning') {
    return 0.22
  }

  return 0
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
  bolts.push({
    mesh,
    direction: travelDirection,
    remainingDistance: Math.max(0.35, distance - 0.55),
    ttlMs: hit ? 120 : 180
  })
}

function tickShotBolts(runtime: RuntimeRefs, bolts: ShotBolt[], deltaMs: number) {
  for (let index = bolts.length - 1; index >= 0; index -= 1) {
    const bolt = bolts[index]
    const step = Math.min(bolt.remainingDistance, deltaMs * 0.075)
    bolt.mesh.position.addScaledVector(bolt.direction, step)
    bolt.remainingDistance -= step
    bolt.ttlMs -= deltaMs
    bolt.mesh.material.opacity = Math.max(0, Math.min(0.92, bolt.ttlMs / 120))

    if (bolt.remainingDistance <= 0 || bolt.ttlMs <= 0) {
      runtime.shotGroup.remove(bolt.mesh)
      bolt.mesh.geometry.dispose()
      bolt.mesh.material.dispose()
      bolts.splice(index, 1)
    }
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

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 16, 16),
    new THREE.MeshBasicMaterial({
      color: '#50d1c0',
      transparent: true,
      opacity: 0.88
    })
  )
  mesh.position.copy(start)
  mesh.renderOrder = 5
  runtime.shotGroup.add(mesh)
  projectiles.push({
    mesh,
    direction: travelDirection,
    remainingDistance: 16,
    damage,
    splashRadius: 0.95
  })
}

function tickInkProjectiles(
  runtime: RuntimeRefs,
  projectiles: InkProjectile[],
  enemy: EnemyModel,
  deltaMs: number
): number {
  let hits = 0

  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = projectiles[index]
    const step = Math.min(projectile.remainingDistance, deltaMs * 0.028)
    projectile.mesh.position.addScaledVector(projectile.direction, step)
    projectile.remainingDistance -= step

    const enemyDistance = Math.hypot(
      projectile.mesh.position.x - enemy.position.x,
      projectile.mesh.position.z - enemy.position.z
    )
    const hitEnemy = enemy.state !== 'dead' && enemyDistance <= enemy.radius + projectile.splashRadius

    if (hitEnemy || projectile.remainingDistance <= 0) {
      if (hitEnemy) {
        hits += 1
      }

      runtime.shotGroup.remove(projectile.mesh)
      projectile.mesh.geometry.dispose()
      projectile.mesh.material.dispose()
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

    runtime?.shotGroup.remove(projectile.mesh)
    projectile.mesh.geometry.dispose()
    projectile.mesh.material.dispose()
  }
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
    enemyTypes: ['grunt', 'skitter', 'brute'],
    spawnRate: 1,
    infiniteAmmo: false,
    damageEnabled: true,
    debugOverlays: true
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
    debugOverlays: settings.debugOverlays
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

  return 'Grunt'
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

async function loadGruntAtlas() {
  const atlasResponse = await fetch('/assets/enemies/grunt/grunt.atlas.json')
  const atlas = await atlasResponse.json() as SpriteAtlas
  const texture = await new THREE.TextureLoader().loadAsync(`/assets/enemies/grunt/${atlas.image}`)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping

  return { atlas, texture }
}

function applyEnemyFrame(
  runtime: RuntimeRefs,
  atlas: SpriteAtlas | null,
  animationName: AnimationName,
  angle: BillboardAngle,
  timeMs: number
) {
  if (!atlas || !runtime.enemyTexture) {
    return
  }

  const clip = selectAnimationClip(atlas, animationName, angle)
  const frame = selectSpriteFrame(clip, timeMs)
  const transform = frameToUvTransform(frame, atlas.imageWidth, atlas.imageHeight)
  runtime.enemyTexture.repeat.set(transform.repeatX, transform.repeatY)
  runtime.enemyTexture.offset.set(transform.offsetX, transform.offsetY)
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
