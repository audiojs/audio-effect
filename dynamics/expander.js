/**
 * Expander — downward expansion below threshold.
 * Complement to compressor: attenuates signal below threshold rather than above.
 * ratio=2 means each 1 dB drop below threshold produces 2 dB of output drop.
 */

let {abs, exp, pow, log10, max} = Math

export default function expander (data, params) {
	let threshold = params.threshold ?? -40   // dB
	let ratio = params.ratio ?? 2             // expansion ratio > 1
	let attack = params.attack ?? 0.001       // seconds
	let release = params.release ?? 0.1       // seconds
	let range = params.range ?? -60           // dB (maximum attenuation floor)
	let fs = params.fs || 44100

	let aA = exp(-1 / (attack * fs))
	let aR = exp(-1 / (release * fs))

	let env = params._env ?? 0

	for (let i = 0, l = data.length; i < l; i++) {
		let x = data[i]
		let xAbs = abs(x)

		if (xAbs > env) env = aA * env + (1 - aA) * xAbs
		else env = aR * env + (1 - aR) * xAbs

		let dB = 20 * log10(max(env, 1e-30))

		// Below threshold: gain = (ratio-1) * (dB - threshold), clamped to range
		let gainDB = 0
		if (dB < threshold) {
			gainDB = max((ratio - 1) * (dB - threshold), range)
		}

		data[i] = x * pow(10, gainDB / 20)
	}

	params._env = env

	return data
}
