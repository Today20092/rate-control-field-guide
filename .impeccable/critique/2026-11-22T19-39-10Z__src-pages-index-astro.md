---
target: Field guide homepage
total_score: 31
max_score: 40
na_heuristics: ''
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\User\\rate-control-field-guide\\src\\pages\\index.astro"
target_fingerprint: "sha256:11ee1e30185849d14999a1a7f9f60b4f43a54838ffc2b5600759b693574ab4fe"
target_path: "C:\\Users\\User\\rate-control-field-guide\\src\\pages\\index.astro"
timestamp: 2026-11-22T19-39-10Z
slug: src-pages-index-astro
---
# Field guide critique

Two independent assessments reviewed the guide. The design review used live browser layout and interaction checks. The detector scanned source and the rendered page.

## Baseline

31/40 (Good). Visibility 3, real-world match 3, user control 3, consistency 3, error prevention 3, recognition 3, efficiency 3, aesthetics 3, recovery 4, help 3.

The animation sheet, peg rail and measured clip give the guide a recognizable teaching style. The first demo sits below the learning goals at common viewport heights. The intro provides a direct link to the frame stack.

## Findings addressed

- Previous and Next could split across rows. They now stay together, with Play and Stop as a separate action. Readers choose when the steps advance.
- The chapter indicator could keep an old chapter when readers scrolled back to the intro. It now follows the reader's position.
- The JPEG coefficient grid was hard to read on a phone. It gets a full row on narrow screens, with larger, higher-contrast numbers.
- Readers saw rate-control acronyms before they knew which mode to choose. The chapter now starts with common goals and gives long FFmpeg commands room to wrap.
- Chapter goal links now meet the 44 px target. The copy pass shortened explanations and scoped the measured frame-size comparison to the actual clip.

The final source detector returned no findings. The browser screenshot API did not provide an image, so rendered checks used live browser measurements.
