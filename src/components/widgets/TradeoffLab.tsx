import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Meter, MeterIndicator, MeterLabel, MeterTrack } from '@/components/ui/meter'
import type { Codec } from '../../lib/bitrate'
import { outcome, presets } from '../../lib/tradeoffs'

/** Pull one lever, watch the other three move. A teaching model, not a benchmark. */

const meters = [
  { key: 'size', label: 'File size', good: 'low' },
  { key: 'quality', label: 'Picture quality', good: 'high' },
  { key: 'encode', label: 'Time to encode', good: 'low' },
  { key: 'decode', label: 'Work to play back', good: 'low' },
] as const

export default function TradeoffLab() {
  const [codec, setCodec] = useState<Codec>('h264')
  const [effort, setEffort] = useState(3)
  const [crf, setCrf] = useState(23)
  const result = outcome(codec, effort, crf)

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-5">
        <fieldset>
          <legend className="font-display font-semibold">Codec</legend>
          <div className="mt-2 flex gap-2">
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
        </fieldset>
        <Slider
          label="Preset: how long the encoder searches"
          display={presets[effort]}
          min={0}
          max={presets.length - 1}
          value={effort}
          onValueChange={setEffort}
        />
        <Slider
          label="Quality target (CRF, lower looks better)"
          display={`CRF ${crf}`}
          min={14}
          max={36}
          value={crf}
          onValueChange={setCrf}
        />
      </div>

      <div className="space-y-4">
        {meters.map((m) => (
          <Meter
            key={m.key}
            value={result[m.key]}
            aria-valuetext={`${result[m.key]} out of 100, ${m.good} is better`}
          >
            <div className="flex items-baseline justify-between">
              <MeterLabel className="font-display text-base font-semibold">{m.label}</MeterLabel>
              <span className="label text-ink-soft" aria-hidden="true">
                {result[m.key]} / 100
              </span>
            </div>
            <MeterTrack className="h-4 rounded-sm bg-paper">
              <MeterIndicator className={`rounded-sm ${m.key === 'quality' ? 'bg-ink-soft' : 'bg-ink'}`} />
            </MeterTrack>
          </Meter>
        ))}
      </div>
    </div>
  )
}
