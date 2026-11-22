/** Summaries of a real encode's frames (from scripts/make-clips.mjs): measured, not a teaching model. */
import type { FrameType } from './gop.ts'

export interface MeasuredClip {
  fps: number
  width: number
  height: number
  keyInterval: number
  types: string // one letter per frame, display order
  bytes: number[] // size of each frame in bytes
}

/** Count and average size of each frame type, plus the whole clip's size. */
export function summarize(clip: MeasuredClip) {
  const byType = { I: { count: 0, avg: 0 }, P: { count: 0, avg: 0 }, B: { count: 0, avg: 0 } }
  for (let i = 0; i < clip.bytes.length; i++) {
    const t = byType[clip.types[i] as FrameType]
    t.count++
    t.avg += clip.bytes[i]
  }
  for (const t of Object.values(byType)) t.avg = t.count ? t.avg / t.count : 0
  return { byType, total: clip.bytes.reduce((a, b) => a + b, 0) }
}

/** Size of the same frames stored as raw 8-bit 4:2:0 pictures (1.5 bytes per pixel). */
export const rawBytes = (clip: MeasuredClip) => clip.width * clip.height * 1.5 * clip.types.length

export const kb = (bytes: number) => `${(bytes / 1000).toFixed(bytes < 10_000 ? 1 : 0)} KB`
export const mb = (bytes: number) => `${(bytes / 1e6).toFixed(bytes < 1e7 ? 2 : 0)} MB`

/**
 * Frames the player must decode to show frame `i` of a closed-GOP clip: everything from the last key
 * frame up to `i`, and for a B-frame also the next reference frame, which is sent before it.
 */
export function decodeSpan(types: string, i: number) {
  const from = types.lastIndexOf('I', i)
  let to = i
  if (types[i] === 'B') while (to < types.length - 1 && types[to] === 'B') to++
  return { from, to }
}
