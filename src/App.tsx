import { useEffect, useMemo, useRef, useState } from 'react'
import { arrow, defineChart, lineY, rect, text } from '@tanstack/charts'
import { d3Curve } from '@tanstack/charts/d3/shape'
import { Chart } from '@tanstack/charts/react'
import { angleGrid, polar, radialArea, radialGrid, radialLine } from '@tanstack/charts/polar'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { curveLinearClosed, curveMonotoneX } from 'd3-shape'
import mermaid from 'mermaid'
import flowSource from './rate-control-flow.mmd?raw'
import qp18 from './assets/quantization/qp-18.png'
import qp28 from './assets/quantization/qp-28.png'
import qp38 from './assets/quantization/qp-38.png'
import qp48 from './assets/quantization/qp-48.png'

type ModeId = 'crf' | 'cqp' | 'vbr' | 'cbr'
type Codec = 'h264' | 'h265'
type Metric = 'Quality stability' | 'Size certainty' | 'Stream safety' | 'Compression' | 'Speed'

type Mode = {
  id: ModeId
  name: string
  longName: string
  color: string
  promise: string
  useWhen: string
  avoidWhen: string
  scores: Record<Metric, number>
  priorities: { quality: number; speed: number; space: number }
}

const metrics: Metric[] = ['Quality stability', 'Size certainty', 'Stream safety', 'Compression', 'Speed']

const modes: Mode[] = [
  {
    id: 'crf', name: 'CRF', longName: 'Constant rate factor', color: '#ff6b45',
    promise: 'Keep perceived quality near a chosen level. Let bitrate move.',
    useWhen: 'You are making a local file, upload, archive, or mezzanine and care most about consistent viewing quality.',
    avoidWhen: 'A hard file-size cap or network bandwidth ceiling matters.',
    scores: { 'Quality stability': 9, 'Size certainty': 3, 'Stream safety': 3, Compression: 9, Speed: 7 },
    priorities: { quality: 10, speed: 7, space: 8 },
  },
  {
    id: 'cqp', name: 'CQP', longName: 'Constant quantizer', color: '#f5b73b',
    promise: 'Use the same quantization strength. Let bitrate and perceived quality move.',
    useWhen: 'You need a fixed quantizer for experiments or a low-overhead intermediate capture.',
    avoidWhen: 'You want predictable size, bandwidth, or perceptual quality.',
    scores: { 'Quality stability': 4, 'Size certainty': 1, 'Stream safety': 2, Compression: 5, Speed: 10 },
    priorities: { quality: 5, speed: 10, space: 2 },
  },
  {
    id: 'vbr', name: 'VBR', longName: 'Variable bitrate', color: '#7b8cff',
    promise: 'Hit an average bitrate or file-size budget. Spend more bits on hard scenes.',
    useWhen: 'You know the delivery bitrate or file-size budget. Two-pass VBR is best when hitting it closely matters.',
    avoidWhen: 'You need live output or a strict moment-to-moment bandwidth ceiling.',
    scores: { 'Quality stability': 8, 'Size certainty': 9, 'Stream safety': 6, Compression: 9, Speed: 5 },
    priorities: { quality: 8, speed: 5, space: 10 },
  },
  {
    id: 'cbr', name: 'CBR', longName: 'Constant bitrate', color: '#27c7a8',
    promise: 'Keep the data rate inside a tight channel. Let quality absorb the complexity.',
    useWhen: 'The network, muxer, service, or receiver requires tightly bounded throughput.',
    avoidWhen: 'You are encoding a normal file and want the best quality per byte.',
    scores: { 'Quality stability': 4, 'Size certainty': 10, 'Stream safety': 10, Compression: 4, Speed: 7 },
    priorities: { quality: 4, speed: 8, space: 4 },
  },
]

const commands: Record<Codec, Record<ModeId, string>> = {
  h264: {
    crf: 'ffmpeg -i input.mp4 -c:v libx264 -crf 23 output.mp4',
    cqp: 'ffmpeg -i input.mp4 -c:v libx264 -qp 20 output.mp4',
    vbr: 'ffmpeg -i input.mp4 -c:v libx264 -b:v 5M output.mp4',
    cbr: 'ffmpeg -i input.mp4 -c:v libx264 -b:v 5M -maxrate 5M -bufsize 10M output.mp4',
  },
  h265: {
    crf: 'ffmpeg -i input.mp4 -c:v libx265 -crf 28 output.mp4',
    cqp: 'ffmpeg -i input.mp4 -c:v libx265 -qp 20 output.mp4',
    vbr: 'ffmpeg -i input.mp4 -c:v libx265 -b:v 5M output.mp4',
    cbr: 'ffmpeg -i input.mp4 -c:v libx265 -b:v 5M -maxrate 5M -bufsize 10M output.mp4',
  },
}

