/**
 * Delivery codecs (long GOP) against editing codecs (every frame whole), for 3840×2160 at 29.97 fps.
 * Approximate: ProRes rates are Apple's published 1080p targets scaled by four for UHD; DNxHR HQ is
 * Avid's published UHD rate; H.264 is a typical camera setting. Real files vary with the picture.
 */
export interface EditingCodec {
  id: string
  name: string
  kind: 'long-gop' | 'intra'
  mbps: number
}

export const editingCodecs: EditingCodec[] = [
  { id: 'h264', name: 'H.264 camera file', kind: 'long-gop', mbps: 100 },
  { id: 'proxy', name: 'ProRes 422 Proxy', kind: 'intra', mbps: 180 },
  { id: 'prores', name: 'ProRes 422', kind: 'intra', mbps: 588 },
  { id: 'prores-hq', name: 'ProRes 422 HQ', kind: 'intra', mbps: 880 },
  { id: 'dnxhr-hq', name: 'DNxHR HQ', kind: 'intra', mbps: 873 },
]

/** Gigabytes for one hour at `mbps` megabits per second (decimal GB, as drives are sold). */
export const gbPerHour = (mbps: number) => Math.round((mbps * 3600) / 8 / 1000)
