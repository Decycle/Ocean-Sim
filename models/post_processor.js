import {tiny, defs} from '../examples/common.js'
import PostProcessingShader from '../shaders/post_processing.js'
const {vec3, Mat4, Material, Texture} = tiny

export class PostProcessor {
	constructor() {
		this.scratchpad = document.createElement('canvas')
		// A hidden canvas for re-sizing the real canvas to be square:
		this.scratchpad_context = this.scratchpad.getContext('2d')
		this.scratchpad.width = 512
		this.scratchpad.height = 512 // Initial image source: Blank gif file:
		this.texture = new Texture(
			'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
		)
		this.material = new Material(new PostProcessingShader(), {
			texture: this.texture,
		})

		this.skipped_first_frame = false
		this.screen_quad = new defs.Square()
	}

	draw(context, program_state) {
		this.scratchpad_context.drawImage(
			context.canvas,
			0,
			0,
			this.scratchpad.width,
			this.scratchpad.height,
		)

		this.texture.image.src = this.scratchpad.toDataURL('image/png')

		if (this.skipped_first_frame)
			// Update the texture with the current scene:
			this.texture.copy_onto_graphics_card(context.context, false)
		this.skipped_first_frame = true

		context.context.clear(
			context.context.COLOR_BUFFER_BIT | context.context.DEPTH_BUFFER_BIT,
		)

		this.screen_quad.draw(
			context,
			program_state,
			Mat4.identity(),
			this.material,
		)
		context.context.clear(context.context.DEPTH_BUFFER_BIT)
	}
}
