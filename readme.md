# audio-effect

Canonical audio effect implementations.

<table><tr><td valign="top">

**[Modulation](#modulation)**<br>
<sub>[Phaser](#phaser) · [Flanger](#flanger) · [Chorus](#chorus) · [Wah-wah](#wah-wah) · [Tremolo](#tremolo) · [Vibrato](#vibrato) · [Ring mod](#ring-mod) · [Pitch shifter](#pitch-shifter) · [Auto-wah](#auto-wah)</sub>

**[Dynamics](#dynamics)**<br>
<sub>[Compressor](#compressor) · [Limiter](#limiter) · [Noise gate](#noise-gate) · [Envelope follower](#envelope-follower) · [Transient shaper](#transient-shaper) · [Expander](#expander)</sub>

**[Delay](#delay)**<br>
<sub>[Delay](#delay-1) · [Multitap](#multitap) · [Ping-pong](#ping-pong) · [Reverb](#reverb)</sub>

</td><td valign="top">

**[Distortion](#distortion)**<br>
<sub>[Distortion / saturation](#distortion--saturation) · [Bitcrusher](#bitcrusher)</sub>

**[Spatial](#spatial)**<br>
<sub>[Stereo widener](#stereo-widener) · [Haas effect](#haas-effect) · [Panner](#panner)</sub>

**[Utility](#utility)**<br>
<sub>[Gain](#gain) · [Mixer](#mixer) · [Slew limiter](#slew-limiter) · [Noise shaping](#noise-shaping)</sub>

</td></tr></table>


## Install

```
npm install audio-effect
```

```js
// import everything
import * as fx from 'audio-effect'

// import by category
import { phaser, flanger, chorus, wah, autoWah, pitchShifter } from 'audio-effect/modulation'
import { compressor, limiter, gate, envelope, expander }        from 'audio-effect/dynamics'
import { delay, multitap, pingPong, reverb }                    from 'audio-effect/delay'
import { distortion, bitcrusher }                               from 'audio-effect/distortion'
import { stereoWidener, haas, panner }                          from 'audio-effect/spatial'
import { gain, mixer, slewLimiter, noiseShaping }               from 'audio-effect/utility'
```


## API

All effects share one shape:

```js
effect(buffer, params)   // → buffer (modified in-place)
```

Takes a `Float32Array`/`Float64Array`, modifies it in-place, returns it. Pass the same params object on every call — internal state (`_phase`, `_env`, etc.) persists across blocks automatically:

```js
let params = { rate: 1, depth: 0.7, fc: 1000, fs: 44100 }
for (let buf of stream) phaser(buf, params)
```

Spatial effects take two channels and return `[left, right]`:

```js
stereoWidener(left, right, { width: 1.5 })   // → [left, right]
haas(left, right, { time: 0.02, fs: 44100 }) // → [left, right]
panner(left, right, { pan: -0.5 })           // → [left, right]
```


## Modulation

LFO-driven effects that vary a parameter periodically.

### Phaser

Cascade of swept allpass filters creating moving notches and peaks.

**`rate`** LFO rate in Hz (default 0.5) · **`depth`** sweep depth 0–1 (default 0.7) · **`stages`** allpass stages (default 4) · **`feedback`** 0–1 (default 0.5) · **`fc`** center frequency Hz (default 1000) · **`fs`** sample rate

```js
import { phaser } from 'audio-effect/modulation'

let p = { rate: 0.5, depth: 0.7, stages: 4, feedback: 0.5, fc: 1000, fs: 44100 }
for (let buf of stream) phaser(buf, p)
```

**Use when**: electric guitar, synth pads, vintage phase effects<br>
**Not for**: spatial positioning (use stereoWidener or haas)

<!-- ![Phaser](plot/phaser.svg) -->


### Flanger

Modulated short delay (1–10 ms) with feedback — creates comb filter sweep.

**`rate`** LFO rate in Hz (default 0.3) · **`depth`** modulation depth 0–1 (default 0.7) · **`delay`** center delay in ms (default 3) · **`feedback`** 0–1 (default 0.5) · **`fs`** sample rate

```js
import { flanger } from 'audio-effect/modulation'

let p = { rate: 0.3, depth: 0.7, delay: 3, feedback: 0.5, fs: 44100 }
for (let buf of stream) flanger(buf, p)
```

**Use when**: jet sweeps, metallic modulation, guitar/bass<br>
**Not for**: subtle pitch modulation (use vibrato)

<!-- ![Flanger](plot/flanger.svg) -->


### Chorus

Multiple detuned delay voices layered over dry signal — ensemble thickening.

**`rate`** LFO rate in Hz (default 1.5) · **`depth`** modulation depth 0–1 (default 0.5) · **`delay`** center delay in ms (default 20) · **`voices`** number of chorus voices (default 3) · **`fs`** sample rate

```js
import { chorus } from 'audio-effect/modulation'

let p = { rate: 1.5, depth: 0.5, delay: 20, voices: 3, fs: 44100 }
for (let buf of stream) chorus(buf, p)
```

**Use when**: thickening strings, vocals, synth pads<br>
**Not for**: transparent processing (adds modulation artifacts)

<!-- ![Chorus](plot/chorus.svg) -->


### Wah-wah

Swept resonant bandpass filter — auto (LFO) or fixed frequency mode.

**`rate`** LFO rate in Hz (default 1.5) · **`depth`** sweep depth 0–1 (default 0.8) · **`fc`** center frequency Hz (default 1000) · **`Q`** resonance (default 5) · **`mode`** `'auto'` LFO or `'manual'` fixed (default `'auto'`) · **`fs`** sample rate

```js
import { wah } from 'audio-effect/modulation'

let p = { rate: 1.5, depth: 0.8, fc: 1000, Q: 5, fs: 44100 }
for (let buf of stream) wah(buf, p)
```

**Use when**: classic wah sound, filter sweeps<br>
**Not for**: signal-driven wah (use autoWah)

<!-- ![Wah-wah](plot/wah.svg) -->


### Tremolo

Amplitude modulation via LFO — periodic volume pulsing.

**`rate`** LFO rate in Hz (default 5) · **`depth`** modulation depth 0–1 (default 0.5) · **`fs`** sample rate

```js
import { tremolo } from 'audio-effect/modulation'

let p = { rate: 5, depth: 0.7, fs: 44100 }
for (let buf of stream) tremolo(buf, p)
```

**Use when**: vintage amp tremolo, rhythmic pulsing, guitar effects<br>
**Not for**: pitch modulation (use vibrato)

<!-- ![Tremolo](plot/tremolo.svg) -->


### Vibrato

Pitch modulation via modulated delay line — periodic pitch wobble.

**`rate`** LFO rate in Hz (default 5) · **`depth`** delay modulation depth in seconds (default 0.003) · **`fs`** sample rate

```js
import { vibrato } from 'audio-effect/modulation'

let p = { rate: 5, depth: 0.003, fs: 44100 }
for (let buf of stream) vibrato(buf, p)
```

**Use when**: vocal vibrato, string wobble, instrument simulation<br>
**Not for**: amplitude variation (use tremolo)

<!-- ![Vibrato](plot/vibrato.svg) -->


### Ring mod

Multiplies signal by a carrier oscillator — produces sum and difference frequencies.

**`fc`** carrier frequency Hz (default 440) · **`mix`** wet/dry 0–1 (default 1) · **`fs`** sample rate

```js
import { ringMod } from 'audio-effect/modulation'

let p = { fc: 300, mix: 1, fs: 44100 }
for (let buf of stream) ringMod(buf, p)
```

**Use when**: metallic/robotic tones, experimental textures, AM synthesis<br>
**Not for**: clean frequency shifting

<!-- ![Ring mod](plot/ring-mod.svg) -->


### Pitch shifter

Granular OLA pitch shifting via varispeed read with crossfade grain boundaries.

**`shift`** pitch ratio (default 1.5 · 2 = +octave · 0.5 = −octave) · **`grain`** grain size in samples (default 2048) · **`fs`** sample rate

```js
import { pitchShifter } from 'audio-effect/modulation'

let p = { shift: 1.5, grain: 2048, fs: 44100 }
for (let buf of stream) pitchShifter(buf, p)
```

**Use when**: harmonizer, octave up/down, pitch correction<br>
**Not for**: high-quality transposition (use phase vocoder for that)

<!-- ![Pitch shifter](plot/pitch-shifter.svg) -->


### Auto-wah

Envelope follower drives a resonant bandpass filter — signal level controls the sweep.

**`base`** minimum cutoff Hz (default 300) · **`range`** sweep range Hz (default 3000) · **`Q`** resonance (default 5) · **`attack`** envelope attack seconds (default 0.002) · **`release`** envelope release seconds (default 0.1) · **`sens`** input sensitivity multiplier (default 2) · **`fs`** sample rate

```js
import { autoWah } from 'audio-effect/modulation'

let p = { base: 300, range: 3000, Q: 5, sens: 2, fs: 44100 }
for (let buf of stream) autoWah(buf, p)
```

**Use when**: funk guitar, touch-sensitive filter sweeps, envelope filter<br>
**Not for**: LFO-driven wah (use wah with `mode: 'auto'`)

<!-- ![Auto-wah](plot/auto-wah.svg) -->


## Dynamics

Gain-control effects that respond to signal level.

### Compressor

Reduces dynamic range above threshold — feedforward with envelope follower and soft knee.

**`threshold`** dB (default −20) · **`ratio`** compression ratio (default 4) · **`attack`** seconds (default 0.003) · **`release`** seconds (default 0.1) · **`knee`** soft knee width dB (default 0) · **`makeupGain`** dB (default 0) · **`fs`** sample rate

```js
import { compressor } from 'audio-effect/dynamics'

let p = { threshold: -18, ratio: 4, attack: 0.003, release: 0.1, fs: 44100 }
for (let buf of stream) compressor(buf, p)
```

**Use when**: taming peaks, bus glue, leveling vocals<br>
**Not for**: hard limiting (use limiter)

<!-- ![Compressor](plot/compressor.svg) -->


### Limiter

Hard ceiling — infinite-ratio compressor, clamps peaks to threshold.

**`threshold`** linear amplitude ceiling (default 0.9) · **`release`** seconds (default 0.1) · **`fs`** sample rate

```js
import { limiter } from 'audio-effect/dynamics'

let p = { threshold: 0.9, release: 0.05, fs: 44100 }
for (let buf of stream) limiter(buf, p)
```

**Use when**: preventing clipping, master bus ceiling, broadcast compliance<br>
**Not for**: transparent dynamic control (use compressor)

<!-- ![Limiter](plot/limiter.svg) -->


### Noise gate

Attenuates signal below threshold — cleans up noise in pauses.

**`threshold`** dB (default −40) · **`range`** attenuation when closed dB (default −80) · **`attack`** seconds (default 0.001) · **`release`** seconds (default 0.05) · **`fs`** sample rate

```js
import { gate } from 'audio-effect/dynamics'

let p = { threshold: -30, range: -80, attack: 0.001, release: 0.05, fs: 44100 }
for (let buf of stream) gate(buf, p)
```

**Use when**: removing mic bleed, drum gate, noise floor cleanup<br>
**Not for**: compression or amplitude control

<!-- ![Noise gate](plot/gate.svg) -->


### Envelope follower

Rectifies and smooths signal to extract amplitude envelope — outputs envelope as signal.

**`attack`** seconds (default 0.01) · **`release`** seconds (default 0.1) · **`fs`** sample rate

```js
import { envelope } from 'audio-effect/dynamics'

let p = { attack: 0.005, release: 0.05, fs: 44100 }
for (let buf of stream) envelope(buf, p)
// buf now contains the envelope curve
```

**Use when**: sidechain source, envelope-controlled parameters, VCA control<br>
**Not for**: gain reduction (use compressor)

<!-- ![Envelope follower](plot/envelope.svg) -->


### Transient shaper

Separately amplifies or attenuates transient (attack) and sustain portions.

**`attackGain`** transient multiplier (default 1) · **`sustainGain`** sustain multiplier (default 0) · **`fs`** sample rate

```js
import { transientShaper } from 'audio-effect/dynamics'

let p = { attackGain: 2, sustainGain: -0.5, fs: 44100 }
for (let buf of stream) transientShaper(buf, p)
```

**Use when**: drum punch enhancement, click reduction, transient design<br>
**Not for**: general dynamic range control

<!-- ![Transient shaper](plot/transient-shaper.svg) -->


### Expander

Downward expansion below threshold — attenuates quiet signals, complementing compression.

**`threshold`** dB (default −40) · **`ratio`** expansion ratio > 1 (default 2) · **`range`** maximum attenuation floor dB (default −60) · **`attack`** seconds (default 0.001) · **`release`** seconds (default 0.1) · **`fs`** sample rate

```js
import { expander } from 'audio-effect/dynamics'

let p = { threshold: -40, ratio: 2, range: -60, attack: 0.001, release: 0.1, fs: 44100 }
for (let buf of stream) expander(buf, p)
```

**Transfer function**: for each `dB < threshold`, `gainDB = max((ratio−1)×(dB−threshold), range)`

| ratio | effect |
|---|---|
| 2 | gentle expansion, doubles apparent dynamic range |
| 4 | aggressive, close to gate behavior |
| ∞ | pure gate |

**Use when**: subtle noise reduction, dynamic restoration, complementing compression<br>
**Not for**: hard noise removal (use gate)

<!-- ![Expander](plot/expander.svg) -->


## Delay

Time-based echo and reverberation effects.

### Delay

Simple delay — dry signal mixed with delayed copy and optional feedback.

**`time`** delay time in seconds (default 0.25) · **`feedback`** echo decay 0–1 (default 0.3) · **`mix`** wet/dry 0–1 (default 0.5) · **`fs`** sample rate

```js
import { delay } from 'audio-effect/delay'

let p = { time: 0.25, feedback: 0.4, mix: 0.5, fs: 44100 }
for (let buf of stream) delay(buf, p)
```

**Use when**: slap-back echo, rhythmic delays, tape delay emulation<br>
**Not for**: diffuse reverberation (use reverb)

<!-- ![Delay](plot/delay.svg) -->


### Multitap

Multiple independent delay taps at different times with individual gains.

**`taps`** array of `{ time, gain }` objects · **`fs`** sample rate

```js
import { multitap } from 'audio-effect/delay'

let p = {
  taps: [{ time: 0.1, gain: 0.6 }, { time: 0.25, gain: 0.4 }, { time: 0.4, gain: 0.2 }],
  fs: 44100
}
for (let buf of stream) multitap(buf, p)
```

**Use when**: complex rhythmic echo patterns, vintage tape echo with multiple heads<br>
**Not for**: simple single echo (use delay)

<!-- ![Multitap](plot/multitap.svg) -->


### Ping-pong

Cross-fed stereo delay — left echo bounces to right, right to left.

**`time`** delay time in seconds (default 0.25) · **`feedback`** 0–1 (default 0.3) · **`mix`** wet/dry 0–1 (default 0.5) · **`fs`** sample rate

```js
import { pingPong } from 'audio-effect/delay'

let p = { time: 0.15, feedback: 0.5, mix: 0.5, fs: 44100 }
for (let [L, R] of stereoStream) pingPong(L, R, p)
```

**Use when**: stereo width from delays, spatial depth, rhythmic bounce effects<br>
**Not for**: mono output

<!-- ![Ping-pong](plot/ping-pong.svg) -->


### Reverb

Schroeder reverb — 4 parallel feedback comb filters with LP damping, 2 series allpass diffusers.

**`decay`** reverb time 0–1 (default 0.84) · **`damping`** high-frequency rolloff 0–1 (default 0.5) · **`mix`** wet/dry 0–1 (default 0.3) · **`fs`** sample rate

```js
import { reverb } from 'audio-effect/delay'

let p = { decay: 0.84, damping: 0.5, mix: 0.3, fs: 44100 }
for (let buf of stream) reverb(buf, p)
```

**Implementation**: 4 parallel comb delays (1277–1523 samples at 44100 Hz), LP filter on feedback path, 2 Schroeder allpass stages (277, 349 samples)<br>
**Use when**: room ambience, plate reverb character, spatial depth<br>
**Not for**: convolution reverb accuracy (use an IR-based approach for that)

<!-- ![Reverb](plot/reverb.svg) -->


## Distortion

Non-linear waveshaping effects.

### Distortion / saturation

Four waveshaping types: cubic soft clip, hard clip, tanh saturation, and wavefolding.

**`drive`** distortion amount 0–1 (default 0.5, maps to 1–10× input gain) · **`type`** `'soft'` | `'hard'` | `'tanh'` | `'foldback'` (default `'soft'`) · **`mix`** wet/dry 0–1 (default 1) · **`fs`** sample rate

```js
import { distortion } from 'audio-effect/distortion'

// Soft saturation
let p = { drive: 0.6, type: 'soft', fs: 44100 }
for (let buf of stream) distortion(buf, p)

// Hard clip
distortion(buf, { drive: 0.8, type: 'hard' })

// Tanh (asymptotically smooth, never clips hard)
distortion(buf, { drive: 0.5, type: 'tanh' })

// Wavefolding (metallic/harsh)
distortion(buf, { drive: 0.7, type: 'foldback' })
```

| type | character | clamps at ±1 |
|---|---|---|
| `soft` | cubic saturation, smooth knee | yes |
| `hard` | brickwall clip, harsh | yes |
| `tanh` | asymptotically smooth | approaches 1 |
| `foldback` | metallic, complex harmonics | yes |

**Use when**: guitar overdrive, tube saturation, lo-fi crunch, harmonic enrichment<br>
**Not for**: transparent limiting (use limiter)

<!-- ![Distortion types](plot/distortion.svg) -->


### Bitcrusher

Sample-rate reduction (zero-order hold) + bit-depth quantization.

**`bits`** target bit depth 1–24 (default 8) · **`rate`** sample rate ratio 0–1 (default 0.25, quarter rate) · **`fs`** sample rate

```js
import { bitcrusher } from 'audio-effect/distortion'

// 8-bit, quarter sample rate (lo-fi)
let p = { bits: 8, rate: 0.25, fs: 44100 }
for (let buf of stream) bitcrusher(buf, p)

// Bit depth only, no rate reduction
bitcrusher(buf, { bits: 4, rate: 1 })
```

**Use when**: lo-fi aesthetics, game audio, retro console sound, stutter effects<br>
**Not for**: smooth saturation (use distortion)

<!-- ![Bitcrusher](plot/bitcrusher.svg) -->


## Spatial

Stereo image and positioning effects. All take `(left, right, params)` and return `[left, right]`.

### Stereo widener

Mid/side processing to widen or narrow the stereo image.

**`width`** 0 = mono, 1 = unchanged, 2 = full side emphasis (default 1.5)

```js
import { stereoWidener } from 'audio-effect/spatial'

let p = { width: 1.5 }
for (let [L, R] of stereoStream) stereoWidener(L, R, p)
```

**Use when**: widening narrow mixes, mono-compatibility check (width=0), mastering<br>
**Not for**: positioning a single source (use panner)

<!-- ![Stereo widener](plot/stereo-widener.svg) -->


### Haas effect

Delays one channel by 1–35 ms — creates phantom stereo from mono source.

**`time`** delay in seconds (default 0.02 = 20 ms) · **`channel`** `'left'` or `'right'` (default `'right'`) · **`fs`** sample rate

```js
import { haas } from 'audio-effect/spatial'

let p = { time: 0.015, channel: 'right', fs: 44100 }
for (let [L, R] of stereoStream) haas(L, R, p)
```

**Use when**: mono-to-stereo widening, spatial placement, drum room simulation<br>
**Not for**: large delays (use ping-pong delay instead)

<!-- ![Haas effect](plot/haas.svg) -->


### Panner

Constant-power stereo panning using cos/sin law.

**`pan`** −1 = full left, 0 = center, +1 = full right (default 0)

```js
import { panner } from 'audio-effect/spatial'

let p = { pan: -0.3 }
for (let [L, R] of stereoStream) panner(L, R, p)
```

**Use when**: placing sources in the stereo field<br>
**Not for**: 3D spatial audio

<!-- ![Panner](plot/panner.svg) -->


## Utility

Signal conditioning and mixing tools.

### Gain

Simple level adjustment in decibels.

**`dB`** gain in dB (default 0)

```js
import { gain } from 'audio-effect/utility'

for (let buf of stream) gain(buf, { dB: -6 })
```

<!-- ![Gain](plot/gain.svg) -->


### Mixer

Sums an array of buffers with individual gain multipliers.

**`channels`** array of `{ buffer, gain }` objects

```js
import { mixer } from 'audio-effect/utility'

let out = mixer([
  { buffer: drums,  gain: 0.8 },
  { buffer: bass,   gain: 0.7 },
  { buffer: synth,  gain: 0.5 },
])
```

**Use when**: combining signals, bus summing, stem mixing


### Slew limiter

Clips the derivative — limits how fast the signal can change.

**`rise`** maximum rise rate in units/second (default 1000) · **`fall`** maximum fall rate (default 1000) · **`fs`** sample rate

```js
import { slewLimiter } from 'audio-effect/utility'

let p = { rise: 5000, fall: 5000, fs: 44100 }
for (let buf of stream) slewLimiter(buf, p)
```

**Use when**: click removal, smoothing control signals, limiting slew on CVs<br>
**Not for**: dynamic range control

<!-- ![Slew limiter](plot/slew-limiter.svg) -->


### Noise shaping

Error-feedback quantization — shapes quantization noise out of the audible band.

**`bits`** target bit depth (default 16)

```js
import { noiseShaping } from 'audio-effect/utility'

for (let buf of stream) noiseShaping(buf, { bits: 16 })
```

**Use when**: dithering before bit-depth reduction, quantization to lower bit depths<br>
**Not for**: audio compression (unrelated to lossy codecs)

<!-- ![Noise shaping](plot/noise-shaping.svg) -->
