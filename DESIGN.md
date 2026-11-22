---
name: Video Compression, Frame by Frame
description: An interactive beginner's guide to video compression, set as an animator's exposure sheet.
colors:
  paper: '#f4f6f4'
  sheet: '#ffffff'
  peg: '#e9e2c8'
  peg-shade: '#cfc6a4'
  line: '#cfd6d2'
  ink: '#1d2326'
  ink-soft: '#4a5357'
  ink-faint: '#6b7478'
  graphite: '#8b9397'
  key: '#d8432b'
  key-ink: '#a8301b'
  motion: '#3d7fc0'
  motion-ink: '#2a6aa8'
  motion-wash: '#dcebf8'
typography:
  display:
    fontFamily: "'Bricolage Grotesque Variable', 'Segoe UI', sans-serif"
    fontSize: 'clamp(2.6rem, 8vw, 5.5rem)'
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: '-0.025em'
  headline:
    fontFamily: "'Bricolage Grotesque Variable', 'Segoe UI', sans-serif"
    fontSize: 'clamp(2rem, 5.5vw, 3.5rem)'
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: '-0.025em'
  title:
    fontFamily: "'Bricolage Grotesque Variable', 'Segoe UI', sans-serif"
    fontSize: '1.6rem'
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: '-0.025em'
  takeaway:
    fontFamily: "'Bricolage Grotesque Variable', 'Segoe UI', sans-serif"
    fontSize: '1.05rem'
    fontWeight: 700
    lineHeight: 1.35
  lede:
    fontFamily: "'Literata Variable', Georgia, serif"
    fontSize: '1.2rem'
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "'Literata Variable', Georgia, serif"
    fontSize: '1.0625rem'
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace"
    fontSize: '0.75rem'
    fontWeight: 400
    letterSpacing: '0.04em'
  control:
    fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace"
    fontSize: '0.8rem'
    fontWeight: 600
rounded:
  focus: '2px'
  sm: '0.25rem'
  md: '0.375rem'
  peg-tab: '0.5rem'
  pill: '999px'
spacing:
  xs: '0.5rem'
  sm: '0.75rem'
  md: '1rem'
  lg: '1.5rem'
  xl: '2rem'
  2xl: '3rem'
components:
  control:
    backgroundColor: '{colors.sheet}'
    textColor: '{colors.ink}'
    typography: '{typography.control}'
    rounded: '{rounded.pill}'
    padding: '0 1rem'
    height: '2.75rem'
  control-hover:
    backgroundColor: '{colors.peg}'
    textColor: '{colors.ink}'
  control-pressed:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
  frame-tag-i:
    backgroundColor: '{colors.sheet}'
    textColor: '{colors.key-ink}'
    size: '2.25rem'
  frame-tag-p:
    backgroundColor: '{colors.sheet}'
    textColor: '{colors.ink}'
    size: '2.25rem'
  frame-tag-b:
    backgroundColor: '{colors.sheet}'
    textColor: '{colors.ink}'
    size: '2.25rem'
  figure-caption:
    textColor: '{colors.ink}'
    typography: '{typography.takeaway}'
    padding: '0.9rem 0'
  command-slab:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    rounded: '{rounded.md}'
    padding: '0.75rem'
  peg-strip-page:
    backgroundColor: '{colors.peg}'
    height: '3.5rem'
  peg-strip-chapter:
    backgroundColor: '{colors.peg}'
    rounded: '{rounded.peg-tab}'
    height: '2.25rem'
---

# Design System: Video Compression, Frame by Frame

## Overview

**Creative North Star: "The Animator's Exposure Sheet"**

The guide is set as a working animation sheet, because animators named the idea first: key drawings, breakdowns and in-betweens are I, P and B frames. Cool bond paper carries graphite ink, a punched peg strip heads the page and every chapter, a timing-chart rail of ticks tracks the reader's place, and figures sit on the paper as ruled exposure-sheet frames rather than as cards. Two pencils do all the signalling: red for keys and "you are here", non-photo blue for motion and prediction.

Density is a calm reading column with diagrams breaking out to full measure. Diagrams are flat planes lit from one side; the only depth in the system is the 3D frame stack, where frames float apart to show that only the keys are whole pictures. Measurements are literal: a bar's length equals the bits it stands for.

**Key Characteristics:**

- Cool paper ground, graphite ink, no tinted surfaces beyond the peg tan.
- Two reserved pencil colours with fixed meanings, never decoration.
- Ruled sheets (heavy rule above, hairline below) instead of boxed cards.
- Mono numerals for frame numbers, measurements and axis text.
- Lengths that encode quantity exactly.

## Colors

A near-neutral paper-and-graphite palette with two reserved pencil colours.

### Primary

- **Red Key Pencil** (`key`): I-frames and keys, the current chapter tick, the hero's word "changes", the key-idea circle, range-input accent. Used for fills, strokes and large type.
- **Key Pencil Ink** (`key-ink`): the same red darkened for small text on paper (meets 4.5:1): current chapter name, I-frame labels, "K" in the key-idea mark.

