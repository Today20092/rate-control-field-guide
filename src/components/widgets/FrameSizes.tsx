import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Slider } from '@/components/ui/slider'
import clip from '../../content/podcastFrames.json'
import { decodeSpan, kb, mb, rawBytes, summarize } from '../../lib/frames'
import type { FrameType } from '../../lib/gop'

/**
 * A real 10 s H.264 clip with one bar per frame under it, drawn to scale from the encoder's own output.
 * Switch between the picture and what the file stores for each frame (full picture or motion vectors).
 * Drag the slider or tap the strip to step frame by frame; the strip marks what the player must decode.
 */

const FRAMES = clip.types.length
const MAX = Math.max(...clip.bytes)
const { byType, total } = summarize(clip)
const names: Record<FrameType, string> = { I: 'I-frame (key frame)', P: 'P-frame', B: 'B-frame' }
const fill: Record<FrameType, string> = { I: 'fill-key', P: 'fill-ink', B: 'fill-graphite' }
const stores: Record<FrameType, string> = {
  I: 'It stores a full picture.',
  P: 'It stores motion arrows and a small fix, borrowed from earlier frames.',
  B: 'It stores motion arrows and a small fix, borrowed from frames before and after it.',
}
// Frame type as a border style too, never colour alone.
const border: Record<FrameType, string> = {
  I: 'outline-4 outline-key',
  P: 'outline-2 outline-ink',
  B: 'outline-2 outline-dashed outline-graphite',
}

type View = 'see' | 'stored'

