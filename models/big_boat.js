import {defs, tiny} from '../examples/common.js'
import {Shape_From_File} from '../examples/obj-file-demo.js'
import BoatShader from '../shaders/boat.js'

const {vec3, Material, hex_color, Texture} = tiny

export class BigBoat {
	constructor() {
		this.model = new Shape_From_File('assets/big_boat.obj')
		this.material = new Material(new BoatShader(), {
			texture: new Texture('assets/big_boat_texture.png'),
		})
		this.health = 1
	}

	take_damage(damage) {
		this.health -= damage
		if (this.health < 0) this.health = 0
	}

	heal(healFactor) {
		this.health += healFactor
		if (this.health > 1) this.health = 1
	}

	draw(context, program_state, model_transform) {
		this.model.draw(
			context,
			program_state,
			model_transform,
			this.material.override({
				health: this.health,
			}),
		)
	}
}
