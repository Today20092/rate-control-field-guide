/** Group of pictures (GOP): which frames are I, P or B, and what each costs. Sizes are a teaching model. */

export type FrameType = 'I' | 'P' | 'B'

export interface Frame {
  index: number // display order, 0-based
  type: FrameType
  bits: number // relative size; an I-frame is 100
  refs: number[] // display indices this frame copies from
}

/** Relative sizes for a typical moving scene. Real ratios vary with content; these are illustrative. */
export const FRAME_BITS: Record<FrameType, number> = { I: 100, P: 28, B: 11 }

/**
 * Build `count` frames with a key frame every `keyInterval` frames and up to `bFrames` B-frames
 * between reference frames. `keyInterval = 1` means intra-only (every frame a full picture).
 */
export function buildGop(count: number, keyInterval: number, bFrames: number): Frame[] {
  const types: FrameType[] = Array.from({ length: count }, (_, i) => {
    const pos = i % keyInterval
    if (pos === 0) return 'I'
    // References land every (bFrames + 1) frames; the final frame of a GOP is always a reference.
    const isRef = pos % (bFrames + 1) === 0 || pos === keyInterval - 1 || i === count - 1
    return isRef ? 'P' : 'B'
  })
  const refIndices = types.flatMap((t, i) => (t === 'B' ? [] : [i]))
  return types.map((type, index) => {
    const prev = [...refIndices].reverse().find((r) => r < index)
    const next = refIndices.find((r) => r > index)
    const refs =
      type === 'I' ? [] : type === 'P' ? [prev!] : ([prev, next].filter((r) => r !== undefined) as number[])
    return { index, type, bits: FRAME_BITS[type], refs }
  })
}

/** Decode order: each reference frame must arrive before the B-frames that point forward to it. */
export function decodeOrder(frames: Frame[]): Frame[] {
  const out: Frame[] = []
  let pendingB: Frame[] = []
  for (const f of frames) {
    if (f.type === 'B') pendingB.push(f)
    else {
      out.push(f, ...pendingB)
      pendingB = []
    }
  }
  return [...out, ...pendingB]
}

/** Frames (display indices, ascending) a player must decode to show frame `target` after a jump. */
export function framesNeeded(frames: Frame[], target: number): number[] {
  const needed = new Set<number>()
  const visit = (i: number) => {
    if (needed.has(i)) return
    needed.add(i)
    frames[i].refs.forEach(visit)
  }
  visit(target)
  return [...needed].sort((a, b) => a - b)
}

export const seekCost = (frames: Frame[], target: number) => framesNeeded(frames, target).length

export const totalBits = (frames: Frame[]) => frames.reduce((sum, f) => sum + f.bits, 0)
