import {tiny, defs} from '../examples/common.js'
import {OceanMapShader} from '../shaders/ocean_map.js'
import {OceanMapDisplay} from '../shaders/ocean_map_display.js'
const {vec3, Mat4, Material, Texture, hex_color} = tiny

export class OceanMap {
	constructor(seaColor, badSeaColor, oceanSize) {
		this.scratchpad = document.createElement('canvas', {
			willReadFrequently: true,
		})
		// A hidden canvas for re-sizing the real canvas to be square:
		this.scratchpad_context = this.scratchpad.getContext('2d')
		this.scratchpad.width = 64
		this.scratchpad.height = 64 // Initial image source: Blank gif file:
		this.texture = new Texture(
			'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
		)
		this.ocean_map_material = new Material(new OceanMapShader(), {
			seaColor,
			badSeaColor,
		})
		this.ocean_map_display_material = new Material(new OceanMapDisplay(), {
			texture: this.texture,
		})

		this.skipped_first_frame = false
		this.screen_quad = new defs.Square()

		this.oceanSize = oceanSize
	}

	init_map(context, program_state, x, z) {
		this.screen_quad.draw(
			context,
			program_state,
			Mat4.identity(),
			this.ocean_map_material.override({
				x: x,
				z: z,
				scale: this.oceanSize,
			}),
		)
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
	}

	get_map() {
		return this.texture
	}

	draw_map(context, program_state, theta, targets) {
		this.screen_quad.draw(
			context,
			program_state,
			Mat4.identity(),
			this.ocean_map_display_material.override({
				theta: theta,
				targets: targets,
			}),
		)
	}

	get_center_color() {
		const x = this.scratchpad.width / 2
		const y = this.scratchpad.height / 2

		const pixel = this.scratchpad_context.getImageData(x, y, 1, 1).data
		return pixel
	}
}
