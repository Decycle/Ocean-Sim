import {defs, tiny} from '../examples/common.js'
import {Shape_From_File} from '../examples/obj-file-demo.js'
import BoatShader from '../shaders/boat.js'

const {vec3, Material, hex_color, Texture, Mat4} = tiny

export class Target {
	constructor() {
		this.model = new defs.Cube()
		this.material = new Material(new defs.Basic_Shader())
	}

	draw(context, program_state, x, y, z, scale = 1) {
		this.model.draw(
			context,
			program_state,
			Mat4.translation(x, y, z).times(Mat4.scale(scale, scale, scale)),
			this.material
		)
	}

	draw_line(
		context,
		program_state,
		x,
		y,
		z,
		dx,
		dy,
		dz,
		scale = 1,
		yScale = 5
	) {
		const model_scale = Mat4.scale(scale, scale * yScale, scale)
		const direction = vec3(dx, dy, dz).normalized()
		const upVector = vec3(0, 1, 0)
		const rotationAxis = upVector.cross(direction).normalized()
		const angle = Math.acos(upVector.dot(direction))
		const rotation = Mat4.rotation(
			angle,
			rotationAxis[0],
			rotationAxis[1],
			rotationAxis[2]
		)
		this.model.draw(
			context,
			program_state,
			Mat4.translation(x, y, z).times(rotation).times(model_scale),
			this.material
		)
	}

	draw_model_transform(context, program_state, model_transform) {
		this.model.draw(context, program_state, model_transform, this.material)
	}
}
