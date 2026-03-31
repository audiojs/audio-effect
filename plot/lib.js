/**
 * Custom SVG plot generators for audio-effect documentation.
 * All plots: 820×392 viewBox, matching digital-filter/plot visual style.
 */

// ── Theme ──────────────────────────────────────────────────────────────────
const W = 820, H = 392
const LM = 34, TM = 16, RM = 20, PW = 358, PH = 155, GAP = 50
const FW = PW + GAP + PW   // 766: full-width panel interior
const FH = PH + GAP + PH   // 360: full-height panel interior

const COLORS = ['#3b82f6','#ef4444','#22c55e','#eab308','#f97316','#a855f7','#06b6d4','#64748b']
const GRID = '#e5e7eb', AXIS = '#d1d5db', TEXT = '#6b7280'

let _uid = 0
const uid = () => 'u' + (++_uid)

// ── SVG primitives ─────────────────────────────────────────────────────────
export function svgWrap (body, defs = '') {
	let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="font-family:system-ui,-apple-system,sans-serif">\n`
	if (defs) s += `  <defs>${defs}  </defs>\n`
	return s + body + '</svg>\n'
}

function txt (x, y, s, anchor = 'middle', size = 8, weight = '') {
	let w = weight ? ` font-weight="${weight}"` : ''
	return `  <text x="${+x.toFixed(1)}" y="${+y.toFixed(1)}" text-anchor="${anchor}" font-size="${size}" fill="${TEXT}"${w}>${s}</text>\n`
}

function hline (x1, y, x2, stroke = AXIS, sw = 1, dash = '') {
	let d = dash ? ` stroke-dasharray="${dash}"` : ''
	return `  <line x1="${+x1.toFixed(1)}" y1="${+y.toFixed(1)}" x2="${+x2.toFixed(1)}" y2="${+y.toFixed(1)}" stroke="${stroke}" stroke-width="${sw}"${d}/>\n`
}

function vline (x, y1, y2, stroke = AXIS, sw = 1) {
	return `  <line x1="${+x.toFixed(1)}" y1="${+y1.toFixed(1)}" x2="${+x.toFixed(1)}" y2="${+y2.toFixed(1)}" stroke="${stroke}" stroke-width="${sw}"/>\n`
}

function clipRect (id, x, y, w, h) {
	return `\n    <clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>\n`
}

// ── Panel helpers ──────────────────────────────────────────────────────────
function panelAxes (x, y, w, h) {
	return vline(x, y, y + h) + hline(x, y + h, x + w)
}

function yGrid (x, y, w, h, ticks, yMin, yMax, fmt = v => String(v)) {
	let s = ''
	for (let v of ticks) {
		let py = y + h - (v - yMin) / (yMax - yMin) * h
		if (py < y - 2 || py > y + h + 2) continue
		s += hline(x, py, x + w, GRID, 0.5)
		s += txt(x - 4, py + 3, fmt(v), 'end')
	}
	return s
}

function xLinGrid (x, y, w, h, ticks, xMin, xMax, fmt = v => String(v)) {
	let s = ''
	for (let v of ticks) {
		let px = x + (v - xMin) / (xMax - xMin) * w
		if (px < x - 2 || px > x + w + 2) continue
		s += vline(px, y, y + h, GRID, 0.5)
		s += txt(px, y + h + 12, fmt(v), 'middle')
	}
	return s
}

function xLogGrid (x, y, w, h, ticks, fMin, fMax) {
	let lr = Math.log10(fMax / fMin), s = ''
	let decade = Math.pow(10, Math.floor(Math.log10(fMin)))
	while (decade < fMax) {
		for (let m = 2; m <= 9; m++) {
			let f = decade * m
			if (f >= fMin && f <= fMax) {
				let px = x + Math.log10(f / fMin) / lr * w
				s += vline(px, y, y + h, GRID, 0.5)
			}
		}
		decade *= 10
	}
	for (let f of ticks) {
		let px = x + Math.log10(f / fMin) / lr * w
		s += vline(px, y, y + h, GRID, 0.5)
		s += txt(px, y + h + 12, f >= 1000 ? (f / 1000) + 'k' : f, 'middle')
	}
	return s
}

// ── Curve helpers ──────────────────────────────────────────────────────────
function linPolyline (data, xMin, xMax, yMin, yMax, px, py, pw, ph, color, sw = 1.2, cid = null) {
	let N = data.length, pts = [], cols = Math.ceil(pw)
	if (N <= cols) {
		for (let i = 0; i < N; i++) {
			let cx = px + i / (N - 1) * pw
			let v = Math.max(yMin, Math.min(yMax, data[i]))
			pts.push(`${cx.toFixed(1)},${(py + ph - (v - yMin) / (yMax - yMin) * ph).toFixed(1)}`)
		}
	} else {
		// min/max per pixel column — preserves peaks/spikes on downsampled waveforms
		for (let col = 0; col < cols; col++) {
			let i0 = (col * N / cols) | 0, i1 = ((col + 1) * N / cols) | 0
			let mn = Infinity, mx = -Infinity
			for (let i = i0; i < i1; i++) { if (data[i] < mn) mn = data[i]; if (data[i] > mx) mx = data[i] }
			if (!isFinite(mn)) continue
			let cx = (px + (col + 0.5) / cols * pw).toFixed(1)
			let cy1 = (py + ph - (Math.max(yMin, Math.min(yMax, mn)) - yMin) / (yMax - yMin) * ph).toFixed(1)
			let cy2 = (py + ph - (Math.max(yMin, Math.min(yMax, mx)) - yMin) / (yMax - yMin) * ph).toFixed(1)
			pts.push(`${cx},${cy1}`, `${cx},${cy2}`)
		}
	}
	if (pts.length < 2) return ''
	let clip = cid ? ` clip-path="url(#${cid})"` : ''
	return `  <polyline${clip} points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round"/>\n`
}

