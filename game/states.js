import {tiny, defs} from '../examples/common.js'

const {vec3} = tiny

export class States {
	constructor() {
		//is the user rotating the camera
		this.camera_rotate_left = false
		this.camera_rotate_right = false
		// current angle of the camera
		this.camera_horizontal_angle = 0

		// whether or not to show advanced controls
		this.show_advanced_controls = true

		// enable post processing
		this.enable_post_processing = true
		// current camera z offset (zoom)
		this.camera_z_offset = 4.3

		// camera rotation with mouse
		this.mouse_camera_horizontal_angle = 0
		this.mouse_camera_vertical_angle = 0

		// is the user zooming in or out
		this.is_zooming_in = false
		this.is_zooming_out = false

		// is the boat big
		this.is_big_boat = false

		// fov
		this.fov = Math.PI / 3

		this.camera_position = vec3(0, 0, 0)

		this.money = 0
		this.upgrades = []

		this.is_mouse_down = false

		this.last_mouse_x = 0
		this.last_mouse_y = 0
	}
}
