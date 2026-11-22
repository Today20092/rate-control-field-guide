/** 8×8 DCT and JPEG-style quantization: the real maths behind "throw away detail you won't notice". */

export type Block = number[][] // 8 rows × 8 columns, values 0–255 (or coefficients)

const N = 8
const c = (k: number) => (k === 0 ? Math.SQRT1_2 : 1)

export function dct(block: Block): Block {
  const out: Block = []
  for (let v = 0; v < N; v++) {
    out.push([])
    for (let u = 0; u < N; u++) {
      let sum = 0
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++)
          sum +=
            (block[y][x] - 128) *
            Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
            Math.cos(((2 * y + 1) * v * Math.PI) / 16)
      out[v].push((c(u) * c(v) * sum) / 4)
    }
  }
  return out
}

export function idct(coeffs: Block): Block {
  const out: Block = []
  for (let y = 0; y < N; y++) {
    out.push([])
    for (let x = 0; x < N; x++) {
      let sum = 0
      for (let v = 0; v < N; v++)
        for (let u = 0; u < N; u++)
          sum +=
            c(u) *
            c(v) *
            coeffs[v][u] *
            Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
            Math.cos(((2 * y + 1) * v * Math.PI) / 16)
      out[y].push(Math.max(0, Math.min(255, sum / 4 + 128)))
    }
  }
  return out
}

/** The standard JPEG luminance table (ITU-T T.81 Annex K). */
const BASE = [
  [16, 11, 10, 16, 24, 40, 51, 61],
  [12, 12, 14, 19, 26, 58, 60, 55],
  [14, 13, 16, 24, 40, 57, 69, 56],
  [14, 17, 22, 29, 51, 87, 80, 62],
  [18, 22, 37, 56, 68, 109, 103, 77],
  [24, 35, 55, 64, 81, 104, 113, 92],
  [49, 64, 78, 87, 103, 121, 120, 101],
  [72, 92, 95, 98, 112, 100, 103, 99],
]

/** Scale the table for a 1–100 quality setting, as libjpeg does. */
export function quantTable(quality: number): Block {
  const q = Math.max(1, Math.min(100, quality))
  const scale = q < 50 ? 5000 / q : 200 - 2 * q
  return BASE.map((row) => row.map((v) => Math.max(1, Math.floor((v * scale + 50) / 100))))
}

export interface Compressed {
  levels: Block // what gets stored: rounded, mostly zeros
  rebuilt: Block // what the viewer sees
  kept: number // non-zero levels out of 64
}

export function compress(block: Block, quality: number): Compressed {
  const table = quantTable(quality)
  const levels = dct(block).map((row, v) => row.map((value, u) => Math.round(value / table[v][u])))
  const rebuilt = idct(levels.map((row, v) => row.map((level, u) => level * table[v][u])))
  const kept = levels.flat().filter((l) => l !== 0).length
  return { levels, rebuilt, kept }
}

const make = (f: (x: number, y: number) => number): Block =>
  Array.from({ length: N }, (_, y) => Array.from({ length: N }, (_, x) => Math.round(f(x, y))))

/** Three sample 8×8 patches: what sky, an edge and texture look like to the encoder. */
export const samples = {
  sky: { label: 'Smooth sky', block: make((x, y) => 150 + x * 4 + y * 6) },
  edge: { label: 'Sharp edge', block: make((x, y) => (x + y * 0.4 < 4.5 ? 60 : 210)) },
  texture: {
    label: 'Grass texture',
    block: make((x, y) => 128 + 70 * Math.sin(x * 2.1 + y * 0.7) * Math.cos(y * 1.9 - x * 0.4)),
  },
}
export type SampleId = keyof typeof samples
