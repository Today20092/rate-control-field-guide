import type { Block } from '../../lib/dct'

/** Draws an 8×8 block of 0–255 values as grey squares (ink at varying opacity on white). */
export default function PixelBlock({ block, label }: { block: Block; label?: string }) {
  return (
    <svg
      viewBox="0 0 8 8"
      className="aspect-square w-full rounded-md border border-line"
      shapeRendering="crispEdges"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <rect width="8" height="8" fill="var(--color-sheet)" />
      {block.flatMap((row, y) =>
        row.map((v, x) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="1"
            height="1"
            fill="var(--color-ink)"
            fillOpacity={1 - v / 255}
          />
        )),
      )}
    </svg>
  )
}