function logPolyline (freqs, vals, fMin, fMax, yMin, yMax, px, py, pw, ph, color, sw = 1.2, cid = null) {
	let lr = Math.log10(fMax / fMin), pts = []
	for (let i = 0; i < freqs.length; i++) {
		let f = freqs[i]
		if (f < fMin || f > fMax) continue
		let v = vals[i]
		if (!isFinite(v)) continue
		let cx = px + Math.log10(f / fMin) / lr * pw
		let cv = Math.max(yMin, Math.min(yMax, v))
		let cy = py + ph - (cv - yMin) / (yMax - yMin) * ph
		pts.push(`${cx.toFixed(1)},${cy.toFixed(1)}`)
	}
	if (pts.length < 2) return ''
	let clip = cid ? ` clip-path="url(#${cid})"` : ''
	return `  <polyline${clip} points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round"/>\n`
}

function fillUnder (data, yMin, yMax, px, py, pw, ph, color, cid = null) {
	let N = data.length, pts = [], cols = Math.ceil(pw)
	let baseY = py + ph - (0 - yMin) / (yMax - yMin) * ph
	baseY = Math.max(py, Math.min(py + ph, baseY))
	if (N <= cols) {
		for (let i = 0; i < N; i++) {
			let cx = px + i / (N - 1) * pw
			let v = Math.max(yMin, Math.min(yMax, data[i]))
			pts.push(`${cx.toFixed(1)},${(py + ph - (v - yMin) / (yMax - yMin) * ph).toFixed(1)}`)
		}
	} else {
		for (let col = 0; col < cols; col++) {
			let i0 = (col * N / cols) | 0, i1 = ((col + 1) * N / cols) | 0
			let mn = Infinity, mx = -Infinity
			for (let i = i0; i < i1; i++) { if (data[i] < mn) mn = data[i]; if (data[i] > mx) mx = data[i] }
			if (!isFinite(mn)) continue
			let cx = (px + (col + 0.5) / cols * pw).toFixed(1)
			pts.push(`${cx},${(py + ph - (Math.max(yMin, Math.min(yMax, mx)) - yMin) / (yMax - yMin) * ph).toFixed(1)}`)
		}
	}
	if (pts.length < 2) return ''
	let id = uid()
	let minY = pts.reduce((m, p) => Math.min(m, +p.split(',')[1]), baseY)
	let defs = `\n    <linearGradient id="${id}" x1="0" y1="${minY.toFixed(0)}" x2="0" y2="${baseY.toFixed(0)}" gradientUnits="userSpaceOnUse">` +
		`<stop offset="0%" stop-color="${color}" stop-opacity="0.15"/>` +
		`<stop offset="100%" stop-color="${color}" stop-opacity="0.01"/>` +
		`</linearGradient>\n`
	let clip = cid ? ` clip-path="url(#${cid})"` : ''
	let poly = `  <polygon${clip} points="${px.toFixed(1)},${baseY.toFixed(1)} ${pts.join(' ')} ${(px + pw).toFixed(1)},${baseY.toFixed(1)}" fill="url(#${id})"/>\n`
	return { defs, poly }
}

