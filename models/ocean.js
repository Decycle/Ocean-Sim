import {tiny} from '../examples/common.js'
import OceanShader from '../shaders/ocean.js'
// Pull these names into this module's scope for convenience:
const {vec3, Material, hex_color} = tiny

export class OceanPlane extends tiny.Vertex_Buffer {
	// **Minimal_Shape** an even more minimal triangle, with three
	// vertices each holding a 3D position and a color.
	constructor(boundary, subdivision) {
		super('position')
		const step = boundary / subdivision

		for (let i = 0; i < subdivision; i++) {
			for (let j = 0; j < subdivision; j++) {
				const x0 = step * i
				const y0 = step * j
				this.arrays.position.push(vec3(x0, 0, y0))
				if (i == subdivision - 1 || j == subdivision - 1) continue
				const x0y0 = i * subdivision + j
				const x1y0 = (i + 1) * subdivision + j
				const x0y1 = i * subdivision + j + 1
				const x1y1 = (i + 1) * subdivision + j + 1
				this.indices.push(x0y0, x1y0, x0y1, x1y0, x1y1, x0y1)
			}
		}
	}
}

export class Ocean {
	constructor(boundary, subdivision, configs) {
		this.boundary = boundary
		this.subdivision = subdivision

		this.ocean_plane = new OceanPlane(boundary, subdivision)
		this.material = new Material(new OceanShader(), {
			...configs,
			boundary,
		})
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

	draw(context, program_state, model_transform, configs, t, map) {
		this.ocean_plane.draw(
			context,
			program_state,
			model_transform,
			this.material.override({
				...configs,
				time: t,
				map: map,
			}),
		)
	}
}
