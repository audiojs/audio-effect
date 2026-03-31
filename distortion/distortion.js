/**
 * Distortion / saturation — non-linear waveshaping.
 * types: 'soft' (cubic), 'hard' (brickwall), 'tanh', 'foldback'
 */

let {abs, sign, tanh, min, max} = Math

export default function distortion (data, params) {
	let drive = params.drive ?? 0.5    // distortion amount (0–1)
	let type = params.type || 'soft'   // 'soft' | 'hard' | 'tanh' | 'foldback'
	let mix = params.mix ?? 1          // wet/dry

	let gain = 1 + drive * 9           // 1× to 10×

	for (let i = 0, l = data.length; i < l; i++) {
		let x = data[i]
		let xg = x * gain
		let y

		if (type === 'soft') {
			// Cubic soft clip: smooth saturation, unity gain at |x|=1
			let ax = abs(xg)
			y = ax >= 1 ? sign(xg) : xg * (1 - ax * ax / 3) * 1.5
		} else if (type === 'hard') {
			// Hard clip: brickwall limiter
			y = max(-1, min(1, xg))
		} else if (type === 'foldback') {
			// Wavefolding: reflects signal back at ±1 boundary
			y = xg
			while (abs(y) > 1) {
				if (y > 1) y = 2 - y
				else y = -2 - y
			}
		} else {
			// tanh: hyperbolic tangent — asymptotically soft
			y = tanh(xg)
		}

		data[i] = x * (1 - mix) + y * mix
	}

	return data
}
