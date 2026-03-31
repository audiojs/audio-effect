/**
 * Pitch shifter — granular OLA pitch shifting via varispeed read.
 * Maintains a ring buffer; read pointer advances at `shift` rate.
 * Crossfades at grain boundaries to reduce artifacts.
 */

export default function pitchShifter (data, params) {
	let shift = params.shift ?? 1.5    // pitch ratio: 2 = +octave, 0.5 = −octave
	let grain = params.grain || 2048   // grain size in samples
	let fs = params.fs || 44100

	let N = grain * 4                  // ring buffer: 4 grains

	if (!params._buf) {
		params._buf = new Float64Array(N)
		params._wp = grain             // write starts one grain ahead (latency)
		params._rp = 0.0
		params._xn = 0                 // crossfade: samples remaining
		params._xa = 0.0               // crossfade: stored amplitude at jump
	}

	let buf = params._buf, G = grain
	let wp = params._wp
	let rp = params._rp
	let xn = params._xn
	let xa = params._xa

	for (let i = 0, l = data.length; i < l; i++) {
		buf[wp % N] = data[i]
		wp++

		// Interpolated read
		let ri = rp | 0
		let frac = rp - ri
		let y = buf[ri % N] * (1 - frac) + buf[(ri + 1) % N] * frac

		// Crossfade old value (xa) → new value (y) over one grain
		if (xn > 0) {
			let t = (G - xn) / G     // 0 → 1
			y = xa * (1 - t) + y * t
			xn--
		}

		data[i] = y

		rp += shift

		// Drift correction: keep read [G/2, N−G/2] samples behind write
		let dist = wp - rp
		if (dist < G * 0.5) {
			xa = y; xn = G; rp -= G
		} else if (dist > N - G * 0.5) {
			xa = y; xn = G; rp += G
		}
	}

	params._wp = wp
	params._rp = rp
	params._xn = xn
	params._xa = xa

	return data
}
