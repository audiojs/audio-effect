/**
 * Vibrato — pitch modulation via modulated delay line
 */

let {sin, floor, PI} = Math

export default function vibrato (data, params) {
	let rate = params.rate == null ? 5 : params.rate
	let depth = params.depth == null ? 0.003 : params.depth   // seconds
	let fs = params.fs || 44100

	let maxDelay = (depth * 2 * fs + 2) | 0
	let delaySamples = depth * fs

	if (!params.buffer || params.buffer.length < maxDelay) {
		params.buffer = new Float64Array(maxDelay)
		params.ptr = 0
		params._phase = 0
	}
	let buf = params.buffer, ptr = params.ptr, phase = params._phase
	let inc = 2 * PI * rate / fs

	for (let i = 0, l = data.length; i < l; i++) {
		buf[ptr] = data[i]

		let d = delaySamples * (1 + sin(phase))
		phase += inc
		if (phase > 2 * PI) phase -= 2 * PI

		let readPos = ptr - d
		if (readPos < 0) readPos += maxDelay

		let idx = floor(readPos)
		let frac = readPos - idx
		let a = buf[idx % maxDelay]
		let b = buf[(idx + 1) % maxDelay]
		data[i] = a + frac * (b - a)

		ptr = (ptr + 1) % maxDelay
	}

	params.ptr = ptr
	params._phase = phase

	return data
}
