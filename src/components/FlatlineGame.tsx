'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { angleToPlayerBucket, angleToPlayerName, type BillboardAngle } from '@/game/billboard'
import { createGrunt, damageEnemy, gruntConfig, tickEnemy, type EnemyModel } from '@/game/enemies'
import { updatePlayerPosition } from '@/game/movement'
import { accuracy, createScoreState, finalScore, recordKill, recordShot, type ScoreState } from '@/game/scoring'
import { fireHitscan, forwardFromYawPitch } from '@/game/shooting'
import { createDirectorState, tickDirector, type DirectorState } from '@/game/spawnDirector'
import { frameToUvTransform, selectAnimationClip, selectSpriteFrame, type AnimationName, type SpriteAtlas } from '@/game/spriteAtlas'
import type { MovementInput, SphereTarget, Vec3 } from '@/game/types'
import { dailySeed } from '@/lib/dailySeed'
import { insertLeaderboardEntry, readLeaderboard, writeLeaderboard, type LeaderboardEntry } from '@/lib/leaderboard'
import { dailyDateKey, type LeaderboardScope, type RankedLeaderboardEntry, type SharedLeaderboardResponse } from '@/lib/sharedLeaderboard'

const cameraHeight = 1.7
const initialPlayerPosition: Vec3 = { x: 0, y: cameraHeight, z: -5.5 }
const movementConfig = {
  speed: 6.8,
  bounds: {
    minX: -8.5,
    maxX: 8.5,
    minZ: -8.5,
    maxZ: 8.5
  }
}

type RuntimeRefs = {
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  scene: THREE.Scene
  enemyMaterial: THREE.MeshBasicMaterial
  enemyTexture: THREE.Texture | null
  enemyMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  enemyFacingArrow: THREE.ArrowHelper
  muzzleLight: THREE.PointLight
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
}

