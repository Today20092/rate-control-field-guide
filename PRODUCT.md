# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro (static output) with React islands for interactive diagrams, Tailwind v4, and shadcn primitives only where a control needs one. Deployed to GitHub Pages through `.github/workflows/deploy-pages.yml`.

## Users

Total beginners and videographers: anyone who has seen words like "H.264", "bitrate" or "1080p" in an export dialog or a streaming setting and wants to know what they mean. Assume no engineering or video background. They read on a phone as often as on a desktop.

## Product Purpose

A free, single-page interactive guide that explains how video compression works, building up step by step:

1. How a single image is compressed (JPEG: blocks, frequency, throwing away detail).
2. Intra-frame coding: compressing each video frame on its own like a JPEG.
3. Inter-frame coding in H.264 and H.265: I-frames, P-frames and B-frames, what each references and what each costs.
4. Delivery codecs vs editing codecs: how H.264/H.265 work in general (long GOP: small files, heavy decoding) against ProRes/DNxHR (every frame whole: large files, smooth editing playback), and the proxy workflow videographers use.
5. Bitrate vs resolution: why more pixels without more bits can look worse, and how bits per pixel works.
6. The trade-offs: file size, quality, encode speed and decode speed pull against each other; codec choice and presets move you along them.
7. Rate control (CRF, CQP, VBR, CBR) as the practical "what do I set?" closing chapter, with FFmpeg starting points.

The central idea to land: a compressed video does not store a stack of full pictures. It stores a few full pictures plus motion data (motion vectors and leftover differences) between them, and that is where most of the space saving comes from. Show it in 3D: frames stacked in depth, with motion vectors and residuals visibly linking them.

Success: a beginner finishes understanding what bitrate is, able to explain why a 4K video at a low bitrate can look worse than a 1080p one, what I/P/B frames are, and why H.264 is small but slow to edit while ProRes/DNxHR is big but smooth.

## Positioning

Teach by letting the reader poke the mechanism: every concept is a diagram the reader can change, not a paragraph to read. Simplified models are labelled as such; nothing claims to be a benchmark.

## Capabilities and Constraints

- One long scrolling page with numbered chapters and chapter navigation. Must work equally on phone and desktop, touch and pointer.
- Diagrams, animations, 3D frame-stack scenes and interactive widgets are core; short video or video-like animation is welcome where it shows motion better than a still. Motion must respect `prefers-reduced-motion`.
- Static hosting only (GitHub Pages, relative `base`). No backend.
- Codebase should stay clean and maintainable: content separate from widgets, one component per widget.

## Brand Commitments

- Footer link to the author's YouTube channel: https://www.youtube.com/channel/UCVAZXZ90b8aw3i1MQngo_WQ/
- `.github/FUNDING.yml` (GitHub Sponsors and Ko-fi) stays.

## Evidence on Hand

- Real H.264 encodes of one frame at QP 18, 28, 38, 48: `src/assets/quantization/qp-*.png`.
- Rate-control content and FFmpeg commands from the previous site (git history, `src/App.tsx` at `d9115d0`).
- `research.md`: earlier teaching notes on rate control.
- No measured codec benchmarks exist. Any numbers in charts are illustrative and must say so.

## Product Principles

- The first screen says what the page teaches and why it matters, as a list of goals that link to their chapters.
- Comparisons are swipes (one frame, a draggable divider), not stacked images, so phones see both sides at once.

- Show before you explain: a diagram changes state before a paragraph explains it.
- Build up one idea at a time; each chapter uses only what earlier chapters taught.
- Plain words first, the real term second ("reference frame (I-frame)").
- Honest simplifications: label teaching models and illustrative numbers.

## Accessibility & Inclusion

Every interactive works by keyboard and touch, has a text equivalent of what it shows, and respects reduced motion.
