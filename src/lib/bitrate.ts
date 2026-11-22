/** Bitrate arithmetic (exact) and quality bands (a teaching model, labelled as such in the UI). */

export type Codec = 'h264' | 'h265'

export const resolutions = [
  { id: '480p', w: 854, h: 480 },
  { id: '720p', w: 1280, h: 720 },
  { id: '1080p', w: 1920, h: 1080 },
  { id: '1440p', w: 2560, h: 1440 },
  { id: '4K', w: 3840, h: 2160 },
] as const

/** Bits available for each pixel of each frame. */
export function bitsPerPixel(mbps: number, w: number, h: number, fps: number): number {
  return (mbps * 1_000_000) / (w * h * fps)
}

/** File size in megabytes for a duration in seconds. */
export function fileSizeMB(mbps: number, seconds: number): number {
  return (mbps * seconds) / 8
}

export interface Band {
  id: 'starved' | 'soft' | 'good' | 'generous'
  label: string
  note: string
}

const BANDS: Band[] = [
  { id: 'starved', label: 'Starved', note: 'Blocks and smeared detail, especially in motion.' },
  { id: 'soft', label: 'Soft', note: 'Watchable, but fine texture turns to mush.' },
  { id: 'good', label: 'Good', note: 'Most people see a clean picture.' },
  { id: 'generous', label: 'Generous', note: 'Extra bits buy little you can see.' },
]

/**
 * Rough bits-per-pixel bands for moderately complex 8-bit footage. H.265 reaches the same look with
 * roughly 40% fewer bits. shortcut: one curve for all content; real needs swing widely with motion and grain.
 */
export function qualityBand(bpp: number, codec: Codec): Band {
  const scaled = codec === 'h265' ? bpp / 0.6 : bpp
  if (scaled < 0.04) return BANDS[0]
  if (scaled < 0.08) return BANDS[1]
  if (scaled < 0.16) return BANDS[2]
  return BANDS[3]
}

/** Map bits per pixel to a JPEG-style quality for the preview patch (illustrative). */
export function previewQuality(bpp: number, codec: Codec): number {
  const scaled = codec === 'h265' ? bpp / 0.6 : bpp
  return Math.round(Math.max(3, Math.min(95, 8 + Math.log2(scaled / 0.01) * 18)))
}
