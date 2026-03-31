/**
 * Compressor — reduces dynamic range above threshold.
 * Feedforward design with envelope-based gain computation.
 */

let {abs, exp, pow, log10, max} = Math

export default function compressor (data, params) {
	let threshold = params.threshold ?? -20   // dB
	let ratio = params.ratio ?? 4             // :1
	let attack = params.attack ?? 0.003       // seconds
	let release = params.release ?? 0.1       // seconds
	let knee = params.knee ?? 0               // dB (soft knee width)
	let makeupGain = params.makeupGain ?? 0   // dB
	let fs = params.fs || 44100

	let aA = exp(-1 / (attack * fs))
	let aR = exp(-1 / (release * fs))
	let makeup = pow(10, makeupGain / 20)

	let env = params._env ?? 0

	for (let i = 0, l = data.length; i < l; i++) {
		let x = data[i]
		let xAbs = abs(x)

		// Envelope follower
		if (xAbs > env) env = aA * env + (1 - aA) * xAbs
		else env = aR * env + (1 - aR) * xAbs

		// Level in dB
		let dB = 20 * log10(max(env, 1e-30))

		// Gain computation
		let gainDB = 0
		if (knee > 0) {
			let lo = threshold - knee / 2
			let hi = threshold + knee / 2
			if (dB > lo && dB < hi) {
				let x2 = dB - lo
				gainDB = (1 / ratio - 1) * x2 * x2 / (2 * knee)
			} else if (dB >= hi) {
				gainDB = (1 / ratio - 1) * (dB - threshold)
			}
		} else if (dB > threshold) {
			gainDB = (1 / ratio - 1) * (dB - threshold)
		}

		data[i] = x * pow(10, gainDB / 20) * makeup
	}

	params._env = env

	return data
}
