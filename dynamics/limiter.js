/**
 * Limiter — brickwall peak limiter with lookahead-free design.
 * Instant attack, configurable release. Ceiling at threshold.
 */

let {abs, exp, max, min} = Math

export default function limiter (data, params) {
	let threshold = params.threshold ?? 0.95
	let release = params.release ?? 0.05
	let fs = params.fs || 44100

	let aR = exp(-1 / (release * fs))

	let gain = params._gain ?? 1

	for (let i = 0, l = data.length; i < l; i++) {
		let x = data[i]
		let xAbs = abs(x)

		let target = xAbs > threshold ? threshold / xAbs : 1

		// Instant attack, smooth release
		if (target < gain) gain = target
		else gain = aR * gain + (1 - aR) * target

		data[i] = x * gain
	}

	params._gain = gain

	return data
}
