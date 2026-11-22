import { useEffect, useRef, useState } from 'react'
import { buildGop, type Frame } from '../../lib/gop'

/**
 * The guide's signature: seven frames stacked in depth. "What you see" shows every frame as a full
 * picture; "What's stored" shows that only the key (I) frame is a picture and the rest are motion
 * arrows plus a small fix-up patch.
 */

const frames = buildGop(7, 6, 2) // I B B P B P I: keys bookend the run
const ballX = (i: number) => 34 + i * 16

const typeName = {
  I: 'I-frame: full picture',
  P: 'P-frame: arrows + fix from earlier',
  B: 'B-frame: arrows both ways',
}

function Scene({ frame, stored }: { frame: Frame; stored: boolean }) {
  const x = ballX(frame.index)
  const full = !stored || frame.type === 'I'
  return (
    <svg viewBox="0 0 160 90" className="block h-full w-full" aria-hidden="true">
      {full ? (
        <>
          <rect width="160" height="90" fill="var(--color-sheet)" />
          <circle cx="128" cy="20" r="9" fill="var(--color-peg-shade)" />
          <path d="M0 64 L40 46 L78 60 L118 40 L160 56 L160 90 L0 90 Z" fill="var(--color-line)" />
          <path d="M0 76 L60 66 L110 74 L160 68 L160 90 L0 90 Z" fill="var(--color-graphite)" />
          <circle cx={x} cy="52" r="8" fill="var(--color-ink)" />
        </>
      ) : (
        <>
          <rect width="160" height="90" fill="var(--color-sheet)" fillOpacity="0.55" />
          {frame.refs.map((r) => {
            const from = ballX(r)
            const dir = from < x ? 1 : -1
            return (
              <g key={r} stroke="var(--color-motion)" strokeWidth="2.5" fill="none">
                <line x1={from} y1="52" x2={x - dir * 10} y2="52" />
                <path d={`M${x - dir * 15} 47 L${x - dir * 9} 52 L${x - dir * 15} 57`} />
              </g>
            )
          })}
          <rect
            x={x - 8}
            y="44"
            width="16"
            height="16"
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
          <rect x={x - 3} y="49" width="6" height="6" fill="var(--color-graphite)" />
        </>
      )}
    </svg>
  )
}

interface Props {
  compact?: boolean
  intro?: boolean // play the fan-open reveal; only the hero instance does
  initialView?: 'see' | 'stored'
}

export default function FrameStack3D({ compact = false, intro = true, initialView = 'stored' }: Props) {
  // Fanned by default so the static HTML already shows the idea.
  const [fanned, setFanned] = useState(true)
  const [stored, setStored] = useState(initialView === 'stored')
  const ref = useRef<HTMLDivElement>(null)

  // The one authored moment: with motion allowed, the stack closes, then fans open once it is in view.
  useEffect(() => {
    if (!intro || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !ref.current) return
    setFanned(false)
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        requestAnimationFrame(() => setFanned(true))
        io.disconnect()
      }
    })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [intro])

  const storedBits = frames.reduce((s, f) => s + f.bits, 0)
  const fullBits = frames.length * 100

  return (
    <div ref={ref} className="@container">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
          <button type="button" className="ctl" aria-pressed={!stored} onClick={() => setStored(false)}>
            What you see
          </button>
          <button type="button" className="ctl" aria-pressed={stored} onClick={() => setStored(true)}>
            What’s stored
          </button>
        </div>
        <button type="button" className="ctl ml-auto" onClick={() => setFanned((f) => !f)}>
          {fanned ? 'Stack frames' : 'Fan out frames'}
        </button>
      </div>

      <div
        className={`stack-stage relative mx-auto mt-4 overflow-hidden ${compact ? 'h-64 @md:h-80' : 'h-72 @md:h-[26rem]'}`}
        style={{ perspective: '1100px' }}
        aria-hidden="true"
      >
        <div
          className="absolute top-1/2 left-1/2"
          style={{ transformStyle: 'preserve-3d', transform: 'rotateX(52deg) rotateZ(-30deg)' }}
        >
          {frames.map((f, i) => {
            const spread = fanned ? i - (frames.length - 1) / 2 : 0
            return (
              <div
                key={f.index}
                className="frame absolute overflow-hidden bg-sheet"
                style={{
                  transform: `translate(-50%, -50%) translate3d(${spread * 27}%, 0, ${fanned ? spread * 12 : i * 2}px)`,
                  transitionDelay: `${i * 45}ms`,
                  outline:
                    f.type === 'I'
                      ? '4px solid var(--color-key)'
                      : f.type === 'P'
                        ? '2px solid var(--color-ink)'
                        : '2px dashed var(--color-graphite)',
                }}
              >
                <Scene frame={f} stored={stored} />
                <span className="label absolute top-1 left-1 rounded bg-paper/90 px-1.5 py-0.5 text-ink">
                  {f.index + 1} · {f.type}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 text-sm">
        <dt className="label text-ink-soft">All full pictures</dt>
        <dd className="h-3 bg-ink-faint" style={{ width: '100%' }} />
        <dd className="label text-right">{fullBits} units</dd>
        <dt className="label whitespace-nowrap text-ink">What’s stored</dt>
        <dd className="h-3 bg-key" style={{ width: `${(storedBits / fullBits) * 100}%` }} />
        <dd className="label text-right text-ink">{storedBits} units</dd>
      </dl>

      <p className="sr-only" aria-live="polite">
        {stored
          ? `Showing what is stored. Frame 1 is a full picture. ${frames
              .slice(1)
              .map((f) => `Frame ${f.index + 1}, ${typeName[f.type]}`)
              .join('. ')}.`
          : 'Showing what you see: seven full pictures of a ball rolling left to right.'}
      </p>

      <style>{`
        .frame { width: min(13rem, 32cqw); aspect-ratio: 16 / 9;
          transition: transform 900ms var(--ease-out-expo); box-shadow: 0 10px 24px -14px var(--color-ink); }
      `}</style>
    </div>
  )
}
