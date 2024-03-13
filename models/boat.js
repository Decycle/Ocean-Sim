import {defs, tiny} from '../examples/common.js'
import {Shape_From_File} from '../examples/obj-file-demo.js'
import BoatShader from '../shaders/boat.js'

const {vec3, Material, hex_color, Texture} = tiny

export class Boat {
	constructor() {
		this.model = new Shape_From_File('assets/minecraft-boat.obj')
		this.materials = [
			new Material(new BoatShader(), {
				texture: new Texture('assets/oak-wood.jpeg'),
			}),
			new Material(new BoatShader(), {
				texture: new Texture('assets/oak-wood-medium-dense.jpeg'),
			}),
			new Material(new BoatShader(), {
				texture: new Texture('assets/oak-wood-densest.jpeg'),
			}),
		]

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

	draw(context, program_state, model_transform, texture_density = 2) {
		texture_density = texture_density % 3
		this.model.draw(
			context,
			program_state,
			model_transform,
			this.materials[texture_density].override({
				health: this.health,
			}),
		)
	}
}
