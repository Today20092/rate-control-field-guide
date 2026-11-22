---
target: Field guide homepage
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\User\\rate-control-field-guide\\src\\pages\\index.astro"
target_fingerprint: "sha256:fc0e76419a551a170cb36b79014acc4df2186baf459d3f27c53a6726d61ea4a9"
target_path: "C:\\Users\\User\\rate-control-field-guide\\src\\pages\\index.astro"
timestamp: 2026-11-22T19-12-05Z
slug: src-pages-index-astro
---
# Field guide critique

Method: two independent assessments on `src/pages/index.astro`. The design review used live DOM measurements and Chromium screenshots. The detector used shipped source and a live DOM scan.

## Baseline

29/40 (Good). Visibility 3, real-world match 3, user control 2, consistency 3, error prevention 3, recognition 2, efficiency 4, aesthetics 4, recovery 2, help 3.

The exposure-sheet typography, peg rail and movable frame stack give the guide a distinct identity. The highest-priority problems were the hard-to-reach stack, tiny and timed frame-builder labels, and frame-strip navigation that was difficult to discover on a phone.

## Changes verified

- The intro links directly to the stack. The chapter learning goals remain linked.
- The frame builder fits all three tabs on one row from 320 px. Labels use HTML, and manual step controls and Replay work independently. Reduced-motion users start at the completed frame with manual steps available.
- The GOP controls fit narrow viewports. Its strip has 44 px frame targets and visible guidance before the chart.
- The bitrate lab gives readers a first experiment and the buffer panel identifies its fixed-speed connection scenario.
- Shared secondary text was darkened. Type sizes now follow the documented scale and the existing focus outline radius is documented.
- The real clip shows only the chosen video and updates the frame type and size on seek.

## Final checks

Impeccable source detector returned zero findings. Browser layout checks passed at 320, 390, 768 and 1280 CSS px. The production build and repository checks passed. The browser overlay produced partial evidence during the baseline because its scan did not finish. The score above describes the baseline design assessment.