function Radar({ selected }: { selected: ModeId[] }) {
  const definition = useMemo(() => {
    const marks = modes.filter((mode) => selected.includes(mode.id)).flatMap((mode) => {
      const data = metrics.map((metric) => ({ metric, value: mode.scores[metric] }))
      return [
        radialArea(data, { angle: 'metric', radius: 'value', curve: curveLinearClosed, fill: mode.color, fillOpacity: 0.11 }),
        radialLine(data, { angle: 'metric', radius: 'value', curve: curveLinearClosed, stroke: mode.color, strokeWidth: 2.5, points: true }),
      ]
    })

    return defineChart({
      marks: [polar({
        radiusRatio: 0.7,
        scales: {
          angle: { scale: scalePoint<string>().domain(metrics), wrap: true },
          radius: { scale: scaleLinear().domain([0, 10]) },
        },
        guides: [radialGrid({ values: [2, 4, 6, 8, 10], shape: 'polygon' }), angleGrid({ labels: false })],
        marks,
      })],
      scales: { x: null, y: null },
    })
  }, [selected])

  return <Chart definition={definition} height={410} ariaLabel="Radar comparison of selected rate-control modes" ariaDescription="Higher values mean the mode is better suited to that requirement. Scores are teaching aids, not measurements." />
}

const metricHelp: { metric: Metric; explanation: string; position: string }[] = [
  { metric: 'Quality stability', explanation: 'How evenly the picture holds up. A high score means hard scenes are less likely to look worse than easy scenes.', position: 'top' },
  { metric: 'Size certainty', explanation: 'How closely you can predict the finished file size or average bitrate before the encode ends.', position: 'right' },
  { metric: 'Stream safety', explanation: 'How well the output stays inside a network or decoder buffer limit. High scores are safer for live delivery.', position: 'bottom-right' },
  { metric: 'Compression', explanation: 'How well the mode spends bits where viewers notice them. High scores usually give more quality for the same file size.', position: 'bottom-left' },
  { metric: 'Speed', explanation: 'Encoding speed, not playback speed. A high score means the mode needs less analysis and usually finishes sooner.', position: 'left' },
]

function MetricHelp() {
  return <div className="metric-help">{metricHelp.map(({ metric, explanation, position }) => <button key={metric} className={position} aria-label={`${metric}: ${explanation}`}><span>{metric}</span><i role="tooltip">{explanation}</i></button>)}</div>
}

type Priorities = { quality: number; speed: number; space: number }

function PriorityTriangle({ values, onChange }: { values: Priorities; onChange: (values: Priorities) => void }) {
  const total = values.quality + values.speed + values.space
  const point = {
    x: (values.speed * 90 + values.space * 10 + values.quality * 50) / total,
    y: (values.speed * 86 + values.space * 86 + values.quality * 8) / total,
  }
  function move(event: React.PointerEvent<SVGSVGElement>) {
    if (event.buttons !== 1) return
    const box = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width * 100
    const y = (event.clientY - box.top) / box.height * 94
    const raw = { quality: (86 - y) / 78, speed: (x - 10 - 40 * ((86 - y) / 78)) / 80, space: 0 }
    raw.space = 1 - raw.quality - raw.speed
    const clamped = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Math.max(0, value)])) as Priorities
    const sum = clamped.quality + clamped.speed + clamped.space || 1
    onChange({ quality: 1 + Math.round(clamped.quality / sum * 9), speed: 1 + Math.round(clamped.speed / sum * 9), space: 1 + Math.round(clamped.space / sum * 9) })
  }

  return (
    <svg viewBox="0 0 100 94" className="triangle" role="group" aria-label="Drag the dot to balance quality, speed, and smaller files" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); move(event) }} onPointerMove={move}>
      <path d="M50 8 L90 86 L10 86 Z" className="triangle-fill" />
      <path d="M50 8 L90 86 L10 86 Z" className="triangle-line" />
      <path d="M50 8 L50 86 M10 86 L70 47 M90 86 L30 47" className="triangle-grid" />
      <circle cx={point.x} cy={point.y} r="4.5" className="triangle-point"><title>Drag me</title></circle>
      <text x="50" y="4" textAnchor="middle">QUALITY</text>
      <text x="95" y="92" textAnchor="end">SPEED</text>
      <text x="5" y="92">SMALLER FILE</text>
    </svg>
  )
}

