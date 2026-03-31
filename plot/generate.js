#!/usr/bin/env node
/**
 * Generate SVG plots for audio-effect documentation.
 * Run: npm run plot
 *
 * Each plot type is chosen to reveal what the effect actually does:
 *   modulation   → overlaid freq responses (frozen LFO) + spectrograms
 *   dynamics     → transfer curves (input dB vs output dB) + waveforms
 *   delay        → impulse waveform showing echo structure
 *   distortion   → waveshaping transfer curve
 *   spatial      → Lissajous, dual waveforms, L/R bars
 *   utility      → before/after waveforms, spectrum
 */
import { plotCompare } from 'digital-filter/plot'
import { waveformPlot, dualWaveformPlot, spectrogramPlot, transferCurvePlot,
         waveshaperPlot, spectrumPlot, lissajousMulti, pannerBarsPlot } from './lib.js'
import * as fx from '../index.js'
import { writeFileSync, mkdirSync } from 'node:fs'

mkdirSync('plot', { recursive: true })

const FS = 44100
const write = (name, svg) => writeFileSync(`plot/${name}.svg`, svg)

const sine  = (f, n = 4096) => { let d = new Float64Array(n); for (let i = 0; i < n; i++) d[i] = Math.sin(2*Math.PI*f*i/FS); return d }
const imp   = (n = 4096)    => { let d = new Float64Array(n); d[0] = 1; return d }
const dc    = (n, v = 0.5)  => { let d = new Float64Array(n); d.fill(v); return d }
const noise = (n, amp = 0.3) => { let d = new Float64Array(n); for (let i = 0; i < n; i++) d[i] = (Math.random()*2-1)*amp; return d }

// ── Modulation ── overlaid freq responses at frozen LFO positions ──────────

// Phaser: 5 LFO phases — shows sweeping notch pattern
{
	let phases = [0, Math.PI/2, Math.PI, 3*Math.PI/2, 2*Math.PI]
	let labels = ['φ=0', 'φ=½π', 'φ=π', 'φ=³⁄₂π', 'φ=2π']
	write('phaser', plotCompare(
		phases.map((phase, i) => {
			let d = new Float64Array(2048); d[0] = 1
			let p = { rate: 0, depth: 0.7, stages: 4, feedback: 0.5, fc: 1000, fs: FS, _phase: phase }
			fx.phaser(d, p)
			return [labels[i], d.slice(0, 512)]
		}),
		'Phaser — sweeping notch at 5 LFO phases',
		{ bins: 512 }
	))
}

// Flanger: 3 delay positions — shows comb sweep
{
	let phases = [-Math.PI/2, 0, Math.PI/2]
	let labels = ['min delay', 'center delay', 'max delay']
	write('flanger', plotCompare(
		phases.map((phase, i) => {
			let d = new Float64Array(2048); d[0] = 1
			let p = { rate: 0, depth: 0.7, delay: 3, feedback: 0.5, fs: FS, _phase: phase }
			fx.flanger(d, p)
			return [labels[i], d.slice(0, 512)]
		}),
		'Flanger — comb sweep at min/center/max delay',
		{ bins: 512 }
	))
}

// Chorus: spectrogram of sustained tone — shows shimmer spread
{
	let d = sine(440, 8192)
	fx.chorus(d, { rate: 1.5, depth: 0.5, delay: 20, voices: 3, fs: FS })
	write('chorus', spectrogramPlot(d, 'Chorus — 440Hz shimmer spread (3 voices, delay=20ms)',
		{ fs: FS, fMin: 200, fMax: 2000, dbFloor: -55 }))
}

// Wah: 5 pedal positions — shows frequency sweep
{
	let fcs = [200, 500, 1000, 2000, 4000]
	write('wah', plotCompare(
		fcs.map(fc => {
			let d = new Float64Array(2048); d[0] = 1
			fx.wah(d, { mode: 'manual', fc, Q: 5, fs: FS })
			return [fc >= 1000 ? fc/1000 + 'kHz' : fc + 'Hz', d.slice(0, 512)]
		}),
		'Wah — bandpass at 5 pedal positions',
		{ bins: 512 }
	))
}

