'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { angleToPlayerBucket, angleToPlayerName, type BillboardAngle } from '@/game/billboard'
import { updatePlayerPosition } from '@/game/movement'
import { fireHitscan, forwardFromYawPitch } from '@/game/shooting'
import { frameToUvTransform, selectAnimationClip, selectSpriteFrame, type AnimationName, type SpriteAtlas } from '@/game/spriteAtlas'
import type { MovementInput, SphereTarget, Vec3 } from '@/game/types'

const cameraHeight = 1.7
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

export function FlatlineGame() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const runtimeRef = useRef<RuntimeRefs | null>(null)
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const positionRef = useRef<Vec3>({ x: 0, y: cameraHeight, z: -5.5 })
  const yawRef = useRef<number>(0)
  const pitchRef = useRef<number>(0)
  const keysRef = useRef<MovementInput>({ forward: false, backward: false, left: false, right: false })
  const runningRef = useRef<boolean>(false)
  const enemyAnimationRef = useRef<AnimationName>('idle')
  const enemyAnimationTimeRef = useRef<number>(0)
  const enemyHealthRef = useRef<number>(3)
  const atlasRef = useRef<SpriteAtlas | null>(null)
  const [running, setRunning] = useState(false)
  const [hits, setHits] = useState(0)
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

    const targets: SphereTarget[] = [
      {
        id: 'dummy',
        center: { x: 0, y: 1.35, z: 3.5 },
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

    if (hit) {
      enemyHealthRef.current = Math.max(0, enemyHealthRef.current - 1)
      enemyAnimationRef.current = enemyHealthRef.current === 0 ? 'death' : 'hurt'
      enemyAnimationTimeRef.current = 0
      setHits((value) => value + 1)
      setStatus(enemyHealthRef.current === 0 ? 'Billboard enemy dropped.' : 'Billboard enemy hurt.')
      runtimeRef.current.enemyMaterial.color.set('#f05a4f')
    } else {
      setStatus('Shot missed. Aim at the target dummy.')
    }
  }, [])

  const startRun = useCallback(() => {
    runningRef.current = true
    setRunning(true)
    setStatus('WASD moves. Mouse aims. Left click fires.')
    requestPointerLock(runtimeRef.current?.renderer.domElement)
  }, [])

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

      if (runningRef.current) {
        positionRef.current = updatePlayerPosition(
          positionRef.current,
          yawRef.current,
          keysRef.current,
          delta,
          movementConfig
        )
      }

      runtime.camera.position.set(positionRef.current.x, positionRef.current.y, positionRef.current.z)
      runtime.camera.rotation.set(pitchRef.current, yawRef.current, 0)
      runtime.muzzleLight.position.copy(runtime.camera.position)
      runtime.muzzleLight.intensity = Math.max(0, runtime.muzzleLight.intensity - delta * 22)
      enemyAnimationTimeRef.current += delta * 1000

      if (enemyAnimationRef.current === 'hurt' && enemyAnimationTimeRef.current > 180) {
        enemyAnimationRef.current = 'idle'
        enemyAnimationTimeRef.current = 0
        runtime.enemyMaterial.color.set('#ffffff')
      }

      const enemyPosition = { x: 0, y: 1.05, z: 3.5 }
      const enemyFacingAngle = -Math.PI / 2
      const bucket = angleToPlayerBucket(enemyPosition, enemyFacingAngle, positionRef.current)
      const angle = angleToPlayerName(enemyPosition, enemyFacingAngle, positionRef.current)
      applyEnemyFrame(runtime, atlasRef.current, enemyAnimationRef.current, angle, enemyAnimationTimeRef.current)
      runtime.enemyMesh.lookAt(runtime.camera.position)
      runtime.enemyFacingArrow.setDirection(new THREE.Vector3(0, 0, -1))
      dummyMarker.rotation.z += delta * 1.4
      setDebug((current) => {
        if (current.angle === angle && current.bucket === bucket && current.animation === enemyAnimationRef.current) {
          return current
        }

        return { angle, bucket, animation: enemyAnimationRef.current }
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
  }, [])

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

      yawRef.current -= event.movementX * 0.0024
      pitchRef.current = clamp(pitchRef.current - event.movementY * 0.002, -1.25, 1.25)
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

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onMouseDown)
    document.addEventListener('pointerlockchange', onPointerLockChange)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
    }
  }, [fire])

  return (
    <main className="game-shell">
      <div ref={mountRef} className="render-root" data-testid="render-root" />
      {running ? (
        <div className="hud" data-testid="hud">
          <div className="hud-pill">
            Health
            <strong>100</strong>
          </div>
          <div className="hud-pill">
            Ammo
            <strong>Inf</strong>
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
        </div>
      ) : (
        <section className="start-panel">
          <div className="start-panel-inner">
            <h1>Flatline</h1>
            <p>One room. One target. Move fast, aim clean, and prove the first loop feels right.</p>
            <button className="start-button" type="button" onClick={startRun}>
              Start run
            </button>
          </div>
        </section>
      )}
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
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
