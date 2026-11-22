import { useMemo, useState } from 'react'
import { buildGop, decodeOrder, FRAME_BITS, framesNeeded, totalBits, type Frame } from '../../lib/gop'

/**
 * An exposure sheet of 24 frames (one second at 24 fps). Change the keyframe interval and B-frame
 * count; bar height is the frame's size. Tap a frame to see what a player must decode to jump there.
 */

const COUNT = 24
const intervals = [1, 6, 12, 24]
const bOptions = [0, 1, 2, 3]

const style: Record<Frame['type'], string> = {
  I: 'bg-key',
  P: 'bg-ink',
  B: 'bg-graphite',
}

export default function GopTimeline() {
  const [interval, setKeyInterval] = useState(12)
  const [bFrames, setBFrames] = useState(2)
  const [target, setTarget] = useState<number | null>(null)
  const [order, setOrder] = useState<'display' | 'decode'>('display')

  const frames = useMemo(() => buildGop(COUNT, interval, interval === 1 ? 0 : bFrames), [interval, bFrames])
  const shown = order === 'display' ? frames : decodeOrder(frames)
  const neededList = target === null ? [] : framesNeeded(frames, target)
  const needed = new Set(neededList)
  const intraTotal = COUNT * FRAME_BITS.I
  const total = totalBits(frames)

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="font-display font-semibold">A full picture (I-frame) every…</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {intervals.map((n) => (
              <button
                key={n}
                type="button"
                className="ctl"
                aria-pressed={n === interval}
                onClick={() => {
                  setKeyInterval(n)
                  setTarget(null)
                }}
              >
                {n === 1 ? 'Every frame' : `${n} frames`}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset disabled={interval === 1}>
          <legend className="font-display font-semibold">B-frames between references</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {bOptions.map((n) => (
              <button
                key={n}
                type="button"
                className="ctl"
                aria-pressed={interval !== 1 && n === bFrames}
                onClick={() => {
                  setBFrames(n)
                  setTarget(null)
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        Scroll sideways to see all frames. Choose a frame to see what the player needs.
      </p>
      <div className="mt-2 overflow-x-auto pb-2">
        <ol
          className="grid min-w-[72.25rem] grid-cols-[repeat(24,minmax(0,1fr))] items-end gap-1 p-1"
          aria-label="Frames"
        >
          {shown.map((f) => {
            const isNeeded = needed.has(f.index)
            const dim = target !== null && !isNeeded
            return (
              <li key={f.index} className="flex flex-col items-stretch">
                <button
                  type="button"
                  onClick={() => setTarget(target === f.index ? null : f.index)}
                  aria-pressed={target === f.index}
                  aria-label={`Frame ${f.index + 1}, ${f.type}-frame, size ${f.bits}. Jump here`}
                  className={`flex h-28 flex-col justify-end rounded-sm transition-opacity ${dim ? 'opacity-25' : ''} ${target === f.index ? 'outline-2 outline-offset-2 outline-motion' : ''}`}
                >
                  <span className={`block w-full ${style[f.type]}`} style={{ height: `${f.bits}%` }} />
                </button>
                <span
                  className={`label mt-1 text-center ${f.type === 'I' ? 'font-bold text-key-ink' : f.type === 'B' ? 'text-ink-faint' : 'text-ink'}`}
                  aria-hidden="true"
                >
                  {f.type}
                </span>
                <span className="label text-center text-ink-faint" aria-hidden="true">
                  {f.index + 1}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Frame order" className="flex flex-wrap gap-2">
          <button
            type="button"
            className="ctl"
            aria-pressed={order === 'display'}
            onClick={() => setOrder('display')}
          >
            Order you watch
          </button>
          <button
            type="button"
            className="ctl"
            aria-pressed={order === 'decode'}
            onClick={() => setOrder('decode')}
          >
            Order it’s sent
          </button>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2" aria-live="polite">
        <div>
          <dt className="label text-ink-soft">One second costs</dt>
          <dd className="font-display text-2xl font-bold">
            {total} units{' '}
            <span className="text-base font-semibold text-ink-soft">
              ({Math.round((total / intraTotal) * 100)}% of every-frame-a-picture)
            </span>
          </dd>
        </div>
        <div>
          <dt className="label text-ink-soft">Jumping to a frame</dt>
          <dd className="font-display text-lg font-semibold">
            {target === null
              ? 'Tap a frame to see what must be decoded first.'
              : `Frame ${target + 1} needs ${neededList.length} frame${neededList.length === 1 ? '' : 's'} decoded: ${neededList.map((i) => i + 1).join(', ')}.`}
          </dd>
        </div>
      </dl>
    </div>
  )
}
