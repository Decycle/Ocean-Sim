import {defs, tiny} from '../examples/common.js'
import BackgroundShader from '../shaders/background.js'

const {vec3, vec4, Mat4, color, hex_color, Material, Scene, Light, Texture} =
	tiny

const {Phong_Shader, Basic_Shader, Cube} = defs

export class BackgroundRenderer {
	constructor() {
		this.screen_quad = new defs.Square()
		this.material = new Material(new BackgroundShader(), {
			color: hex_color('#3b59CC'),
		})
	}

	draw(context, program_state) {
		this.screen_quad.draw(
			context,
			program_state,
			Mat4.identity(),
			this.material,
		)

		context.context.clear(context.context.DEPTH_BUFFER_BIT)
	}
}
