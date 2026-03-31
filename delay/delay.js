/**
 * Simple delay — mix of dry signal with delayed copy.
 */

export default function delay (data, params) {
	let time = params.time ?? 0.25          // seconds
	let feedback = params.feedback ?? 0.3
	let mix = params.mix ?? 0.5
	let fs = params.fs || 44100

	let delaySamples = (time * fs) | 0

	if (!params.buffer || params.buffer.length < delaySamples) {
		params.buffer = new Float64Array(delaySamples)
		params.ptr = 0
	}
	let buf = params.buffer, ptr = params.ptr

	for (let i = 0, l = data.length; i < l; i++) {
		let delayed = buf[ptr]
		let x = data[i]
		buf[ptr] = x + feedback * delayed
		ptr = (ptr + 1) % delaySamples
		data[i] = x * (1 - mix) + delayed * mix
	}

	params.ptr = ptr

	return data
}
