#!/usr/bin/env node
/**
 * Generate SVG plots for audio-effect documentation.
 * Run: npm run plot
 */
import { plotFir, plotCompare } from 'digital-filter/plot'
import * as fx from '../index.js'
import { writeFileSync } from 'node:fs'

let FS = 44100

function write (name, svg) { writeFileSync(`plot/${name}.svg`, svg) }

function sine (f, n = 4096) {
	let d = new Float64Array(n)
	for (let i = 0; i < n; i++) d[i] = Math.sin(2 * Math.PI * f * i / FS)
	return d
}
function impulse (n = 4096) { let d = new Float64Array(n); d[0] = 1; return d }
function dc (n = 4096, v = 0.5) { let d = new Float64Array(n); d.fill(v); return d }

// ── Modulation ──

{
	let d = sine(440)
	fx.phaser(d, { rate: 1, depth: 0.7, stages: 4, feedback: 0.5, fc: 1000, fs: FS })
	write('phaser', plotFir(d, 'Phaser (440Hz, rate=1Hz, 4 stages)'))
}

{
	let d = sine(440)
	fx.flanger(d, { rate: 0.3, depth: 0.7, delay: 3, feedback: 0.5, fs: FS })
	write('flanger', plotFir(d, 'Flanger (440Hz, delay=3ms, feedback=0.5)'))
}

{
	let d = sine(440)
	fx.chorus(d, { rate: 1.5, depth: 0.5, delay: 20, voices: 3, fs: FS })
	write('chorus', plotFir(d, 'Chorus (440Hz, 3 voices, delay=20ms)'))
}

{
	let d = impulse()
	fx.wah(d, { rate: 1.5, depth: 0.8, fc: 1000, Q: 5, fs: FS })
	write('wah', plotFir(d.slice(0, 512), 'Wah-wah (impulse, fc=1kHz, Q=5)'))
}

{
	let d = new Float64Array(4096)
	for (let i = 0; i < d.length; i++) d[i] = Math.sin(2 * Math.PI * 440 * i / FS)
	fx.tremolo(d, { rate: 5, depth: 0.9, fs: FS })
	write('tremolo', plotFir(d.slice(0, 1024), 'Tremolo (440Hz, rate=5Hz, depth=0.9)'))
}

{
	let d = sine(440)
	fx.vibrato(d, { rate: 5, depth: 0.003, fs: FS })
	write('vibrato', plotFir(d, 'Vibrato (440Hz, rate=5Hz, depth=3ms)'))
}

{
	let d = sine(440)
	fx.ringMod(d, { fc: 300, mix: 1, fs: FS })
	write('ring-mod', plotFir(d, 'Ring mod (440Hz × 300Hz carrier)'))
}

{
	let d = sine(440)
	fx.pitchShifter(d, { shift: 1.5, grain: 1024, fs: FS })
	write('pitch-shifter', plotFir(d, 'Pitch shifter (440Hz → +5th, shift=1.5)'))
}

{
	let d = sine(440)
	fx.autoWah(d, { base: 300, range: 3000, Q: 5, sens: 3, fs: FS })
	write('auto-wah', plotFir(d, 'Auto-wah (440Hz, base=300Hz, range=3kHz)'))
}

// ── Dynamics ──

{
	let d = new Float64Array(4096)
	for (let i = 0; i < d.length; i++) d[i] = Math.sin(2 * Math.PI * 440 * i / FS) * 0.9
	fx.compressor(d, { threshold: -6, ratio: 8, attack: 0.001, release: 0.05, fs: FS })
	write('compressor', plotFir(d, 'Compressor (threshold=−6dB, ratio=8:1)'))
}

{
	let d = sine(440)
	for (let i = 0; i < d.length; i++) d[i] *= 2
	fx.limiter(d, { threshold: 0.5, release: 0.05, fs: FS })
	write('limiter', plotFir(d, 'Limiter (threshold=0.5, 2× overdrive)'))
}

{
	let N = 4096, d = new Float64Array(N)
	for (let i = 0; i < N; i++) d[i] = Math.sin(2 * Math.PI * 440 * i / FS) * (i < N / 2 ? 0.8 : 0.01)
	fx.gate(d, { threshold: -20, range: -80, attack: 0.002, release: 0.05, fs: FS })
	write('gate', plotFir(d, 'Noise gate (threshold=−20dB, range=−80dB)'))
}

