import {defs, tiny} from './examples/common.js'
import PostProcessingShader from './shaders/post_processing.js'
import Quaternion from './util/quaternion.js'
import {SplashEffect} from './models/splash_effect.js'
import {Ocean} from './models/ocean.js'
import {BackgroundRenderer} from './models/background.js'
import {UIHandler} from './ui.js'
import {Boat} from './models/boat.js'
import {BigBoat} from './models/big_boat.js'
import {lerp, smoothlerp, clamp, remap} from './util/common.js'
// Pull these names into this module's scope for convenience:
const {vec3, vec4, Mat4, color, hex_color, Material, Scene, Light, Texture} =
	tiny
export class Project_Scene extends Scene {
	// **Minimal_Webgl_Demo** is an extremely simple example of a Scene class.
	constructor(webgl_manager, control_panel) {
		super(webgl_manager, control_panel)

		this.scratchpad = document.createElement('canvas')
		// A hidden canvas for re-sizing the real canvas to be square:
		this.scratchpad_context = this.scratchpad.getContext('2d')
		this.scratchpad.width = 512
		this.scratchpad.height = 512 // Initial image source: Blank gif file:
		this.texture = new Texture(
			'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
		)

		this.widget_options = {
			make_controls: true,
			show_explanation: false,
		}
		this.boat = new Boat()
		this.big_boat = new BigBoat()

		this.shapes = {
			screen_quad: new defs.Square(),
		}

		this.backgroundRenderer = new BackgroundRenderer()

		this.materials = {
			postprocess: new Material(new PostProcessingShader(), {
				texture: this.texture,
			}),
		}

		this.boat_texture_density = 2

		this.uiHandler = new UIHandler()
		this.skipped_first_frame = false

		this.oceanConfig = {
			amplitude: 0.13,
			waveMut: 0.22,
			seed: 4551.671312417933,
			amplitudeMultiplier: 0.94,
			waveMultiplier: 1.1,
			seedOffset: 8780.3143875966,
			seaColor: hex_color('#3b59CC'),
		}

		this.ocean = new Ocean(50, 500, this.oceanConfig)

		// boat position and velocity
		this.boat_position = vec3(0, 0, 0)
		this.boat_velocity = vec3(0, 0, 0)

		// is the user rotating the boat
		this.boat_rotate_left = false
		this.boat_rotate_right = false
		// current angle of the boat
		this.boat_horizontal_angle = 0

		//is the user rotating the camera
		this.camera_rotate_left = false
		this.camera_rotate_right = false
		// current angle of the camera
		this.camera_horizontal_angle = 0

		// whether or not to show advanced controls
		this.show_advanced_controls = true

		// current boat quaternion
		this.quaternion = Quaternion.identity()
		// previous boat quaternion
		this.last_quaternion = this.quaternion

		// enable post processing
		this.enable_post_processing = true

		// current camera z offset (zoom)
		this.camera_z_offset = 4.3
		this.camera_z_min_offset = 1.0
		this.camera_z_max_offset = 20

		// camera rotation with mouse
		this.mouse_camera_horizontal_angle = 0
		this.mouse_camera_vertical_angle = 0
		this.mouse_camera_horizontal_sensitivity = 0.005
		this.mouse_camera_vertical_sensitivity = 0.003

		// is the user zooming in or out
		this.is_zooming_in = false
		this.is_zooming_out = false

		// splash effect
		this.splash_effect = new SplashEffect(0)

		// is the boat big
		this.is_big_boat = false

		this.boat_moving_force = 10
		this.boat_maximum_velocity = 5

		// fov
		this.fov = Math.PI / 3
	}

	draw_boat(context, program_state, model_transform) {
		console.log('drawing boat:', this.boat_texture_density)
		if (this.is_big_boat) {
			this.big_boat.draw(context, program_state, model_transform)
		} else {
			this.boat.draw(
				context,
				program_state,
				model_transform
					.times(Mat4.translation(0, 0.95, 0))
					.times(Mat4.scale(0.7, -0.7, 0.7))
					.times(Mat4.rotation(Math.PI / 2, 0, 1, 0)),
				this.boat_texture_density,
			)
		}
	}

