"use client"

import { useEffect, useRef } from "react"

interface AnimNode {
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

interface Ring {
  cx: number
  cy: number
  r: number
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function buildNodes(w: number, h: number): AnimNode[] {
  return Array.from({ length: 7 }, () => ({
    x:  rand(0, w),
    y:  rand(0, h),
    vx: rand(-0.3, 0.3),
    vy: rand(-0.3, 0.3),
    r:  rand(4, 6),
  }))
}

function buildRings(w: number, h: number): Ring[] {
  return [
    { cx: rand(w * 0.15, w * 0.4),  cy: rand(h * 0.1,  h * 0.35), r: rand(80,  110) },
    { cx: rand(w * 0.55, w * 0.85), cy: rand(h * 0.45, h * 0.7),  r: rand(90,  120) },
    { cx: rand(w * 0.3,  w * 0.65), cy: rand(h * 0.7,  h * 0.9),  r: rand(80,  105) },
  ]
}

export function LoginPanelBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Capture as typed constants so closures below don't lose narrowing
    const cvs: HTMLCanvasElement          = canvas
    const cx:  CanvasRenderingContext2D   = ctx

    let animId = 0
    let W = 0
    let H = 0
    let nodes: AnimNode[] = []
    let rings:  Ring[]    = []

    function resize() {
      const parent = cvs.parentElement
      if (!parent) return
      const { width, height } = parent.getBoundingClientRect()
      cvs.width  = width
      cvs.height = height
      W = width
      H = height
      nodes = buildNodes(W, H)
      rings  = buildRings(W, H)
    }

    function draw() {
      cx.clearRect(0, 0, W, H)

      // ── Dot grid ──────────────────────────────────────
      cx.fillStyle = "rgba(255,255,255,0.15)"
      for (let x = 0; x <= W; x += 40) {
        for (let y = 0; y <= H; y += 40) {
          cx.beginPath()
          cx.arc(x, y, 1, 0, Math.PI * 2)
          cx.fill()
        }
      }

      // ── Faint blueprint rings ──────────────────────────
      cx.lineWidth   = 1
      cx.strokeStyle = "rgba(255,255,255,0.04)"
      for (const ring of rings) {
        cx.beginPath()
        cx.arc(ring.cx, ring.cy, ring.r, 0, Math.PI * 2)
        cx.stroke()
      }

      // ── Node connections ────────────────────────────────
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx   = nodes[i].x - nodes[j].x
          const dy   = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 180) {
            const alpha = (0.3 * (1 - dist / 180)).toFixed(3)
            cx.beginPath()
            cx.strokeStyle = `rgba(74,85,104,${alpha})`
            cx.lineWidth   = 1
            cx.moveTo(nodes[i].x, nodes[i].y)
            cx.lineTo(nodes[j].x, nodes[j].y)
            cx.stroke()
          }
        }
      }

      // ── Glowing nodes ───────────────────────────────────
      for (const n of nodes) {
        const grad = cx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4)
        grad.addColorStop(0,   "rgba(230,50,50,0.35)")
        grad.addColorStop(0.5, "rgba(255,107,53,0.12)")
        grad.addColorStop(1,   "rgba(230,50,50,0)")
        cx.beginPath()
        cx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2)
        cx.fillStyle = grad
        cx.fill()

        cx.beginPath()
        cx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        cx.fillStyle = "rgba(230,50,50,0.6)"
        cx.fill()
      }

      // ── Drift & bounce ──────────────────────────────────
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > W) { n.vx *= -1; n.x = Math.max(0, Math.min(W, n.x)) }
        if (n.y < 0 || n.y > H) { n.vy *= -1; n.y = Math.max(0, Math.min(H, n.y)) }
      }

      animId = requestAnimationFrame(draw)
    }

    resize()
    draw()

    const ro = new ResizeObserver(resize)
    if (cvs.parentElement) ro.observe(cvs.parentElement)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <>
      {/* Animated canvas background */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Blueprint school outline — stroke only, no fill */}
      <svg
        aria-hidden="true"
        width="220"
        height="180"
        viewBox="0 0 220 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          bottom: "80px",
          left: "40px",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        {/* Building body */}
        <rect x="20" y="80" width="180" height="95" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
        {/* Roof */}
        <polyline points="8,82 110,18 212,82" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
        {/* Centre door */}
        <rect x="88" y="130" width="44" height="45" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
        {/* Door knob */}
        <circle cx="126" cy="155" r="2" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        {/* Left window */}
        <rect x="32" y="98" width="38" height="28" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
        <line x1="51" y1="98"  x2="51"  y2="126" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="32" y1="112" x2="70"  y2="112" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        {/* Right window */}
        <rect x="150" y="98" width="38" height="28" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
        <line x1="169" y1="98"  x2="169" y2="126" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="150" y1="112" x2="188" y2="112" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        {/* Flag pole */}
        <line x1="110" y1="18" x2="110" y2="2"  stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <polyline points="110,2 126,8 110,14" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        {/* Ground line */}
        <line x1="0" y1="175" x2="220" y2="175" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      </svg>
    </>
  )
}
