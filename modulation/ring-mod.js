/**
 * Ring modulator — multiplies signal by a carrier oscillator
 */

let {sin, PI} = Math

export default function ringMod (data, params) {
	let fc = params.fc || 440
	let fs = params.fs || 44100
	let mix = params.mix == null ? 1 : params.mix

	if (params._phase == null) params._phase = 0
	let phase = params._phase
	let inc = 2 * PI * fc / fs

	for (let i = 0, l = data.length; i < l; i++) {
		let carrier = sin(phase)
		phase += inc
		if (phase > 2 * PI) phase -= 2 * PI
		data[i] = data[i] * (1 - mix) + data[i] * carrier * mix
	}

	params._phase = phase

	return data
}