// ── DSP helpers ────────────────────────────────────────────────────────────
// Simple DFT magnitude — fine for short signals
function dftMag (signal, winSize, fs) {
	let nBins = winSize >> 1
	let freqs = new Float64Array(nBins)
	let mag = new Float64Array(nBins)
	for (let k = 0; k < nBins; k++) {
		freqs[k] = k * fs / winSize
		let re = 0, im = 0, tw = 2 * Math.PI * k / winSize
		for (let n = 0; n < winSize; n++) {
			let x = n < signal.length ? signal[n] : 0
			re += x * Math.cos(tw * n)
			im -= x * Math.sin(tw * n)
		}
		mag[k] = Math.sqrt(re * re + im * im) / winSize
	}
	return { freqs, mag }
}

// STFT: returns array of magnitude frames
function computeSTFT (signal, winSize, hop, fs) {
	let N = signal.length
	let nFrames = Math.max(1, Math.floor((N - winSize) / hop) + 1)
	let nBins = winSize >> 1
	// Hann window
	let win = new Float64Array(winSize)
	for (let i = 0; i < winSize; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / winSize)
	let frames = []
	for (let f = 0; f < nFrames; f++) {
		let off = f * hop
		let mag = new Float64Array(nBins)
		for (let k = 0; k < nBins; k++) {
			let re = 0, im = 0, tw = 2 * Math.PI * k / winSize
			for (let n = 0; n < winSize; n++) {
				let x = (off + n) < N ? signal[off + n] * win[n] : 0
				re += x * Math.cos(tw * n)
				im -= x * Math.sin(tw * n)
			}
			mag[k] = Math.sqrt(re * re + im * im) / winSize
		}
		frames.push(mag)
	}
	return { frames, nBins, binHz: fs / winSize }
}

// ── Legend ─────────────────────────────────────────────────────────────────
function legendRow (items, x, y) {
	let s = ''
	for (let [name, color] of items) {
		s += hline(x, y - 3, x + 12, color, 2)
		s += txt(x + 15, y, name, 'start', 11)
		x += 15 + name.length * 5.8 + 10
	}
	return s
}

// ── Waveform plot ──────────────────────────────────────────────────────────
/**
 * Time-domain waveform plot.
 * @param {Array} traces  - [{signal: Float64Array, label, color}]
 * @param {string} title
 * @param {object} opts   - {fs, yMin, yMax, xLabel, markers: [{x, label}], fill}
 * @returns SVG string
 */
export function waveformPlot (traces, title, opts = {}) {
	let fs = opts.fs || 44100
	let N = traces[0].signal.length
	let durMs = (N / fs * 1000)
	let yMin = opts.yMin ?? -1.2, yMax = opts.yMax ?? 1.2
	let xLabel = opts.xLabel || 'ms'

	let px = LM, py = TM, pw = FW, ph = FH

	let xTicks = autoTicks(0, durMs, 5).map(v => Math.round(v * 10) / 10)
	let yTicks = autoTicks(yMin, yMax, 5).map(v => Math.round(v * 100) / 100)
		.filter(v => v > yMin * 0.99 && v < yMax * 0.99)

	let cid = uid()
	let defs = clipRect(cid, px, py, pw, ph)
	let body = ''

	if (title) body += txt(px + pw, py - 5, title, 'end', 11, '600')

	body += panelAxes(px, py, pw, ph)
	body += xLinGrid(px, py, pw, ph, xTicks, 0, durMs, v => v % 1 === 0 ? v : v.toFixed(1))
	body += yGrid(px, py, pw, ph, yTicks, yMin, yMax)
	body += hline(px, py + ph - (0 - yMin) / (yMax - yMin) * ph, px + pw, AXIS, 0.5)
	body += txt(px + pw / 2, py + ph + 26, xLabel, 'middle', 9)
	body += txt(px - 22, py + ph / 2, 'amp', 'middle', 9)

	// Optional markers (vertical lines with labels, e.g. echo positions)
	if (opts.markers) {
		for (let {x, label} of opts.markers) {
			let vx = px + x / durMs * pw
			body += vline(vx, py, py + ph, COLORS[3], 1)
			body += txt(vx, py + 10, label, 'middle', 7)
		}
	}

	// Fill + draw each trace
	for (let ti = 0; ti < traces.length; ti++) {
		let { signal, color } = traces[ti]
		color = color || COLORS[ti]
		if (opts.fill !== false) {
			let res = fillUnder(signal, yMin, yMax, px, py, pw, ph, color, cid)
			if (res) { defs += res.defs; body += res.poly }
		}
		body += linPolyline(signal, 0, durMs, yMin, yMax, px, py, pw, ph, color, 1.5, cid)
	}

	if (traces.length > 1) {
		body += legendRow(traces.map((t, i) => [t.label || `ch${i+1}`, t.color || COLORS[i]]),
			px, py - 5)
	}

	return svgWrap(body, defs)
}

