/**
 * Noise gate — attenuates signal below threshold.
 */

let {abs, exp, pow, log10, max} = Math

export default function gate (data, params) {
	let threshold = params.threshold ?? -40   // dB
	let attack = params.attack ?? 0.001       // seconds
	let release = params.release ?? 0.05      // seconds
	let range = params.range ?? -80           // dB (how much to attenuate when closed)
	let fs = params.fs || 44100

	let aA = exp(-1 / (attack * fs))
	let aR = exp(-1 / (release * fs))
	let minGain = pow(10, range / 20)

	let env = params._env ?? 0
	let gain = params._gain ?? minGain

	for (let i = 0, l = data.length; i < l; i++) {
		let x = data[i]
		let xAbs = abs(x)

		if (xAbs > env) env = aA * env + (1 - aA) * xAbs
		else env = aR * env + (1 - aR) * xAbs

		let dB = 20 * log10(max(env, 1e-30))
		let target = dB > threshold ? 1 : minGain

		// Smooth gain transitions
		if (target > gain) gain = aA * gain + (1 - aA) * target
		else gain = aR * gain + (1 - aR) * target

		data[i] = x * gain
	}

	params._env = env
	params._gain = gain

	return data
}