const complexity = [3, 5, 2, 8, 6, 9, 4, 7, 3, 8, 5, 7]

function RateStory({ mode }: { mode: Mode }) {
  const output = mode.id === 'cbr' ? complexity.map(() => 6) : mode.id === 'vbr' ? [4, 5, 3, 7, 6, 8, 4, 7, 4, 7, 5, 6] : complexity
  const definition = useMemo(() => {
    const scene = complexity.map((value, frame) => ({ frame, value }))
    const bitrate = output.map((value, frame) => ({ frame, value }))

    return defineChart({
      marks: [
        lineY(bitrate, { x: 'frame', y: 'value', curve: d3Curve(curveMonotoneX), stroke: mode.color, strokeWidth: 3 }),
        lineY(scene, { x: 'frame', y: 'value', curve: d3Curve(curveMonotoneX), stroke: '#9a9d9b', strokeWidth: 2.5, strokeDasharray: '3 7' }),
      ],
      scales: {
        x: { scale: scaleLinear, axis: false },
        y: { scale: () => scaleLinear().domain([0, 10]), axis: false },
      },
    })
  }, [mode.id, mode.color])
  const caption = {
    crf: 'Hard scene? Spend more bits. Easy scene? Save them.',
    cqp: 'The quantizer stays fixed. Bitrate follows the scene.',
    vbr: 'Bits move between scenes, but the average stays on budget.',
    cbr: 'The channel stays level. Hard scenes get fewer bits than they want.',
  }[mode.id]
  return (
    <div className="rate-story" aria-label={`${mode.name} bitrate behavior over time`}>
      <div className="story-chart">
        <Chart definition={definition} height={190} ariaLabel={`${mode.name} bitrate follows scene complexity over time`} ariaDescription="Scene complexity is a dashed gray line. Bitrate is a solid line in the selected mode color." />
      </div>
      <div className="story-legend">
        <span><i className="complexity-line" />Scene complexity</span>
        <span><i style={{ background: mode.color }} />Bitrate</span>
        <small>time →</small>
      </div>
      <strong>{caption}</strong>
    </div>
  )
}

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'base',
  themeVariables: { background: '#e8e4db', primaryTextColor: '#171819', lineColor: '#77756f', fontFamily: 'Manrope, sans-serif' },
  flowchart: { curve: 'stepAfter', htmlLabels: true, nodeSpacing: 38, rankSpacing: 54 },
})

let mermaidRenderId = 0

function DecisionFlow() {
  const container = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let cancelled = false
    const id = `rate-control-flow-${++mermaidRenderId}`
    mermaid.render(id, flowSource).then(({ svg, bindFunctions }) => {
      if (cancelled || !container.current) return
      container.current.innerHTML = svg
      bindFunctions?.(container.current)
    })
    return () => { cancelled = true }
  }, [])
  return <div className="flow-scroll" ref={container} role="img" aria-label="Decision flowchart for choosing a video rate-control mode" />
}