// ── Dual waveform (L / R) ─────────────────────────────────────────────────
/**
 * Two side-by-side waveform panels.
 */
export function dualWaveformPlot (left, right, labels, title, opts = {}) {
	let fs = opts.fs || 44100
	let N = left.length
	let durMs = N / fs * 1000
	let yMin = opts.yMin ?? -1.2, yMax = opts.yMax ?? 1.2

	let p1 = { x: LM,           y: TM, w: PW, h: FH }
	let p2 = { x: LM + PW + GAP, y: TM, w: PW, h: FH }

	let xTicks = autoTicks(0, durMs, 4).map(v => Math.round(v))
	let yTicks = [-1, -0.5, 0, 0.5, 1].filter(v => v > yMin * 0.99 && v < yMax * 0.99)

	let defs = '', body = ''
	if (title) body += txt(p2.x + p2.w, p1.y - 5, title, 'end', 11, '600')

	for (let [panel, sig, lbl] of [[p1, left, labels[0]], [p2, right, labels[1]]]) {
		let { x: px, y: py, w: pw, h: ph } = panel
		let cid = uid()
		defs += clipRect(cid, px, py, pw, ph)
		body += panelAxes(px, py, pw, ph)
		body += xLinGrid(px, py, pw, ph, xTicks, 0, durMs, v => v + 'ms')
		body += yGrid(px, py, pw, ph, yTicks, yMin, yMax)
		body += hline(px, py + ph - (0 - yMin) / (yMax - yMin) * ph, px + pw, AXIS, 0.5)
		body += txt(px + pw / 2, py + ph + 26, 'ms', 'middle', 9)
		body += txt(px + pw / 2, py - 5, lbl, 'middle', 10, '600')
		let res = fillUnder(sig, yMin, yMax, px, py, pw, ph, COLORS[0], cid)
		if (res) { defs += res.defs; body += res.poly }
		body += linPolyline(sig, 0, durMs, yMin, yMax, px, py, pw, ph, COLORS[0], 1.5, cid)
	}

	return svgWrap(body, defs)
}

// ── Spectrogram ────────────────────────────────────────────────────────────
/**
 * STFT spectrogram: time × log-frequency × intensity.
 * @param {Float64Array} signal
 * @param {string} title
 * @param {object} opts - {fs, fMin, fMax, dbFloor, winSize, hop}
 */
export function spectrogramPlot (signal, title, opts = {}) {
	let fs = opts.fs || 44100
	let winSize = opts.winSize || 256
	let hop = opts.hop || 64
	let fMin = opts.fMin || 80
	let fMax = opts.fMax || Math.min(12000, fs / 2)
	let dbFloor = opts.dbFloor || -60

	let { frames, binHz } = computeSTFT(signal, winSize, hop, fs)
	let nFrames = frames.length
	let nBins = frames[0].length

	// Aggregate into N_BANDS log-spaced bands for even visual density
	const N_BANDS = 48
	let logFMin = Math.log10(fMin), logFMax = Math.log10(fMax)

	// Find global max for normalization
	let gMax = 0
	for (let f of frames) for (let v of f) if (v > gMax) gMax = v
	if (gMax === 0) gMax = 1

	let px = LM, py = TM, pw = FW, ph = FH
	let frameW = pw / nFrames
	let bandH = ph / N_BANDS
	let durMs = signal.length / fs * 1000

	let cid = uid()
	let defs = clipRect(cid, px, py, pw, ph)
	let body = ''

	if (title) body += txt(px + pw, py - 5, title, 'end', 11, '600')

	// Render spectrogram cells
	body += `  <g clip-path="url(#${cid})">\n`
	for (let f = 0; f < nFrames; f++) {
		let sx = px + f * frameW
		// For each band, find max magnitude
		let bandMag = new Float64Array(N_BANDS)
		for (let k = 1; k < nBins; k++) {
			let freq = k * binHz
			if (freq < fMin || freq > fMax) continue
			let logF = Math.log10(freq)
			let b = Math.floor((logF - logFMin) / (logFMax - logFMin) * N_BANDS)
			b = Math.max(0, Math.min(N_BANDS - 1, b))
			if (frames[f][k] > bandMag[b]) bandMag[b] = frames[f][k]
		}
		for (let b = 0; b < N_BANDS; b++) {
			let intensity = Math.max(0, Math.min(1, (20 * Math.log10(Math.max(bandMag[b] / gMax, 1e-6)) - dbFloor) / (-dbFloor)))
			if (intensity < 0.03) continue
			let sy = py + (N_BANDS - 1 - b) * bandH
			// White → blue: rgb(255-196t, 255-125t, 255-9t)
			let t = intensity
			let r = (255 - 196 * t) | 0, g = (255 - 125 * t) | 0, bl = (255 - 9 * t) | 0
			body += `  <rect x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="${(frameW + 0.5).toFixed(1)}" height="${(bandH + 0.5).toFixed(1)}" fill="rgb(${r},${g},${bl})"/>\n`
		}
	}
	body += `  </g>\n`

	// Axes
	body += panelAxes(px, py, pw, ph)

	// Frequency grid lines (y-axis, log scale)
	let fTicks = [100, 200, 500, 1000, 2000, 5000, 10000].filter(f => f >= fMin && f <= fMax)
	for (let f of fTicks) {
		let logF = Math.log10(f)
		let by = py + ph - (logF - logFMin) / (logFMax - logFMin) * ph
		body += hline(px, by, px + pw, GRID, 0.5)
		body += txt(px - 4, by + 3, f >= 1000 ? (f / 1000) + 'k' : f, 'end')
	}

	// Time grid (x-axis)
	let tTicks = autoTicks(0, durMs, 5).map(v => Math.round(v))
	for (let t of tTicks) {
		let tx = px + (t / durMs) * pw
		body += vline(tx, py, py + ph, GRID, 0.5)
		body += txt(tx, py + ph + 12, t + 'ms', 'middle')
	}

	body += txt(px + pw / 2, py + ph + 26, 'time', 'middle', 9)
	body += txt(px - 22, py + ph / 2, 'Hz', 'middle', 9)

	return svgWrap(body, defs)
}

