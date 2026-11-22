import { useState } from 'react'
import CompareSlider from './CompareSlider'

/** One real H.264 frame at four QP levels: swipe between the finest and a chosen level, and zoom in. */

export interface QpImage {
  qp: number
  src: string
  note: string
}

const views = [
  { label: 'Whole frame', zoom: 1, x: 50, y: 50 },
  { label: 'Face', zoom: 4, x: 27, y: 33 },
  { label: 'Lettering', zoom: 4, x: 60, y: 85 },
  { label: 'Posters', zoom: 4, x: 85, y: 18 },
]

function Layer({ src, view }: { src: string; view: (typeof views)[number] }) {
  return (
    <div
      className="aspect-[1280/676] w-full bg-no-repeat transition-[background-size,background-position] duration-500 ease-(--ease-out-expo)"
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: `${view.zoom * 100}%`,
        backgroundPosition: `${view.x}% ${view.y}%`,
      }}
    />
  )
}

export default function QualityLens({ images }: { images: QpImage[] }) {
  const [level, setLevel] = useState(images.length - 1)
  const [viewIndex, setViewIndex] = useState(0)
  const best = images[0]
  const image = images[level]
  const view = views[viewIndex]

  return (
    <div>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <div role="group" aria-label="Right side shows" className="flex flex-wrap gap-2">
          {images.slice(1).map((img, i) => (
            <button
              key={img.qp}
              type="button"
              className="ctl"
              aria-pressed={i + 1 === level}
              onClick={() => setLevel(i + 1)}
            >
              QP {img.qp}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Zoom" className="flex flex-wrap gap-2">
          {views.map((v, i) => (
            <button
              key={v.label}
              type="button"
              className="ctl"
              aria-pressed={i === viewIndex}
              onClick={() => setViewIndex(i)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <CompareSlider
        className="mt-4"
        label={`Compare QP ${best.qp} with QP ${image.qp}`}
        beforeLabel={`QP ${best.qp}`}
        afterLabel={`QP ${image.qp}`}
        before={<Layer src={best.src} view={view} />}
        after={<Layer src={image.src} view={view} />}
      />
      <p className="label mt-2 text-ink-faint">Drag across the picture to compare.</p>

      <p className="mt-3 font-display text-lg font-semibold" aria-live="polite">
        QP {image.qp}: {image.note}
      </p>
      <p className="sr-only">
        A video frame of two people at a table, encoded with H.264 at QP {best.qp} on the left and QP{' '}
        {image.qp} on the right.
      </p>
    </div>
  )
}