// Tremolo: waveform showing AM modulation
{
	let d = dc(2048, 0.8)
	write('tremolo', waveformPlot(
		[{ signal: d, color: '#3b82f6', label: 'amplitude' }],
		'Tremolo — DC carrier, rate=5Hz, depth=0.9',
		{ fs: FS, yMin: -0.1, yMax: 1.1, fill: false }
	))
	// Reuse the dc signal - overwrite with tremolo applied
	let d2 = dc(2048, 0.8)
	fx.tremolo(d2, { rate: 5, depth: 0.9, fs: FS })
	write('tremolo', waveformPlot(
		[{ signal: d2, color: '#3b82f6' }],
		'Tremolo — DC signal, rate=5Hz, depth=0.9',
		{ fs: FS, yMin: -0.05, yMax: 0.9, fill: false }
	))
}

// Vibrato: spectrogram shows pitch wobble
{
	let d = sine(440, 8192)
	fx.vibrato(d, { rate: 5, depth: 0.004, fs: FS })
	write('vibrato', spectrogramPlot(d, 'Vibrato — 440Hz pitch wobble, rate=5Hz, depth=4ms',
		{ fs: FS, fMin: 200, fMax: 1500, dbFloor: -50 }))
}

// Ring mod: spectrum showing carrier + sidebands
{
	let d = sine(440, 4096)
	fx.ringMod(d, { fc: 300, mix: 1, fs: FS })
	write('ring-mod', spectrumPlot(
		[{ signal: d, label: 'output', color: '#3b82f6' },
		 { signal: sine(440, 4096), label: 'input (440Hz)', color: '#d1d5db' }],
		'Ring mod — 440Hz × 300Hz → sidebands at 140Hz + 740Hz',
		{ fs: FS, fMin: 20, fMax: 4000, dbMin: -80 }
	))
}

// Pitch shifter: waveform comparison
{
	let orig = sine(440, 4096)
	let shifted = Float64Array.from(orig)
	fx.pitchShifter(shifted, { shift: 1.5, grain: 1024, fs: FS })
	write('pitch-shifter', spectrumPlot(
		[{ signal: orig,    label: '440Hz input',      color: '#d1d5db' },
		 { signal: shifted, label: 'shift=1.5 output', color: '#3b82f6' }],
		'Pitch shifter — 440Hz → ~660Hz (perfect fifth, shift=1.5)',
		{ fs: FS, fMin: 50, fMax: 4000, dbMin: -80 }
	))
}

// Auto-wah: spectrogram showing cutoff tracking envelope
{
	// Signal with rising then falling amplitude
	let N = 8192
	let d = new Float64Array(N)
	for (let i = 0; i < N; i++) {
		let env = i < N/2 ? i/(N/2) : 1 - (i - N/2)/(N/2)
		d[i] = Math.sin(2*Math.PI*440*i/FS) * env
	}
	fx.autoWah(d, { base: 300, range: 3500, Q: 6, sens: 3, fs: FS })
	write('auto-wah', spectrogramPlot(d, 'Auto-wah — cutoff tracks amplitude envelope',
		{ fs: FS, fMin: 150, fMax: 6000, dbFloor: -55 }))
}

// ── Dynamics ── transfer curves + waveforms ────────────────────────────────

// Compressor: transfer curve + test waveform
write('compressor', transferCurvePlot(
	[{ fn: fx.compressor, params: { threshold: -18, ratio: 4, attack: 0.003, release: 0.05, fs: FS }, label: '4:1', color: '#3b82f6' },
	 { fn: fx.compressor, params: { threshold: -18, ratio: 8, attack: 0.003, release: 0.05, fs: FS }, label: '8:1', color: '#ef4444' }],
	'Compressor — threshold=−18dB',
	{ fs: FS, markers: [{ x: -18, label: 'threshold' }] }
))

// Limiter
write('limiter', transferCurvePlot(
	[{ fn: fx.limiter, params: { threshold: 0.5, release: 0.05, fs: FS }, label: 'limiter', color: '#3b82f6' }],
	'Limiter — threshold=0.5 (−6dB)',
	{ fs: FS, markers: [{ x: -6, label: 'threshold' }] }
))

// Expander
write('expander', transferCurvePlot(
	[{ fn: fx.expander, params: { threshold: -30, ratio: 2, range: -60, fs: FS }, label: '2:1', color: '#3b82f6' },
	 { fn: fx.expander, params: { threshold: -30, ratio: 4, range: -60, fs: FS }, label: '4:1', color: '#ef4444' }],
	'Expander — threshold=−30dB',
	{ fs: FS, markers: [{ x: -30, label: 'threshold' }] }
))