// ── Transfer curve ─────────────────────────────────────────────────────────
/**
 * Dynamics transfer curve: input dB on x, output dB on y.
 * Left panel = static curve; right panel = test waveform before/after.
 * @param {Array} curves - [{fn, params, label, color}]
 * @param {string} title
 * @param {object} opts  - {fs, dbMin, markers: [{x, label}]}
 */
export function transferCurvePlot (curves, title, opts = {}) {
	let fs = opts.fs || 44100
	let dbMin = opts.dbMin || -60
	let N = 256  // block size for steady-state measurement

	// Compute transfer curves: sweep input dB, measure steady-state output dB
	let nPoints = 120
	let computed = curves.map(({ fn, params, color }, ci) => {
		let inDB = [], outDB = []
		for (let i = 0; i <= nPoints; i++) {
			let dBin = dbMin + (0 - dbMin) * i / nPoints
			let level = Math.pow(10, dBin / 20)
			// Feed a few blocks to let envelope settle, measure last block
			let p = Object.assign({}, params)
			// Reset internal state
			delete p._env; delete p._gain
			let warmup = new Float64Array(N * 4)
			for (let n = 0; n < warmup.length; n++) warmup[n] = level * Math.sign(Math.sin(2 * Math.PI * 440 * n / fs))
			fn(warmup, p)
			let settle = new Float64Array(N)
			for (let n = 0; n < N; n++) settle[n] = level * Math.sign(Math.sin(2 * Math.PI * 440 * n / fs))
			fn(settle, p)
			let rms = Math.sqrt(settle.reduce((s, v) => s + v * v, 0) / N)
			let dBout = 20 * Math.log10(Math.max(rms, 1e-10))
			inDB.push(dBin)
			outDB.push(Math.max(dbMin - 5, dBout))
		}
		return { inDB, outDB, color: color || COLORS[ci] }
	})

	// Left panel: transfer curve
	let p1 = { x: LM, y: TM, w: PW, h: FH }
	// Right panel: test waveform before/after (using first curve)
	let p2 = { x: LM + PW + GAP, y: TM, w: PW, h: FH }

	let ticks = [-60, -50, -40, -30, -20, -10, 0]
	let defs = '', body = ''

	if (title) body += txt(p2.x + p2.w, p1.y - 5, title, 'end', 11, '600')

	// ── Left panel: transfer curve ──
	{
		let { x: px, y: py, w: pw, h: ph } = p1
		let cid = uid()
		defs += clipRect(cid, px, py, pw, ph)
		body += panelAxes(px, py, pw, ph)
		body += yGrid(px, py, pw, ph, ticks, dbMin, 0, v => v === 0 ? '0' : v)
		body += xLinGrid(px, py, pw, ph, ticks, dbMin, 0, v => v === 0 ? '0' : v)
		// Unity line (dashed)
		body += logPolyline([dbMin, 0], [dbMin, 0], dbMin, 0, dbMin, 0, px, py, pw, ph, AXIS, 0.8, null)
		body += txt(px + pw / 2, py + ph + 26, 'input (dB)', 'middle', 9)
		body += txt(px - 22, py + ph / 2, 'output (dB)', 'middle', 9)

		// Threshold markers
		if (opts.markers) {
			for (let { x, label } of opts.markers) {
				let lx = px + (x - dbMin) / (0 - dbMin) * pw
				body += vline(lx, py, py + ph, COLORS[3], 1)
				body += txt(lx + 3, py + 12, label, 'start', 7)
			}
		}

		for (let { inDB, outDB, color } of computed) {
			body += linPolyline(outDB, 0, nPoints, dbMin, 0, px, py, pw, ph, color, 1.8, cid)
		}
	}

	// ── Right panel: test waveform ──
	{
		let { fn, params, color } = curves[0]
		color = color || COLORS[0]
		let { x: px, y: py, w: pw, h: ph } = p2
		let cid = uid()
		defs += clipRect(cid, px, py, pw, ph)

		// Create test signal: sine that ramps up then back down
		let testLen = 4096
		let orig = new Float64Array(testLen)
		for (let n = 0; n < testLen; n++) {
			let env = n < testLen / 2
				? n / (testLen / 2)
				: 1 - (n - testLen / 2) / (testLen / 2)
			orig[n] = Math.sin(2 * Math.PI * 440 * n / fs) * env
		}
		let processed = Float64Array.from(orig)
		let p = Object.assign({}, params); delete p._env; delete p._gain
		fn(processed, p)

		let yMin = -1.2, yMax = 1.2
		let durMs = testLen / fs * 1000
		let tTicks = autoTicks(0, durMs, 4).map(Math.round)
		body += panelAxes(px, py, pw, ph)
		body += xLinGrid(px, py, pw, ph, tTicks, 0, durMs, v => v + 'ms')
		body += yGrid(px, py, pw, ph, [-1, 0, 1], yMin, yMax)
		body += hline(px, py + ph * 0.5, px + pw, AXIS, 0.5)
		body += txt(px + pw / 2, py + ph + 26, 'time', 'middle', 9)

		// Draw original (faded) and processed
		body += linPolyline(orig, 0, durMs, yMin, yMax, px, py, pw, ph, '#d1d5db', 1, cid)
		body += linPolyline(processed, 0, durMs, yMin, yMax, px, py, pw, ph, color, 1.5, cid)
		body += legendRow([['input', '#d1d5db'], ['output', color]], px, py - 5)
	}

	if (curves.length > 1) {
		body += legendRow(curves.map((c, i) => [c.label, c.color || COLORS[i]]), LM, TM - 3)
	}

	return svgWrap(body, defs)
}

