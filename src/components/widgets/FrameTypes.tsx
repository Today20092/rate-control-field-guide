import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Play, Square } from 'lucide-react'
import { FRAME_BITS, type FrameType } from '../../lib/gop'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'

/**
 * How each frame type is built, as a short animation. Three frames sit in a row; the middle one is
 * being built. An I-frame paints every block; a P-frame copies frame 1 and moves the ball along one
 * arrow; a B-frame borrows from frames 1 and 3. Each tab shows its own sequence.
 */

const SLOT = [10, 215, 420] // left edge of frames 1, 2, 3
const FW = 170
const FH = 96
const TOP = 30
const BALL = [45, 85, 125] // ball centre in each frame, frame-local
const CY = 58
const COLS = 10
const ROWS = 6

const types: Record<
  FrameType,
  { name: string; stores: string; needs: string; steps: string[]; refs: number[] }
> = {
  I: {
    name: 'I-frame',
    stores: 'A complete picture.',
    needs: 'No other frame.',
    refs: [],
    steps: ['The I-frame starts empty.', 'It stores every block of the picture. It needs no other frame.'],
  },
  P: {
    name: 'P-frame',
    stores: 'One arrow and a small fix.',
    needs: 'An earlier frame.',
    refs: [0],
    steps: [
      'The P-frame starts empty.',
      'Copy frame 1. Most of the picture is already right.',
      'Store one arrow: the ball moved to the right.',
      'Store a small fix for what the arrow got wrong.',
    ],
  },
  B: {
    name: 'B-frame',
    stores: 'Arrows to both sides and a tiny fix.',
    needs: 'One earlier frame and one later frame.',
    refs: [0, 2],
    steps: [
      'The B-frame starts empty.',
      'The player decodes frame 3 before frame 2 so both references are ready.',
      'Store two arrows. The ball is halfway between its two positions.',
      'Store a small correction for the difference between the prediction and frame 2.',
    ],
  },
}

// How each frame type is outlined: red solid for keys, ink solid for P, graphite dashed for B.
const outline: Record<FrameType | 'none', { stroke: string; width: number; dash?: string }> = {
  I: { stroke: 'var(--color-key)', width: 4 },
  P: { stroke: 'var(--color-ink)', width: 2 },
  B: { stroke: 'var(--color-graphite)', width: 2, dash: '6 4' },
  none: { stroke: 'var(--color-line)', width: 1.5, dash: '4 4' },
}

const ease = 'var(--ease-out-expo)'

function Background() {
  return (
    <>
      <rect width={FW} height={FH} fill="var(--color-sheet)" />
      <circle cx="140" cy="20" r="9" fill="var(--color-peg-shade)" />
      <path d="M0 66 L42 48 L82 62 L124 42 L170 58 L170 96 L0 96 Z" fill="var(--color-line)" />
      <path d="M0 80 L64 70 L116 78 L170 72 L170 96 L0 96 Z" fill="var(--color-graphite)" />
    </>
  )
}

function Ball({ x }: { x: number }) {
  return <circle cx={x} cy={CY} r="9" fill="var(--color-ink)" />
}

/** A finished frame sitting in a slot: a reference the middle frame borrows from, or an unused one. */
function SideFrame({ slot, type, used }: { slot: number; type: FrameType | 'none'; used: boolean }) {
  const o = outline[used ? type : 'none']
  return (
    <g transform={`translate(${SLOT[slot]} ${TOP})`} opacity={used ? 1 : 0.35}>
      <Background />
      <Ball x={BALL[slot]} />
      <rect
        width={FW}
        height={FH}
        fill="none"
        stroke={o.stroke}
        strokeWidth={o.width}
        strokeDasharray={o.dash}
      />
    </g>
  )
}

function Arrow({ from, to, show, delay = 0 }: { from: number; to: number; show: boolean; delay?: number }) {
  // Drawn above the ball inside the middle frame, from the ball's old position to its new one.
  const y = CY - 20
  const dir = Math.sign(to - from)
  return (
    <g
      stroke="var(--color-motion)"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      style={{ opacity: show ? 1 : 0, transition: `opacity 300ms ${delay}ms` }}
    >
      <path
        d={`M${from} ${y} L${to - dir * 4} ${y}`}
        pathLength={1}
        strokeDasharray="1"
        style={{
          strokeDashoffset: show ? 0 : 1,
          transition: `stroke-dashoffset 700ms ${ease} ${delay}ms`,
        }}
      />
      <path d={`M${to - dir * 10} ${y - 6} L${to - dir * 3} ${y} L${to - dir * 10} ${y + 6}`} />
    </g>
  )
}

