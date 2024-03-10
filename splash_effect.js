import {tiny, defs} from './examples/common.js'
import {SplashShader} from './shaders/splash.js'
const {vec3, Mat4, Material, Texture} = tiny

class CylinderStrip extends tiny.Shape {
	constructor(columns) {
		super('position', 'texture_coord')
		for (let i = 0; i < columns + 1; i++) {
			this.arrays.position.push(
				vec3(
					Math.cos((i / columns) * 2 * Math.PI),
					Math.sin((i / columns) * 2 * Math.PI),
					0,
				),
				vec3(
					Math.cos((i / columns) * 2 * Math.PI),
					Math.sin((i / columns) * 2 * Math.PI),
					1,
				),
			)
			this.arrays.texture_coord.push(
				vec3(i / columns, 0, 0),
				vec3(i / columns, 1, 0),
			)
		}
	}
}

export class SplashEffect {
	constructor(start_time) {
		this.cylinder = new CylinderStrip(100)
		this.material = new Material(new SplashShader(), {
			texture: new Texture('assets/texture.png'),
		})
		this.start_time = start_time
		this.life_time = 0.5
	}

	set_start_time(start_time) {
		this.start_time = start_time
	}

	set_splash_position(x, y) {
		this.x = x
		this.y = y
	}

	set_splash_strength(strength) {
		this.strength = strength
	}

	draw(context, program_state, water_height) {
		const life = program_state.animation_time / 1000 - this.start_time
		const t = life / this.life_time
		if (t > 1) return
		const horz_scale = (0.3 * (1 - t) + 0.9 * t) * this.strength
		const height_scale = (3 * (1 - t) + 0.01 * t) * this.strength
		const model_transform = Mat4.identity()
			.times(Mat4.translation(this.x, this.y, 0))
			.times(Mat4.translation(0, 0, water_height - 1 + t))
			.times(Mat4.scale(horz_scale, horz_scale, height_scale))
		this.cylinder.draw(
			context,
			program_state,
			model_transform,
			this.material,
			'TRIANGLE_STRIP',
		)
	}

	is_alive(program_state) {
		const life = program_state.animation_time / 1000 - this.start_time
		return life < this.life_time
	}
}
