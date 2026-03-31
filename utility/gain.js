/**
 * Gain — simple level adjustment in dB.
 */

let {pow} = Math

export default function gain (data, params) {
	let dB = params.dB ?? 0
	let g = pow(10, dB / 20)

	for (let i = 0, l = data.length; i < l; i++) data[i] *= g

	return data
}