// Gate: waveform showing open/closed regions
{
	let N = 4096
	let d = new Float64Array(N)
	for (let i = 0; i < N; i++) d[i] = Math.sin(2*Math.PI*440*i/FS) * (i < N/2 ? 0.8 : 0.02)
	let processed = Float64Array.from(d)
	fx.gate(processed, { threshold: -20, range: -80, attack: 0.002, release: 0.05, fs: FS })
	write('gate', waveformPlot(
		[{ signal: d,         color: '#d1d5db', label: 'input' },
		 { signal: processed, color: '#3b82f6', label: 'gated' }],
		'Noise gate — threshold=−20dB, loud→quiet transition',
		{ fs: FS, fill: false }
	))
}

// Transient shaper: before/after on a drum-like signal
{
	let N = 2048
	let d = new Float64Array(N)
	for (let i = 0; i < N; i++) d[i] = Math.exp(-i/80) * Math.sin(2*Math.PI*120*i/FS) * 0.9
	let processed = Float64Array.from(d)
	fx.transientShaper(processed, { attackGain: 3, sustainGain: -0.7, fs: FS })
	write('transient-shaper', waveformPlot(
		[{ signal: d,         color: '#d1d5db', label: 'input' },
		 { signal: processed, color: '#3b82f6', label: 'shaped' }],
		'Transient shaper — attackGain=3, sustainGain=−0.7',
		{ fs: FS, fill: false }
	))
}

// Envelope follower
{
	let N = 2048, d = new Float64Array(N)
	for (let i = 0; i < N; i++) d[i] = Math.sin(2*Math.PI*440*i/FS) * (i < N/2 ? 0.8 : 0)
	let sig = Float64Array.from(d)
	let env = Float64Array.from(d)
	fx.envelope(env, { attack: 0.005, release: 0.08, fs: FS })
	write('envelope', waveformPlot(
		[{ signal: sig, color: '#d1d5db', label: 'signal' },
		 { signal: env, color: '#3b82f6', label: 'envelope' }],
		'Envelope follower — attack=5ms, release=80ms',
		{ fs: FS, fill: false }
	))
}

// ── Delay ── impulse responses showing echo structure ─────────────────────

// Delay: labeled echo positions
{
	let N = 22050, d = imp(N)
	fx.delay(d, { time: 0.1, feedback: 0.5, mix: 1, fs: FS })
	write('delay', waveformPlot(
		[{ signal: d.slice(0, N), color: '#3b82f6' }],
		'Delay — time=100ms, feedback=0.5',
		{ fs: FS,
		  markers: [{ x: 100, label: '100ms' }, { x: 200, label: '200ms' }, { x: 300, label: '300ms' }],
		  yMin: -0.6, yMax: 0.6 }
	))
}

// Multitap: labeled taps
{
	let N = 22050, d = imp(N)
	fx.multitap(d, { taps: [{time:0.08,gain:0.6},{time:0.18,gain:0.4},{time:0.32,gain:0.25}], fs: FS })
	write('multitap', waveformPlot(
		[{ signal: d.slice(0, N), color: '#3b82f6' }],
		'Multitap delay — taps at 80ms, 180ms, 320ms',
		{ fs: FS,
		  markers: [{ x: 80, label: '80ms' }, { x: 180, label: '180ms' }, { x: 320, label: '320ms' }],
		  yMin: -0.7, yMax: 0.7 }
	))
}

// Ping-pong: L/R dual waveform showing alternating echoes
{
	let N = 22050, L = imp(N), R = new Float64Array(N)
	fx.pingPong(L, R, { time: 0.12, feedback: 0.6, mix: 1, fs: FS })
	write('ping-pong', dualWaveformPlot(
		L, R,
		['Left', 'Right'],
		'Ping-pong delay — alternating L↔R echoes, time=120ms',
		{ fs: FS, yMin: -0.7, yMax: 0.7 }
	))
}

// Reverb: impulse response showing RT60 decay
{
	let N = 44100, d = imp(N)
	fx.reverb(d, { decay: 0.84, damping: 0.5, mix: 1, fs: FS })
	write('reverb', waveformPlot(
		[{ signal: d, color: '#3b82f6' }],
		'Reverb — Schroeder, decay=0.84, damping=0.5',
		{ fs: FS, yMin: -0.15, yMax: 0.15, fill: false }
	))
}

// ── Distortion ── waveshaping transfer curve + waveform ────────────────────

