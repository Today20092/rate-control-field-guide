# Rate-control modes for H.264 and H.265

## The idea to teach first

Rate control answers one question: **what should the encoder hold steady when the pictures become easier or harder to compress?** You cannot hold quality, bitrate, file size, and encode time fixed at once.

There are two separate decisions:

- **Rate control** chooses how bits are spent: fixed quantizer, target quality, target average bitrate, or tightly bounded bitrate.
- **Preset / encoder effort** chooses how hard the encoder searches for efficient decisions. A slower x265 preset uses more computation to get better quality at the selected bitrate, or fewer bits at the selected CRF quality. It does not simply "turn quality up." [x265 preset documentation](https://x265.readthedocs.io/en/master/presets.html)

That distinction matters for the proposed triangle. A useful interactive model has **quality, bitrate / storage, and encode time** as three pressures, but it should label encode time as an efficiency control, not a rate-control mode.

## Modes at a glance

| Mode | What the user fixes | What is allowed to move | Best fit | Main cost |
|---|---|---|---|---|
| Constant QP / CQP | Quantizer setting | Quality and bitrate | Testing, analysis, unusual fixed-QP workflows | Poor control of perceived quality and size |
| CRF / constant-quality VBR | Quality target | Bitrate and final size | One-off files, uploads, archives where exact size is unimportant | Size is unknown until encoding finishes |
| 1-pass VBR / ABR | Average bitrate | Quality and momentary bitrate | Fast delivery when size or average rate matters | Less informed bit allocation than 2-pass |
| 2-pass VBR / ABR | Average bitrate, with a full analysis pass first | Quality and momentary bitrate | Fixed-size VOD, storage budgets, bitrate ladders | Roughly another pass of work; unsuitable for true live input |
| CBR | Channel rate or a tight rate envelope | Quality | Live contribution, conferencing, or fixed-capacity channels | Quality falls on hard scenes; easy scenes may waste capacity or need padding |

These labels are encoder controls, not properties mandated by H.264 or H.265 themselves. FFmpeg maps common options into the selected encoder, and the available modes and exact behavior differ among libx264, libx265, NVENC, QSV, and other implementations. FFmpeg even warns that QSV may select a different mode than requested, so verbose logs are needed to see what the runtime actually chose. [FFmpeg codec documentation](https://ffmpeg.org/ffmpeg-codecs.html)

## Constant QP

Constant QP exists because it is the simplest control: give the encoder a quantization setting instead of a bitrate or perceptual-quality goal. Lower QP means finer quantization and usually more bits; higher QP means coarser quantization, fewer bits, and more loss.

In x265, `--qp` selects Constant QP. The supplied value is the base QP for P slices, while I and B slice QPs normally use configured offsets. QP 0 disables quantization but is **not** x265's true lossless mode. [x265 `--qp` and `--lossless`](https://x265.readthedocs.io/en/master/cli.html#cmdoption-qp)

The beginner trap is the name. "Constant QP" does not guarantee constant visible quality. Frames and regions differ in predictability and masking, and encoders may apply slice-type offsets or adaptive quantization. It also does not guarantee constant bitrate or file size. Use it when the quantizer itself is the experimental control, not as the default for ordinary delivery.

## CRF and constant-quality modes

CRF exists for jobs where **quality is the requirement and size is the result**. x265 calls CRF "quality-controlled variable bitrate": it does not target a bitrate; source complexity determines the output size. Higher CRF raises quantization and lowers quality. [x265 `--crf`](https://x265.readthedocs.io/en/master/cli.html#cmdoption-crf)

This makes CRF the clearest default for local files, uploads, and archives when a precise file size is unnecessary. Difficult motion, grain, and detail receive more bits; simple scenes receive fewer.

CRF is not a universal quality scale. The useful value and result depend on the encoder, codec, bit depth, preset, tune, resolution, and content. Do not teach "CRF 23" as equal quality across x264, x265, or a hardware encoder. NVIDIA, for example, exposes target quality through its VBR mode and permits a maximum bitrate cap; if the cap is too low, the requested quality cannot be maintained. [NVENC rate-control documentation](https://docs.nvidia.com/video-technologies/video-codec-sdk/13.1/nvenc-video-encoder-api-prog-guide/index.html#rate-control)

CRF can be **capped** with VBV controls for compatibility or streaming envelopes. In x265, both `--vbv-maxrate` and `--vbv-bufsize` are needed to enable VBV with CRF. Once the cap binds, bitrate compliance wins and quality can fall. [x265 VBV options](https://x265.readthedocs.io/en/master/cli.html#cmdoption-vbv-maxrate)

## VBR / ABR, one pass

Bitrate-targeted VBR exists because delivery systems and storage plans often care about average rate or final size more than uniform quality. The encoder spends more of the budget on hard scenes and less on easy scenes while aiming for a target average.

x265's `--bitrate` enables single-pass ABR and takes a target in kbit/s. [x265 `--bitrate`](https://x265.readthedocs.io/en/master/cli.html#cmdoption-bitrate) NVIDIA's VBR similarly targets `averageBitRate` over the long term and supports `maxBitRate` as a ceiling. [NVENC VBR](https://docs.nvidia.com/video-technologies/video-codec-sdk/13.1/nvenc-video-encoder-api-prog-guide/index.html#rate-control)

Choose one pass when speed, live operation, or fast turnaround matters. It can look ahead only as far as the encoder buffers, so it cannot know the complexity of the entire program before committing early bits.

## VBR / ABR, two pass

Two-pass VBR exists to solve the fixed-budget problem with advance knowledge. The first pass records complexity and encoding statistics. The later pass uses them to tune each frame's QP and improve allocation at the requested bitrate. x265 documents this exact stats-file workflow. [x265 `--pass`](https://x265.readthedocs.io/en/master/cli.html#cmdoption-pass)

Use it for VOD when a target bitrate, approximate file size, disc capacity, or bitrate ladder rung matters. It costs another read and analysis of the source, and it cannot perform a conventional full-program first pass on a live event that has not happened yet.

Do not promise that two-pass always beats CRF. They answer different questions. Two-pass is for hitting a bitrate budget; CRF is for hitting a quality target. At the same average bitrate, a well-informed later pass can allocate that fixed budget better than a one-pass encode, but it still cannot create enough bits for every difficult scene.

One terminology warning belongs in the UI: NVIDIA's "multipass" can mean two passes **within each frame**, not two complete runs over the whole video. NVIDIA says its first per-frame pass estimates complexity and bit distribution, while the second encodes the frame; it improves target adherence at lower performance. [NVENC multi-pass frame encoding](https://docs.nvidia.com/video-technologies/video-codec-sdk/13.1/nvenc-video-encoder-api-prog-guide/index.html#multi-pass-frame-encoding)

## CBR

CBR exists for channels that cannot tolerate large rate swings: live links, conferencing, broadcast-style pipelines, and other fixed-capacity paths. The encoder changes QP as content complexity changes so the output follows the channel budget. Hard scenes therefore lose quality before they are allowed to exceed the rate envelope.

"Constant" is usually a buffer model, not identical bytes in every frame or every instant. Encoded frames naturally vary in size. A VBV buffer lets rate control borrow bits for a hard moment and repay them later. FFmpeg exposes `maxrate`, `minrate`, `bufsize`, and initial buffer occupancy as rate-control buffering parameters. [FFmpeg codec options](https://ffmpeg.org/ffmpeg-codecs.html#Codec-Options)

NVIDIA makes the distinction explicit: its CBR mode targets `averageBitRate`, but strict adherence requires filler-data insertion or bitstream padding. [NVENC CBR](https://docs.nvidia.com/video-technologies/video-codec-sdk/13.1/nvenc-video-encoder-api-prog-guide/index.html#rate-control) So the website should avoid drawing CBR as a perfectly flat line unless it explains padding and the measurement window.

## Why H.264 versus H.265 does not choose the mode

H.264 and H.265 define video bitstreams and decoder constraints. The encoder decides how to search and how to control rate. The same broad goal may therefore appear under different names and options. FFmpeg's libx264 wrapper maps `b` to x264 `bitrate` and exposes `crf`, `qp`, `maxrate`, and `bufsize`; hardware wrappers expose their own mode sets. [FFmpeg libx264 options](https://ffmpeg.org/ffmpeg-codecs.html#libx264_002c-libx264rgb)

Do not compare CRF or QP numbers across codecs as if the number were a measured quality score. Compare actual output with a consistent test method. For a beginner tool, the honest wording is "quality target" and "quantizer control," not "quality percentage."

## Suggested interaction model

Use two coordinated visuals instead of making one radar chart carry the whole lesson:

1. A **three-corner tradeoff control** for quality, data budget, and encode time. Moving toward one corner changes a plain-language scenario and recommendation.
2. A **time-series strip** showing scene complexity, allocated bitrate, and resulting quality. Switching modes makes the difference obvious:
   - CQP keeps quantization steady while bitrate and perceived quality move.
   - CRF tries to keep perceived quality steady while bitrate moves.
   - VBR spends a fixed average budget unevenly; two-pass allocates with whole-program knowledge.
   - CBR stays inside a short-term rate envelope while quality moves.

A radar chart is useful as a comparison summary, not a physical law. Suggested axes are quality consistency, size predictability, bandwidth predictability, live suitability, and encode speed. Label scores as teaching estimates. Actual results depend on the encoder and content.

## A compact decision rule

- Need predictable quality and can accept unknown size? **CRF / constant quality.**
- Need a target size or average bitrate for prerecorded video? **2-pass VBR / ABR.**
- Need a target average quickly, or only one traversal is possible? **1-pass VBR / ABR.**
- Need a tight live channel envelope? **CBR with an appropriate buffer model.**
- Need the quantizer itself held as the controlled variable? **Constant QP.**

## Primary sources

- [FFmpeg codec documentation](https://ffmpeg.org/ffmpeg-codecs.html)
- [x265 command-line documentation](https://x265.readthedocs.io/en/master/cli.html)
- [x265 preset documentation](https://x265.readthedocs.io/en/master/presets.html)
- [NVIDIA Video Codec SDK programming guide](https://docs.nvidia.com/video-technologies/video-codec-sdk/13.1/nvenc-video-encoder-api-prog-guide/index.html)
- [Apple HLS authoring specification](https://developer.apple.com/documentation/http-live-streaming/hls-authoring-specification-for-apple-devices/), useful evidence that real streaming systems specify measured average and peak segment bitrates rather than assuming a perfectly flat elementary-stream rate.