	clamp_ocean_config() {
		this.oceanConfig.amplitude = clamp(this.oceanConfig.amplitude, 0, 0.3)
		this.oceanConfig.amplitudeMultiplier = clamp(
			this.oceanConfig.amplitudeMultiplier,
			0,
			0.99,
		)
		this.oceanConfig.waveMut = clamp(this.oceanConfig.waveMut, 0, 2)
		this.oceanConfig.waveMultiplier = clamp(
			this.oceanConfig.waveMultiplier,
			1.01,
			2,
		)
	}

	display(context, program_state) {
		super.display(context, program_state)

		const t = program_state.animation_time / 1000
		const dt = program_state.animation_delta_time / 1000

		// development camera
		// if (!context.scratchpad.controls) {
		// 	this.children.push(
		// 		(context.scratchpad.controls = new defs.Movement_Controls()),
		// 	)

		// 	program_state.set_camera(Mat4.inverse(Mat4.translation(0, 0, 100)))
		// }

		const boatWidth = 1
		const boatLength = 1
		const boatHeight = 1
		const heightLerpFactor = 0.05
		const quaternionInterpolation = 0.05
		const boatFallingAcceleration = 1

		// small boat bounding box: 15.5 x 6.5 x 21.5
		// big boat bounding box: 2.68 x 8.1 x 7.4

		// rotate the boat if the user is pressing the keys
		if (this.boat_rotate_left) {
			this.boat_horizontal_angle += 0.015
		}
		if (this.boat_rotate_right) {
			this.boat_horizontal_angle -= 0.015
		}

		this.boat_velocity[1] = clamp(
			this.boat_velocity[1],
			-this.boat_maximum_velocity,
			this.boat_maximum_velocity,
		)
		// move forward in the direction of the horizontal angle
		this.boat_position = this.boat_position.plus(
			Mat4.rotation(this.boat_horizontal_angle, 0, 0, 1).times(
				this.boat_velocity.times(dt),
			),
		)

		const x = this.boat_position[0]
		const y = this.boat_position[1]

		// calculate the new position of the boat at this instant
		const wave_pos = this.get_gerstner_wave(x, y, t)[0]
		// get the new z position
		const nz = wave_pos[2]

		// if the boat is below the water, move it up to the water level
		if (this.boat_position[2] < nz) {
			const threshold = 0.25
			const maximum_threshold = 1.4
			// if the boat is falling fast enough, make a splash when it hits the water
			if (-this.boat_velocity[2] > threshold) {
				const strength = remap(
					-this.boat_velocity[2],
					threshold,
					maximum_threshold,
					0,
					1,
				)
				this.splash_effect.set_start_time(t)
				this.splash_effect.set_splash_position(x, y)
				this.splash_effect.set_splash_strength(strength)
			}

			// smoothly move the boat up to the water level
			this.boat_position[2] = lerp(
				this.boat_position[2],
				nz + boatHeight / 2,
				heightLerpFactor,
			)
			this.boat_velocity[2] = 0
		}
		// if the boat is above water, make it fall
		else {
			this.boat_velocity[2] -= boatFallingAcceleration * dt
		}

		// apply drag to the boat (velocity decays over time)
		this.boat_velocity[0] *= 0.95
		this.boat_velocity[1] *= 0.95

		// camera rotation
		if (this.camera_rotate_left) {
			this.camera_horizontal_angle += 0.02
		} else if (this.camera_rotate_right) {
			this.camera_horizontal_angle -= 0.02
		}
		this.camera_horizontal_angle = clamp(
			this.camera_horizontal_angle,
			-Math.PI / 4,
			Math.PI / 4,
		)

		// zooming in and out
		if (this.is_zooming_in) {
			this.camera_z_offset *= 0.97
		} else if (this.is_zooming_out) {
			this.camera_z_offset *= 1.03
		}

		this.camera_z_offset = clamp(
			this.camera_z_offset,
			this.camera_z_min_offset,
			this.camera_z_max_offset,
		)

		program_state.set_camera(
			Mat4.inverse(
				Mat4.translation(
					this.boat_position[0],
					this.boat_position[1],
					this.boat_position[2],
				) //follow boat
					.times(Mat4.rotation(-this.mouse_camera_horizontal_angle, 0, 0, 1)) // mouse camera rotation
					.times(Mat4.rotation(-this.mouse_camera_vertical_angle, 1, 0, 0)) // mouse camera rotation
					.times(Mat4.rotation(this.boat_horizontal_angle, 0, 0, 1)) // align with boat
					.times(Mat4.rotation(1.1, 1, 0, 0)) // initial camera angle
					.times(Mat4.translation(0, 0, this.camera_z_offset)), // zoom,
			),
		)

		const normal_fov = Math.PI * 0.33
		const fast_fov = Math.PI * 0.5

		const fov = remap(
			this.boat_velocity.norm(),
			0,
			this.boat_maximum_velocity * 1.141,
			normal_fov,
			fast_fov,
		)

		this.fov = smoothlerp(this.fov, fov, 0.07)

		program_state.projection_transform = Mat4.perspective(
			this.fov, // 60 degrees field of view //TODO: higher fov when going faster
			context.width / context.height,
			0.5,
			1000,
		)

		// first pass
		this.backgroundRenderer.draw(context, program_state) // render the background
		this.splash_effect.draw(context, program_state, nz) // render the splash effect (if any)

		const ocean_model_transform = Mat4.translation(
			this.boat_position[0],
			this.boat_position[1],
			0,
		)

		this.clamp_ocean_config()
		this.ocean.draw(
			context,
			program_state,
			ocean_model_transform,
			this.oceanConfig,
			t,
		) // render the ocean

		let new_quaternion = this.quaternion //calculate the new rotation of the boat

		//if boat is below water, rotate it to match the waves
		if (this.boat_position[2] < nz + boatHeight / 2) {
			// calculate the four quadrants of the boat and average the normals
			const x1 = x + boatWidth / 2
			const x2 = x - boatWidth / 2
			const y1 = y + boatLength / 2
			const y2 = y - boatLength / 2

			const wave_normal1 = this.get_gerstner_wave(x1, y1, t)[1]
			const wave_normal2 = this.get_gerstner_wave(x1, y2, t)[1]
			const wave_normal3 = this.get_gerstner_wave(x2, y1, t)[1]
			const wave_normal4 = this.get_gerstner_wave(x2, y2, t)[1]

			const wave_normal = wave_normal1
				.plus(wave_normal2)
				.plus(wave_normal3)
				.plus(wave_normal4)
				.times(0.25)

			const up = vec3(0, 1, 0)
			const right = wave_normal.cross(up).normalized()
			if (isNaN(wave_normal[0])) {
				console.error('normal is NaN')
			}
			const theta = Math.acos(up.dot(wave_normal))

			let q0 = Math.cos(theta / 2)
			let q1 = right[0] * Math.sin(theta / 2)
			let q2 = right[1] * Math.sin(theta / 2)
			let q3 = right[2] * Math.sin(theta / 2)

			new_quaternion = new Quaternion(q0, q1, q2, q3)
			if (new_quaternion.isNan()) {
				console.error('new_quaternion is NaN')
			}
			this.last_quaternion = this.quaternion
			this.quaternion = this.quaternion.slerp(
				new_quaternion,
				quaternionInterpolation,
			)
			if (!this.last_quaternion.isNan() && this.quaternion.isNan()) {
				console.error('slerp caused NaN')
			}
		} // otherwise, rotate the boat according to the angular velocity
		else {
			new_quaternion = this.quaternion.predictNext(this.last_quaternion)
			if (
				!this.last_quaternion.isNan() &&
				!this.quaternion.isNan() &&
				new_quaternion.isNan()
			) {
				console.error('predictNext caused NaN')
			}
			this.last_quaternion = this.quaternion
			this.quaternion = new_quaternion
		}

		// convert the quaternion to a rotation matrix1
		const rotation = this.quaternion.toMatrix()

		const boat_model_transform = Mat4.translation(
			this.boat_position[0],
			this.boat_position[1],
			this.boat_position[2] + 1,
		) // boat position
			.times(Mat4.rotation(this.boat_horizontal_angle, 0, 0, 1)) // boat horizontal angle
			.times(Mat4.rotation(Math.PI, 0, 0, 1)) // rotate the boat 180 degrees by z axis so it faces the right way
			.times(rotation) // boat quaternion rotation
			.times(Mat4.scale(boatWidth, boatHeight, boatLength)) //scale by boat dimensions

		this.draw_boat(context, program_state, boat_model_transform) // render the boat

		// second pass
		if (this.enable_post_processing) {
			this.scratchpad_context.drawImage(context.canvas, 0, 0, 512, 512)

			this.texture.image.src = this.scratchpad.toDataURL('image/png')

			if (this.skipped_first_frame)
				// Update the texture with the current scene:
				this.texture.copy_onto_graphics_card(context.context, false)
			this.skipped_first_frame = true

			context.context.clear(
				context.context.COLOR_BUFFER_BIT | context.context.DEPTH_BUFFER_BIT,
			)

			this.shapes.screen_quad.draw(
				context,
				program_state,
				Mat4.identity(),
				this.materials.postprocess,
			)
		}

		// if the user is pressing the splash key, splash
		if (this.is_splashing && !this.splash_effect.is_alive(t)) {
			this.splash_effect.set_start_time(t)
			this.splash_effect.set_splash_position(x, y)
			this.splash_effect.set_splash_strength(1)
			this.is_splashing = false
		}
	}

