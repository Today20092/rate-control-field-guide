import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import CompareSlider from './CompareSlider'

/** Two neighbouring frames are nearly identical: count the blocks that actually changed. */

const COLS = 16
const ROWS = 9
const B = 10 // block size in SVG units

function ballBlocks(cx: number, cy: number, r: number) {
  const set = new Set<string>()
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      const nx = Math.max(x * B, Math.min(cx, x * B + B))
      const ny = Math.max(y * B, Math.min(cy, y * B + B))
      if ((nx - cx) ** 2 + (ny - cy) ** 2 < r * r) set.add(`${x},${y}`)
    }
  return set
}

export default function FrameDiff() {
  const [speed, setSpeed] = useState(2)
  const from = { x: 60, y: 48 }
  const to = { x: 60 + speed * 6, y: 48 - speed * 1.5 }
  const a = ballBlocks(from.x, from.y, 9)
  const b = ballBlocks(to.x, to.y, 9)
  // Any block the ball touches in either frame looks different; everything else is identical.
  const changed = speed === 0 ? new Set<string>() : new Set([...a, ...b])
  const changedCount = changed.size
  const total = COLS * ROWS

  const scene = (ball: { x: number; y: number }) => (
    <>
      <rect width={COLS * B} height={ROWS * B} fill="var(--color-sheet)" />
      <path d="M0 62 L50 48 L100 60 L160 44 L160 90 L0 90 Z" fill="var(--color-line)" />
      <circle cx={ball.x} cy={ball.y} r="9" fill="var(--color-ink)" />
    </>
  )

  const grid = (
    <>
      <rect width={COLS * B} height={ROWS * B} fill="var(--color-sheet)" fillOpacity="0.8" />
      {Array.from({ length: total }, (_, i) => {
        const x = i % COLS
        const y = Math.floor(i / COLS)
        const hit = changed.has(`${x},${y}`)
        return (
          <rect
            key={i}
            x={x * B + 0.5}
            y={y * B + 0.5}
            width={B - 1}
            height={B - 1}
            fill={hit ? 'var(--color-ink-soft)' : 'none'}
            fillOpacity={hit ? 0.85 : 0}
            stroke="var(--color-line)"
            strokeWidth="0.5"
          />
        )
      })}
    </>
  )

  return (
    <div>
      <Slider
        label="How far the ball moves between frames"
        display={speed === 0 ? 'Still' : `${speed * 6} px`}
        min={0}
        max={8}
        value={speed}
        onValueChange={setSpeed}
      />

      <CompareSlider
        className="mt-4"
        label="Compare frame 1 with the blocks that changed in frame 2"
        beforeLabel="Frame 1"
        afterLabel="What changed in frame 2"
        before={
          <svg viewBox={`0 0 ${COLS * B} ${ROWS * B}`} className="block w-full">
            {scene(from)}
          </svg>
        }
        after={
          <svg viewBox={`0 0 ${COLS * B} ${ROWS * B}`} className="block w-full">
            {scene(to)}
            {grid}
          </svg>
        }
      />

      <p className="mt-4 font-display text-lg font-semibold" aria-live="polite">
        {changedCount} of {total} blocks changed ({Math.round((changedCount / total) * 100)}%). A full new
        picture would store the other {total - changedCount} blocks again.
      </p>
    </div>
  )
}
