/** A teaching model of encoder trade-offs. Scores are 0–100 and illustrative, not benchmarks. */
import type { Codec } from './bitrate'

export const presets = ['ultrafast', 'veryfast', 'fast', 'medium', 'slow', 'veryslow'] as const

export interface Outcome {
  size: number // file size (higher = bigger file)
  quality: number // visual quality
  encode: number // time to encode
  decode: number // work for the playing device
}

/**
 * `effort` is the preset index (0 = ultrafast). `crf` is the quality target (lower = better, bigger).
 * Slower presets search harder, so the same quality target produces a smaller file.
 * H.265 compresses further at the same target but costs more to encode and decode.
 */
export function outcome(codec: Codec, effort: number, crf: number): Outcome {
  const h265 = codec === 'h265'
  const e = effort / (presets.length - 1) // 0..1
  // Each 6 CRF steps roughly halves or doubles the size.
  const sizeFromCrf = 2 ** ((23 - crf) / 6)
  const size = sizeFromCrf * (1.35 - 0.45 * e) * (h265 ? 0.62 : 1)
  const quality = 100 - (crf - 12) * 2.6 + e * 4
  const encode = (8 + 92 * e ** 1.6) * (h265 ? 1.9 : 1) * (1 + (30 - crf) / 60)
  const decode = (h265 ? 62 : 38) + (30 - crf) * 0.6
  const clamp = (v: number) => Math.round(Math.max(2, Math.min(100, v)))
  return {
    size: clamp(size * 38),
    quality: clamp(quality),
    encode: clamp(encode / 1.9),
    decode: clamp(decode),
  }
}