{
	let types = [
		{ type: 'soft',     label: 'soft (cubic)',  color: '#3b82f6' },
		{ type: 'hard',     label: 'hard (clip)',   color: '#ef4444' },
		{ type: 'tanh',     label: 'tanh',          color: '#22c55e' },
		{ type: 'foldback', label: 'foldback',      color: '#eab308' },
	]
	write('distortion', waveshaperPlot(types, fx.distortion, { drive: 0.6 },
		'Distortion — transfer curves (drive=0.6)'))
}

// Bitcrusher: before/after waveform
{
	let N = 1024
	let orig = sine(440, N)
	let crushed = Float64Array.from(orig)
	fx.bitcrusher(crushed, { bits: 4, rate: 0.25, fs: FS })
	write('bitcrusher', waveformPlot(
		[{ signal: orig,    color: '#d1d5db', label: 'input' },
		 { signal: crushed, color: '#3b82f6', label: '4-bit, rate=¼' }],
		'Bitcrusher — 4-bit depth, quarter sample rate',
		{ fs: FS, fill: false }
	))
}

// ── Spatial ── goniometer, L/R waveforms, level bars ──────────────────────

// Stereo widener: 3 Lissajous at different widths
{
	let N = 2048
	let pairs = [0, 1, 2].map(width => {
		let L = new Float64Array(N), R = new Float64Array(N)
		for (let i = 0; i < N; i++) {
			L[i] = Math.sin(2*Math.PI*440*i/FS)
			R[i] = Math.sin(2*Math.PI*440*i/FS + 0.7)  // slightly different phase
		}
		fx.stereoWidener(L, R, { width })
		return { left: L, right: R, label: `width=${width}` }
	})
	write('stereo-widener', lissajousMulti(pairs, 'Stereo widener — goniometer at width 0/1/2'))
}

// Haas: L/R waveform pair showing time offset
{
	let N = 4096, L = imp(N), R = new Float64Array(N)
	fx.haas(L, R, { time: 0.02, channel: 'right', fs: FS })
	write('haas', dualWaveformPlot(
		L.slice(0, 2048), R.slice(0, 2048),
		['Left (dry)', 'Right (delayed 20ms)'],
		'Haas effect — 20ms delay creates phantom stereo',
		{ fs: FS, yMin: -0.3, yMax: 1.2 }
	))
}

// Panner: L/R level bars at 5 positions
write('panner', pannerBarsPlot([-1, -0.5, 0, 0.5, 1], fx.panner, 'Panner — constant-power L/R balance'))

// ── Utility ───────────────────────────────────────────────────────────────

// Slew limiter: before/after on square wave
{
	let N = 2048, d = new Float64Array(N)
	for (let i = 0; i < N; i++) d[i] = i % 200 < 100 ? 0.8 : -0.8
	let slewed = Float64Array.from(d)
	fx.slewLimiter(slewed, { rise: 5000, fall: 5000, fs: FS })
	write('slew-limiter', waveformPlot(
		[{ signal: d,      color: '#d1d5db', label: 'square wave' },
		 { signal: slewed, color: '#3b82f6', label: 'slew limited' }],
		'Slew limiter — square wave, rise=fall=5000/s',
		{ fs: FS, fill: false }
	))
}

// Noise shaping: spectrum before/after quantization
{
	let N = 4096, d = sine(440, N)
	let quant = Float64Array.from(d)
	let shaped = Float64Array.from(d)
	// Simple 8-bit truncation (no shaping)
	let scale = Math.pow(2, 7)
	for (let i = 0; i < N; i++) quant[i] = Math.round(quant[i] * scale) / scale
	fx.noiseShaping(shaped, { bits: 8 })
	write('noise-shaping', spectrumPlot(
		[{ signal: quant,  label: 'truncated 8-bit', color: '#ef4444' },
		 { signal: shaped, label: 'noise-shaped 8-bit', color: '#3b82f6' }],
		'Noise shaping — 8-bit: quantization error pushed to HF',
		{ fs: FS, fMin: 100, fMax: 22000, dbMin: -100 }
	))
}

// Gain: simple waveform
{
	let d = sine(440, 2048)
	fx.gain(d, { dB: 12 })
	write('gain', waveformPlot(
		[{ signal: d, color: '#3b82f6' }],
		'Gain +12 dB — sine at 440Hz',
		{ fs: FS }
	))
}

console.log('SVGs written to plot/')
