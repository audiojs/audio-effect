/**
 * Tremolo — amplitude modulation via LFO
 */

let {sin, PI} = Math

export default function tremolo (data, params) {
	let rate = params.rate == null ? 5 : params.rate
	let depth = params.depth == null ? 0.5 : params.depth
	let fs = params.fs || 44100

	if (params._phase == null) params._phase = 0
	let phase = params._phase
	let inc = 2 * PI * rate / fs

	for (let i = 0, l = data.length; i < l; i++) {
		let mod = 1 - depth * (0.5 + 0.5 * sin(phase))
		phase += inc
		if (phase > 2 * PI) phase -= 2 * PI
		data[i] *= mod
	}

	params._phase = phase

	return data
}