// ── Waveshaper curve ───────────────────────────────────────────────────────
/**
 * Static waveshaping transfer curve: input amplitude → output amplitude.
 * Shows all 4 distortion types overlaid.
 */
export function waveshaperPlot (types, fn, baseParams, title) {
	let nPoints = 400
	let xMin = -2, xMax = 2, yMin = -1.5, yMax = 1.5

	let p1 = { x: LM, y: TM, w: PW, h: FH }
	let p2 = { x: LM + PW + GAP, y: TM, w: PW, h: FH }

	let defs = '', body = ''
	if (title) body += txt(p2.x + p2.w, p1.y - 5, title, 'end', 11, '600')

	// Left panel: transfer curves
	{
		let { x: px, y: py, w: pw, h: ph } = p1
		let cid = uid()
		defs += clipRect(cid, px, py, pw, ph)
		body += panelAxes(px, py, pw, ph)
		body += yGrid(px, py, pw, ph, [-1, 0, 1], yMin, yMax)
		body += xLinGrid(px, py, pw, ph, [-2, -1, 0, 1, 2], xMin, xMax)
		// Identity line
		let idPts = `${px.toFixed(1)},${(py + ph - (-xMin) / (yMax - yMin) * ph).toFixed(1)} ${(px + pw).toFixed(1)},${(py + ph - (xMax - yMin) / (yMax - yMin) * ph).toFixed(1)}`
		body += `  <polyline points="${idPts}" fill="none" stroke="${AXIS}" stroke-width="0.8" stroke-dasharray="4 3"/>\n`
		body += txt(px + pw / 2, py + ph + 26, 'input', 'middle', 9)
		body += txt(px - 22, py + ph / 2, 'output', 'middle', 9)

		for (let [i, { type, label, color }] of types.entries()) {
			let curve = new Float64Array(nPoints)
			for (let j = 0; j < nPoints; j++) {
				let x = xMin + (xMax - xMin) * j / (nPoints - 1)
				let d = new Float64Array(1); d[0] = x
				fn(d, { ...baseParams, type, mix: 1 })
				curve[j] = d[0]
			}
			body += linPolyline(curve, 0, nPoints - 1, yMin, yMax, px, py, pw, ph, color, 1.8, cid)
		}
		body += legendRow(types.map(t => [t.label, t.color]), px, py - 5)
	}

	// Right panel: processed waveform (soft only, showing harmonics visually)
	{
		let { x: px, y: py, w: pw, h: ph } = p2
		let cid = uid()
		defs += clipRect(cid, px, py, pw, ph)
		let N = 512
		let orig = new Float64Array(N)
		for (let n = 0; n < N; n++) orig[n] = 1.5 * Math.sin(2 * Math.PI * 440 * n / 44100)
		body += panelAxes(px, py, pw, ph)
		body += yGrid(px, py, pw, ph, [-1, 0, 1], -1.5, 1.5)
		body += xLinGrid(px, py, pw, ph, [0, 128, 256, 384, 512], 0, N)
		body += hline(px, py + ph / 2, px + pw, AXIS, 0.5)
		body += txt(px + pw / 2, py + ph + 26, 'samples', 'middle', 9)

		body += linPolyline(orig, 0, N, -1.5, 1.5, px, py, pw, ph, '#d1d5db', 1, cid)

		for (let { type, color } of types) {
			let d = Float64Array.from(orig)
			fn(d, { ...baseParams, type, mix: 1 })
			body += linPolyline(d, 0, N, -1.5, 1.5, px, py, pw, ph, color, 1.5, cid)
		}
		body += legendRow([['input', '#d1d5db'], ...types.map(t => [t.label, t.color])], px, py - 5)
	}

	return svgWrap(body, defs)
}