function App() {
  const [active, setActive] = useState<ModeId>('crf')
  const [selected, setSelected] = useState<ModeId[]>(['crf', 'cbr'])
  const [codec, setCodec] = useState<Codec>('h264')
  const [priorities, setPriorities] = useState({ quality: 8, speed: 5, space: 6 })
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null)
  const [magnification, setMagnification] = useState(4)

  const recommendation = modes.reduce((best, mode) => {
    const score = Object.entries(priorities).reduce((sum, [key, weight]) => sum + weight * mode.priorities[key as keyof typeof priorities], 0)
    const bestScore = Object.entries(priorities).reduce((sum, [key, weight]) => sum + weight * best.priorities[key as keyof typeof priorities], 0)
    return score > bestScore ? mode : best
  }, modes[0])

  const activeMode = modes.find((mode) => mode.id === active)!
  const activeCommand = commands[codec][activeMode.id]

  function toggleMode(id: ModeId) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function showMode(id: ModeId) {
    setActive(id)
    document.getElementById('modes')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main>
      <header className="hero">
        <nav><a className="brand" href="#top">RATE / CONTROL</a><a href="#modes">Modes</a><a href="#choose">Choose</a><a href="#compare">Compare</a></nav>
        <div className="hero-copy" id="top">
          <p className="eyebrow">A field guide to H.264 & H.265 encoding</p>
          <h1>Something always<br /><em>has to move.</em></h1>
          <p className="lede">Rate control decides what the encoder may change when a scene gets harder: quality, bitrate, or both.</p>
          <a className="button" href="#modes">Meet the modes <span>↓</span></a>
        </div>
        <div className="signal" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
      </header>

      <section className="principle">
        <p className="section-number">01 / THE ONE IDEA</p>
        <h2>You can pin <em>one promise.</em><br />The encoder negotiates the rest.</h2>
        <div className="promise-grid">
          {[
            ['CRF', 'Keep quality steady', 'File size can change', '#ff6b45'],
            ['VBR', 'Hit a size target', 'Bitrate can change', '#7b8cff'],
            ['CBR', 'Fit the connection', 'Quality can change', '#27c7a8'],
            ['CQP', 'Hold QP fixed', 'Everything else can change', '#f5b73b'],
          ].map(([name, promise, cost, color]) => <div key={name} style={{ '--mode': color } as React.CSSProperties}><strong>{name}</strong><span>{promise}</span><small>↳ {cost}</small></div>)}
        </div>
      </section>

      <section className="quantization">
        <div className="quantization-intro">
          <div><p className="section-number">02 / WHAT QUANTIZATION DOES</p><h2>The encoder keeps the shape.<br /><em>It spends less on precision.</em></h2></div>
          <p>H.264 and H.265 predict blocks of a frame, transform what the prediction missed, then round those transform values. That rounding is quantization. Coarser rounding needs fewer bits, but fine texture, clean edges, and subtle color changes disappear.</p>
        </div>
        <div className="compression-steps" aria-label="Simplified video compression process">
          <span><b>01</b> Predict blocks</span><i>→</i><span><b>02</b> Transform the error</span><i>→</i><span><b>03</b> Quantize values</span><i>→</i><span><b>04</b> Store fewer bits</span>
        </div>
        <div className="qp-grid" tabIndex={0} aria-label="Four H.264 quantization samples. Hover any image to compare the same magnified area across all four. Use plus and minus to change magnification." onPointerEnter={(event) => event.currentTarget.focus()} onKeyDown={(event) => {
          if (!['+', '=', '-', '_'].includes(event.key)) return
          event.preventDefault()
          setMagnification((current) => Math.min(10, Math.max(2, current + (event.key === '+' || event.key === '=' ? 1 : -1))))
        }}>
          {[
            [qp18, 'QP 18', 'Fine rounding', 'More detail · more bits'],
            [qp28, 'QP 28', 'Moderate rounding', 'Less texture · fewer bits'],
            [qp38, 'QP 38', 'Coarse rounding', 'Edges begin to break down'],
            [qp48, 'QP 48', 'Very coarse rounding', 'Blocking and detail loss'],
          ].map(([image, qp, title, note]) => <figure key={qp}>
            <div className="qp-image" onPointerMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect()
              setLens({ x: (event.clientX - bounds.left) / bounds.width * 100, y: (event.clientY - bounds.top) / bounds.height * 100 })
            }} onPointerLeave={() => setLens(null)}>
              <img src={image} alt={`The same video frame encoded with H.264 at ${qp}`} loading="lazy" />
              {lens && <i className="qp-lens" aria-hidden="true" style={{ left: `${lens.x}%`, top: `${lens.y}%`, backgroundImage: `url(${image})`, backgroundPosition: `${lens.x}% ${lens.y}%`, backgroundSize: `${magnification * 100}% auto` }} />}
            </div>
            <figcaption><strong>{qp}</strong><span>{title}</span><small>{note}</small></figcaption>
          </figure>)}
        </div>
        <div className="quantization-footer">
          <p className="quantization-note"><strong>Lower QP</strong> keeps smaller differences and usually needs more bits. <strong>Higher QP</strong> throws more differences away. CRF changes quantization as needed to pursue perceived quality; CQP holds the chosen QP fixed.</p>
          <div className="lens-controls" aria-label="Lens magnification controls"><span>Lens</span><button onClick={() => setMagnification((current) => Math.max(2, current - 1))} disabled={magnification === 2} aria-label="Decrease magnification">−</button><output>{magnification}×</output><button onClick={() => setMagnification((current) => Math.min(10, current + 1))} disabled={magnification === 10} aria-label="Increase magnification">+</button><small>or use + / −</small></div>
        </div>
      </section>

      <section id="modes" className="modes">
        <p className="section-number">03 / MEET THE MODES</p>
        <div className="tab-row">
          <div className="mode-tabs" role="tablist" aria-label="Rate control modes">
            {modes.map((mode) => <button role="tab" aria-selected={active === mode.id} key={mode.id} onClick={() => setActive(mode.id)}>{mode.name}</button>)}
          </div>
          <div className="codec-toggle" aria-label="Encoder examples">
            <button aria-pressed={codec === 'h264'} onClick={() => setCodec('h264')}>H.264</button>
            <button aria-pressed={codec === 'h265'} onClick={() => setCodec('h265')}>H.265</button>
          </div>
        </div>
        <article className="mode-detail" style={{ '--mode': activeMode.color } as React.CSSProperties}>
          <div className="mode-title"><span>{activeMode.name}</span><h2>{activeMode.longName}</h2><p>{activeMode.promise}</p></div>
          <RateStory mode={activeMode} />
          <div className="mode-facts">
            <div><small>Good for</small><p>{activeMode.useWhen}</p></div>
            <div><small>The catch</small><p>{activeMode.avoidWhen}</p></div>
          </div>
          {(active === 'crf' || active === 'cqp') && <div className="crf-cqp">
            <div><small>Same shape, different promise</small><h3>CRF vs CQP</h3><p>Both let bitrate rise with scene complexity. What changes is how the encoder chooses quantization.</p></div>
            <div><strong>Choose CRF for viewing</strong><p>The encoder adjusts quantization across the video to keep perceived quality near your chosen level. File size is the result.</p></div>
            <div><strong>Choose CQP for control</strong><p>The quantizer stays fixed. Quality can vary with content, so use it for tests or workflows that specifically require a fixed QP.</p></div>
          </div>}
          <div className="command"><span>FFmpeg starting point</span><code>{activeCommand}</code><button aria-label="Copy FFmpeg command" onClick={() => navigator.clipboard.writeText(activeCommand)}>COPY</button></div>
        </article>
        <p className="codec-note">The idea transfers between H.264 and H.265, but the numbers do not. A CRF value is meaningful only within that encoder and bit depth. Test a short representative clip before settling on it.</p>
      </section>

      <section id="choose" className="chooser">
        <div>
          <p className="section-number">04 / CHOOSE YOUR PRESSURE</p>
          <h2>What can you afford<br />to spend?</h2>
          <p className="muted">Raise what matters. There is no magic corner where maximum quality, instant encoding, and tiny files all meet.</p>
          <div className="sliders">
            {(['quality', 'speed', 'space'] as const).map((key) => (
              <label key={key}><span>{key === 'space' ? 'Smaller file' : key}<b>{priorities[key]}</b></span><input type="range" min="1" max="10" value={priorities[key]} onChange={(event) => setPriorities({ ...priorities, [key]: Number(event.target.value) })} /></label>
            ))}
          </div>
        </div>
        <PriorityTriangle values={priorities} onChange={setPriorities} />
        <aside className="recommendation">
          <span>Your starting point</span>
          <strong style={{ color: recommendation.color }}>{recommendation.name}</strong>
          <p>{recommendation.promise}</p>
          <button onClick={() => showMode(recommendation.id)}>Why this mode?</button>
        </aside>
      </section>

      <section id="compare" className="compare">
        <div className="section-heading"><div><p className="section-number">05 / COMPARE THE SHAPES</p><h2>Different promises,<br />different strengths.</h2></div><p>Higher means better suited to that requirement. These scores explain behavior. They are not codec benchmarks.</p></div>
        <div className="chart-shell">
          <div className="mode-toggles" aria-label="Choose modes to compare">
            {modes.map((mode) => <button key={mode.id} className={selected.includes(mode.id) ? 'selected' : ''} style={{ '--mode': mode.color } as React.CSSProperties} onClick={() => toggleMode(mode.id)} aria-pressed={selected.includes(mode.id)}><i />{mode.name}</button>)}
          </div>
          <div className="radar-wrap">{selected.length > 0 ? <><Radar selected={selected} /><MetricHelp /></> : <div className="empty-radar"><p>All modes are off.<br /><span>Pick one above to begin.</span></p></div>}</div>
        </div>
      </section>

      <section className="decision">
        <p className="section-number">06 / THE 10-SECOND DECISION</p>
        <h2>Start with the constraint.</h2>
        <DecisionFlow />
        <p className="fine-print">Names and exact behavior vary by encoder. “CBR” is often buffer-constrained VBR in practice. Presets control compression efficiency and encode time separately from rate control.</p>
      </section>

      <footer><span>RATE / CONTROL</span><p>Built for learning, not as a substitute for your encoder’s documentation.</p><a href="https://www.youtube.com/channel/UCVAZXZ90b8aw3i1MQngo_WQ/" target="_blank" rel="noreferrer">More video guides on YouTube ↗</a></footer>
    </main>
  )
}

export default App