### Secondary

- **Non-Photo Blue** (`motion`): motion vectors, prediction, diagram strokes, the focus ring, the first pipeline step. Meets 3:1 for strokes.
- **Non-Photo Blue Ink** (`motion-ink`): blue for small text and prose links (meets 4.5:1).
- **Blue Wash** (`motion-wash`): text selection background only.

### Neutral

- **Bond Paper** (`paper`): page background, sticky mobile contents bar, pressed-control text.
- **Clean Sheet** (`sheet`): control faces, frame-type tags, frames in the 3D stack.
- **Peg Tan** (`peg`): peg strips and control hover.
- **Peg Shade** (`peg-shade`): the page peg strip's bottom rule and the inset shading in each peg hole.
- **Ruling Line** (`line`): hairline rules, table rows, rail divider, figure bottom rule, canvas borders.
- **Graphite Ink** (`ink`): body text, heavy rules, control borders, pressed controls, P-frame borders.
- **Soft Graphite** (`ink-soft`): lede, secondary text, inactive rail names, footer.
- **Faint Graphite** (`ink-faint`): table headers, figure notes, step numbers.
- **Graphite Pencil** (`graphite`): B-frame dashed borders and bars, key-idea rules, scrollbar thumb.

### Named Rules

**The Two Pencils Rule.** Red marks only I-frames, keys and the current position. Blue marks only motion vectors, prediction and diagram labels. Neither colour is ever used for emphasis, branding or decoration. The build's only other blue uses are functional: prose and footer links (`motion-ink`) and the focus ring (`motion`).

**The Not By Colour Alone Rule.** I, P and B are always distinguished by letter and border style as well as colour: I has a 3–4px solid red border, P a 2px solid ink border, B a 2px dashed graphite border.

**The One Colour File Rule.** Raw colour values live only in `src/styles/global.css`; everywhere else uses a token or its Tailwind class (`scripts/check-tokens.mjs` enforces this).

## Typography

**Display Font:** Bricolage Grotesque Variable (with Segoe UI, sans-serif)
**Body Font:** Literata Variable (with Georgia, serif)
**Label/Mono Font:** JetBrains Mono Variable (with ui-monospace, monospace)

**Character:** A heavy, slightly quirky grotesque for headings and the sentence that states each figure's point, over a warm reading serif; mono carries every number that is a frame, a measurement or an axis.

### Hierarchy

- **Display** (800, clamp(2.6rem, 8vw, 5.5rem), 0.95): the hero title only, max 14ch, the key word set upright in red.
- **Headline** (800, clamp(2rem, 5.5vw, 3.5rem), 1.05): chapter titles under each peg strip.
- **Title** (800, 1.6rem): sub-headings inside prose; rate-control panel titles (`text-2xl`).
- **Takeaway** (700, 1.05rem, 1.35): every figure's one-sentence point; key ideas use the same face at 600, 1.2rem.
- **Lede** (400, 1.2rem, 1.6): hero introduction in soft graphite, max 38rem.
- **Body** (400, 1.0625rem, 1.65): prose in a 40rem column (about 65–70 characters); paragraphs spaced 1.1em; strong at 650.
- **Label** (400, 0.75rem, 0.04em, uppercase): frame numbers, measurements, axis text, figure notes, table headers.
- **Control** (600, 0.8rem): all button and tab text.

Headings use `text-wrap: balance` and -0.025em tracking; paragraphs use `text-wrap: pretty`. Tabular figures in the exposure sheet.

### Named Rules

**The Mono Means Measured Rule.** Mono is reserved for things that are counted or measured: frame numbers, sizes, settings, axes, commands. Prose and headings never use it.

## Layout

One long page. Below 70rem the content is a single column with a sticky contents bar on top; from 70rem a 13rem sticky timing-chart rail sits to the left of the main column. The main column is capped at 66rem with side padding `clamp(1rem, 4vw, 3.5rem)`.

The hero is a single column on phones; from 60rem it becomes copy plus a 15rem exposure-sheet margin, with the hero figure spanning both below. Prose holds to 40rem while figures take the full main width. Chapters are separated by `clamp(4rem, 10vw, 7rem)`; figures by 3rem above and below. Widgets use container queries to adapt to their figure width; the encoder pipeline goes from a stack to four columns at 48rem. Wide tables scroll horizontally inside their own wrapper. Spacing follows the Tailwind 0.25rem grid, with the steps above reused most.

## Elevation & Depth

Flat by default. Depth is drawn, not shaded: a heavy 1.5px ink rule over a hairline marks a sheet, and peg holes are punched with a 2px inset shade. There are no gradients and no glows.

### Shadow Vocabulary

