import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import type React from 'react'
import { cn } from '@/lib/utils'

// From the cnippet registry (@cnippet/slider), restyled for this guide: a labelled single-thumb slider
// with the current value printed on the right, a 44px hit area, an ink track and a red thumb.

export function Slider({
  label,
  display,
  valueText,
  className,
  ...props
}: Omit<SliderPrimitive.Root.Props<number>, 'children'> & {
  label: React.ReactNode
  /** The value as printed next to the label, e.g. "QP 28". Also spoken unless `valueText` is set. */
  display: string
  /** A longer spoken value for screen readers. */
  valueText?: string
}): React.ReactElement {
  return (
    <SliderPrimitive.Root className={cn('w-full', className)} thumbAlignment="edge" {...props}>
      <div className="flex items-baseline justify-between gap-4">
        <SliderPrimitive.Label className="font-display font-semibold">{label}</SliderPrimitive.Label>
        <span className="label whitespace-nowrap text-key-ink" aria-hidden="true">
          {display}
        </span>
      </div>
      <SliderPrimitive.Control
        className="flex min-h-11 w-full cursor-pointer touch-none items-center select-none data-disabled:pointer-events-none data-disabled:opacity-50"
        data-slot="slider-control"
      >
        <SliderPrimitive.Track
          className="relative h-1.5 w-full rounded-full bg-input"
          data-slot="slider-track"
        >
          <SliderPrimitive.Indicator className="rounded-full bg-ink" data-slot="slider-indicator" />
          <SliderPrimitive.Thumb
            getAriaValueText={() => valueText ?? display}
            className="block size-6 rounded-full border-2 border-sheet bg-key shadow-[0_1px_4px] shadow-ink/35 transition-[scale] duration-150 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-motion data-dragging:scale-115"
            data-slot="slider-thumb"
          />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}
