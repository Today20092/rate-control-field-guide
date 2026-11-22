import { useState } from 'react'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
import type { Codec } from '../../lib/bitrate'
import { bufferStates, commands, complexity, modes, type Mode, type ModeId } from '../../content/rateModes'
import CopyCommand from './CopyCommand'

/** The four rate-control modes as tabs (cnippet/Base UI tabs), each with its curve, buffer and command. */

const W = 330
const H = 120
const toPath = (values: number[]) =>
  values
    .map((v, i) => `${i ? 'L' : 'M'}${(i / (values.length - 1)) * W} ${H - (v / 10) * (H - 10) - 5}`)
    .join(' ')

function Swatch({
  stroke,
  dash,
  width,
  children,
}: {
  stroke: string
  dash?: string
  width: number
  children: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="22" height="8" aria-hidden="true">
        <line x1="0" y1="4" x2="22" y2="4" stroke={stroke} strokeWidth={width} strokeDasharray={dash} />
      </svg>
      {children}
    </span>
  )
}

export default function RateControl() {
  const [active, setActive] = useState<ModeId>('crf')
  const [codec, setCodec] = useState<Codec>('h264')

  return (
    <Tabs value={active} onValueChange={(v) => setActive(v as ModeId)}>
      <TabsList aria-label="Rate-control modes">
        {modes.map((m) => (
          <TabsTab key={m.id} value={m.id}>
            {m.name}
          </TabsTab>
        ))}
      </TabsList>
      {modes.map((mode) => (
        <TabsPanel key={mode.id} value={mode.id}>
          <ModePanel mode={mode} codec={codec} setCodec={setCodec} />
        </TabsPanel>
      ))}
    </Tabs>
  )
}

function ModePanel({ mode, codec, setCodec }: { mode: Mode; codec: Codec; setCodec: (c: Codec) => void }) {
  const clip = `wipe-${mode.id}`
  return (
    <div>
      <h3 className="text-2xl font-extrabold">
        {mode.longName}: <span className="font-semibold text-ink-soft">{mode.promise}</span>
      </h3>
      <p className="mt-1 font-display text-lg text-ink-soft">{mode.moves}</p>

      <div className="mt-5 grid gap-6 md:grid-cols-[3fr_2fr]">
        <figure>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full overflow-visible"
            role="img"
            aria-label={`${mode.name}: ${mode.moves}`}
          >
            <clipPath id={clip}>
              <rect className="wipe" width={W} height={H + 10} y="-5" />
            </clipPath>
            <line x1="0" y1={H} x2={W} y2={H} stroke="var(--color-line)" />
            <g clipPath={`url(#${clip})`}>
              <path
                d={toPath(complexity)}
                fill="none"
                stroke="var(--color-graphite)"
                strokeWidth="2"
                strokeDasharray="3 5"
              />
              <path d={toPath(mode.bitrate)} fill="none" stroke="var(--color-ink)" strokeWidth="3" />
              <path
                d={toPath(mode.quality)}
                fill="none"
                stroke="var(--color-ink-soft)"
                strokeWidth="3"
                strokeDasharray="10 4"
              />
            </g>
          </svg>
          <figcaption className="label mt-3 flex flex-wrap gap-x-5 gap-y-1 text-ink-soft">
            <Swatch stroke="var(--color-graphite)" dash="3 5" width={2}>
              Scene difficulty
            </Swatch>
            <Swatch stroke="var(--color-ink)" width={3}>
              Bitrate
            </Swatch>
            <Swatch stroke="var(--color-ink-soft)" dash="10 4" width={3}>
              Quality
            </Swatch>
            <span>Time runs left to right</span>
          </figcaption>
        </figure>

        <div>
          <p className="label text-ink-soft">Streaming buffer in the hardest scene</p>
          <p className="mt-1 text-sm text-ink-soft">
            This shows what can happen over a fixed-speed connection.
          </p>
          <ol className="mt-2 grid grid-cols-4 gap-2">
            {bufferStates.map((b) => {
              const now = b.id === mode.buffer
              const top = 6 + 50 * (1 - b.fill)
              return (
                <li
                  key={b.id}
                  aria-current={now ? 'true' : undefined}
                  className="flex flex-col items-center gap-1"
                >
                  <svg viewBox="0 0 40 60" className="h-16 w-full" aria-hidden="true">
                    <rect
                      x="6"
                      y="6"
                      width="28"
                      height="50"
                      rx="3"
                      fill="var(--color-sheet)"
                      stroke={now ? 'var(--color-ink)' : 'var(--color-graphite)'}
                      strokeWidth={now ? 2.5 : 1.2}
                    />
                    <rect
                      x="8"
                      y={top}
                      width="24"
                      height={56 - top - 2}
                      fill={now ? 'var(--color-ink)' : 'var(--color-graphite)'}
                    />
                    {b.id === 'overflow' && (
                      <path
                        d="M30 6 Q36 2 37 12 L37 22"
                        fill="none"
                        stroke={now ? 'var(--color-ink)' : 'var(--color-graphite)'}
                        strokeWidth="2"
                      />
                    )}
                  </svg>
                  <span
                    className={`text-center text-xs leading-tight ${now ? 'font-bold text-ink' : 'text-ink-soft'}`}
                  >
                    {b.label}
                  </span>
                </li>
              )
            })}
          </ol>
          <dl className="mt-4 space-y-3 text-base">
            <div>
              <dt className="font-display font-bold">Good for</dt>
              <dd>{mode.useWhen}</dd>
            </div>
            <div>
              <dt className="font-display font-bold">The catch</dt>
              <dd>{mode.avoidWhen}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="font-display font-semibold">FFmpeg starting point for</span>
          <div role="group" aria-label="Encoder" className="flex gap-2">
            {(['h264', 'h265'] as const).map((c) => (
              <button
                key={c}
                type="button"
                className="ctl"
                aria-pressed={c === codec}
                onClick={() => setCodec(c)}
              >
                {c === 'h264' ? 'H.264' : 'H.265'}
              </button>
            ))}
          </div>
        </div>
        <CopyCommand command={commands[codec][mode.id]} />
      </div>
    </div>
  )
}
