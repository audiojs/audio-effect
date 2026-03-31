/**
 * Reverb — Schroeder reverb: parallel feedback comb filters + series allpass.
 * 4 comb filters with LP damping, 2 allpass diffusers.
 */

export default function reverb (data, params) {
	let decay = params.decay ?? 0.84      // reverb time (0–1)
	let damping = params.damping ?? 0.5   // high-freq damping (0–1)
	let mix = params.mix ?? 0.3           // wet/dry mix
	let fs = params.fs || 44100

	let scale = fs / 44100

	if (!params._c) {
		// 4 prime comb delays (~29–35 ms at 44100 Hz)
		let cl = [1277, 1381, 1447, 1523].map(n => (n * scale) | 0)
		params._c = cl.map(n => ({ b: new Float64Array(n), p: 0, f: 0 }))
		// 2 allpass delays (~6–8 ms at 44100 Hz)
		let al = [277, 349].map(n => (n * scale) | 0)
		params._a = al.map(n => ({ b: new Float64Array(n), p: 0 }))
	}

	let combs = params._c, aps = params._a

	for (let i = 0, l = data.length; i < l; i++) {
		let x = data[i]

		// 4 parallel feedback comb filters with LP damping on feedback path
		let out = 0
		for (let c of combs) {
			let y = c.b[c.p]
			c.f = y * (1 - damping) + c.f * damping   // one-pole LP
			c.b[c.p] = x + decay * c.f
			c.p = (c.p + 1) % c.b.length
			out += y
		}
		out *= 0.25

		// 2 series Schroeder allpass filters (g = 0.5)
		for (let a of aps) {
			let y = a.b[a.p]
			a.b[a.p] = out + 0.5 * y
			a.p = (a.p + 1) % a.b.length
			out = y - 0.5 * out
		}

		data[i] = x * (1 - mix) + out * mix
	}

	return data
}