export default function FrameSizes({ src, stored, poster }: { src: string; stored: string; poster: string }) {
  const seeRef = useRef<HTMLVideoElement>(null)
  const storedRef = useRef<HTMLVideoElement>(null)
  const videoFor = (v: View) => (v === 'see' ? seeRef : storedRef).current
  const [view, setView] = useState<View>('see')
  const [frame, setFrame] = useState(0)
  const type = clip.types[frame] as FrameType
  const span = decodeSpan(clip.types, frame)
  const decodes = span.to - span.from + 1

  // Follow the visible video frame by frame while it plays.
  useEffect(() => {
    const v = (view === 'see' ? seeRef : storedRef).current
    if (!v) return
    const toFrame = (index: number) => setFrame(Math.min(FRAMES - 1, index))
    if (typeof v.requestVideoFrameCallback !== 'function') {
      const onTime = () => toFrame(Math.floor(v.currentTime * clip.fps))
      v.addEventListener('timeupdate', onTime)
      return () => v.removeEventListener('timeupdate', onTime)
    }
    let id = 0
    const tick = (_: number, meta: VideoFrameCallbackMetadata) => {
      toFrame(Math.round(meta.mediaTime * clip.fps))
      id = v.requestVideoFrameCallback(tick)
    }
    id = v.requestVideoFrameCallback(tick)
    return () => v.cancelVideoFrameCallback(id)
  }, [view])

  function seek(f: number, to: View = view) {
    setFrame(f)
    seeRef.current?.pause()
    storedRef.current?.pause()
    const v = videoFor(to)
    if (v) v.currentTime = (f + 0.5) / clip.fps
  }

  function show(next: View) {
    setView(next)
    seek(frame, next)
  }

  function seekFromStrip(e: PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    seek(Math.max(0, Math.min(FRAMES - 1, Math.floor(((e.clientX - r.left) / r.width) * FRAMES))))
  }

  const videoProps = {
    poster,
    width: clip.width,
    height: clip.height,
    className: 'h-auto w-full bg-ink not-hidden:block',
    controls: true,
    playsInline: true,
  }

  return (
    <div>
      <div role="group" aria-label="Show" className="mb-3 flex flex-wrap gap-2">
        <button type="button" className="ctl" aria-pressed={view === 'see'} onClick={() => show('see')}>
          What you see
        </button>
        <button type="button" className="ctl" aria-pressed={view === 'stored'} onClick={() => show('stored')}>
          What the file stores
        </button>
      </div>

      <div className={`overflow-hidden rounded-md outline-offset-2 ${border[type]}`}>
        <video ref={seeRef} src={src} preload="metadata" hidden={view !== 'see'} muted {...videoProps} />
        <video
          ref={storedRef}
          src={stored}
          preload={view === 'stored' ? 'auto' : 'none'}
          hidden={view !== 'stored'}
          muted
          {...videoProps}
        />
      </div>
      {view === 'stored' && (
        <p className="label mt-2 text-ink-soft">
          Key frames show the picture. On other frames, dark means copied from an earlier frame, pale means
          the picture changed, and <span className="text-motion-ink">blue arrows</span> are the encoder’s real
          motion vectors.
        </p>
      )}

      <div className="relative mt-5">
        {/* The slider and the readout carry this for keyboard and screen-reader users. */}
        <svg
          viewBox={`0 0 ${FRAMES} 100`}
          preserveAspectRatio="none"
          className="block h-28 w-full cursor-pointer touch-none"
          aria-hidden="true"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            seekFromStrip(e)
          }}
          onPointerMove={(e) => e.buttons && seekFromStrip(e)}
        >
          <rect x={span.from} y={0} width={decodes} height={100} className="fill-motion-wash" />
          {clip.bytes.map((b, i) => {
            const t = clip.types[i] as FrameType
            const h = Math.max(1.2, (b / MAX) * 100)
            return (
              <rect
                key={i}
                x={i}
                y={100 - h}
                width={t === 'I' ? 2.5 : 0.8}
                height={h}
                className={`${fill[t]} ${i < span.from || i > span.to ? 'opacity-35' : ''}`}
              />
            )
          })}
          <line
            x1={frame + 0.4}
            x2={frame + 0.4}
            y1={0}
            y2={100}
            className="stroke-motion"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {[...clip.types].map((t, i) =>
          t === 'I' ? (
            <span
              key={i}
              className="label absolute -bottom-5 font-bold text-key-ink"
              style={{ left: `${(i / FRAMES) * 100}%` }}
              aria-hidden="true"
            >
              I
            </span>
          ) : null,
        )}
      </div>

      <div className="mt-8">
        <Slider
          label="Step through the frames"
          display={`Frame ${frame + 1} / ${FRAMES}`}
          valueText={`Frame ${frame + 1} of ${FRAMES}, ${names[type]}, ${kb(clip.bytes[frame])}`}
          min={0}
          max={FRAMES - 1}
          value={frame}
          onValueChange={(f) => seek(f)}
        />
      </div>

      <div className="mt-3 flex items-start gap-3">
        <b className={`frame-tag frame-tag-${type} mt-0.5`} aria-hidden="true">
          {type}
        </b>
        <p>
          <span className="block font-display text-lg font-semibold">
            {names[type]} · {kb(clip.bytes[frame])}
          </span>
          <span className="mt-1 block text-ink-soft">
            {stores[type]}{' '}
            {type === 'I'
              ? 'The player can show it straight away.'
              : `To show it, the player decodes ${decodes} frames, starting from the key frame at frame ${span.from + 1} (shaded blue).`}
          </span>
        </p>
      </div>

      <dl className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-4">
        {(['I', 'P', 'B'] as const).map((t) => (
          <div key={t}>
            <dt className="label flex items-center gap-2 text-ink-soft">
              <b className={`frame-tag frame-tag-${t}`} aria-hidden="true">
                {t}
              </b>
              Average {names[t]}
            </dt>
            <dd className="mt-1 font-display text-2xl font-bold">
              {kb(byType[t].avg)}{' '}
              <span className="text-base font-semibold text-ink-soft">× {byType[t].count}</span>
            </dd>
          </div>
        ))}
        <div>
          <dt className="label text-ink-soft">Whole clip</dt>
          <dd className="mt-1 font-display text-2xl font-bold">
            {mb(total)}{' '}
            <span className="text-base font-semibold text-ink-soft">raw: {mb(rawBytes(clip))}</span>
          </dd>
        </div>
      </dl>
    </div>
  )
}
