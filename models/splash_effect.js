import {tiny, defs} from '../examples/common.js'
import {SplashShader} from '../shaders/splash.js'
import {remap} from '../util/common.js'
const {vec3, Mat4, Material, Texture} = tiny

class CylinderStrip extends tiny.Shape {
	constructor(columns) {
		super('position', 'texture_coord')
		for (let i = 0; i < columns + 1; i++) {
			this.arrays.position.push(
				vec3(
					Math.cos((i / columns) * 2 * Math.PI),
					0,
					Math.sin((i / columns) * 2 * Math.PI),
				),
				vec3(
					Math.cos((i / columns) * 2 * Math.PI),
					1,
					Math.sin((i / columns) * 2 * Math.PI),
				),
			)
			this.arrays.texture_coord.push(
				vec3(i / columns, 0, 0),
				vec3(i / columns, 1, 0),
			)
		}
	}
}

class Splash {
	constructor(
		start_time,
		x,
		z,
		water_height,
		water_color,
		strength = 1,
		life_time = 5,
	) {
		this.start_time = start_time
		this.x = x
		this.water_color = water_color
		this.water_height = water_height
		this.z = z
		this.strength = strength
		this.life_time = life_time
	}
	draw(context, program_state, current_time, model, material) {
		const life = current_time - this.start_time
		const t = life / this.life_time
		if (t > 1) return
		const horizontal_scale = remap(t, 0, 1, 0.3, 0.9) * this.strength
		const height_scale = remap(t, 0, 1, 3, 0.01) * this.strength
		const model_transform = Mat4.identity()
			.times(Mat4.translation(this.x, 0, this.z))
			.times(Mat4.translation(0, this.water_height - 1 + t, 0))
			.times(Mat4.scale(horizontal_scale, height_scale, horizontal_scale))
		model.draw(
			context,
			program_state,
			model_transform,
			material.override({water_color: this.water_color}),
			'TRIANGLE_STRIP',
		)
	}

	is_alive(current_time) {
		return current_time < this.start_time + this.life_time
	}
}
export class SplashEffect {
	constructor() {
		this.cylinder = new CylinderStrip(100)
		this.material = new Material(new SplashShader(), {
			texture: new Texture('assets/texture.png'),
		})
		this.splashes = []
	}

	cleanup(current_time) {
		this.splashes = this.splashes.filter((splash) =>
			splash.is_alive(current_time),
		)
	}

	splash(
		start_time,
		x,
		z,
		water_height,
		water_color,
		strength = 1,
		life_time = 0.5,
	) {
		const splash = new Splash(
			start_time,
			x,
			z,
			water_height,
			water_color,
			strength,
			life_time,
		)
		this.splashes.push(splash)
	}

	draw(context, program_state) {
		for (let i = 0; i < this.splashes.length; i++) {
			const splash = this.splashes[i]
			const current_time = program_state.animation_time / 1000
			splash.draw(
				context,
				program_state,
				current_time,
				this.cylinder,
				this.material,
			)
		}
	}
}
