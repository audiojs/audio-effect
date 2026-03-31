/**
 * Auto-wah — envelope follower drives resonant bandpass cutoff.
 * Signal level controls filter sweep from base up through range.
 */

let {abs, exp, sin, min, PI} = Math

export default function autoWah (data, params) {
	let base = params.base ?? 300       // minimum cutoff Hz
	let range = params.range ?? 3000    // sweep range Hz
	let Q = params.Q ?? 5               // filter resonance
	let attack = params.attack ?? 0.002 // envelope attack (seconds)
	let release = params.release ?? 0.1 // envelope release (seconds)
	let sens = params.sens ?? 2         // input sensitivity
	let fs = params.fs || 44100

	let aA = exp(-1 / (attack * fs))
	let aR = exp(-1 / (release * fs))

	if (params._env == null) {
		params._env = 0
		params._lp = 0
		params._bp = 0
	}
	let env = params._env, lp = params._lp, bp = params._bp
	let q = 1 / Q

	for (let i = 0, l = data.length; i < l; i++) {
		let x = data[i]
		let level = abs(x) * sens

		// Envelope follower with asymmetric attack/release
		if (level > env) env = aA * env + (1 - aA) * level
		else env = aR * env + (1 - aR) * level

		// Envelope → cutoff frequency
		let freq = base + range * min(1, env)

		// State-variable bandpass filter
		let f = 2 * sin(PI * freq / fs)
		lp += f * bp
		let hp = x - lp - q * bp
		bp += f * hp
		data[i] = bp
	}

	params._env = env
	params._lp = lp
	params._bp = bp

	return data
}
