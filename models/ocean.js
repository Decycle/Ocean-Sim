import {tiny} from '../examples/common.js'
import OceanShader from '../shaders/ocean.js'
// Pull these names into this module's scope for convenience:
const {vec3, Material, hex_color} = tiny

export class OceanPlane extends tiny.Vertex_Buffer {
	// **Minimal_Shape** an even more minimal triangle, with three
	// vertices each holding a 3D position and a color.
	constructor(boundary, subdivision) {
		super('position')
		const step = (2 * boundary) / subdivision
		const position = []

		for (let i = 0; i < subdivision; i++) {
			for (let j = 0; j < subdivision; j++) {
				const x = -boundary + step * i
				const y = -boundary + step * j

				const x2 = x + step
				const y2 = y + step

				const new_position = [
					vec3(x, y, 0),
					vec3(x, y2, 0),
					vec3(x2, y, 0),
					vec3(x2, y, 0),
					vec3(x, y2, 0),
					vec3(x2, y2, 0),
				]
				position.push(...new_position)
			}
		}

		this.arrays.position = position
	}
}

export class Ocean {
	constructor(boundary, subdivision, configs) {
		this.boundary = boundary
		this.subdivision = subdivision

		this.ocean_plane = new OceanPlane(boundary, subdivision)
		this.material = new Material(new OceanShader(), configs)
		// const {
		// 	amplitude,
		// 	waveMut,
		// 	seed,
		// 	amplitudeMultiplier,
		// 	waveMultiplier,
		// 	seedOffset,
		// 	color,
		// } = configs
		// this.material = new Material(new OceanShader(), {
		// 	amplitude,
		// 	waveMut,
		// 	seed,
		// 	amplitudeMultiplier,
		// 	waveMultiplier,
		// 	seedOffset,
		// 	sea_color: hex_color('#3b59CC'),
		// })
	}

	draw(context, program_state, model_transform, configs, t) {
		this.ocean_plane.draw(
			context,
			program_state,
			model_transform,
			this.material.override({
				...configs,
				time: t,
			}),
		)
	}
}
