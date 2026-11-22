import { useId, useRef, useState, type PointerEvent, type ReactNode } from 'react'

/**
 * Before/after swipe: drag anywhere on the picture (or use the arrow keys) to move the divider.
 * Both layers must render at the same size. The left layer shows `before`, the right layer `after`.
 */
export default function CompareSlider({
  before,
  after,
  beforeLabel,
  afterLabel,
  label,
  className = '',
}: {
  before: ReactNode
  after: ReactNode
  beforeLabel: string
  afterLabel: string
  /** What the reader compares, for screen readers. */
  label: string
  className?: string
}) {
  const [split, setSplit] = useState(50)
  const box = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const id = useId()

  function moveTo(e: PointerEvent) {
    const r = box.current?.getBoundingClientRect()
    if (!r) return
    setSplit(Math.round(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))))
  }

  return (
    <div className={`group relative ${className}`}>
      <div
        ref={box}
        className="relative cursor-ew-resize touch-pan-y overflow-hidden rounded-md select-none"
        onPointerDown={(e) => {
          dragging.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          moveTo(e)
        }}
        onPointerMove={(e) => dragging.current && moveTo(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <div aria-hidden="true">{after}</div>
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
          aria-hidden="true"
        >
          {before}
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-sheet shadow-[0_0_0_1px] shadow-ink/40"
          style={{ left: `${split}%` }}
          aria-hidden="true"
        >
          <span className="absolute top-1/2 left-1/2 grid size-10 -translate-1/2 place-items-center rounded-full border-2 border-sheet bg-ink text-paper shadow-[0_2px_6px] shadow-ink/30 group-has-focus-visible:outline-3 group-has-focus-visible:outline-offset-2 group-has-focus-visible:outline-motion">
            <svg width="20" height="12" viewBox="0 0 20 12" fill="currentColor">
              <path d="M0 6l6-5v10zM20 6l-6-5v10z" />
            </svg>
          </span>
        </div>
        <span className="label pointer-events-none absolute top-2 left-2 rounded-sm bg-ink/80 px-1.5 py-0.5 text-paper">
          {beforeLabel}
        </span>
        <span className="label pointer-events-none absolute top-2 right-2 rounded-sm bg-ink/80 px-1.5 py-0.5 text-paper">
          {afterLabel}
        </span>
      </div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="range"
        className="sr-only"
        min={0}
        max={100}
        value={split}
        aria-valuetext={`${split}% ${beforeLabel}, ${100 - split}% ${afterLabel}`}
        onChange={(e) => setSplit(Number(e.target.value))}
      />
    </div>
  )
}
