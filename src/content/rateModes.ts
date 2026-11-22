/** Rate-control modes: what each one promises and what it lets move. Curves are illustrative shapes. */
import type { Codec } from '../lib/bitrate'

export type ModeId = 'crf' | 'cqp' | 'vbr' | 'cbr'
export type BufferState = 'empty' | 'steady' | 'strained' | 'overflow'

export interface Mode {
  id: ModeId
  name: string
  longName: string
  promise: string
  moves: string
  useWhen: string
  avoidWhen: string
  bitrate: number[] // 0–10 per scene
  quality: number[] // 0–10 per scene
  buffer: BufferState // a streaming buffer during the hardest scene
}

/** How hard each scene is to compress, over time. */
export const complexity = [3, 5, 2, 8, 6, 9, 4, 7, 3, 8, 5, 7]

export const modes: Mode[] = [
  {
    id: 'crf',
    name: 'CRF',
    longName: 'Constant rate factor',
    promise: 'Aim for consistent visual quality.',
    moves: 'Bitrate and file size can vary.',
    useWhen: 'Uploads, archives and local files where you care most about consistent quality.',
    avoidWhen: 'You need a guaranteed file size or must stay under a network limit.',
    bitrate: complexity,
    quality: complexity.map(() => 8),
    buffer: 'overflow',
  },
  {
    id: 'cqp',
    name: 'CQP',
    longName: 'Constant quantizer',
    promise: 'Use a fixed quantizer setting.',
    moves: 'File size and quality can vary.',
    useWhen: 'Tests and comparisons that need a fixed quantizer, or fast intermediate captures.',
    avoidWhen: 'You want predictable size or steady perceived quality.',
    bitrate: complexity.map((c) => Math.min(10, c * 1.15)),
    quality: complexity.map((c) => 8.6 - c * 0.25),
    buffer: 'overflow',
  },
  {
    id: 'vbr',
    name: 'VBR',
    longName: 'Variable bitrate',
    promise: 'Hit an average bitrate or a file-size budget.',
    moves: 'Bitrate varies by scene around the target average.',
    useWhen: 'You know the target size or average bitrate. Two-pass VBR hits it most closely.',
    avoidWhen: 'Live streaming with a strict moment-to-moment limit.',
    bitrate: [4, 5, 3, 7, 6, 8, 4, 7, 4, 7, 5, 6],
    quality: complexity.map((c) => 8 - Math.max(0, c - 7) * 0.5),
    buffer: 'strained',
  },
  {
    id: 'cbr',
    name: 'CBR',
    longName: 'Constant bitrate',
    promise: 'Keep the data rate steady.',
    moves: 'Hard scenes can lose more detail.',
    useWhen: 'Live streams and broadcast, where the connection has a bitrate limit.',
    avoidWhen: 'Files where you want to give harder scenes more bits.',
    bitrate: complexity.map(() => 6),
    quality: complexity.map((c) => 9.5 - c * 0.55),
    buffer: 'steady',
  },
]

/** `fill` is how full the player's buffer tank is drawn (0–1); overflow spills over the top. */
export const bufferStates: { id: BufferState; label: string; fill: number }[] = [
  { id: 'empty', label: 'Empty: viewer waits', fill: 0.06 },
  { id: 'steady', label: 'Steady', fill: 0.5 },
  { id: 'strained', label: 'Strained', fill: 0.82 },
  { id: 'overflow', label: 'Overflow: spikes too big', fill: 1 },
]

export const commands: Record<Codec, Record<ModeId, string>> = {
  h264: {
    crf: 'ffmpeg -i input.mp4 -c:v libx264 -preset medium -crf 23 output.mp4',
    cqp: 'ffmpeg -i input.mp4 -c:v libx264 -qp 20 output.mp4',
    vbr: 'ffmpeg -i input.mp4 -c:v libx264 -b:v 5M output.mp4',
    cbr: 'ffmpeg -i input.mp4 -c:v libx264 -b:v 5M -maxrate 5M -bufsize 10M output.mp4',
  },
  h265: {
    crf: 'ffmpeg -i input.mp4 -c:v libx265 -preset medium -crf 28 output.mp4',
    cqp: 'ffmpeg -i input.mp4 -c:v libx265 -x265-params qp=20 output.mp4',
    vbr: 'ffmpeg -i input.mp4 -c:v libx265 -b:v 5M output.mp4',
    cbr: 'ffmpeg -i input.mp4 -c:v libx265 -b:v 5M -maxrate 5M -bufsize 10M output.mp4',
  },
}