// ── Spectrum plot ──────────────────────────────────────────────────────────
/**
 * Frequency domain magnitude spectrum.
 * @param {Array} spectra - [{signal, label, color}]
 * @param {string} title
 * @param {object} opts  - {fs, fMin, fMax, dbMin}
 */
export function spectrumPlot (spectra, title, opts = {}) {
	let fs = opts.fs || 44100
	let fMin = opts.fMin || 20, fMax = opts.fMax || 20000
	let dbMin = opts.dbMin || -80

	let px = LM, py = TM, pw = FW, ph = FH
	let fTicks = [100, 1000, 10000]
	let dBticks = [-80, -60, -40, -20, 0]

	let cid = uid()
	let defs = clipRect(cid, px, py, pw, ph)
	let body = ''

	if (title) body += txt(px + pw, py - 5, title, 'end', 11, '600')
	body += panelAxes(px, py, pw, ph)
	body += xLogGrid(px, py, pw, ph, fTicks, fMin, fMax)
	body += yGrid(px, py, pw, ph, dBticks, dbMin, 0, v => v + '')
	body += txt(px + pw / 2, py + ph + 26, 'Hz', 'middle', 9)
	body += txt(px - 22, py + ph / 2, 'dB', 'middle', 9)

	for (let [ti, { signal, color }] of spectra.entries()) {
		color = color || COLORS[ti]
		let N = Math.min(signal.length, 8192)
		let { freqs, mag } = dftMag(signal, N, fs)
		let dBvals = Array.from(mag).map(m => 20 * Math.log10(Math.max(m, 1e-10)))
		body += logPolyline(freqs, dBvals, fMin, fMax, dbMin, 0, px, py, pw, ph, color, 1.5, cid)
	}

	if (spectra.length > 1) {
		body += legendRow(spectra.map((s, i) => [s.label, s.color || COLORS[i]]), px, py - 5)
	}

	return svgWrap(body, defs)
}

// ── Lissajous multi ────────────────────────────────────────────────────────
/**
 * Multiple side-by-side Lissajous (x=L, y=R) panels.
 * @param {Array} pairs  - [{left, right, label}]
 * @param {string} title
 */