	add_camera_controls(canvas) {
		canvas.addEventListener('mousedown', (e) => {
			this.mouse_down = true
			this.last_mouse_x = e.clientX
			this.last_mouse_y = e.clientY
		})

		canvas.addEventListener('mouseup', (e) => {
			this.mouse_down = false
		})

		canvas.addEventListener('mousemove', (e) => {
			if (this.mouse_down) {
				const dx = e.clientX - this.last_mouse_x
				const dy = e.clientY - this.last_mouse_y
				this.mouse_camera_horizontal_angle +=
					dx * this.mouse_camera_horizontal_sensitivity
				this.mouse_camera_vertical_angle +=
					dy * this.mouse_camera_vertical_sensitivity

				// cap dy
				this.mouse_camera_vertical_angle = Math.min(
					Math.PI / 4,
					Math.max(0, this.mouse_camera_vertical_angle),
				)

				this.last_mouse_x = e.clientX
				this.last_mouse_y = e.clientY
			}
		})
	}

	make_control_panel() {
		this.uiHandler.setup_ui(this)
	}

	// same calculation as in the shader to get the relative movement of the boat
	get_gerstner_wave(x, y, t) {
		let amplitude = this.oceanConfig.amplitude
		let waveMut = this.oceanConfig.waveMut
		let seed = this.oceanConfig.seed

		let nx = x
		let ny = y
		let nz = 0

		let vx = vec3(1, 0, 0)
		let vy = vec3(0, 1, 0)

		const g = 9.81
		const ITERATIONS = 40

		for (let i = 0; i < ITERATIONS; i++) {
			const kx = Math.sin(seed)
			const ky = Math.cos(seed)
			const omega = Math.sqrt(g * waveMut)
			const theta = kx * waveMut * nx + ky * waveMut * ny - omega * t - seed

			nx -= kx * amplitude * Math.sin(theta)
			ny -= ky * amplitude * Math.sin(theta)
			nz += amplitude * Math.cos(theta)

			const dv = vec3(
				kx * Math.cos(theta),
				ky * Math.cos(theta),
				Math.sin(theta),
			).times(amplitude)

			vx = vx.minus(dv.times(kx))
			vy = vy.minus(dv.times(ky))

			amplitude *= this.oceanConfig.amplitudeMultiplier
			waveMut *= this.oceanConfig.waveMultiplier
			seed += this.oceanConfig.seedOffset
		}

		return [vec3(nx, ny, nz), vx.cross(vy).normalized()]
	}
}
