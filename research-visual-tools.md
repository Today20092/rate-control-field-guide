# Visual tools research: animation, 3D and explorable-explanation tooling

Research date: 2026-11-22. Scope: free and open-source tools, libraries and agent skills for better animation, interactivity and 3D in this guide, judged against `AGENTS.md`, `PRODUCT.md` and `.impeccable/surfaces/src-pages-index-astro.md`. Nothing here has been installed. Every dependency still needs the owner's approval (AGENTS.md: "Do not add dependencies without asking").

Where the facts come from: npm registry metadata (`npm view <pkg> --json`, read 2026-11-22), the GitHub API (`gh api repos/<owner>/<repo>`, licence detected from the repo's LICENSE file, plus latest release), official docs, and `web-features` 3.47.0 (`https://cdn.jsdelivr.net/npm/web-features/data.json`) for browser Baseline status. Context7 hit its monthly quota early on, so library docs were read straight from the official sites. Bundle sizes are given only where the project publishes them. Everything else is marked "not published". npm "unpacked" size is the size of the installed package, not what ships to the browser.

## What the site already does

`FrameStack3D.tsx` builds the signature frame stack from **CSS 3D transforms on SVG**. It checks `matchMedia('(prefers-reduced-motion: reduce)')` and uses `requestAnimationFrame`. `global.css` has `prefers-reduced-motion` blocks. There is no animation or 3D library yet. Any library recommendation has to beat what the platform already gives for free.

---

## TL;DR: ranked shortlist

1. **Use the platform first (0 KB): CSS 3D transforms, Web Animations API, same-document View Transitions, CSS scroll-driven animations.** 3D transforms and WAAPI are Baseline widely available. Same-document view transitions became Baseline on 2025-10-14. Scroll-driven animations became Baseline only on 2026-10-27 (Firefox 159), so wrap them in `@supports (animation-timeline: view())`. These cover most of what the guide needs: the frame stack fanning out, the "What you see / What's stored" toggle as a view transition, and chapter openers that draw in on scroll. They cost nothing per island, and they degrade to static content.
2. **Motion (`motion`, MIT, v14.14.0, 2026-11-13).** Use it when a widget needs springs, gestures or layout animation that hand-written WAAPI makes painful. Published sizes: `animate` from `motion/mini` is 3.2 kB, `useAnimate` mini is 3.3 kB, and `m` + `LazyMotion` is "just over 5kb" for the initial render. `<MotionConfig reducedMotion="user">` turns off transform and layout animations for reduced-motion users across the whole tree. Peer: React ^18 || ^19. Best targets: the GOP timeline (frames reorder from display order to decode order with layout animation), BlockPartition (blocks split with springs), and RateControl's buffer.
3. **three.js + React Three Fiber + drei (all MIT): one hero 3D island, not many.** three r187 (2026-10-30), R3F 9.8.2 (2026-10-15, "pairs with react@19"), drei 10.7.9. `WebGPURenderer` falls back to WebGL 2 by itself (from its source). Use `<Canvas frameloop="demand">` so it only renders when something changes. Targets: a true 3D version of the frame stack with motion-vector arrows between planes (the "memorable moment" in the surface brief), and a 3D surface of the DCT basis functions for the JPEG chapter. Keep the current CSS/SVG stack as the no-JS and reduced-motion fallback. **Caveat:** R3F 9.8.2 declares peer `react >=19 <19.4`. The repo has react ^19.3.1, which fits today, but a future React 19.4 bump would break the peer range until R3F catches up.
4. **Pre-rendered video for things that are motion by nature: ManimCE (MIT, v0.22.1, 2026-10-27) plus FFmpeg's `codecview` filter.** `codecview` draws the _real_ motion vectors from a real H.264 encode (`-flags2 +export_mvs ... -vf codecview=mv=pf+bf+bb`). That matches the site's "honest, no fake benchmarks" principle and the real QP frames already in `src/assets/quantization`. Manim fits short clips such as "an 8×8 block becomes a weighted sum of 64 cosine patterns" or zig-zag scan order. Ship as `<video>` with a poster, no autoplay under reduced motion, and a caption. 0 KB of JS.
5. **Observable Plot (ISC, v0.6.19, 2026-11-05) or D3 (ISC, v7.9.2), run at build time.** Plot takes a `document` option "for server-side rendering in Node", so charts like the bitrate-vs-resolution curves or the trade-off chart can be static SVG in the HTML: readable without JS, no island needed. Only hydrate when the reader has something to drag.

Skip for this site: Spline (proprietary runtime, paid code export), GSAP (free, but under a proprietary "no charge" licence, not open source), Theatre.js (Studio is AGPL, no release since 2024-05), Idyll (last publish 2022, alpha), Threlte (Svelte only), Babylon.js (too heavy for one diagram). Details are in the "Avoid" section.

---

## Comparison table

Fit: ★★★ strong, ★★ situational, ★ poor, ✗ avoid. "Latest" is the npm `version` and its publish date, cross-checked against the GitHub release where one exists.

| Tool                                                                    | Licence (repo LICENSE)                                 | Latest                                                     | Published size                                             | React 19 / Astro island                         | Reduced motion / a11y                                   | Fit                                                |
| ----------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| CSS 3D transforms / WAAPI / View Transitions / scroll-driven animations | web standard                                           | Baseline: see §1                                           | 0                                                          | n/a (works in `.astro` too)                     | `@media (prefers-reduced-motion)`; content is plain DOM | ★★★                                                |
| Motion                                                                  | MIT                                                    | 14.14.0, 2026-11-13                                        | mini 3.2 kB; hybrid 22 kB; LazyMotion ~5 kB initial        | peer react ^18‖^19                              | `MotionConfig reducedMotion="user"`, `useReducedMotion` | ★★★                                                |
| anime.js                                                                | MIT                                                    | 4.5.0, 2026-06-22                                          | site says 24.50 KB full; Timer 5.60 KB, +5.20 KB Animation | framework-agnostic (refs + effects)             | none built in found; do it by hand                      | ★★                                                 |
| React Spring (`@react-spring/web`)                                      | MIT                                                    | 10.1.2, 2026-06-24                                         | not published                                              | peer react 16.8–19                              | `useReducedMotion` hook                                 | ★★                                                 |
| GSAP                                                                    | none in repo; proprietary "Standard no charge" licence | 3.15.1, 2026-11-04                                         | not published                                              | `@gsap/react` (not verified)                    | `gsap.matchMedia()` (README)                            | ✗ (licence)                                        |
| three.js                                                                | MIT                                                    | r187, 2026-10-30                                           | not published                                              | any; vanilla or via R3F                         | canvas only: you have to supply text equivalents        | ★★★ (one island)                                   |
| React Three Fiber                                                       | MIT                                                    | 9.8.2, 2026-10-15                                          | not published                                              | v9 pairs with React 19; peer `react >=19 <19.4` | `frameloop="demand"`; no built-in a11y                  | ★★★                                                |
| drei                                                                    | MIT                                                    | 10.7.9, 2026-09-25                                         | not published                                              | peer react ^19, R3F ^9                          | `Html` overlay lets you put real DOM labels in a scene  | ★★★                                                |
| @react-three/a11y                                                       | MIT (LICENSE file has a merge-conflict marker)         | 3.0.0, 2022-05-15                                          | not published                                              | peer R3F >=8                                    | its purpose; but no release since 2022                  | ★                                                  |
| Threlte                                                                 | MIT                                                    | @threlte/core 8.7.0, 2026-11-02                            | not published                                              | Svelte 5 only                                   | —                                                       | ✗ (wrong framework)                                |
| OGL                                                                     | npm says Unlicense; repo has no LICENSE file           | 1.0.11, 2025-01-27                                         | not published                                              | vanilla                                         | —                                                       | ★                                                  |
| Babylon.js                                                              | Apache-2.0                                             | 9.37.1, 2026-11-18                                         | not published (72 MB unpacked)                             | vanilla                                         | has its own a11y package (not checked)                  | ★ (too heavy)                                      |
| regl                                                                    | MIT                                                    | 2.1.1, 2024-11-12                                          | not published                                              | vanilla                                         | —                                                       | ★                                                  |
| Spline runtime                                                          | **no licence field on npm; GitHub repo 404s**          | 2.0.211, 2026-11-20                                        | 35.9 MB unpacked                                           | `@splinetool/react-spline`                      | —                                                       | ✗                                                  |
| Mafs                                                                    | MIT                                                    | 0.21.0, 2024-10-20                                         | not published                                              | peer react >=18                                 | movable points work with arrow keys                     | ★★                                                 |
| D3                                                                      | ISC                                                    | 7.9.2, 2026-11-03                                          | not published                                              | modular, can run at build time                  | SVG you write yourself                                  | ★★                                                 |
| Observable Plot                                                         | ISC                                                    | 0.6.19, 2026-11-05                                         | not published                                              | build-time SVG via `document` option            | static SVG; add `aria-label`/`title`                    | ★★★ (static charts)                                |
| visx                                                                    | MIT                                                    | 4.0.0, 2026-06-11                                          | per-package                                                | peer react ^18‖^19                              | SVG primitives                                          | ★★                                                 |
| JSXGraph                                                                | MIT OR LGPL-3.0 (repo detects LGPL-3.0)                | 1.14.3, 2026-11-06                                         | not published (73 MB unpacked)                             | vanilla                                         | docs say multi-touch; a11y not confirmed                | ★                                                  |
| Motion Canvas                                                           | MIT                                                    | 3.17.2, 2024-12-14                                         | — (authoring tool)                                         | pre-rendered video                              | n/a (video)                                             | ★★ (for video)                                     |
| ManimCE                                                                 | MIT                                                    | 0.22.1, 2026-10-27 (PyPI + GitHub)                         | — (Python, renders video)                                  | pre-rendered video                              | n/a (video; add captions)                               | ★★★ (for video)                                    |
| Idyll                                                                   | MIT                                                    | 6.0.0-alpha.6, 2022-04-22; repo last push 2023-02          | —                                                          | its own framework                               | —                                                       | ✗                                                  |
| p5.js                                                                   | LGPL-2.1                                               | 2.4.0, 2026-11-11                                          | not published (16 MB unpacked)                             | vanilla, canvas                                 | canvas: needs text equivalents                          | ★                                                  |
| two.js                                                                  | MIT                                                    | 0.8.24, 2026-08-29                                         | not published                                              | vanilla; SVG/canvas/WebGL                       | SVG renderer keeps DOM                                  | ★                                                  |
| Rive runtime                                                            | MIT (runtime)                                          | `@rive-app/canvas` 2.54.0, react-canvas 4.41.0, 2026-11-21 | not published (WASM)                                       | peer react 16.8–19                              | —                                                       | ★ (editor: free exports play a Rive splash screen) |
| lottie-web                                                              | MIT                                                    | 5.13.0, 2025-05-21; repo last push 2025-09                 | not published                                              | vanilla                                         | —                                                       | ★                                                  |
| dotLottie web/react                                                     | MIT                                                    | 0.83.2 / 0.22.3, Nov 2026                                  | not published                                              | peer react 17–19                                | —                                                       | ★                                                  |
| Theatre.js                                                              | core Apache-2.0, **studio AGPL-3.0-only**              | 0.7.2, 2024-05-19; repo last push 2024-08                  | —                                                          | —                                               | —                                                       | ✗                                                  |
| Scrollama                                                               | MIT                                                    | 3.2.0, 2022-06-17                                          | not published                                              | vanilla                                         | IntersectionObserver, no motion of its own              | ★ (CSS/IO do this now)                             |

---

## 1. Animation

### Native: CSS 3D, Web Animations API, View Transitions, scroll-driven animations

Baseline status from `web-features` 3.47.0:

| Feature                                                            | Baseline             | Since                           | Engines (first version)                                               |
| ------------------------------------------------------------------ | -------------------- | ------------------------------- | --------------------------------------------------------------------- |
| `transforms3d` (3D transforms)                                     | **widely available** | low 2022-03-14, high 2024-09-14 | Chrome 36, Firefox 16, Safari 15.4                                    |
| `web-animations` (`element.animate()`)                             | **widely available** | low 2020-09-16, high 2023-03-16 | Chrome 84, Firefox 75, Safari 14                                      |
| `prefers-reduced-motion`                                           | **widely available** | high 2022-07-15                 | Chrome 74, Firefox 63, Safari 10.1                                    |
| `view-transitions` (same-document `document.startViewTransition`)  | **newly available**  | 2025-10-14                      | Chrome 111, Firefox 144, Safari 18                                    |
| `view-transition-class`                                            | newly available      | 2025-10-14                      | Chrome 125, Firefox 144, Safari 18.2                                  |
| `cross-document-view-transitions`                                  | **not Baseline**     | —                               | Chrome 126, Safari 18.2; no Firefox                                   |
| `view-transitions-element-scoped`                                  | not Baseline         | —                               | Chrome 147 only                                                       |
| `scroll-driven-animations` (`animation-timeline: scroll()/view()`) | **newly available**  | **2026-10-27**                  | Chrome 115, Firefox 159, Safari 26                                    |
| `webgl2`                                                           | widely available     | high 2024-03-20                 | —                                                                     |
| `webgpu`                                                           | **not Baseline**     | —                               | Chrome 144 (desktop), Chrome Android 121, Safari 26; no Firefox entry |

Fit: ★★★. This is a one-page site, so cross-document view transitions don't matter. Same-document `startViewTransition` fits widget state changes: the FrameStack3D toggle, switching codec tabs between H.264 and H.265 block grids, and switching rate-control modes. Scroll-driven animations shipped in all three engines only a month ago, so treat them as progressive enhancement behind `@supports (animation-timeline: view())`, with the end state as the default. Put them under `@media (prefers-reduced-motion: no-preference)`, which `global.css` already does for other motion.

Ideas:

- Chapter 3 (I/P/B): a scroll-driven fan-out of the frame stack as it enters the viewport, with the static fanned state as the fallback.
- Chapter 1 (JPEG): a view transition between "pixels" and "frequency coefficients" for one 8×8 block in `BlockLab`.
- ExposureSheet bars grow to their bit length on `view()`.

`modern-web-guidance` is already installed locally and has guides on view transitions and scroll-driven effects (`guides/performance/faster-spa-view-transitions.md`, `guides/ui-atoms/scroll-progress-indicator.md`). Use it before writing this code.

### Motion (formerly Framer Motion)

- Licence: MIT (https://github.com/motiondivision/motion). Latest 14.14.0, 2026-11-13 (npm). The repo has no GitHub Releases; versions are npm-only.
- Size, as published: "mini (3.2kb) and hybrid (22kb)" for `animate` (https://motion.dev/docs/animate). `useAnimate` mini 3.3 kB. Full `motion` component "impossible ... to tree shake any smaller than 43kb", `m` + `LazyMotion` "just over 5kb" initial (https://motion.dev/docs/react-reduce-bundle-size).
- Reduced motion: `<MotionConfig reducedMotion="user">` "will automatically disable transform and layout animations, while preserving ... opacity and backgroundColor". There is also a `useReducedMotion` hook (https://motion.dev/docs/react-accessibility).
- Islands: peer `react ^18.0.0 || ^19.0.0`. It works inside a `client:visible` island. It does nothing on the server beyond rendering the initial state, so the no-JS HTML shows the resting frame.
- Fit ★★★. Best for **GopTimeline**: animate frames between display order (I B B P) and decode order (I P B B) with layout animation, which shows why B-frames need a later reference. Also BlockPartition (H.265 CTU splitting into CUs with springs) and the RateControl buffer.

### GSAP

- Licence: the repo has **no LICENSE file**. The README says "GSAP is now 100% FREE ... even for commercial use" thanks to Webflow, and points to "GreenSock's standard 'no charge' license" (https://github.com/greensock/GSAP README; https://webflow.com/blog/gsap-becomes-free). The npm `license` field is "Standard 'no charge' license: https://gsap.com/standard-license". I could not read the licence clauses: https://gsap.com/standard-license redirects to a login-gated community page that wouldn't render for a fetch. **So: free of charge, but not an OSI open-source licence, and the exact terms are unverified.**
- Latest 3.15.1, 2026-11-04 (npm). 6.1 MB unpacked.
- Fit ✗ for this brief ("free and open-source"). It is technically excellent (ScrollTrigger, `gsap.matchMedia()` for reduced motion, per its README), but Motion plus native CSS covers the same needs under MIT.

### anime.js

- MIT, v4.5.0, 2026-06-22 (GitHub release v4.5.0). Site lists "24.50 KB" with modular parts (Timer 5.60 KB, Animation +5.20 KB) (https://animejs.com/). v4 declares optional peer `three >=0.150`.
- No reduced-motion helper found in the README or homepage. You would gate it yourself with `matchMedia`.
- Fit ★★. A capable imperative timeline for SVG (good for drawing motion-vector paths), but in React islands Motion is the more natural fit and is smaller for simple cases.

### React Spring

- MIT, v10.1.2, 2026-06-24. Peer react 16.8–19. Has a `useReducedMotion` utility "to stop the running of animations ... [when] a user prefers reduced motion" (https://www.react-spring.dev/docs/utilities/use-reduced-motion).
- Fit ★★. Fine, and it pairs well with R3F (same pmndrs family, `@react-spring/three`). But two animation libraries is one too many, and Motion's reduced-motion handling is broader.

---

## 2. 3D / WebGL / WebGPU

### three.js

- MIT, r187, 2026-10-30 (GitHub release). 20.5 MB unpacked, tree-shakeable. No published gzip size.
- WebGPU: `WebGPURenderer` picks WebGPU when available and otherwise "running under WebGL2 backend", with `forceWebGL` to force WebGL 2 (source: `src/renderers/webgpu/WebGPURenderer.js`, https://github.com/mrdoob/three.js/blob/dev/src/renderers/webgpu/WebGPURenderer.js). WebGPU is **not Baseline** (no Firefox in web-features). For flat-shaded planes, arrows and a DCT surface, the classic `WebGLRenderer` (WebGL 2, Baseline widely available) is enough and the safer choice.
- Accessibility: a `<canvas>` gives nothing to screen readers. Every 3D island needs a visible text equivalent and its controls outside the canvas (native buttons and ranges, per AGENTS.md).

### React Three Fiber + drei

- R3F: MIT, 9.8.2, 2026-10-15. "@react-three/fiber@9 pairs with react@19" (https://r3f.docs.pmnd.rs/getting-started/installation). npm peer range is `react >=19 <19.4`, `react-dom >=19 <19.4`. This repo pins `react ^19.3.1`, which fits, but watch for React 19.4.
- On-demand rendering: `<Canvas frameloop="demand">` "only render[s] when necessary. This saves battery" (https://r3f.docs.pmnd.rs/advanced/scaling-performance). Good on phones and good for reduced motion (no idle loop).
- drei: MIT, 10.7.9, 2026-09-25, peer R3F ^9 / React ^19. `Html` places real DOM labels in a scene, so labels like "I", "P", "B" and frame numbers can stay real text in JetBrains Mono.
- `@react-three/a11y`: last release 3.0.0, 2022-05-15, and its LICENSE file contains a git merge-conflict marker (`<<<<<<< HEAD`). Don't rely on it. Do the accessibility in DOM around the canvas.
- Island pattern: `client:visible` (already used) is fine; the server renders the wrapper and React mounts the canvas later. Render the existing SVG/CSS stack as the server HTML and swap to the canvas only when JS and WebGL are available and motion is allowed.
- Fit ★★★ for **one** signature scene:
  - **Frame stack in real 3D** (hero and chapter 3): planes in depth, red I-frames, dashed in-betweens, blue motion-vector arrows linking blocks between planes, with drag or a range input to orbit. This is exactly the brief's "memorable moment".
  - **DCT basis-function surface** (chapter 1): an 8×8 grid of height-mapped cosine surfaces, where the reader picks (u, v) with two ranges. Drive it from the existing `src/lib/dct.ts`.
  - Flat lighting from one side, no gradients or glow, as the surface brief requires: `MeshLambertMaterial` or `MeshBasicMaterial` with one directional light.

### Threlte

MIT, @threlte/core 8.7.0, 2026-11-02, peer `svelte >=5`. "Threlte brings Three.js to Svelte" (https://threlte.xyz/docs/learn/getting-started/introduction). Fit ✗: it would add a second UI framework to a React-island site.

### OGL

npm `license: "Unlicense"`, but the GitHub repo has **no LICENSE file** (contents: `.gitignore .npmignore README.md examples package.json src types`). Latest 1.0.11, 2025-01-27; repo last push 2025-04-13. Small and nice, but thin docs and slow maintenance. Fit ★.

### Babylon.js

Apache-2.0, 9.37.1, 2026-11-18, very active. 72 MB unpacked for `@babylonjs/core`. A full game/scene engine, which is overkill for flat planes and arrows. Fit ★.

### regl

MIT, 2.1.1, 2024-11-12 (no GitHub releases; repo pushed 2026-10). A functional WebGL wrapper. It means writing shaders by hand; worth it only for a custom GPU visual like a live DCT on a webcam frame. Fit ★.

### Spline

The npm package `@splinetool/runtime` (2.0.211, 2026-11-20) has **no `license` field**, and its declared repo `github.com/splinetool/spline` returns 404. It is **not open source**. Pricing: paid plans add "No watermark on web exports", "No watermark on web embeds" and "Code & Self-hosted exports" (https://spline.design/pricing), so the free plan watermarks embeds. 35.9 MB unpacked runtime. `@splinetool/react-spline` peer-depends on `next >=14.2.0`. Fit ✗.

---

## 3. Explorable-explanation and math-viz tools

- **Mafs**: MIT, 0.21.0, 2024-10-20 (repo still pushed 2026-11). React components for 2D math. "Movable points can be dragged ... or moved via the keyboard" (https://mafs.dev/guides/interaction/movable-points). Fit ★★: a draggable 1D cosine-sum demo ("add basis waves to rebuild a row of pixels") for chapter 1. No release for two years, so check it builds on React 19 before committing.
- **D3**: ISC, 7.9.2, 2026-11-03. Modules like `d3-scale` and `d3-shape` work in Node at build time and inside React. Fit ★★ as a toolbox (scales, paths), not as a DOM owner inside React islands.
- **Observable Plot**: ISC, 0.6.19, 2026-11-05. The `document` option can be "changed to another document ... for server-side rendering in Node" (https://observablehq.com/plot/features/plots). Fit ★★★ for static, readable-without-JS charts: bits per pixel vs resolution (chapter 5), the size/quality/speed trade-off (chapter 6). Label them "illustrative" as AGENTS.md requires. Rendering at build time needs a DOM implementation (for example linkedom or jsdom), which is one more dependency to approve.
- **visx**: MIT, 4.0.0, 2026-06-11, peer React ^18 || ^19. React-first SVG chart primitives. Fit ★★ if a chart has to be interactive inside an island.
- **JSXGraph**: dual "MIT OR LGPL-3.0-or-later" (npm); GitHub detects LGPL-3.0. 1.14.3, 2026-11-06, active. 73 MB unpacked. Strong for geometry and function plots, including 3D surfaces (https://jsxgraph.org/docs/). Fit ★: heavy, and it brings its own look that would fight the animation-sheet design.
- **Motion Canvas**: MIT, 3.17.2, 2024-12-14 (repo last push 2026-07). A TypeScript tool for authoring _videos_. Fit ★★ only as an alternative to Manim for pre-rendered clips. It's slowing down.
- **ManimCE**: MIT, 0.22.1, 2026-10-27 (PyPI and GitHub release). Python; renders MP4/WebM. Reducible's JPEG video was built with Manim (`2022/JPEGImageCompression/scenes.py` in https://github.com/nipunramk/Reducible, a repo with no licence, so read it for ideas and don't copy). Fit ★★★ for short silent clips: "a block as a sum of 64 patterns", zig-zag scan, quantization rounding coefficients to zero. Note that 3b1b's own `manim` (MIT, v1.7.2, 2024-12) is a separate fork; use ManimCE for docs and stability.
- **Idyll**: MIT, 6.0.0-alpha.6, 2022-04-22; repo last push 2023-02-04. Fit ✗: stale, and it would replace Astro rather than sit in it.
- **p5.js**: LGPL-2.1, 2.4.0, 2026-11-11, active. 16 MB unpacked. Canvas-only sketches. Fit ★: big for what it adds, and the LGPL is fine for use but heavier to reason about.
- **two.js**: MIT, 0.8.24, 2026-08-29. One 2D API over SVG, canvas or WebGL. Fit ★: plain SVG in React already does this here.
- **Rive**: runtimes MIT (`rive-app/rive-wasm`, `rive-react`, `rive-runtime` LICENSE: "MIT License, Copyright (c) 2020 Rive"); very active (2026-11-21). The **editor** is a hosted product: "Free exports play a Rive splash screen. Upgrade to remove it." (https://rive.app/pricing). Fit ★: the runtime licence is fine, but the authoring path isn't free without a splash screen, and the output is an opaque `.riv` binary with no text equivalent.
- **Lottie / dotLottie**: `lottie-web` MIT, 5.13.0, 2025-05-21, repo last push 2025-09, so it's slowing. `@lottiefiles/dotlottie-web` (0.83.2) and `-react` (0.22.3, peer React 17–19) MIT, active. Fit ★: needs After Effects or a Lottie editor to author. Nothing here calls for designer-made vector loops.
- **Theatre.js**: `@theatre/core` Apache-2.0 but `@theatre/studio` **AGPL-3.0-only**. 0.7.2, 2024-05-19; repo last push 2024-08-14. Fit ✗.

---

## 4. Scrollytelling

- **CSS scroll-driven animations**: Baseline newly available since 2026-10-27 (Chrome 115, Firefox 159, Safari 26; web-features). Zero JS, runs off the main thread, and easy to turn off under reduced motion. Fit ★★★ as progressive enhancement behind `@supports`.
- **IntersectionObserver** (already Baseline): for "step" scrollytelling, where a sticky diagram changes state as each paragraph enters, a few lines in an island do it. That's what Scrollama wraps.
- **Scrollama**: MIT, 3.2.0, 2022-06-17 (repo moved to `russellsamora/scrollama`, last push 2025-11). "Lightweight ... using IntersectionObserver in favor of scroll events" (https://www.npmjs.com/package/scrollama). Fit ★: unmaintained releases, and native IO plus CSS replace it.
- **GSAP ScrollTrigger**: ✗ for licence reasons (see §1).

Idea: in chapter 3, keep the frame stack sticky while the reader scrolls through three short paragraphs (I, then P, then B). Each step lights up one frame type and its arrows. Without JS, the three paragraphs each show their own static figure.

---

## 5. Prior art: compression and codec explainers

| Work                                                                                                                                                  | Topic                                                                                                                                                       | Tech (from source)                                                                                                                                                                                  | Lesson for us                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bartosz Ciechanowski, https://ciechanow.ski                                                                                                           | No compression article (archive lists Moon, Airfoil, Bicycle, Sound, GPS, Cameras and Lenses, Color Spaces, …). "Sound" and "Color Spaces" are the closest. | Hand-written JS per article: `/js/base.js` + `/js/color_spaces.js`, raw WebGL calls (`gl.getUniformLocation`, `gl.texParameteri`), `requestAnimationFrame`. No libraries in the page's script tags. | The bar for "amazing" is many small, self-contained figures, each with one slider, rendered flat and crisp, not one big 3D scene.                                 |
| Omar Shehata, "Unraveling the JPEG", Parametric Press issue 01, https://parametric.press/issue-01/unraveling-the-jpeg/                                | JPEG: DCT, quantization, chroma, Huffman, hands-on byte editing                                                                                             | Idyll 4 + D3 4 + a forked `jpeg-js` (package.json in https://github.com/ParametricPress/01-unraveling-the-jpeg, MIT)                                                                                | The closest match to our chapter 1. Its strongest move is letting readers corrupt real bytes and see the result. Our QP frames give the same "real data" honesty. |
| Jez Swanson, "An Interactive Introduction to Fourier Transforms", source https://github.com/Jezzamonn/fourier (MIT)                                   | Frequency decomposition, including an image/JPEG section                                                                                                    | Vanilla JS with `fft.js` and `browser-image-compression`; no framework                                                                                                                              | Shows frequency ideas with plain canvas and a small maths library. That argues for keeping the math in `src/lib` and staying dependency-light.                    |
| Reducible (YouTube), JPEG video, code in https://github.com/nipunramk/Reducible (no licence)                                                          | JPEG end to end                                                                                                                                             | Manim (3b1b `manimlib`), pre-rendered video                                                                                                                                                         | Video is the right medium for transforms that unfold over time (basis patterns being summed).                                                                     |
| Leandro Moreira, "digital_video_introduction", https://github.com/leandromoreira/digital_video_introduction (BSD-3-Clause, 16k stars, pushed 2026-11) | Whole video pipeline incl. I/P/B, motion vectors, FFmpeg hands-on                                                                                           | Static Markdown + images + FFmpeg commands                                                                                                                                                          | A content checklist for chapters 3–7. It shows FFmpeg `codecview` motion-vector overlays as figures.                                                              |
| FFmpeg `codecview` filter, https://ffmpeg.org/ffmpeg-filters.html#codecview                                                                           | "Visualize information exported by some codecs"                                                                                                             | `ffplay -flags2 +export_mvs input.mp4 -vf codecview=mv=pf+bf+bb`                                                                                                                                    | The source for honest, real motion-vector clips (P-forward, B-forward, B-backward) to sit next to the simplified widgets.                                         |

I couldn't find another interactive, browser-based motion-vector or GOP explainer with public source through GitHub repo search (`"motion vector visualization h264"` and `"dct visualization interactive"` returned nothing). That gap is part of what this guide can fill.

---

## 6. Agent skills / MCP servers

### Already installed locally (check these first)

Found in `C:\Users\User\.claude\skills` and canonical sources in `C:\Users\User\.config\agent-sync\.rulesync\skills`:

- **`impeccable`**: has `reference/animate.md`, `overdrive.md`, `delight.md` and reduced-motion guidance in `audit.md`, `distill.md` and `quieter.md`. It already owns this site's design direction (`.impeccable/`). This is the main skill for motion design decisions.
- **`modern-web-guidance`**: guides for view transitions and scroll-driven effects (e.g. `guides/performance/faster-spa-view-transitions.md`, `guides/ui-atoms/scroll-progress-indicator.md`). Use it for the native-first path.
- **`web-ui-accessibility`**, **`frontend-quality`**: accessibility and screenshot checks for any new island.
- **`archify`** and **`diagram-design`**: standalone HTML/SVG diagrams with motion. Useful for prototyping a figure, not for shipping islands.
- **`dataviz`** (built-in): chart form and colour method. Use it before building Plot/D3 charts.
- **`prototype`**: throwaway prototypes, for trying a 3D scene before committing to a dependency.
- `lumos-astro` is a **broken symlink** (points to `C:\Users\User\.agents\skills\lumos-astro`, which is empty or missing). Worth cleaning up through `agent-skill-management`.

### Candidates on skills.sh (found with `npx skills find`; not installed)

| Skill                                                                                                                 | Source repo (licence, last push)                                                             | Installs (skills.sh) | Relevance                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cloudai-x/threejs-skills@threejs-fundamentals`, `-animation`, `-shaders`, `-materials`, `-react-three-fiber`         | https://github.com/CloudAI-X/threejs-skills (MIT, 2026-10-19)                                | 8.5K–29.3K each      | ★★★ if we build the 3D island. Install only the R3F and fundamentals skills.                                                                                                          |
| `emilkowalski/skills@review-animations`, `improve-animations`, `animation-vocabulary`, `find-animation-opportunities` | https://github.com/emilkowalski/skills (MIT, 2026-11-15)                                     | 274K–328K            | ★★ overlaps with `impeccable`'s animate reference; `review-animations` could be a second opinion.                                                                                     |
| `greensock/gsap-skills@gsap-core`, `gsap-scrolltrigger`, …                                                            | https://github.com/greensock/gsap-skills (MIT, 2026-07-29)                                   | ~87K–95K             | ✗ unless GSAP is adopted.                                                                                                                                                             |
| `adithya-s-k/manim_skill@manimce-best-practices`                                                                      | https://github.com/adithya-s-k/manim_skill (MIT, 2026-01-23)                                 | 4.9K                 | ★★ if we pre-render clips with ManimCE.                                                                                                                                               |
| `remotion-dev/skills@remotion-*`                                                                                      | https://github.com/remotion-dev/skills (no licence detected)                                 | up to 884K           | ✗ Remotion itself is not open source: "a company license is required for for-profit organizations of a certain size" (https://github.com/remotion-dev/remotion/blob/main/LICENSE.md). |
| Official `anthropics/skills`                                                                                          | https://github.com/anthropics/skills (no repo-level licence detected; per-skill LICENSE.txt) | —                    | `algorithmic-art` (p5.js generative art) and `web-artifacts-builder`. Neither targets Astro islands. Low relevance.                                                                   |

I didn't find an MCP server dedicated to animation or 3D authoring worth recommending. The installed `astro-docs` MCP covers Astro island questions.

---

## Fits our constraints

- **No-JS fallback.** Every island's server HTML must show a meaningful resting state. Native CSS and Motion do that naturally, since the initial render _is_ the content. For three.js/R3F, render the current CSS/SVG frame stack as the server markup and mount the canvas on top only after hydration and a WebGL check. Pre-rendered video needs a `poster` image and a caption that says what it shows. Build-time Plot charts are plain SVG.
- **Reduced motion.** Native: `@media (prefers-reduced-motion: no-preference)` around every animation. Motion: wrap islands in `<MotionConfig reducedMotion="user">`. R3F: `frameloop="demand"`, no auto-rotate, and jump straight to the end state when `matchMedia('(prefers-reduced-motion: reduce)')` matches (the pattern FrameStack3D already uses). Video: no `autoplay` when reduced motion is set; give play/pause controls.
- **Bundle cost per island.** Each `client:visible` island pulls in its own chunk, though Vite shares common chunks. Rough guide, using published numbers only: native 0; Motion ~3–5 kB (mini or LazyMotion) up to 22–43 kB for the full API; anime.js ~24.5 kB full. three.js + R3F + drei publish no gzip size, but they are by far the heaviest choice. Measure with `npm run build` and the `dist/_astro` chunk sizes before approving, and keep it to one 3D island that loads only when visible.
- **GitHub Pages base path.** Any runtime-loaded asset (video, textures, `.glb`, `.riv`, `.lottie`) must resolve under `/rate-control-field-guide`. Import it through Vite (`import url from '../assets/x.mp4?url'`) or build URLs from `import.meta.env.BASE_URL`, never `"/x.mp4"`. Video posters can go through `getImage` like the QP frames. Don't load from third-party CDNs at runtime: Spline and Rive community embeds would break the "static hosting only" rule and add a third-party request.
- **Tokens and colour.** WebGL materials need colours in JS. Read them at runtime from CSS custom properties (`getComputedStyle(document.documentElement).getPropertyValue('--color-key')`) so `scripts/check-tokens.mjs` stays clean and the red-key / blue-motion rules still hold. Keep the I/P/B letter and border-style distinction in 3D as well (letters through drei `Html`, dashed edges with `LineDashedMaterial`).
- **React pin.** R3F 9.8.2 requires `react <19.4`. Note this next to the TypeScript pin in AGENTS.md if R3F is adopted.

---

## Avoid, and why

- **Spline**: proprietary runtime with no licence on npm and no public repo (404). Free plan watermarks web embeds. Code and self-hosted export are paid. 35.9 MB runtime package.
- **GSAP (and its skills)**: free of charge but under a proprietary "no charge" licence with no LICENSE file in the repo. The terms page is login-gated, so I couldn't verify the clauses. Doesn't meet "open source".
- **Remotion**: source-available, with a company licence required above a size threshold.
- **Theatre.js**: Studio is AGPL-3.0-only, and no release since 2024-05-19.
- **Idyll**: last publish 2022 (alpha), repo idle since 2023-02. It's a whole framework, not an island.
- **@react-three/a11y**: no release since 2022, and its LICENSE file contains a merge-conflict marker.
- **Scrollama**: no release since 2022. Native IntersectionObserver plus CSS scroll-driven animations do the same job.
- **Threlte**: Svelte only.
- **Babylon.js, JSXGraph, p5.js** for this site: heavy (72 MB / 73 MB / 16 MB unpacked) for flat diagrams. Fine projects, wrong scale.
- **Rive / Lottie**: authoring depends on hosted editors (Rive's free exports show a splash screen) and produces opaque binaries with no text equivalent. lottie-web's last publish was 2025-05.
- **WebGPU-only rendering**: WebGPU is not Baseline (no Firefox entry in web-features). Use three's WebGL 2 path, or `WebGPURenderer` with its automatic WebGL 2 fallback.

---

## Sources

Registry and repo metadata (read 2026-11-22):

- npm: `npm view <pkg> --json` for motion, gsap, animejs, @react-spring/web, three, @react-three/fiber, @react-three/drei, @react-three/a11y, @threlte/core, ogl, @babylonjs/core, regl, @splinetool/runtime, @splinetool/react-spline, mafs, d3, @observablehq/plot, @visx/shape, jsxgraph, @motion-canvas/core, idyll, p5, two.js, @rive-app/canvas, @rive-app/react-canvas, lottie-web, @lottiefiles/dotlottie-web, @lottiefiles/dotlottie-react, @theatre/core, @theatre/studio, scrollama (https://www.npmjs.com/package/<name>)
- GitHub API `repos/<owner>/<repo>` and `releases/latest` for: motiondivision/motion, greensock/GSAP, juliangarnier/anime, pmndrs/react-spring, mrdoob/three.js, pmndrs/react-three-fiber, pmndrs/drei, pmndrs/react-three-a11y, threlte/threlte, oframe/ogl, BabylonJS/Babylon.js, regl-project/regl, stevenpetryk/mafs, d3/d3, observablehq/plot, airbnb/visx, jsxgraph/jsxgraph, motion-canvas/motion-canvas, idyll-lang/idyll, processing/p5.js, jonobr1/two.js, rive-app/rive-wasm, rive-app/rive-react, airbnb/lottie-web, LottieFiles/dotlottie-web, theatre-js/theatre, russellsamora/scrollama, ManimCommunity/manim, 3b1b/manim
- PyPI: https://pypi.org/pypi/manim/json
- web-features 3.47.0: https://cdn.jsdelivr.net/npm/web-features/data.json

Docs and pages:

- Motion: https://motion.dev/docs/react-accessibility · https://motion.dev/docs/react-reduce-bundle-size · https://motion.dev/docs/animate
- GSAP: https://github.com/greensock/GSAP (README) · https://webflow.com/blog/gsap-becomes-free · https://gsap.com/standard-license (login-gated, not readable)
- anime.js: https://animejs.com/
- React Spring: https://www.react-spring.dev/docs/utilities/use-reduced-motion
- R3F: https://r3f.docs.pmnd.rs/getting-started/installation · https://r3f.docs.pmnd.rs/advanced/scaling-performance
- three.js WebGPURenderer source: https://github.com/mrdoob/three.js/blob/dev/src/renderers/webgpu/WebGPURenderer.js
- drei: https://github.com/pmndrs/drei (README)
- Threlte: https://threlte.xyz/docs/learn/getting-started/introduction
- Spline: https://spline.design/pricing
- Rive: https://rive.app/pricing · https://github.com/rive-app/rive-runtime/blob/main/LICENSE
- Mafs: https://mafs.dev/guides/interaction/movable-points
- Observable Plot: https://observablehq.com/plot/features/plots
- JSXGraph: https://jsxgraph.org/docs/
- Scrollama: https://www.npmjs.com/package/scrollama · https://github.com/russellsamora/scrollama
- Remotion licence: https://github.com/remotion-dev/remotion/blob/main/LICENSE.md
- FFmpeg codecview: https://ffmpeg.org/ffmpeg-filters.html#codecview

Prior art:

- https://ciechanow.ski/archives/ · https://ciechanow.ski/color-spaces/ (+ `/js/base.js`, `/js/color_spaces.js`)
- https://parametric.press/issue-01/unraveling-the-jpeg/ · https://github.com/ParametricPress/01-unraveling-the-jpeg
- https://github.com/Jezzamonn/fourier
- https://github.com/nipunramk/Reducible
- https://github.com/leandromoreira/digital_video_introduction

Skills:

- `npx skills find <query>` results (skills.sh index), and repos: https://github.com/CloudAI-X/threejs-skills · https://github.com/emilkowalski/skills · https://github.com/greensock/gsap-skills · https://github.com/adithya-s-k/manim_skill · https://github.com/remotion-dev/skills · https://github.com/anthropics/skills
