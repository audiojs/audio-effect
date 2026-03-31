/**
 * Compressor — reduces dynamic range above threshold.
 * dB-domain envelope with multi-channel peak detection.
 */

let { abs, exp, log, pow } = Math

const LN10_20  = Math.log(10) / 20   // dB → linear gain factor
const LOG10_20 = 20 / Math.log(10)   // linear → dB

export default function compressor (data, params) {
	let threshold  = params.threshold  ?? -24    // dB
	let ratio      = params.ratio      ?? 12     // :1
	let attack     = params.attack     ?? 0.003  // seconds
	let release    = params.release    ?? 0.25   // seconds
	let knee       = params.knee       ?? 30     // dB
	let makeupGain = params.makeupGain ?? 0      // dB
	let fs         = params.fs         || 44100

	let aA = attack  > 0 ? exp(-1 / (attack  * fs)) : 0
	let aR = release > 0 ? exp(-1 / (release * fs)) : 0
	let makeup   = pow(10, makeupGain / 20)
	let slope    = 1 - 1 / ratio
	let halfKnee = knee / 2
	let kneeInv  = knee > 0 ? 1 / (4 * knee) : 0

	// Accept mono Float32Array or Float32Array[] for multi-channel
	let channels = ArrayBuffer.isView(data) ? [data] : data
	let nch = channels.length
	let n   = channels[0].length

	let env = params._env ?? -120  // dB floor — avoids attack burst on first block
	let gainReduction = 0

	for (let i = 0; i < n; i++) {
		// Peak detection across channels (linear)
		let peak = 0
		for (let c = 0; c < nch; c++) {
			let v = abs(channels[c][i])
			if (v > peak) peak = v
		}

		// Linear → dB
		let dB = peak > 0 ? LOG10_20 * log(peak) : -120

		// Envelope follower in dB domain
		let coeff = dB > env ? aA : aR
		env = coeff * env + (1 - coeff) * dB

		// Gain reduction
		let overshoot = env - threshold
		gainReduction = 0
		if (overshoot >= halfKnee) {
			gainReduction = overshoot * slope
		} else if (overshoot > -halfKnee) {
			let x = overshoot + halfKnee
			gainReduction = x * x * kneeInv * slope
		}

		let gainLin = exp(-gainReduction * LN10_20) * makeup

		for (let c = 0; c < nch; c++)
			channels[c][i] *= gainLin
	}

	params._env       = env
	params._reduction = -gainReduction  // ≤ 0 dB

	return data
}
