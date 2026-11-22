import { useEffect, useState } from 'react'
import {
  AbsoluteFill,
  Easing,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion'
import { Video } from '@remotion/media'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/jetbrains-mono'
import tokenCss from '../src/styles/global.css?raw'
import clip from '../src/content/podcastFrames.json'

/**
 * "What if the key frame goes missing?" A real 10 s H.264 clip plays normally for one GOP, then again with
 * its first key frame deleted: only what the P and B frames change gets painted, until the next key frame.
 */

// Colours come from the site's token file, so the video and the page never drift apart.
const color = Object.fromEntries(
  [...tokenCss.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{3,8})/g)].map((m) => [m[1], m[2]]),
) as Record<string, string>

const DISPLAY = '"Bricolage Grotesque Variable", sans-serif'
const MONO = '"JetBrains Mono Variable", monospace'
const TITLE = 45 // frames
const GOP = clip.keyInterval
const FRAMES = clip.types.length
export const NO_KEY_DURATION = TITLE + GOP + FRAMES

const ease = Easing.bezier(0.16, 1, 0.3, 1)
const fade = (frame: number, start: number) =>
  interpolate(frame, [start, start + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  })

function useFonts() {
  const [handle] = useState(() => delayRender('fonts'))
  useEffect(() => {
    Promise.all([document.fonts.load(`700 40px ${DISPLAY}`), document.fonts.load(`400 16px ${MONO}`)]).then(
      () => continueRender(handle),
    )
  }, [handle])
}

function Title() {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill
      style={{ background: color.paper, color: color.ink, justifyContent: 'center', padding: 96 }}
    >
      <div style={{ opacity: fade(frame, 0), fontFamily: DISPLAY, fontWeight: 700, fontSize: 64 }}>
        What if the key frame goes missing?
      </div>
      <div style={{ opacity: fade(frame, 10), fontFamily: MONO, fontSize: 22, color: color['ink-soft'] }}>
        A real 10-second H.264 clip, played twice.
      </div>
    </AbsoluteFill>
  )
}

/** The frame-size strip: one bar per frame, drawn to scale, with a playhead at `at`. */
function Strip({ at, keyDeleted }: { at: number; keyDeleted: boolean }) {
  const W = 1200
  const H = 84
  const step = W / FRAMES
  const max = Math.max(...clip.bytes)
  return (
    <svg width={W} height={H + 22} style={{ display: 'block' }}>
      {clip.bytes.map((b, i) => {
        const type = clip.types[i]
        const h = Math.max(1.5, (b / max) * H)
        const x = i * step
        if (keyDeleted && i === 0)
          return (
            <g key={i}>
              <rect
                x={x + 0.5}
                y={0.5}
                width={step * 3}
                height={H - 1}
                fill="none"
                stroke={color.key}
                strokeDasharray="4 3"
              />
              <path
                d={`M${x} 0 L${x + step * 3} ${H} M${x + step * 3} 0 L${x} ${H}`}
                stroke={color.key}
                strokeWidth={2}
              />
            </g>
          )
        return (
          <rect
            key={i}
            x={x}
            y={H - h}
            width={type === 'I' ? step * 3 : step - 1}
            height={h}
            fill={type === 'I' ? color.key : type === 'P' ? color.ink : color.graphite}
            opacity={i > at ? 0.35 : 1}
          />
        )
      })}
      {[...clip.types].map((t, i) =>
        t === 'I' ? (
          <text
            key={i}
            x={i * step + 2}
            y={H + 18}
            fontFamily={MONO}
            fontSize={15}
            fontWeight={700}
            fill={color['key-ink']}
          >
            {keyDeleted && i === 0 ? 'I deleted' : 'I'}
          </text>
        ) : null,
      )}
      <rect x={at * step} y={0} width={2} height={H} fill={color.motion} />
    </svg>
  )
}

function Panel({
  label,
  at,
  keyDeleted,
  caption,
}: {
  label: string
  at: number
  keyDeleted: boolean
  caption: string
}) {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 32,
          left: 40,
          background: color.paper,
          color: keyDeleted ? color['key-ink'] : color.ink,
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 34,
          padding: '10px 18px',
          borderLeft: `6px solid ${keyDeleted ? color.key : color.ink}`,
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          background: color.paper,
          padding: '16px 40px 14px',
          borderTop: `1.5px solid ${color.ink}`,
        }}
      >
        <div
          style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 26, color: color.ink, marginBottom: 12 }}
        >
          {caption}
        </div>
        <Strip at={at} keyDeleted={keyDeleted} />
        <div style={{ fontFamily: MONO, fontSize: 14, color: color['ink-faint'], marginTop: 4 }}>
          One bar per frame, drawn to scale. Red I = key frame. Dark = P. Grey = B. Real sizes from this
          encode.
        </div>
      </div>
    </>
  )
}

function NormalOverlay() {
  const frame = useCurrentFrame()
  return (
    <Panel
      label="Normal file"
      at={frame}
      keyDeleted={false}
      caption="It starts with a key frame: one full picture. The frames after it only store changes."
    />
  )
}

function NoKeyOverlay() {
  const frame = useCurrentFrame()
  return (
    <Panel
      label="Key frame deleted"
      at={frame}
      keyDeleted
      caption={
        frame < GOP
          ? 'The other frames still play, but they only hold changes. So only moving things appear.'
          : 'The next key frame arrives, and the whole picture is back.'
      }
    />
  )
}

export function NoKeyFrame() {
  useFonts()
  return (
    <AbsoluteFill style={{ background: color.ink }}>
      <Sequence durationInFrames={TITLE} name="Title">
        <Title />
      </Sequence>
      <Sequence from={TITLE} durationInFrames={GOP} name="Normal">
        <Video src={staticFile('podcast.mp4')} muted />
        <NormalOverlay />
      </Sequence>
      <Sequence from={TITLE + GOP} durationInFrames={FRAMES} name="Key frame deleted">
        <Video src={staticFile('podcast-no-key.mp4')} muted />
        <NoKeyOverlay />
      </Sequence>
    </AbsoluteFill>
  )
}
