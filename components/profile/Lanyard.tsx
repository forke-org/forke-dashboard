/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

/* eslint-disable react/no-unknown-property */
/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, extend, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture, Environment, Lightformer, Html } from '@react-three/drei'
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  RigidBodyProps,
} from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import { RefreshCw } from 'lucide-react'
import * as THREE from 'three'
import { QRCodeSVG } from 'qrcode.react'

extend({ MeshLineGeometry, MeshLineMaterial })

// Assets live in /public so Next can serve them without webpack .glb config.
const CARD_GLB = '/lanyard/card.glb'
const LANYARD_PNG = '/lanyard/lanyard.png'
const FORKY_BACK = '/forke-assets/forky_clean_transparent.png'

useGLTF.preload(CARD_GLB)

export interface LanyardCard {
  name: string
  username?: string | null
  level: number
  title: string
  headline?: string | null
  avatarUrl?: string | null
}

interface LanyardProps {
  position?: [number, number, number]
  gravity?: [number, number, number]
  fov?: number
  transparent?: boolean
  className?: string
  card?: LanyardCard
  qrUrl?: string
  isHome?: boolean
}

export default function Lanyard({
  position,
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  className = '',
  card,
  qrUrl,
  isHome = false,
}: LanyardProps) {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  )
  const [flipped, setFlipped] = useState(false)
  const flipRef = useRef(false) // read inside the render loop without stale closures

  useEffect(() => {
    const handleResize = (): void => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleFlip = () => {
    flipRef.current = !flipRef.current
    setFlipped(flipRef.current)
  }

  const finalPosition = position || (isMobile ? [0, -2, 14.5] : [0, -2, 20])

  return (
    <div className={`relative z-0 w-full h-full flex justify-center items-center ${className}`}>
      <Canvas
        camera={{ position: finalPosition, fov }}
        dpr={[1, isMobile ? 2 : 3]}
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
        style={{ background: 'transparent' }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0)
          gl.setClearAlpha(0)
          scene.background = null
        }}
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band isMobile={isMobile} card={card} qrUrl={qrUrl} isHome={isHome} flipRef={flipRef} />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>

      {!isHome && (
        <button
          onClick={toggleFlip}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 h-9 px-4 rounded-full bg-white/[0.06] border border-white/15 hover:bg-white/[0.12] hover:border-white/25 backdrop-blur text-xs font-bold text-white/85 hover:text-white transition-colors flex items-center gap-2 cursor-pointer shadow-lg"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {flipped ? 'Show front' : 'Flip card'}
        </button>
      )}
    </div>
  )
}

interface BandProps {
  maxSpeed?: number
  minSpeed?: number
  isMobile?: boolean
  card?: LanyardCard
  flipRef?: React.MutableRefObject<boolean>
  qrUrl?: string
  isHome?: boolean
}

// ---- HTML face sizing ----
const FACE_W = 380 // px (card art is rendered as real DOM at this width)
const FACE_H = 536 // px
// drei <Html transform> renders px much smaller than 1 world unit, so the raw
// place.w/FACE_W ratio comes out ~40× too small. This fudge sizes the DOM card
// to fill the model card — bump it up/down if the card looks too big/small.
const FACE_FUDGE = 48
const FACE_OFFSET = 0.04 // how far each DOM face sits off the body (avoids occlusion clipping)

