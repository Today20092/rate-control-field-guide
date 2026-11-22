import { useEffect, useState } from 'react'
import { buildGop, framesNeeded, type Frame } from '../../lib/gop'
import { editingCodecs, gbPerHour } from '../../content/editingCodecs'
import { Slider } from '@/components/ui/slider'

/**
 * Jump the playhead, as an editor does when scrubbing. The H.264 lane lights up every frame the player
 * must decode first; the ProRes lane decodes one. Below, what each format costs in storage.
 */

const COUNT = 24
const lanes: { name: string; note: string; frames: Frame[] }[] = [
  { name: 'H.264 / H.265', note: 'Long GOP: a key frame every 12', frames: buildGop(COUNT, 12, 2) },
  { name: 'ProRes / DNxHR', note: 'Every frame is a key frame', frames: buildGop(COUNT, 1, 0) },
]

const cellStyle = {
  I: 'border-[3px] border-key text-key-ink',
  P: 'border-2 border-ink',
  B: 'border-2 border-dashed border-graphite',
} as const

function Lane({
  lane,
  target,
  progress,
}: {
  lane: (typeof lanes)[number]
  target: number
  progress: number
}) {
  const needed = framesNeeded(lane.frames, target)
  const shown = needed.slice(0, progress)
  const done = progress >= needed.length
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <p className="font-display font-bold">
          {lane.name} <span className="font-normal text-ink-soft">· {lane.note}</span>
        </p>
        <p className="label text-ink-soft">
          Decoded <b className="text-ink">{Math.min(progress, needed.length)}</b> frame
          {needed.length === 1 ? '' : 's'}
        </p>
      </div>
      <ol className="mt-2 flex gap-[2px] sm:gap-1" aria-hidden="true">
        {lane.frames.map((f) => {
          const lit = shown.includes(f.index)
          const isTarget = f.index === target
          return (
            <li
              key={f.index}
              className={`relative grid aspect-[1/2] min-w-0 flex-1 place-items-center font-mono text-xs font-bold transition-colors duration-200 sm:aspect-[3/4] ${cellStyle[f.type]} ${lit ? 'bg-ink-soft text-paper' : 'bg-sheet'}`}
            >
              <span className="hidden sm:inline">{f.type}</span>
              {isTarget && (
                <span
                  className={`absolute -inset-[5px] border-2 border-key ${done ? '' : 'animate-pulse'}`}
                />
              )}
            </li>
          )
        })}
      </ol>
      <div className="mt-2 h-2 rounded-sm bg-paper">
        <div
          className="h-full rounded-sm bg-ink transition-[width] duration-150"
          style={{ width: `${(Math.min(progress, needed.length) / COUNT) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default function ScrubTest() {
  const [target, setTarget] = useState(10)
  const [progress, setProgress] = useState(COUNT)
  const [run, setRun] = useState(0)
  const maxNeeded = Math.max(...lanes.map((l) => framesNeeded(l.frames, target).length))

  // Decode one frame per tick, so a longer chain visibly takes longer.
  useEffect(() => {
    if (run === 0) return
    let p = 0
    const id = window.setInterval(() => {
      p += 1
      setProgress(p)
      if (p >= COUNT) window.clearInterval(id)
    }, 70)
    return () => window.clearInterval(id)
  }, [run])

  function jump(v: number) {
    setTarget(v)
    setProgress(0)
    setRun((r) => r + 1)
  }

  const longGop = framesNeeded(lanes[0].frames, target).length
  const maxGb = Math.max(...editingCodecs.map((c) => gbPerHour(c.mbps)))

  return (
    <div>
      <Slider
        label="Jump the playhead to frame"
        display={`Frame ${target + 1}`}
        min={0}
        max={COUNT - 1}
        value={target}
        onValueChange={jump}
      />
      <div className="mt-4 space-y-6">
        {lanes.map((l) => (
          <Lane key={l.name} lane={l} target={target} progress={progress} />
        ))}
      </div>
      <p className="mt-4 font-display text-lg font-semibold" aria-live="polite">
        {longGop === 1
          ? `Frame ${target + 1} is a key frame, so both formats show it at once.`
          : `To show frame ${target + 1}, H.264 decodes ${longGop} frames. ProRes decodes 1.`}
      </p>
      <p className="label mt-1 text-ink-faint">
        Highlighted frames are decoded. {maxNeeded > 1 ? 'Each one takes the computer time.' : ''}
      </p>

      <table className="mt-8 w-full border-collapse text-base">
        <caption className="mb-3 text-left font-display text-lg font-bold">
          One hour of 4K (3840×2160, 30 fps)
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Format</th>
            <th scope="col">Storage per hour</th>
          </tr>
        </thead>
        <tbody>
          {editingCodecs.map((c) => {
            const gb = gbPerHour(c.mbps)
            return (
              <tr key={c.id} className="border-b border-line">
                <th scope="row" className="w-[45%] py-2 pr-3 text-left align-middle font-semibold">
                  {c.name}
                  <span className="label block font-normal text-ink-faint">
                    {c.kind === 'long-gop' ? 'Long GOP' : 'Every frame whole'} · {c.mbps} Mbps
                  </span>
                </th>
                <td className="py-2 align-middle">
                  <span className="flex items-center gap-3">
                    <span className="h-3 flex-1 rounded-sm bg-paper" aria-hidden="true">
                      <span
                        className={`block h-full rounded-sm ${c.kind === 'long-gop' ? 'bg-ink' : 'bg-ink-soft'}`}
                        style={{ width: `${(gb / maxGb) * 100}%` }}
                      />
                    </span>
                    <span className="label w-16 text-right text-ink">{gb} GB</span>
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
