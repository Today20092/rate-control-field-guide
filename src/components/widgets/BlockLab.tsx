import { useMemo, useState } from 'react'
import { compress, samples, type Block, type SampleId } from '../../lib/dct'
import { Slider } from '@/components/ui/slider'
import CompareSlider from './CompareSlider'
import PixelBlock from './PixelBlock'

/** JPEG in one 8×8 block: pick a patch, lower the quality, watch the stored numbers turn to zeros. */

function Levels({ levels }: { levels: Block }) {
  return (
    <div className="grid aspect-square w-full grid-cols-8 rounded-md border border-line font-mono text-xs">
      {levels.flat().map((l, i) => (
        <span
          key={i}
          className={`flex items-center justify-center border-[0.5px] border-line transition-colors duration-300 ${l === 0 ? 'text-ink-faint' : 'bg-motion-wash font-bold text-motion-ink'}`}
        >
          {l}
        </span>
      ))}
    </div>
  )
}

export default function BlockLab() {
  const [sample, setSample] = useState<SampleId>('edge')
  const [quality, setQuality] = useState(50)
  const block = samples[sample].block
  const result = useMemo(() => compress(block, quality), [block, quality])

  return (
    <div>
      <div role="group" aria-label="Patch of picture" className="flex flex-wrap gap-2">
        {(Object.keys(samples) as SampleId[]).map((s) => (
          <button
            key={s}
            type="button"
            className="ctl"
            aria-pressed={s === sample}
            onClick={() => setSample(s)}
          >
            {samples[s].label}
          </button>
        ))}
      </div>

      <Slider
        className="mt-5"
        label="JPEG quality"
        display={`${quality} / 100`}
        min={1}
        max={100}
        value={quality}
        onValueChange={setQuality}
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-6">
        <div>
          <p className="label mb-2 text-ink-soft">What you see</p>
          <CompareSlider
            label="Compare the original patch with the rebuilt patch"
            beforeLabel="Original"
            afterLabel="Compressed"
            before={<PixelBlock block={block} />}
            after={<PixelBlock block={result.rebuilt} />}
          />
        </div>
        <div>
          <p className="label mb-2 text-motion-ink">What the file stores</p>
          <Levels levels={result.levels} />
        </div>
      </div>

      <p className="mt-5 font-display text-lg font-semibold" aria-live="polite">
        {result.kept} of 64 values are nonzero. The encoder can store runs of zeros in fewer bits.
      </p>
    </div>
  )
}