function Band({ minSpeed = 0, maxSpeed = 50, isMobile = false, card, flipRef, qrUrl, isHome = false }: BandProps) {
  const band = useRef<any>(null)
  const fixed = useRef<any>(null)
  const j1 = useRef<any>(null)
  const j2 = useRef<any>(null)
  const j3 = useRef<any>(null)
  const cardRef = useRef<any>(null)
  const bodyRef = useRef<any>(null)

  const frontHtmlRef = useRef<HTMLDivElement>(null)
  const backHtmlRef = useRef<HTMLDivElement>(null)

  const ang = new THREE.Vector3()
  const quat = new THREE.Quaternion()
  const euler = new THREE.Euler()

  const segmentProps: any = {
    type: 'dynamic' as RigidBodyProps['type'],
    canSleep: true,
    colliders: false,
    angularDamping: 3,
    linearDamping: 3,
  }

  const { nodes, materials } = useGLTF(CARD_GLB) as any
  const texture = useTexture(LANYARD_PNG)

  // The model card's bounding box, mapped into the RigidBody's local space
  // (the visual card lives in a group scaled 2.25 at [0,-1.2,-0.05]).
  const place = useMemo(() => {
    const geo = nodes.card.geometry
    geo.computeBoundingBox()
    const bb = geo.boundingBox as THREE.Box3
    const c = new THREE.Vector3(); bb.getCenter(c)
    const s = new THREE.Vector3(); bb.getSize(s)
    const S = 2.25
    return {
      cx: S * c.x,
      cy: -1.2 + S * c.y,
      cz: -0.05 + S * c.z,
      w: S * s.x,
      h: S * s.y,
      d: S * s.z,
    }
  }, [nodes])

  // Scale that maps the FACE_W-px DOM onto the card's world width.
  const htmlScale = (place.w / FACE_W) * FACE_FUDGE

  const [curve] = useState(
    () => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  )

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])
  useSphericalJoint(j3, cardRef, [
    [0, 0, 0],
    [0, 1.45, 0],
  ])

  useFrame((state, delta) => {
    if (!fixed.current || !cardRef.current) return

      // Relax band joints toward rest, then redraw the woven strap.
      ;[j1, j2].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation())
        if (!isHome) {
          const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())))
          ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)))
        }
      })
    curve.points[0].copy(j3.current.translation())
    curve.points[1].copy(j2.current.lerped)
    curve.points[2].copy(j1.current.lerped)
    curve.points[3].copy(fixed.current.translation())
    band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32))

    // The x/z sway is fully physics-driven, so it swings in on load and damps to
    // rest like a real badge. Only the y-facing is steered: toward 0° (front) by
    // default, or 180° (back) when the flip button is toggled — a one-shot,
    // ease-to-target turn that then holds still.
    const r = cardRef.current.rotation()
    quat.set(r.x, r.y, r.z, r.w)
    euler.setFromQuaternion(quat, 'YXZ')

    if (!isHome) {
      const targetY = flipRef?.current ? Math.PI : 0
      let err = targetY - euler.y
      err = Math.atan2(Math.sin(err), Math.cos(err)) // shortest path
      ang.copy(cardRef.current.angvel())
      cardRef.current.setAngvel({ x: ang.x, y: err * 4, z: ang.z })
    }

    // Mathematical camera dot-product normal-check for high-performance visibility toggling
    if (frontHtmlRef.current && backHtmlRef.current) {
      const translation = cardRef.current.translation()
      const localNormal = new THREE.Vector3(0, 0, 1)
      const worldNormal = localNormal.applyQuaternion(quat)

      // Vector from card center to camera
      const toCamera = new THREE.Vector3()
        .copy(state.camera.position)
        .sub(new THREE.Vector3(translation.x, translation.y, translation.z))
        .normalize()

      const dot = worldNormal.dot(toCamera)
      const isFrontFacing = dot > 0

      // Toggle display visibility and pointer-events directly on DOM nodes
      frontHtmlRef.current.style.visibility = isFrontFacing ? 'visible' : 'hidden'
      frontHtmlRef.current.style.pointerEvents = isFrontFacing ? 'auto' : 'none'

      backHtmlRef.current.style.visibility = isFrontFacing ? 'hidden' : 'visible'
      backHtmlRef.current.style.pointerEvents = isFrontFacing ? 'none' : 'auto'
    }
  })

  curve.curveType = 'chordal'
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={isHome ? [0, -0.8, 0] : [0.5, 0, 0]} ref={j1} {...segmentProps} type={isHome ? 'fixed' : 'dynamic'}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={isHome ? [0, -1.6, 0] : [1, 0, 0]} ref={j2} {...segmentProps} type={isHome ? 'fixed' : 'dynamic'}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={isHome ? [0, -2.4, 0] : [1.5, 0, 0]} ref={j3} {...segmentProps} type={isHome ? 'fixed' : 'dynamic'}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={isHome ? [0, -3.85, 0] : [2, 0, 0]} ref={cardRef} {...segmentProps} canSleep={false} type={isHome ? 'fixed' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />

          {/* Physical card body + metal clip from the model (gives depth + the clasp) */}
          <group scale={2.25} position={[0, -1.2, -0.05]}>
            <mesh ref={bodyRef} geometry={nodes.card.geometry}>
              <meshPhysicalMaterial color="#0b0709" roughness={0.85} metalness={0.5} clearcoat={isMobile ? 0 : 0.5} clearcoatRoughness={0.4} />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>

          {/* Real DOM faces (crisp text + fetched <img>), visibility steered dynamically. */}
          {card && (
            <>
              <Html
                transform
                position={[place.cx, place.cy, place.cz + place.d / 2 + FACE_OFFSET]}
                scale={htmlScale}
                zIndexRange={[10, 0]}
                style={{ width: FACE_W, height: FACE_H }}
              >
                <div ref={frontHtmlRef} style={{ width: FACE_W, height: FACE_H, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                  <CardFront card={card} />
                </div>
              </Html>
              <Html
                transform
                position={[place.cx, place.cy, place.cz - place.d / 2 - FACE_OFFSET]}
                rotation={[0, Math.PI, 0]}
                scale={htmlScale}
                zIndexRange={[10, 0]}
                style={{ width: FACE_W, height: FACE_H }}
              >
                <div ref={backHtmlRef} style={{ width: FACE_W, height: FACE_H, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                  <CardBack card={card} qrUrl={qrUrl} />
                </div>
              </Html>
            </>
          )}
        </RigidBody>
      </group>

      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-5, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  )
}

/* ----------------------------- DOM card faces ----------------------------- */

// Editorial portrait card: black face with a tilted oval portrait, an oversized
// thin two-line name, role, and footer meta.
function CardFront({ card }: { card: LanyardCard }) {
  const initial = (card.name?.[0] || 'F').toUpperCase()
  const rawHeadline = card.headline || 'Real, verified work.'
  const headline = rawHeadline.length > 25 ? `${rawHeadline.slice(0, 25)}...` : rawHeadline
  return (
    <div style={{ width: FACE_W, height: FACE_H, fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif' }} className="relative bg-[#0a0a0a] rounded-[28px] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.6)] select-none flex flex-col">

      {/* Header: dots + URL */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-[6px] h-[13px] rounded-full bg-white" style={{ transform: 'rotate(25deg)' }} />
          <span className="w-[6px] h-[13px] rounded-full bg-white" style={{ transform: 'rotate(25deg)' }} />
          <span className="w-[6px] h-[13px] rounded-full bg-white" style={{ transform: 'rotate(25deg)' }} />
        </div>
        <span className="text-[#ff8a00] text-[15px] tracking-tight">forke.space</span>
      </div>
      <div className="h-px bg-white/20" />

      {/* Tall tilted capsule portrait — slanted right like the indicators */}
      <div className="relative flex-1">
        <div
          className="absolute left-1/2 top-1/2 w-[72%] h-[94%]"
          style={{ transform: 'translate(-50%, -50%) rotate(25deg)' }}
        >
          {/* the photo is clipped to a vertical pill/capsule and counter-rotated upright */}
          <div
            className="w-full h-full bg-[#161616] flex items-center justify-center rounded-full overflow-hidden"
          >
            {card.avatarUrl ? (
              <img
                src={card.avatarUrl}
                alt={card.name}
                className="w-full h-full object-cover"
                style={{ transform: 'rotate(-25deg) scale(1.4)' }}
                draggable={false}
              />
            ) : (
              <span className="text-[120px] font-light text-white/80" style={{ transform: 'rotate(-25deg)' }}>{initial}</span>
            )}
          </div>
        </div>

        {/* Oversized editorial serif stacked name overlapping the portrait bottom-left */}
        <div className="absolute left-6 z-10 max-w-[85%]" style={{ bottom: '-44px' }}>
          {(() => {
            // First + last name only (drop middle names); single name as-is.
            const nameParts = (card.name || 'Forke').trim().split(/\s+/).filter(Boolean)
            const firstName = nameParts[0] || 'Forke'
            const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
            const maxPartLength = Math.max(firstName.length, lastName.length)
            const fontSize = maxPartLength > 15 ? '32px' : maxPartLength > 10 ? '42px' : '52px'
            return (
              <h2
                className="text-white italic leading-[0.8] tracking-tight"
                style={{ fontSize, fontFamily: 'var(--font-instrument-serif), Georgia, serif' }}
              >
                <div>{firstName}</div>
                {lastName && <div className="opacity-95">{lastName}</div>}
              </h2>
            )
          })()}
        </div>
      </div>

      {/* Role line (right-aligned) */}
      <div className="px-6 pt-3 pb-3 flex items-end justify-end">
        <span className="text-white/85 text-[19px] tracking-tight">{card.title}</span>
      </div>
      <div className="h-px bg-white/20 mx-6" />

      {/* Identity row: level/headline + handle */}
      <div className="px-6 py-4 flex items-start justify-between gap-3">
        <div className="leading-snug min-w-0">
          <p className="text-white text-[15px] tracking-tight">Level {card.level} Builder</p>
          <p className="text-white/65 text-[14px] tracking-tight truncate">{headline}</p>
        </div>
        <span className="text-[#ff8a00] text-[18px] tracking-tight whitespace-nowrap">@{card.username || 'forke'}</span>
      </div>
      <div className="h-px bg-white/20 mx-6" />
      <div className="h-3" />
    </div>
  )
}

// Back face: same black card + dots/URL header, then just the white Forky mark,
// the @handle and the "Developer Network" tagline centered — no oval, no footer.
function CardBack({ card, qrUrl }: { card: LanyardCard; qrUrl?: string }) {
  const profileUrl = qrUrl || (typeof window !== 'undefined'
    ? `${window.location.origin}/${card.username || 'forke'}`
    : `https://www.forke.space/${card.username || 'forke'}`)

  return (
    <div style={{ width: FACE_W, height: FACE_H, fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif' }} className="relative bg-[#0a0a0a] rounded-[28px] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.6)] select-none flex flex-col">
      <style>{`
        .lanyard-qr image {
          filter: brightness(0) invert(1);
        }
      `}</style>

      {/* Header: dots + URL */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-[6px] h-[13px] rounded-full bg-white" style={{ transform: 'rotate(25deg)' }} />
          <span className="w-[6px] h-[13px] rounded-full bg-white" style={{ transform: 'rotate(25deg)' }} />
          <span className="w-[6px] h-[13px] rounded-full bg-white" style={{ transform: 'rotate(25deg)' }} />
        </div>
        <span className="text-[#ff8a00] text-[15px] tracking-tight">forke.space</span>
      </div>
      <div className="h-px bg-white/20" />

      {/* Centered QR code + handle + tagline */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
        <QRCodeSVG
          value={profileUrl}
          size={220}
          bgColor="#0a0a0a"
          fgColor="#ffffff"
          level="H"
          imageSettings={{
            src: FORKY_BACK,
            height: 60,
            width: 60,
            excavate: true,
          }}
          className="lanyard-qr"
        />
        <div className="text-center">
          <h2 className="text-white font-light leading-none tracking-tight" style={{ fontSize: '38px' }}>
            @{card.username || 'forke'}
          </h2>
          <p className="text-[#ff8a00] text-[15px] tracking-[0.25em] uppercase mt-3">Developer Network</p>
        </div>
      </div>
    </div>
  )
}

