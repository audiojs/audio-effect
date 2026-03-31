## Backlog

* [ ] Make plots illustrate meaning nicely
* [ ] Add tests correctness to all of the effects


## Acrhive

### Effects to add

- [x] Distortion — soft clip (overdrive), hard clip, wavefolder; the transfer curve is the visual
- [x] Bitcrusher — bit-depth quantization + sample-rate decimation; lo-fi staple
- [x] Expander — complement to compressor: attenuates signal *below* threshold (gentler gate)

### Plots

Each effect type needs a plot that reveals what it actually does — not a frequency response curve.

**Modulation** — the defining trait is *sweep over time*, so a spectrogram (time × freq × intensity)
is the clearest view. For phaser/flanger, additionally: 4–5 overlaid freq responses
at different LFO phase positions (shows the notch/comb moving).
- [x] `phaser` — sweeping notch: overlaid allpass responses at φ = 0, π/2, π, 3π/2, 2π
- [x] `flanger` — comb sweep: overlaid comb responses at min/mid/max delay
- [x] `chorus` — spectrogram of a sustained tone showing the shimmer spread
- [x] `tremolo` — waveform with AM modulation envelope overlay
- [x] `vibrato` — spectrogram showing pitch wobble as sinusoidal frequency deviation
- [x] `ring-mod` — spectrum (freq domain) showing carrier + sidebands (sum/difference frequencies)
- [x] `wah` — freq response at 5 pedal positions (20 Hz → 2 kHz sweep)
- [x] `auto-wah` — spectrogram showing cutoff tracking the input envelope

**Dynamics** — needs two views: static transfer curve (input dB vs output dB) and
temporal trace (waveform + gain reduction overlay on a drum hit or sine burst)
- [x] `compressor` — transfer curve with labeled threshold/knee + waveform with GR overlay
- [x] `limiter` — transfer curve (hard ceiling) + waveform showing brick-wall clipping prevention
- [x] `gate` — waveform showing open/closed regions on a noisy signal
- [x] `transient-shaper` — waveform before/after on a drum hit (attack punch vs sustain tail)
- [x] `expander` — transfer curve paired with compressor for contrast

**Delay** — waveform of a single impulse showing echo structure:
labeled taps with amplitudes decaying by feedback factor
- [x] `delay` — impulse response: echoes with exponential decay, labeled time/feedback
- [x] `multitap` — impulse response: 4 labeled taps at different times/levels
- [x] `ping-pong` — dual waveform (L / R) showing alternating echo placement

**Spatial** — a Lissajous/goniometer scatter (x=L, y=R) at 3 width settings (narrow/unity/wide)
immediately shows stereo field collapse vs expansion
- [x] `stereo-widener` — Lissajous at width 0 (line), 1 (original), 2 (expanded)
- [x] `haas` — L/R waveform pair showing time offset with level labels
- [x] `panner` — L/R level bars at pan = -1, -0.5, 0, +0.5, +1

**Utility**
- [x] `slew-limiter` — waveform before/after on a square wave (slopes replacing hard edges)
- [x] `noise-shaping` — noise floor spectrum before/after (shows HF noise push)

**Overview** — one composite image: 5 rows (categories), each showing its characteristic
signature in a thumbnail — same role as `weighting.svg` in audio-filter
- [ ] overview grid — one composite image with category thumbnails

### Scope notes

**audio-synth** — oscillators, wavetables, FM/AM operators, envelope generators as *sources*
are clearly a different domain (generate vs process). Separate repo when needed.

**audio-reverb** — reverb has 5+ meaningfully different algorithms (Schroeder, plate, spring,
FDN, convolution IR, shimmer). The reverb here is one canonical FDN. If variants are
needed later, split. Not yet.

**audio-distortion** — same logic: overdrive, fuzz, wavefolder, tape saturation are all
distinct enough for a dedicated repo eventually. For now, one soft-clip + bitcrusher here
covers the canonical producer need.

**Rule**: split when a category needs 4+ distinct algorithms worth their own documentation.
Until then, best-one-per-category stays here.
