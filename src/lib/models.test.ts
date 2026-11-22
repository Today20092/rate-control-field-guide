import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compress, dct, idct, samples } from './dct.ts'
import { buildGop, decodeOrder, seekCost, totalBits } from './gop.ts'
import { bitsPerPixel, fileSizeMB, qualityBand } from './bitrate.ts'
import { outcome } from './tradeoffs.ts'
import { decodeSpan, rawBytes, summarize } from './frames.ts'

test('DCT round-trips a block', () => {
  const back = idct(dct(samples.texture.block))
  back.forEach((row, y) => row.forEach((v, x) => assert.ok(Math.abs(v - samples.texture.block[y][x]) < 0.01)))
})

test('lower quality keeps fewer coefficients', () => {
  assert.ok(compress(samples.texture.block, 10).kept < compress(samples.texture.block, 90).kept)
  assert.ok(compress(samples.sky.block, 50).kept < compress(samples.texture.block, 50).kept)
})

test('GOP pattern, decode order and seeking', () => {
  const frames = buildGop(12, 12, 2)
  assert.equal(frames.map((f) => f.type).join(''), 'IBBPBBPBBPBP')
  assert.deepEqual(frames[1].refs, [0, 3])
  assert.deepEqual(
    decodeOrder(frames)
      .slice(0, 4)
      .map((f) => f.index),
    [0, 3, 1, 2],
  )
  assert.equal(seekCost(frames, 0), 1)
  assert.equal(seekCost(frames, 1), 3) // B needs I0 and P3
  assert.ok(totalBits(buildGop(12, 1, 0)) > totalBits(frames) * 2)
})

test('bitrate arithmetic', () => {
  assert.equal(fileSizeMB(8, 60), 60)
  assert.ok(Math.abs(bitsPerPixel(8, 1920, 1080, 30) - 0.1286) < 0.001)
  assert.equal(qualityBand(0.03, 'h264').id, 'starved')
  assert.equal(qualityBand(0.03, 'h265').id, 'soft')
})

test('trade-off directions', () => {
  assert.ok(outcome('h264', 5, 23).size < outcome('h264', 0, 23).size)
  assert.ok(outcome('h264', 5, 23).encode > outcome('h264', 0, 23).encode)
  assert.ok(outcome('h265', 3, 23).size < outcome('h264', 3, 23).size)
  assert.ok(outcome('h265', 3, 23).decode > outcome('h264', 3, 23).decode)
})

test('measured clip summary', () => {
  const clip = { fps: 30, width: 4, height: 2, keyInterval: 4, types: 'IBBP', bytes: [100, 10, 20, 40] }
  const { byType, total } = summarize(clip)
  assert.deepEqual(byType, { I: { count: 1, avg: 100 }, P: { count: 1, avg: 40 }, B: { count: 2, avg: 15 } })
  assert.equal(total, 170)
  assert.equal(rawBytes(clip), 4 * 2 * 1.5 * 4)
})

test('decode span of a measured clip', () => {
  assert.deepEqual(decodeSpan('IBBPBBPIBP', 0), { from: 0, to: 0 })
  assert.deepEqual(decodeSpan('IBBPBBPIBP', 1), { from: 0, to: 3 })
  assert.deepEqual(decodeSpan('IBBPBBPIBP', 6), { from: 0, to: 6 })
  assert.deepEqual(decodeSpan('IBBPBBPIBP', 8), { from: 7, to: 9 })
})