- **Peg hole punch** (`box-shadow: inset 0 2px 0 var(--color-peg-shade)`): the inside edge of each peg hole.
- **Floating frame** (`box-shadow: 0 10px 24px -14px var(--color-ink)`): frames in the 3D frame stack only, so the planes read as lifted off the sheet.

### Named Rules

**The Only The Stack Floats Rule.** The 3D frame stack is the one place anything casts a shadow. Every other surface stays on the paper.

## Shapes

Straight-edged sheets. Figures, key ideas and tables are open, ruled forms with no corners at all. The page peg strip is square; chapter peg strips have a 0.5rem tab radius on their top corners. Peg holes are circles and a central slot (pill). Controls are full pills with a 1.5px ink border. Raster frames, canvases and the command slab carry a slight 0.375rem radius; small bars and markers 0.25rem. Frame-type tags are square.

## Components

### Buttons and Tabs (`.ctl`)

Firm, inked and tactile, like a stamped button on a light box.

- **Shape:** full pill (999px), 1.5px solid ink border, minimum 44×44px.
- **Default:** clean sheet face, ink text, mono 0.8rem/600, 0 1rem padding.
- **Hover:** peg tan face; 160ms expo-out colour transition.
- **Pressed / Selected:** `aria-pressed="true"` or `aria-selected="true"` fills ink with paper text; in forced colours adds a 3px CanvasText outline.
- **Disabled:** 45% opacity, not-allowed cursor.
- **Focus:** global 3px non-photo blue outline, 3px offset, 2px corner radius.
- **Inverse:** on the command slab the control takes a paper border and ink face, hovering to soft graphite.

Tabs are APG-pattern `role="tab"` buttons using the same class; ranges use `.range` (full width, 44px tall) with a red accent.

### Figure (ruled sheet)

- **Frame:** 1.5px ink rule on top, 1px line rule below, no fill, no radius.
- **Stage:** 1.5rem vertical padding.
- **Caption:** separated by a dashed hairline; the takeaway in display 700 on the left, an optional mono label note in faint graphite on the right ("Sizes are illustrative.").

### Key Idea

A chapter's one sentence to remember, circled like a key drawing: a red 3px stroked circle with a mono "K" in key ink, beside display 600 text at 1.2rem, between two graphite hairlines, max 40rem.

### Frame-Type Tags

2.25rem squares on the clean sheet with a mono bold letter: I (3px solid red, key-ink letter), P (2px solid ink), B (2px dashed graphite).

### Navigation (Timing-Chart Rail)

- **Desktop (≥70rem):** sticky full-height rail, line divider on its right. Each chapter row is a 1px ink tick, a mono number and a short name in soft graphite, 44px tall. Hover lengthens the tick. Current chapter (`aria-current="location"`): tick thickens to 3px and turns red, text in bold key ink.
- **Phone:** a sticky paper bar with a native disclosure: mono "Contents" label, current chapter name in bold display key ink, a drawn chevron; the open list uses hairline-separated 44px rows.

### Peg Strip

The registration strip of an animation sheet: peg tan band with two round holes and a central slot, all punched in paper with the inset shade. Page size (3.5rem, peg-shade bottom rule) heads the page; chapter size (2.25rem, tabbed top corners) heads each chapter. Decorative and hidden from assistive tech.

### Exposure Sheet

The hero margin: a mono table of frames with a heavy top rule and hairline rows; each row's bar length is the frame's stored size. I rows are red and bold, P bars ink, B bars graphite; tabular figures; an "illustrative" note below.

### Command Slab

FFmpeg commands on an ink slab with paper text, 0.375rem radius, mono 0.8rem, horizontally scrollable, with an inverse copy control.

### Frame Stack (signature)

Frames as flat 16:9 planes in perspective (`rotateX(52deg) rotateZ(-30deg)`), bordered by type, labelled in mono. They fan apart along the stack with a 900ms expo-out transition staggered 45ms per frame; the hero instance plays the fan-open once on entering view, only when motion is allowed. Bars below compare all-full-pictures against what is stored.

## Do's and Don'ts

### Do:

- **Do** set every figure as a ruled sheet with a visible one-sentence takeaway, and label simplified models and illustrative numbers in the note.
- **Do** make bar lengths and sizes proportional to the quantity they show.
- **Do** use the `.ctl` and `.range` classes for every control, keeping the 44px minimum.
- **Do** use `key-ink` and `motion-ink` for small red or blue text, and `key` and `motion` for strokes, fills and large type.
- **Do** drive motion with the expo-out ease (`cubic-bezier(0.16, 1, 0.3, 1)`) and let `prefers-reduced-motion` collapse it.

### Don't:

- **Don't** use red or blue for anything outside their roles (keys and current position; motion, prediction and labels).
- **Don't** tell I, P and B apart by colour alone.
- **Don't** put content in boxed, filled, shadowed cards; figures are open ruled sheets on the paper.
- **Don't** add gradients or glow to diagrams, or shadows outside the 3D frame stack.
- **Don't** write raw colour values outside `src/styles/global.css`.
