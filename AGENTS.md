# AGENTS.md

A free, single-page interactive guide to video compression (JPEG blocks, I/P/B frames, H.264 vs H.265, bitrate, rate control) for total beginners. Astro 7 static site with React 19 islands and Tailwind v4, deployed to GitHub Pages.

Design authorities: `PRODUCT.md` (audience, chapter plan, principles) and `.impeccable/surfaces/src-pages-index-astro.md` (visual direction). Read them before changing copy, layout or diagrams. `research.md` holds earlier teaching notes on rate control.

## Layout

- `src/pages/index.astro`: the whole guide, one long page.
- `src/layouts/Base.astro`: document shell.
- `src/components/*.astro`: page pieces (`Chapter`, `Figure`, `KeyIdea`, `Prose`, `ChapterRail`, `PegStrip`, `ExposureSheet`, `EncoderPipeline`).
- `src/components/widgets/*.tsx`: one React island per interactive diagram, hydrated with `client:visible`. `CompareSlider` is the shared swipe comparison; use it for any before/after pair so phones see both in one frame.
- `src/components/ui/*.tsx`: Tabs, Slider and Meter from the cnippet registry (shadcn CLI, built on Base UI), restyled to the palette. Add more with `npx shadcn@latest add @cnippet/<name>`, then restyle them with tokens. `src/lib/utils.ts` holds their `cn` helper.
- `src/lib/*.ts`: pure teaching models (`dct`, `gop`, `bitrate`, `tradeoffs`). Keep widget logic here, not in components, and test it in `src/lib/models.test.ts`.
- `src/content/chapters.ts`: chapter list; drives the rail, mobile contents and section ids. `src/content/rateModes.ts`: rate-control data. `src/content/editingCodecs.ts`: approximate ProRes/DNxHR/H.264 storage rates and their sources.
- `src/styles/global.css`: design tokens and shared control classes.
- `src/assets/quantization/qp-*.png`: real H.264 frames, optimized through `getImage` from `astro:assets`.
- `scripts/make-clips.mjs`: cuts and measures the real clip (`public/video/podcast.mp4`, `src/content/podcastFrames.json`) and writes Remotion's source clips to `remotion/public/` (gitignored). The source footage lives outside the repo.
- `remotion/`: Remotion compositions rendered to `public/video/*.mp4`. Colours are read from `global.css` through a `?raw` import (see `remotion.config.ts`). Remotion's agent skills are in `.claude/skills/remotion-*`.

## Commands

Node `>=22.23.4` (see `.nvmrc`).

```sh
npm run dev       # local dev server
npm run build     # static build to dist/
npm run preview   # serve the build
npm run format    # prettier --write .
npm run check     # astro check, eslint, prettier --check, token check, tests
npm test          # node --test src/lib/ (node:test, no Vitest)
node --test --test-name-pattern="bitrate" src/lib/   # one test by name
node scripts/make-clips.mjs <source> <start s> [secs]  # real clip + frame sizes (needs ffmpeg)
npx remotion studio remotion/index.ts                    # preview videos
npx remotion render remotion/index.ts NoKeyFrame public/video/no-key-frame.mp4 --crf=24
```

Run `npm run check` before calling work done. CI (`.github/workflows/deploy-pages.yml`) only runs `npm ci` and `npm run build` on push to `main` and deploys, so nothing else catches a failing check.

## Rules

- Raw colours (hex, `rgb()`, `oklch()` etc.) go only in `src/styles/global.css`; elsewhere use a token or Tailwind class. `scripts/check-tokens.mjs` enforces this.
- Components must not import from `pages/` or `layouts/`; pass data as props (ESLint enforces).
- Red key tokens mark only I-frames/keys and the current position; blue motion tokens mark only motion vectors, prediction and diagram labels, plus links and focus rings. The blue is darker than the contract's `#6fa8dc` on purpose: that value fails contrast on the paper. Never distinguish I/P/B by colour alone: add the letter and a border style.
- Every `Figure` needs a visible one-sentence `takeaway`. Label simplified models and illustrative numbers as such; there are no real benchmarks.
- Plain words first, real term second ("reference frame (I-frame)"). Write short sentences in plain English: one idea per sentence, active voice, straight quotes, no em dashes.
- Content must be readable without JS, and motion must respect `prefers-reduced-motion`.
- Controls: tabs, sliders and meters come from `src/components/ui` (Base UI handles their keyboard and ARIA). Toggle groups stay native `<button aria-pressed class="ctl">`. Keep every target at least 44px. The shadcn colour names (`primary`, `muted`, `input`, `ring`...) in `global.css` map onto the palette; do not add new raw values for them.
- Asset and link URLs must work under the `/rate-control-field-guide` base set in `astro.config.mjs`.
- Keep `typescript` pinned at `~6.0.3`: newer versions break `@astrojs/check` and `typescript-eslint`.
- Do not add dependencies without asking.

## Git

`main` is the default branch and every push to it deploys. Ask before committing or pushing.