{
	let N = 4096, d = new Float64Array(N)
	for (let i = 0; i < N / 2; i++) d[i] = Math.sin(2 * Math.PI * 440 * i / FS) * 0.8
	fx.envelope(d, { attack: 0.005, release: 0.05, fs: FS })
	write('envelope', plotFir(d, 'Envelope follower (attack=5ms, release=50ms)'))
}

{
	let d = impulse()
	for (let i = 1; i < 200; i++) d[i] = Math.exp(-i / 50) * Math.sin(2 * Math.PI * 200 * i / FS)
	fx.transientShaper(d, { attackGain: 4, sustainGain: -0.5, fs: FS })
	write('transient-shaper', plotFir(d.slice(0, 512), 'Transient shaper (attackGain=4, sustainGain=−0.5)'))
}

// ── Delay ──

{
	let N = 22050, d = impulse(N)
	fx.delay(d, { time: 0.1, feedback: 0.5, mix: 0.5, fs: FS })
	write('delay', plotFir(d.slice(0, 4096), 'Delay (time=100ms, feedback=0.5)'))
}

{
	let N = 22050, d = impulse(N)
	fx.multitap(d, { taps: [{ time: 0.1, gain: 0.6 }, { time: 0.2, gain: 0.4 }, { time: 0.35, gain: 0.25 }], fs: FS })
	write('multitap', plotFir(d.slice(0, 4096), 'Multitap delay (100ms, 200ms, 350ms)'))
}

{
	let N = 22050, L = impulse(N), R = new Float64Array(N)
	fx.pingPong(L, R, { time: 0.1, feedback: 0.5, mix: 0.5, fs: FS })
	write('ping-pong', plotFir(L.slice(0, 4096), 'Ping-pong delay (left ch, time=100ms)'))
}

{
	let N = 44100, d = impulse(N)
	fx.reverb(d, { decay: 0.84, damping: 0.5, mix: 1, fs: FS })
	write('reverb', plotFir(d.slice(0, 4096), 'Reverb (decay=0.84, damping=0.5)'))
}

// ── Distortion ──

{
	write('distortion', plotCompare(
		['soft', 'hard', 'tanh', 'foldback'].map(type => {
			let d = sine(440)
			fx.distortion(d, { drive: 0.7, type, fs: FS })
			return [type, d]
		}),
		'Distortion types (drive=0.7, 440Hz)'
	))
}

{
	write('bitcrusher', plotCompare(
		[2, 4, 8].map(bits => {
			let d = sine(440)
			fx.bitcrusher(d, { bits, rate: 0.25, fs: FS })
			return [`${bits}bit`, d]
		}),
		'Bitcrusher (rate=0.25, 440Hz)'
	))
}

// ── Spatial ──

{
	let N = 2048, L = new Float64Array(N), R = new Float64Array(N)
	for (let i = 0; i < N; i++) { L[i] = Math.sin(2 * Math.PI * 440 * i / FS); R[i] = Math.sin(2 * Math.PI * 660 * i / FS) }
	fx.stereoWidener(L, R, { width: 2.0 })
	write('stereo-widener', plotFir(L, 'Stereo widener (left ch, width=2.0)'))
}

{
	let N = 4096, L = impulse(N), R = new Float64Array(N)
	fx.haas(L, R, { time: 0.02, channel: 'right', fs: FS })
	write('haas', plotFir(R.slice(0, 2048), 'Haas effect (right ch delayed 20ms)'))
}

{
	let N = 2048, L = new Float64Array(N), R = new Float64Array(N)
	for (let i = 0; i < N; i++) L[i] = R[i] = Math.sin(2 * Math.PI * 440 * i / FS)
	fx.panner(L, R, { pan: 0.7 })
	write('panner', plotFir(L, 'Panner (pan=0.7 right, left ch)'))
}

// ── Utility ──

{
	let d = sine(440, 2048)
	fx.gain(d, { dB: 12 })
	write('gain', plotFir(d, 'Gain (+12 dB)'))
}

{
	let d = new Float64Array(2048)
	for (let i = 0; i < d.length; i++) d[i] = Math.sin(2 * Math.PI * 440 * i / FS)
	fx.slewLimiter(d, { rise: 5000, fall: 5000, fs: FS })
	write('slew-limiter', plotFir(d, 'Slew limiter (rise=fall=5000 samples/s)'))
}

{
	let d = sine(440, 2048)
	fx.noiseShaping(d, { bits: 8 })
	write('noise-shaping', plotFir(d, 'Noise shaping (8-bit)'))
}

console.log('SVGs written to plot/')