function Stage({ type }: { type: FrameType }) {
  const info = types[type]
  const last = info.steps.length - 1
  const [step, setStep] = useState(last)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    let next = 1
    let timer: number
    const tick = () => {
      setStep(next)
      if (next === last) setPlaying(false)
      else {
        next += 1
        timer = window.setTimeout(tick, 2200)
      }
    }
    timer = window.setTimeout(tick, 1200)
    return () => window.clearTimeout(timer)
  }, [last, playing])

  function togglePlayback() {
    if (!playing) setStep(0)
    setPlaying(!playing)
  }

  function moveStep(delta: number) {
    setPlaying(false)
    setStep((current) => Math.max(0, Math.min(last, current + delta)))
  }

  const mid = SLOT[1]
  const midOutline = outline[step === 0 ? 'none' : type]
  const sideTypes: (FrameType | 'none')[] =
    type === 'I' ? ['none', 'none'] : type === 'P' ? ['I', 'none'] : ['I', 'P']
  const copied = type !== 'I' && step >= 1
  const moved = type !== 'I' && step >= 2
  const fixed = type !== 'I' && step >= 3

  return (
    <div>
      <div className="label grid grid-cols-3 gap-2 text-center text-ink-soft" aria-hidden="true">
        <span>Frame 1</span>
        <strong className="text-ink">Frame 2</strong>
        <span>Frame 3</span>
      </div>
      <svg viewBox="0 20 600 112" className="block w-full overflow-visible" aria-hidden="true">
        <SideFrame slot={0} type={sideTypes[0]} used={info.refs.includes(0)} />
        <SideFrame slot={2} type={sideTypes[1]} used={info.refs.includes(2)} />

        <g transform={`translate(${mid} ${TOP})`}>
          <rect width={FW} height={FH} fill="var(--color-paper)" />
          {type === 'I' ? (
            <>
              <Background />
              <Ball x={BALL[1]} />
              {/* Blank blocks that clear in scan order: the I-frame paints every block itself. */}
              {Array.from({ length: COLS * ROWS }, (_, i) => (
                <rect
                  key={i}
                  x={(i % COLS) * (FW / COLS)}
                  y={Math.floor(i / COLS) * (FH / ROWS)}
                  width={FW / COLS}
                  height={FH / ROWS}
                  fill="var(--color-paper)"
                  stroke="var(--color-line)"
                  strokeWidth="0.75"
                  style={{
                    opacity: step >= 1 ? 0 : 1,
                    transition: `opacity 250ms ${step >= 1 ? i * 22 : 0}ms`,
                  }}
                />
              ))}
            </>
          ) : (
            <>
              {/* The copied background slides in from each reference frame. */}
              {info.refs.map((r) => (
                <g
                  key={r}
                  style={{
                    transform: copied ? 'translateX(0)' : `translateX(${SLOT[r] - mid}px)`,
                    opacity: copied ? (info.refs.length > 1 && !moved ? 0.5 : 1) : 0,
                    transition: `transform 900ms ${ease}, opacity 400ms`,
                  }}
                >
                  <Background />
                </g>
              ))}
              {info.refs.map((r) => (
                <g
                  key={`ball-${r}`}
                  style={{
                    transform: moved
                      ? 'translateX(0)'
                      : copied
                        ? `translateX(${BALL[r] - BALL[1]}px)`
                        : `translateX(${SLOT[r] - mid + BALL[r] - BALL[1]}px)`,
                    opacity: copied ? (info.refs.length > 1 && !moved ? 0.5 : 1) : 0,
                    transition: `transform 900ms ${ease}, opacity 400ms`,
                  }}
                >
                  <Ball x={BALL[1]} />
                </g>
              ))}
              {info.refs.map((r) => (
                <Arrow key={`arrow-${r}`} from={BALL[r]} to={BALL[1]} show={moved} />
              ))}
              {/* The residual: the few pixels the arrows got wrong. Smaller for B. */}
              <g style={{ opacity: fixed ? 1 : 0, transition: 'opacity 400ms' }}>
                <rect
                  x={BALL[1] + 3}
                  y={CY - 6}
                  width={type === 'B' ? 5 : 9}
                  height={type === 'B' ? 5 : 9}
                  fill="var(--color-motion-wash)"
                  stroke="var(--color-motion-ink)"
                  strokeWidth="1.5"
                />
              </g>
            </>
          )}
          <rect
            width={FW}
            height={FH}
            fill="none"
            stroke={midOutline.stroke}
            strokeWidth={midOutline.width}
            strokeDasharray={midOutline.dash}
          />
        </g>
      </svg>

      <div className="mt-3 space-y-3">
        <p className="font-display text-lg font-semibold" aria-live="polite">
          <span className="label mr-2 text-ink-faint">
            Step {step + 1}/{last + 1}
          </span>
          {info.steps[step]}
        </p>
        <div role="group" aria-label="Animation controls" className="flex flex-wrap gap-2">
          <button type="button" className="ctl min-w-24" onClick={togglePlayback}>
            {playing ? <Square aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
            {playing ? 'Stop' : 'Play'}
          </button>
          <div role="group" aria-label="Animation steps" className="grid grid-cols-2 gap-2">
            <button type="button" className="ctl px-2" disabled={step === 0} onClick={() => moveStep(-1)}>
              <ChevronLeft aria-hidden="true" size={16} />
              Previous
            </button>
            <button type="button" className="ctl px-2" disabled={step === last} onClick={() => moveStep(1)}>
              Next
              <ChevronRight aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      </div>

      <dl className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
        <div>
          <dt className="label text-ink-soft">The file stores</dt>
          <dd className="mt-1">{info.stores}</dd>
        </div>
        <div>
          <dt className="label text-ink-soft">To show it, the player needs</dt>
          <dd className="mt-1">{info.needs}</dd>
        </div>
        <div>
          <dt className="label text-ink-soft">Size, compared with a full picture</dt>
          <dd className="mt-2 flex items-center gap-3">
            <span className="h-3 flex-1 rounded-sm bg-paper">
              <span
                className="block h-full rounded-sm bg-ink transition-[width] duration-700"
                style={{ width: `${FRAME_BITS[type]}%` }}
              />
            </span>
            <span className="label">{FRAME_BITS[type]}%</span>
          </dd>
        </div>
      </dl>
    </div>
  )
}

export default function FrameTypes() {
  return (
    <Tabs defaultValue="I">
      <TabsList aria-label="Frame type">
        {(Object.keys(types) as FrameType[]).map((t) => (
          <TabsTab key={t} value={t} className="flex-1 px-2">
            {types[t].name}
          </TabsTab>
        ))}
      </TabsList>
      {(Object.keys(types) as FrameType[]).map((t) => (
        <TabsPanel key={t} value={t}>
          <Stage type={t} />
        </TabsPanel>
      ))}
    </Tabs>
  )
}