export function FlatlineGame({ initialLeaderboardScope = 'all' }: FlatlineGameProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const runtimeRef = useRef<RuntimeRefs | null>(null)
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const positionRef = useRef<Vec3>({ ...initialPlayerPosition })
  const yawRef = useRef<number>(0)
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
  const atlasRef = useRef<SpriteAtlas | null>(null)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [hits, setHits] = useState(0)
  const [playerHealth, setPlayerHealth] = useState(100)
  const [enemyHealth, setEnemyHealth] = useState(3)
  const [score, setScore] = useState(0)
  const [kills, setKills] = useState(0)
  const [runMs, setRunMs] = useState(0)
  const [healthPickupReady, setHealthPickupReady] = useState(true)
  const [summary, setSummary] = useState<RunSummary | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() =>
    typeof window === 'undefined' ? [] : readLeaderboard(window.localStorage)
  )
  const [settings, setSettings] = useState<Settings>(() => loadInitialSettings())
  const [seed] = useState(() => dailySeed())
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

  const fire = useCallback(() => {
    if (!runningRef.current || runtimeRef.current === null) {
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
    const hit = fireHitscan(
      positionRef.current,
      forwardFromYawPitch(yawRef.current, pitchRef.current),
      targets,
      18
    )

    runtimeRef.current.muzzleLight.intensity = 4.5
    playCue(180, settingsRef.current.audio)

    scoreRef.current = recordShot(scoreRef.current, Boolean(hit))

    if (hit) {
      const wasAlive = enemyRef.current.state !== 'dead'
      enemyRef.current = damageEnemy(enemyRef.current, 1)
      setEnemyHealth(enemyRef.current.health)
      setHits((value) => value + 1)

      if (wasAlive && enemyRef.current.state === 'dead') {
        scoreRef.current = recordKill(scoreRef.current, directorRef.current.runMs)
        setScore(scoreRef.current.score)
        setKills(scoreRef.current.kills)
        playCue(90, settingsRef.current.audio)
      } else {
        playCue(320, settingsRef.current.audio)
      }

      setStatus(enemyRef.current.state === 'dead' ? 'Billboard enemy dropped.' : 'Billboard enemy hurt.')
      runtimeRef.current.enemyMaterial.color.set('#f05a4f')
    } else {
      setStatus('Shot missed. Aim at the target dummy.')
    }
  }, [])

  const startRun = useCallback(() => {
    positionRef.current = { ...initialPlayerPosition }
    yawRef.current = 0
    pitchRef.current = 0
    playerHealthRef.current = 100
    directorRef.current = createDirectorState()
    scoreRef.current = createScoreState()
    enemyRef.current = createGrunt('grunt-1', { x: 0, y: 1.05, z: 3.5 }, initialPlayerPosition)
    healthPickupReadyRef.current = true
    healthPickupCooldownRef.current = 0
    runningRef.current = true
    pausedRef.current = false
    setRunning(true)
    setPaused(false)
    setSummary(null)
    setHits(0)
    setPlayerHealth(100)
    setEnemyHealth(3)
    setScore(0)
    setKills(0)
    setRunMs(0)
    setHealthPickupReady(true)
    setStatus('WASD moves. Mouse aims. Left click fires.')
    requestPointerLock(runtimeRef.current?.renderer.domElement)
  }, [])

  const finishRun = useCallback(() => {
    const runSummary = {
      score: finalScore(scoreRef.current, directorRef.current.runMs),
      survivalMs: directorRef.current.runMs,
      kills: scoreRef.current.kills,
      accuracy: accuracy(scoreRef.current),
      bestCombo: scoreRef.current.bestCombo
    }
    setSummary(runSummary)

    if (typeof window !== 'undefined') {
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
    setStatus('Flatlined.')
  }, [])

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

  const fetchSharedLeaderboard = useCallback(async (scope: LeaderboardScope) => {
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
  }, [dailyDate])

  const switchSharedScope = useCallback((scope: LeaderboardScope) => {
    setSharedScope(scope)
    setSharedStatus('loading')
    fetchSharedLeaderboard(scope)
  }, [fetchSharedLeaderboard])

  const submitSharedScore = useCallback(async () => {
    if (!summary || submitStatus === 'submitting') {
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
  }, [dailyDate, initials, sharedScope, submitStatus, summary])

  useEffect(() => {
    const mount = mountRef.current

    if (!mount) {
      return
    }

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
      enemyMaterial,
      enemyTexture: null,
      enemyMesh,
      enemyFacingArrow,
      muzzleLight
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

          if (!healthPickupReadyRef.current) {
            healthPickupCooldownRef.current = Math.max(0, healthPickupCooldownRef.current - delta * 1000)

            if (healthPickupCooldownRef.current === 0) {
              healthPickupReadyRef.current = true
              setHealthPickupReady(true)
            }
          }

          if (
            healthPickupReadyRef.current &&
            playerHealthRef.current < 100 &&
            Math.hypot(positionRef.current.x, positionRef.current.z) <= 1.35
          ) {
            playerHealthRef.current = Math.min(100, playerHealthRef.current + 15)
            healthPickupReadyRef.current = false
            healthPickupCooldownRef.current = 9000
            setPlayerHealth(playerHealthRef.current)
            setHealthPickupReady(false)
            setStatus('Health pickup collected.')
            playCue(520, settingsRef.current.audio)
          }

          const result = tickEnemy(
            enemyRef.current,
            {
              position: positionRef.current,
              radius: 0.4,
              health: playerHealthRef.current
            },
            delta * 1000,
            gruntConfig
          )
          enemyRef.current = result.enemy

          if (result.player.health !== playerHealthRef.current) {
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

          if (result.player.health === 0) {
            finishRun()
          }

          const activePressure = enemyRef.current.state === 'dead' ? 0 : 1
          const directorTick = tickDirector(
            directorRef.current,
            0,
            activePressure,
            positionRef.current
          )
          directorRef.current = directorTick.state

          if (directorTick.spawn && enemyRef.current.state === 'dead' && enemyRef.current.animationTimeMs > 800) {
            enemyRef.current = createGrunt(
              `grunt-${directorRef.current.spawnCount}`,
              directorTick.spawn.door.position,
              positionRef.current
            )
            setEnemyHealth(enemyRef.current.health)
            setStatus(`Spawn door ${directorTick.spawn.door.id} opened.`)
          }
        }
      }

      runtime.camera.position.set(positionRef.current.x, positionRef.current.y, positionRef.current.z)
      runtime.camera.rotation.set(pitchRef.current, yawRef.current, 0)
      runtime.muzzleLight.position.copy(runtime.camera.position)
      runtime.muzzleLight.intensity = Math.max(0, runtime.muzzleLight.intensity - delta * 22)
      const enemy = enemyRef.current
      const animation = animationForEnemyState(enemy.state)

      if (enemy.state !== 'hurt') {
        runtime.enemyMaterial.color.set('#ffffff')
      }

      const bucket = angleToPlayerBucket(enemy.position, enemy.facingAngle, positionRef.current)
      const angle = angleToPlayerName(enemy.position, enemy.facingAngle, positionRef.current)
      applyEnemyFrame(runtime, atlasRef.current, animation, angle, enemy.animationTimeMs)
      runtime.enemyMesh.position.set(enemy.position.x, enemy.position.y, enemy.position.z)
      runtime.enemyMesh.lookAt(runtime.camera.position)
      runtime.enemyFacingArrow.position.set(enemy.position.x, 0.08, enemy.position.z)
      runtime.enemyFacingArrow.setDirection(new THREE.Vector3(Math.cos(enemy.facingAngle), 0, Math.sin(enemy.facingAngle)))
      dummyMarker.position.set(enemy.position.x, 0.04, enemy.position.z)
      dummyMarker.rotation.z += delta * 1.4
      dummyMarker.visible = enemy.state !== 'dead'
      runtime.enemyMesh.visible = enemy.state !== 'dead' || enemy.animationTimeMs < 1000
      runtime.enemyFacingArrow.visible = runningRef.current
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

      renderer.dispose()
      mount.removeChild(renderer.domElement)
      runtimeRef.current = null
    }
  }, [finishRun])

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
            Ammo
            <strong>Inf</strong>
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
            <strong>{enemyHealth}</strong>
          </div>
          <div className="hud-pill">
            Hits
            <strong>{hits}</strong>
          </div>
          <div className="hud-pill debug-pill" data-testid="billboard-debug">
            Bucket {debug.bucket}
            <strong>{debug.angle}</strong>
            <span>{debug.animation}</span>
          </div>
          <div className="hud-pill">
            Health
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
            ) : (
              <p>Daily seed {seed}. One room. Endless pressure. Move fast, aim clean, and stay alive.</p>
            )}
            {summary ? (
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
            <SharedLeaderboardPanel
              entries={sharedEntries}
              scope={sharedScope}
              status={sharedStatus}
              onScopeChange={switchSharedScope}
            />
            {leaderboard.length > 0 ? <LocalLeaderboard entries={leaderboard} /> : null}
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
            <SharedLeaderboardPanel
              entries={sharedEntries}
              scope={sharedScope}
              status={sharedStatus}
              onScopeChange={switchSharedScope}
            />
            {leaderboard.length > 0 ? <LocalLeaderboard entries={leaderboard} /> : null}
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
