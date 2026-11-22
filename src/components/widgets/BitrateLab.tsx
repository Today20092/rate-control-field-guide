import { useMemo, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import {
  bitsPerPixel,
  fileSizeMB,
  previewQuality,
  qualityBand,
  resolutions,
  type Codec,
} from '../../lib/bitrate'
import { compress, samples } from '../../lib/dct'
import PixelBlock from './PixelBlock'

/** Same bitrate, more pixels = fewer bits for each one. Exact arithmetic, illustrative quality bands. */

const fpsOptions = [24, 30, 60]
const bitrates = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 25, 35, 50]

export default function BitrateLab() {
  const [res, setRes] = useState(2)
  const [fps, setFps] = useState(30)
  const [rateIdx, setRateIdx] = useState(6)
  const [codec, setCodec] = useState<Codec>('h264')

  const r = resolutions[res]
  const mbps = bitrates[rateIdx]
  const bpp = bitsPerPixel(mbps, r.w, r.h, fps)
  const band = qualityBand(bpp, codec)
  const preview = useMemo(
    () => compress(samples.texture.block, previewQuality(bpp, codec)).rebuilt,
    [bpp, codec],
  )
  const bandIndex = ['starved', 'soft', 'good', 'generous'].indexOf(band.id)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
      <div className="space-y-5">
        <p className="text-sm text-ink-soft">
          Try switching from 1080p to 4K at 8 Mbps. Compare how many bits each pixel gets.
        </p>
        <fieldset>
          <legend className="font-display font-semibold">Resolution</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {resolutions.map((x, i) => (
              <button
                key={x.id}
                type="button"
                className="ctl"
                aria-pressed={i === res}
                onClick={() => setRes(i)}
              >
                {x.id}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-6">
          <fieldset>
            <legend className="font-display font-semibold">Frames per second</legend>
            <div className="mt-2 flex gap-2">
              {fpsOptions.map((f) => (
                <button
                  key={f}
                  type="button"
                  className="ctl"
                  aria-pressed={f === fps}
                  onClick={() => setFps(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </fieldset>
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
        </div>
        <Slider
          label="Bitrate"
          display={`${mbps} Mbps`}
          valueText={`${mbps} megabits per second`}
          min={0}
          max={bitrates.length - 1}
          value={rateIdx}
          onValueChange={setRateIdx}
        />

        <dl className="grid grid-cols-2 gap-4 border-t border-line pt-4" aria-live="polite">
          <div>
            <dt className="label text-ink-soft">Pixels per second</dt>
            <dd className="font-display text-xl font-bold">{((r.w * r.h * fps) / 1e6).toFixed(1)} million</dd>
          </div>
          <div>
            <dt className="label text-ink-soft">Bits per pixel</dt>
            <dd className="font-display text-xl font-bold text-key-ink">{bpp.toFixed(3)}</dd>
          </div>
          <div>
            <dt className="label text-ink-soft">One minute of video</dt>
            <dd className="font-display text-xl font-bold">{Math.round(fileSizeMB(mbps, 60))} MB</dd>
          </div>
          <div>
            <dt className="label text-ink-soft">Likely look</dt>
            <dd className="font-display text-xl font-bold">{band.label}</dd>
          </div>
        </dl>
      </div>

      <div>
        <p className="label mb-2 text-ink-soft">Grass at this budget</p>
        <PixelBlock block={preview} />
        <ol className="mt-3 grid grid-cols-4 gap-1" aria-hidden="true">
          {['Starved', 'Soft', 'Good', 'Generous'].map((b, i) => (
            <li
              key={b}
              className={`rounded-sm py-1 text-center text-xs ${i === bandIndex ? 'bg-ink font-bold text-paper' : 'text-ink-soft'}`}
            >
              {b}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-ink-soft">{band.note}</p>
      </div>
    </div>
  )
}
