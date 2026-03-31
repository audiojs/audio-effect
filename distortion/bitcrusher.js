/**
 * Bitcrusher — sample-rate reduction + bit-depth quantization.
 */

let {round, pow} = Math

export default function bitcrusher (data, params) {
	let bits = params.bits ?? 8        // target bit depth (1–24)
	let rate = params.rate ?? 0.25     // sample rate ratio: 1 = full, 0.25 = quarter rate
	let fs = params.fs || 44100

	let step = 1 / rate                // hold length in samples
	let levels = pow(2, bits - 1)      // quantization levels per polarity

	if (params._held == null) {
		params._held = 0
		params._phase = 0
	}
	let held = params._held, phase = params._phase

	for (let i = 0, l = data.length; i < l; i++) {
		phase += 1
		if (phase >= step) {
			phase -= step
			held = round(data[i] * levels) / levels
		}
		data[i] = held
	}

	params._held = held
	params._phase = phase

	return data
}