export function lissajousMulti (pairs, title) {
	let n = pairs.length
	let panelW = Math.min(240, Math.floor((FW - (n - 1) * 10) / n))
	let panelH = panelW  // square
	let totalW = n * panelW + (n - 1) * 10
	let startX = LM + (FW - totalW) / 2
	let startY = TM + (FH - panelH) / 2

	let defs = '', body = ''
	if (title) body += txt(LM + FW / 2, TM - 3, title, 'middle', 11, '600')

	for (let [i, { left, right, label }] of pairs.entries()) {
		let px = startX + i * (panelW + 10)
		let py = startY

		let cid = uid()
		defs += clipRect(cid, px, py, panelW, panelH)
		body += panelAxes(px, py, panelW, panelH)
		// Center cross
		body += hline(px, py + panelH / 2, px + panelW, GRID, 0.5)
		body += vline(px + panelW / 2, py, py + panelH, GRID, 0.5)

		// Diagonal reference line (mono = 45° line)
		body += `  <line x1="${px}" y1="${py + panelH}" x2="${px + panelW}" y2="${py}" stroke="${AXIS}" stroke-width="0.5" stroke-dasharray="3 2"/>\n`

		// Plot Lissajous
		let N = left.length
		let pts = []
		for (let j = 0; j < N; j++) {
			let lv = Math.max(-1, Math.min(1, left[j]))
			let rv = Math.max(-1, Math.min(1, right[j]))
			let x = px + (lv + 1) / 2 * panelW
			let y = py + (1 - (rv + 1) / 2) * panelH
			pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
		}
		body += `  <polyline clip-path="url(#${cid})" points="${pts.join(' ')}" fill="none" stroke="${COLORS[0]}" stroke-width="0.6" stroke-opacity="0.6"/>\n`

		// Axis labels
		body += txt(px - 6, py + panelH / 2, 'R', 'end', 8)
		body += txt(px + panelW / 2, py + panelH + 12, 'L', 'middle', 8)
		// Panel title
		body += txt(px + panelW / 2, py - 5, label, 'middle', 9, '600')
	}

	return svgWrap(body, defs)
}

// ── Panner bars ────────────────────────────────────────────────────────────
/**
 * L/R level bar chart at multiple pan positions.
 */
export function pannerBarsPlot (positions, fn, title) {
	let n = positions.length
	let groupW = Math.floor(FW / n)
	let barW = Math.floor(groupW * 0.3)
	let maxH = FH - 30

	let defs = '', body = ''
	if (title) body += txt(LM + FW, TM - 5, title, 'end', 11, '600')

	// dB grid lines
	for (let dB of [0, -6, -12]) {
		let v = Math.pow(10, dB / 20)
		let gy = TM + maxH - v * maxH
		body += hline(LM, gy, LM + FW, GRID, 0.5)
		body += txt(LM - 4, gy + 3, dB + '', 'end')
	}
	body += vline(LM, TM, TM + maxH)
	body += hline(LM, TM + maxH, LM + FW)

	for (let [i, pan] of positions.entries()) {
		let left = new Float64Array([1]), right = new Float64Array([1])
		fn(left, right, { pan })
		let lv = Math.min(1, Math.abs(left[0])), rv = Math.min(1, Math.abs(right[0]))
		let lh = lv * maxH, rh = rv * maxH

		let gx = LM + i * groupW + groupW / 2
		let lx = gx - barW - 2, rx = gx + 2

		// L bar (blue)
		body += `  <rect x="${lx}" y="${(TM + maxH - lh).toFixed(1)}" width="${barW}" height="${lh.toFixed(1)}" fill="${COLORS[0]}" opacity="0.7"/>\n`
		// R bar (red)
		body += `  <rect x="${rx}" y="${(TM + maxH - rh).toFixed(1)}" width="${barW}" height="${rh.toFixed(1)}" fill="${COLORS[1]}" opacity="0.7"/>\n`

		// Pan label
		let panLabel = pan === 0 ? 'C' : pan > 0 ? `+${pan}` : `${pan}`
		body += txt(gx, TM + maxH + 14, panLabel, 'middle', 9)
	}

	body += legendRow([['L', COLORS[0]], ['R', COLORS[1]]], LM + FW - 60, TM - 3)
	body += txt(LM + FW / 2, TM + maxH + 28, 'pan', 'middle', 9)
	body += txt(LM - 22, TM + maxH / 2, 'dB', 'middle', 9)

	return svgWrap(body, defs)
}

// ── Utility ────────────────────────────────────────────────────────────────
function autoTicks (lo, hi, n) {
	let range = hi - lo
	if (range === 0) return [lo]
	let step = range / n
	let mag = Math.pow(10, Math.floor(Math.log10(step)))
	step = Math.ceil(step / mag) * mag
	let ticks = []
	for (let v = Math.ceil(lo / step) * step; v <= hi + step * 0.01; v += step)
		ticks.push(Math.round(v * 1000) / 1000)
	return ticks
}
