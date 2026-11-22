// Cuts a real clip and measures it: the clip the site plays, a copy with its first key frame deleted
// (for the Remotion video), a "what the file stores" view, a poster, and every frame's real type and size.
// Usage: node scripts/make-clips.mjs <source video> <start seconds> [seconds=10]
// Needs ffmpeg and ffprobe on PATH. The source footage stays outside the repo.
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const [src, start, seconds = '10'] = process.argv.slice(2)
if (!src || !start) {
  console.error('Usage: node scripts/make-clips.mjs <source video> <start seconds> [seconds=10]')
  process.exit(1)
}

const KEY_INTERVAL = 150 // two key frames in a 10 s clip, so the strip and the video show the reset
const ff = (...args) =>
  execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...args], { stdio: 'inherit' })
const probe = (...args) => execFileSync('ffprobe', ['-v', 'error', ...args], { encoding: 'utf8' })
const countFrames = (file) =>
  probe(
    '-count_frames',
    '-select_streams',
    'v',
    '-show_entries',
    'stream=nb_read_frames',
    '-of',
    'csv=p=0',
    file,
  )

mkdirSync('public/video', { recursive: true })
mkdirSync('remotion/public', { recursive: true })
const clip = 'public/video/podcast.mp4'

// The clip a beginner would get from a normal export: H.264, B-frames on, fixed key-frame interval.
ff(
  ...['-ss', start, '-t', seconds, '-i', src, '-an', '-vf', 'scale=1280:-2'],
  ...['-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'],
  ...['-x264-params', `keyint=${KEY_INTERVAL}:min-keyint=${KEY_INTERVAL}:scenecut=0:bframes=3`],
  clip,
)
ff('-i', clip, '-frames:v', '1', '-q:v', '4', 'public/video/podcast.jpg')
copyFileSync(clip, 'remotion/public/podcast.mp4')

// Every frame in display order: picture type and packet size in bytes.
const rows = probe(
  '-select_streams',
  'v',
  '-show_entries',
  'frame=pict_type,pkt_size',
  '-of',
  'csv=p=0',
  clip,
)
  .trim()
  .split(/\r?\n/)
  .map((line) => line.split(','))
const types = rows.map(([, type]) => type).join('')
const bytes = rows.map(([size]) => Number(size))
const { width, height, r_frame_rate } = JSON.parse(
  probe('-select_streams', 'v', '-show_entries', 'stream=width,height,r_frame_rate', '-of', 'json', clip),
).streams[0]
const [num, den] = r_frame_rate.split('/').map(Number)

assert.match(types, /^I[IPB]+$/, `unexpected frame types: ${types.slice(0, 20)}`)
assert.ok(
  bytes.every((b) => b > 0),
  'every frame needs a size',
)
assert.equal(
  types.split('I').length - 1,
  Math.ceil(types.length / KEY_INTERVAL),
  'key frames at the fixed interval',
)

// Drop the first packet (the key frame), then decode anyway. FFmpeg paints the missing reference grey,
// so only what the P and B frames change shows up until the next key frame.
const dropped = 'remotion/public/dropped.tmp.mp4'
ff('-i', clip, '-c', 'copy', '-bsf:v', 'noise=drop=eq(n\\,0)', dropped)
ff(
  ...['-flags2', '+showall', '-flags', '+output_corrupt', '-i', dropped],
  ...[
    '-fps_mode',
    'cfr',
    '-frames:v',
    String(types.length),
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
  ],
  ...['-movflags', '+faststart', 'remotion/public/podcast-no-key.mp4'],
)
rmSync(dropped)
const noKeyFrames = countFrames('remotion/public/podcast-no-key.mp4')
assert.equal(parseInt(noKeyFrames), types.length, 'no-key copy keeps every frame slot')

// "What the file stores": key frames show the picture; every other frame shows the encoder's own motion
// vectors (blue) over a dark sheet where only the pixels that changed since the last frame are pale.
// Lone dots (blocks with a zero-length vector, i.e. copied unchanged) are filtered out of the arrows.
// Saved with every frame a key frame, so dragging through it never waits on a decode chain.
const motionBlue = readFileSync('src/styles/global.css', 'utf8').match(
  /--color-motion:\s*#([0-9a-fA-F]{6})/,
)[1]
const keyFrames = [...types].flatMap((t, i) => (t === 'I' ? [`eq(n,${i})`] : [])).join('+')
const stored = 'public/video/podcast-stored.mp4'
ff(
  ...['-flags2', '+export_mvs', '-i', clip, '-filter_complex'],
  [
    '[0:v]split=4[pic][d1][d2][m]',
    '[d1]format=gray[cur]',
    '[d2]format=gray,tpad=start=1:start_mode=clone[prev]',
    "[cur][prev]blend=all_mode=difference:shortest=1,lut=y='min(255,48+val*4)',format=yuv420p[base]",
    "[m]lutyuv=y=0:u=128:v=128,codecview=mv=pf+bf+bb:mv_type=fp+bp,format=gray,lut=y='if(gt(val,40),255,0)',split[ma][mb]",
    "[mb]convolution=0m='1 1 1 1 1 1 1 1 1':0rdiv=1/9,lut=y='if(gte(val,56),255,0)'[nb]",
    '[ma][nb]blend=all_mode=multiply,dilation[mask]',
    `color=c=0x${motionBlue}:s=${width}x${height}:r=${r_frame_rate},format=yuva420p[blue]`,
    '[blue][mask]alphamerge[arrows]',
    '[base][arrows]overlay=shortest=1:eof_action=pass[motion]',
    `[pic][motion]overlay=enable='not(${keyFrames})':eof_action=pass[out]`,
  ].join(';'),
  ...['-map', '[out]', '-frames:v', String(types.length), '-c:v', 'libx264', '-preset', 'slow'],
  ...['-crf', '26', '-x264-params', 'keyint=1', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', stored],
)
assert.equal(parseInt(countFrames(stored)), types.length, 'stored view keeps every frame')

writeFileSync(
  'src/content/podcastFrames.json',
  JSON.stringify({ fps: num / den, width, height, keyInterval: KEY_INTERVAL, types, bytes }) + '\n',
)
console.log(`${types.length} frames, ${(bytes.reduce((a, b) => a + b, 0) / 1e6).toFixed(2)} MB`)
