import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardUrl } from "@/lib/auth-utils"
import Image from "next/image"
import Link from "next/link"
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google"
import { LoginPanelBg } from "@/components/auth/LoginPanelBg"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  variable: "--font-playfair-auth",
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-jakarta-auth",
})

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (session?.user) {
    const redirectPath = getDashboardUrl(session.user.role)
    return redirect(redirectPath)
  }

  return (
    <div
      className={`${playfair.variable} ${jakarta.variable} flex min-h-screen`}
      style={{ fontFamily: "var(--font-jakarta-auth, sans-serif)" }}
    >
      <style>{`
        @keyframes auth-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes card-float-1 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes card-float-2 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes card-float-3 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes bar-grow {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0;   }
        }
        @keyframes win-flicker {
          0%,100% { opacity: 0.88; }
          42%      { opacity: 0.72; }
          48%      { opacity: 0.95; }
          54%      { opacity: 0.78; }
          60%      { opacity: 0.92; }
        }
        @keyframes tree-sway {
          0%,100% { transform: rotate(0deg);  }
          50%      { transform: rotate(-2deg); }
        }
        .auth-panel-title { font-family: var(--font-playfair-auth, serif); }
        .auth-form-wrap   { animation: auth-fade-in 0.6s ease-out both 0.1s; }
        .stat-card-1      { animation: card-float-1 4s ease-in-out infinite; }
        .stat-card-2      { animation: card-float-2 5s ease-in-out 0.8s infinite; }
        .stat-card-3      { animation: card-float-3 4.5s ease-in-out 1.6s infinite; }
        .bar-anim         { animation: bar-grow 1.2s ease-out both; transform-origin: bottom; }
        .pulse-ring       { animation: pulse-ring 2s ease-out infinite; }
        .win-a { animation: win-flicker 4.0s ease-in-out infinite; }
        .win-b { animation: win-flicker 4.0s ease-in-out 0.7s  infinite; }
        .win-c { animation: win-flicker 4.0s ease-in-out 1.4s  infinite; }
        .win-d { animation: win-flicker 4.0s ease-in-out 2.1s  infinite; }
        .win-e { animation: win-flicker 4.0s ease-in-out 2.8s  infinite; }
        .win-f { animation: win-flicker 4.0s ease-in-out 0.35s infinite; }
        .win-g { animation: win-flicker 4.0s ease-in-out 1.05s infinite; }
        .win-h { animation: win-flicker 4.0s ease-in-out 1.75s infinite; }
        .tree-sway { animation: tree-sway 6s ease-in-out infinite; transform-origin: 150px 530px; }
      `}</style>

      {/* ── Left brand panel ─────────────────────────────── */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex lg:w-5/12 xl:w-[42%]"
        style={{ background: "linear-gradient(155deg, #09112b 0%, #121f42 50%, #0d1730 100%)" }}
      >
        {/* Animated tech-pattern canvas + blueprint SVG */}
        <LoginPanelBg />

        {/* Top accent line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5" style={{ zIndex: 2,
             background: "linear-gradient(90deg, transparent, #DC2626 40%, #F97316 60%, transparent)" }} />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/login">
            <Image src="/logo.png" alt="SikshaMitra" width={160} height={40} className="h-11 w-auto" />
          </Link>
        </div>

        {/* ── Isometric School Illustration ── */}
        <div className="relative z-10 flex-1 flex items-center justify-center py-4">
          <div className="relative w-full" style={{ maxWidth: "340px" }}>

            {/* Isometric SVG — viewBox 600×700, scaled to fit panel */}
            <svg
              viewBox="0 0 600 700"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
              style={{ filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.5))" }}
            >
              <defs>
                {/* Sky radial glow behind building */}
                <radialGradient id="ig-sky" cx="47%" cy="45%" r="55%">
                  <stop offset="0%"   stopColor="#1e3a8a" stopOpacity="0.45"/>
                  <stop offset="100%" stopColor="#0a0f2e" stopOpacity="0"/>
                </radialGradient>
                {/* Ground gradient */}
                <linearGradient id="ig-ground" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#1a3a2a"/>
                  <stop offset="100%" stopColor="#0d1e14"/>
                </linearGradient>
                {/* Front wall face gradient (lit side) */}
                <linearGradient id="ig-wall-front" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"   stopColor="#1e2865"/>
                  <stop offset="100%" stopColor="#1a2151"/>
                </linearGradient>
                {/* Side wall face gradient (shadow side) */}
                <linearGradient id="ig-wall-side" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#111538"/>
                  <stop offset="100%" stopColor="#0e1230"/>
                </linearGradient>
                {/* Roof front gradient */}
                <linearGradient id="ig-roof-front" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#e74c3c"/>
                  <stop offset="100%" stopColor="#c0392b"/>
                </linearGradient>
                {/* Window warm glow */}
                <radialGradient id="ig-win-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#f39c12" stopOpacity="0.9"/>
                  <stop offset="100%" stopColor="#e67e22" stopOpacity="0.5"/>
                </radialGradient>
                {/* Window glow filter */}
                <filter id="ig-glow-f" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* ── Sky glow ── */}
              <ellipse cx="300" cy="380" rx="260" ry="210" fill="url(#ig-sky)"/>

              {/* ── Ground plane ──
                  Building front corner A sits at (280,460).
                  Ground extends around and below. */}
              <polygon
                points="80,510 280,440 480,530 480,700 80,700"
                fill="url(#ig-ground)"
              />
              {/* Subtle ground grid lines */}
              <line x1="80"  y1="510" x2="280" y2="440" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
              <line x1="280" y1="440" x2="480" y2="530" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
              <line x1="160" y1="555" x2="360" y2="475" stroke="rgba(255,255,255,0.02)" strokeWidth="0.8"/>
              <line x1="240" y1="595" x2="440" y2="517" stroke="rgba(255,255,255,0.02)" strokeWidth="0.8"/>

              {/* ═══════════════════════════════════════════════
                  ISOMETRIC BUILDING
                  Unit step: right=(+40,+20), back=(−40,+20), up=(0,−40)
                  A=(280,460) front-near-bottom corner

                  A=(280,460)  B=(440,540)  — ground right edge
                  C=(340,590)  D=(180,510)  — ground back edge
                  A'=(280,320) B'=(440,400) — top front edge
                  C'=(340,450) D'=(180,370) — top back edge
                  Ridge-L=(230,289) Ridge-R=(390,369)
                  ═══════════════════════════════════════════════ */}

              {/* ── Roof back slope (draw first — behind building) ── */}
              <polygon
                points="180,370 340,450 390,369 230,289"
                fill="#7b241c"
              />
              {/* ── Left gable ── */}
              <polygon
                points="280,320 180,370 230,289"
                fill="#922b21"
              />

              {/* ── Right face (shadow side) ── */}
              <polygon
                points="440,540 340,590 340,450 440,400"
                fill="url(#ig-wall-side)"
              />

              {/* ── Front face (lit side) ── */}
              <polygon
                points="280,460 440,540 440,400 280,320"
                fill="url(#ig-wall-front)"
              />

              {/* ── Top face ── */}
              <polygon
                points="280,320 440,400 340,450 180,370"
                fill="#202860"
              />
              {/* Top face edge highlight */}
              <polyline
                points="280,320 440,400 340,450 180,370 280,320"
                stroke="rgba(255,255,255,0.07)" strokeWidth="1" fill="none"
              />

              {/* ── Roof front slope ── */}
              <polygon
                points="280,320 440,400 390,369 230,289"
                fill="url(#ig-roof-front)"
              />
              {/* Roof ridge highlight */}
              <line x1="230" y1="289" x2="390" y2="369" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
              {/* Roof front edge highlight */}
              <line x1="280" y1="320" x2="440" y2="400" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
              {/* Right gable */}
              <polygon
                points="440,400 340,450 390,369"
                fill="#922b21"
              />
              {/* Roof edge lines */}
              <polyline points="230,289 280,320 440,400 390,369 230,289" stroke="#7b241c" strokeWidth="1" fill="none"/>
              <polyline points="230,289 180,370 340,450 390,369" stroke="#6b1f19" strokeWidth="1" fill="none"/>

              {/* ── Flag pole ── */}
              <line x1="230" y1="289" x2="230" y2="252" stroke="#94a3b8" strokeWidth="1.5"/>
              {/* Flag */}
              <polygon points="230,252 258,258 258,268 230,262" fill="#f39c12"/>

              {/* ─────────────────────────────────────
                  FRONT FACE WINDOWS (6 total, 2 rows)
                  x-step=(40,20), y-step=(0,-40) from A(280,460)
                  Window size: 0.7w × 0.75h
                  Row 1 dy=0.55, Row 2 dy=2.0
                  ───────────────────────────────────── */}

              {/* Win1 — col1 row1  BL=(302,451) */}
              <polygon className="win-a" points="302,451 330,465 330,437 302,423" fill="url(#ig-win-glow)" filter="url(#ig-glow-f)"/>
              <polygon className="win-a" points="302,451 330,465 330,437 302,423" fill="#f39c12" opacity="0.15"/>
              <line className="win-a" x1="316" y1="451" x2="316" y2="437" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
              <line className="win-a" x1="302" y1="444" x2="330" y2="458" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>

              {/* Win2 — col2 row1  BL=(346,473) */}
              <polygon className="win-b" points="346,473 374,487 374,459 346,445" fill="url(#ig-win-glow)" filter="url(#ig-glow-f)"/>
              <polygon className="win-b" points="346,473 374,487 374,459 346,445" fill="#f39c12" opacity="0.15"/>
              <line className="win-b" x1="360" y1="473" x2="360" y2="459" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
              <line className="win-b" x1="346" y1="466" x2="374" y2="480" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>

              {/* Win3 — col3 row1  BL=(390,495) */}
              <polygon className="win-c" points="390,495 418,509 418,481 390,467" fill="url(#ig-win-glow)" filter="url(#ig-glow-f)"/>
              <polygon className="win-c" points="390,495 418,509 418,481 390,467" fill="#f39c12" opacity="0.15"/>
              <line className="win-c" x1="404" y1="495" x2="404" y2="481" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
              <line className="win-c" x1="390" y1="488" x2="418" y2="502" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>

              {/* Win4 — col1 row2  BL=(302,391) */}
              <polygon className="win-d" points="302,391 330,405 330,377 302,363" fill="url(#ig-win-glow)" filter="url(#ig-glow-f)"/>
              <polygon className="win-d" points="302,391 330,405 330,377 302,363" fill="#f39c12" opacity="0.15"/>
              <line className="win-d" x1="316" y1="391" x2="316" y2="377" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
              <line className="win-d" x1="302" y1="384" x2="330" y2="398" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>

              {/* Win5 — col2 row2  BL=(346,413) */}
              <polygon className="win-e" points="346,413 374,427 374,399 346,385" fill="url(#ig-win-glow)" filter="url(#ig-glow-f)"/>
              <polygon className="win-e" points="346,413 374,427 374,399 346,385" fill="#f39c12" opacity="0.15"/>
              <line className="win-e" x1="360" y1="413" x2="360" y2="399" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
              <line className="win-e" x1="346" y1="406" x2="374" y2="420" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>

              {/* Win6 — col3 row2  BL=(390,435) */}
              <polygon className="win-f" points="390,435 418,449 418,421 390,407" fill="url(#ig-win-glow)" filter="url(#ig-glow-f)"/>
              <polygon className="win-f" points="390,435 418,449 418,421 390,407" fill="#f39c12" opacity="0.15"/>
              <line className="win-f" x1="404" y1="435" x2="404" y2="421" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
              <line className="win-f" x1="390" y1="428" x2="418" y2="442" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>

              {/* ──────────────────────────────────────
                  RIGHT FACE WINDOWS (4 total)
                  z-step=(−40,+20) from B(440,540)
                  Win-R1 dz=0.6, dy=0.55 → BL=(416,531)
                  ────────────────────────────────────── */}

              {/* Win-R1  BL=(416,531) */}
              <polygon className="win-g" points="416,531 388,545 388,517 416,503" fill="url(#ig-win-glow)" filter="url(#ig-glow-f)"/>
              <polygon className="win-g" points="416,531 388,545 388,517 416,503" fill="#f39c12" opacity="0.1"/>

              {/* Win-R2  dz=1.55, dy=0.55 → BL=(378,549) */}
              <polygon className="win-h" points="378,549 350,563 350,535 378,521" fill="url(#ig-win-glow)" filter="url(#ig-glow-f)"/>
              <polygon className="win-h" points="378,549 350,563 350,535 378,521" fill="#f39c12" opacity="0.1"/>

              {/* Win-R3  dz=0.6, dy=2.0 → BL=(416,471) */}
              <polygon className="win-b" points="416,471 388,485 388,457 416,443" fill="url(#ig-win-glow)" filter="url(#ig-glow-f)"/>
              <polygon className="win-b" points="416,471 388,485 388,457 416,443" fill="#f39c12" opacity="0.1"/>

              {/* Win-R4  dz=1.55, dy=2.0 → BL=(378,489) */}
              <polygon className="win-e" points="378,489 350,503 350,475 378,461" fill="url(#ig-win-glow)" filter="url(#ig-glow-f)"/>
              <polygon className="win-e" points="378,489 350,503 350,475 378,461" fill="#f39c12" opacity="0.1"/>

              {/* ── Door / Entrance ──
                  dx=1.4 from A → BL=(336,488), 1.0w × 1.3h */}
              {/* Door recess (dark) */}
              <path
                d="M336,488 L376,508 L376,456 Q356,438 336,456 Z"
                fill="#080d20"
                stroke="rgba(255,255,255,0.08)" strokeWidth="1"
              />
              {/* Door arch highlight */}
              <path
                d="M336,456 Q356,440 376,456"
                fill="none" stroke="#e74c3c" strokeWidth="1.5" opacity="0.7"
              />
              {/* Door knob */}
              <circle cx="368" cy="476" r="2.5" fill="#94a3b8"/>

              {/* Entrance step — top face */}
              <polygon points="329,492 383,514 381,518 327,496" fill="#1e2860"/>
              {/* Entrance step — front face */}
              <polygon points="327,496 381,518 381,526 327,504" fill="#131940"/>

              {/* Entrance lamp post */}
              <line x1="330" y1="488" x2="330" y2="462" stroke="#94a3b8" strokeWidth="1.2"/>
              <ellipse cx="330" cy="460" rx="4" ry="2" fill="#f39c12" opacity="0.9"/>
              {/* Lamp glow */}
              <ellipse cx="330" cy="460" rx="8" ry="4" fill="#f39c12" opacity="0.15"/>

              {/* ── Wall edge / cornice lines ── */}
              <line x1="280" y1="460" x2="440" y2="540" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
              <line x1="280" y1="320" x2="280" y2="460" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
              <line x1="440" y1="400" x2="440" y2="540" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>

              {/* Floor divider line on front face */}
              <line x1="280" y1="400" x2="440" y2="480" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>

              {/* ── TREES ── */}

              {/* Tree 1 — left side (near D, swaying) */}
              <g className="tree-sway">
                {/* Trunk */}
                <polygon points="148,530 154,533 154,505 148,502" fill="#2d3a1e"/>
                <polygon points="154,533 158,531 158,503 154,505" fill="#222a16"/>
                {/* Foliage bottom */}
                <ellipse cx="151" cy="496" rx="32" ry="16" fill="#1a4a2a"/>
                <ellipse cx="151" cy="496" rx="32" ry="16" fill="#27ae60" opacity="0.6"/>
                {/* Foliage mid */}
                <ellipse cx="151" cy="480" rx="25" ry="13" fill="#1e5c30"/>
                <ellipse cx="151" cy="480" rx="25" ry="13" fill="#2ecc71" opacity="0.5"/>
                {/* Foliage top */}
                <ellipse cx="151" cy="466" rx="16" ry="9" fill="#27ae60"/>
              </g>

              {/* Tree 2 — right front */}
              <polygon points="465,548 471,551 471,523 465,520" fill="#2d3a1e"/>
              <polygon points="471,551 475,549 475,521 471,523" fill="#222a16"/>
              <ellipse cx="469" cy="513" rx="30" ry="15" fill="#1a4a2a"/>
              <ellipse cx="469" cy="513" rx="30" ry="15" fill="#27ae60" opacity="0.6"/>
              <ellipse cx="469" cy="498" rx="22" ry="11" fill="#2ecc71" opacity="0.5"/>
              <ellipse cx="469" cy="486" rx="14" ry="7"  fill="#27ae60"/>

              {/* Tree 3 — far left background */}
              <polygon points="92,552 97,555 97,530 92,527" fill="#2d3a1e"/>
              <ellipse cx="95" cy="522" rx="26" ry="13" fill="#1a4a2a"/>
              <ellipse cx="95" cy="522" rx="26" ry="13" fill="#27ae60" opacity="0.55"/>
              <ellipse cx="95" cy="509" rx="20" ry="10" fill="#2ecc71" opacity="0.45"/>
              <ellipse cx="95" cy="498" rx="13" ry="7"  fill="#27ae60" opacity="0.8"/>

              {/* ── Student figures (3 near entrance) ── */}
              {/* Figure 1 */}
              <ellipse cx="318" cy="510" rx="5" ry="8" fill="#94a3b8" opacity="0.7"/>
              <circle  cx="318" cy="500" r="5"         fill="#94a3b8" opacity="0.8"/>
              {/* Figure 2 */}
              <ellipse cx="305" cy="505" rx="4" ry="7" fill="#7c8fa0" opacity="0.7"/>
              <circle  cx="305" cy="496" r="4"         fill="#7c8fa0" opacity="0.8"/>
              {/* Figure 3 */}
              <ellipse cx="330" cy="515" rx="4" ry="7" fill="#8494a8" opacity="0.65"/>
              <circle  cx="330" cy="506" r="4"         fill="#8494a8" opacity="0.75"/>

              {/* ── Subtle ground shadow under building ── */}
              <ellipse cx="310" cy="565" rx="140" ry="18" fill="#000000" opacity="0.25"/>
            </svg>

            {/* Floating stat cards — unchanged */}
            <div className="stat-card-1 absolute -left-6 top-4 rounded-xl px-3 py-2.5 shadow-2xl"
                 style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", minWidth: "110px" }}>
              <p className="text-xs font-semibold text-slate-400 mb-1">Students</p>
              <p className="text-xl font-extrabold text-white">1,248</p>
              <p className="text-xs text-green-400 mt-0.5">↑ 12% this term</p>
            </div>

            <div className="stat-card-2 absolute -right-4 top-8 rounded-xl px-3 py-2.5 shadow-2xl"
                 style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", minWidth: "110px" }}>
              <p className="text-xs font-semibold text-slate-400 mb-1">Attendance</p>
              <div className="flex items-end gap-0.5 h-8 mt-1">
                {[60,80,55,90,75,95,85].map((h, i) => (
                  <div key={i} className="bar-anim flex-1 rounded-sm"
                       style={{
                         height: `${h}%`,
                         background: i === 5 ? "#DC2626" : "rgba(255,255,255,0.25)",
                         animationDelay: `${i * 0.1}s`,
                       }} />
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">95% today</p>
            </div>

            <div className="stat-card-3 absolute -left-4 bottom-6 rounded-xl px-3 py-2.5 shadow-2xl"
                 style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)", backdropFilter: "blur(10px)", minWidth: "110px" }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="relative h-2 w-2">
                  <div className="pulse-ring absolute inset-0 rounded-full bg-green-400" />
                  <div className="absolute inset-0 rounded-full bg-green-400" />
                </div>
                <p className="text-xs font-semibold text-red-400">Fees Collected</p>
              </div>
              <p className="text-lg font-extrabold text-white">₹4.2L</p>
              <p className="text-xs text-slate-400">of ₹5L target</p>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <h2
            className="auth-panel-title mb-2 leading-tight text-white"
            style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.01em" }}
          >
            Empowering Schools<br />with Technology
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            The all-in-one ERP trusted by modern educational institutions across India.
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-white">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b px-6 py-4 lg:hidden"
             style={{ borderColor: "#F1F5F9" }}>
          <Link href="/login">
            <Image src="/logo.png" alt="SikshaMitra" width={130} height={32} className="h-8 w-auto" />
          </Link>
        </div>

        {/* Form wrapper */}
        <div className="auth-form-wrap flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        {/* Footer note */}
        <div className="border-t px-6 py-4 text-center" style={{ borderColor: "#F1F5F9" }}>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} SikshaMitra &mdash; The Digital Partner of Modern Schools
          </p>
        </div>
      </div>
    </div>
  )
}
