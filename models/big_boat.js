import {defs, tiny} from '../examples/common.js'
import {Shape_From_File} from '../examples/obj-file-demo.js'
import BoatShader from '../shaders/boat.js'

const {vec3, Material, hex_color, Texture} = tiny

export class BigBoat {
	constructor() {
		this.model = new Shape_From_File('assets/big_boat.obj')
		this.material = new Material(new BoatShader(), {
			texture: new Texture('assets/big_boat_texture.png')
		})
	}

	draw(context, program_state, model_transform, healthPercentage = 1) {
		this.model.draw(
			context,
			program_state,
			model_transform,
			this.material.override({
				health: healthPercentage
			})
		)
	}
}
