import {defs, tiny} from './examples/common.js'
import Ocean_Shader from './shaders/ocean.js'
import PostProcessingShader from './shaders/post_processing.js'
import Quaternion from './util/quaternion.js'
import BoatShader from './shaders/boat.js'
import {Shape_From_File} from './examples/obj-file-demo.js'
import {SplashEffect} from './models/splash_effect.js'
import {Ocean, OceanPlane} from './models/ocean.js'
import {BackgroundRenderer} from './models/background.js'
import {UIHandler} from './ui.js'
// Pull these names into this module's scope for convenience:
const {vec3, vec4, Mat4, color, hex_color, Material, Scene, Light, Texture} =
	tiny

const {Phong_Shader, Basic_Shader, Cube} = defs

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
		// Send a Triangle's vertices to the GPU buffers:
		this.shapes = {
			screen_quad: new defs.Square(),
			big_boat: new Shape_From_File('assets/big_boat.obj'),
			boat: new Shape_From_File('assets/minecraft-boat.obj'),
		}

		this.backgroundRenderer = new BackgroundRenderer()

		this.materials = {
			boat: new Material(new BoatShader(), {
				texture: new Texture('assets/oak-wood.jpeg'),
			}),
			big_boat: new Material(new BoatShader(), {
				texture: new Texture('assets/big_boat_texture.png'),
			}),
			postprocess: new Material(new PostProcessingShader(), {
				texture: this.texture,
			}),
		}

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

		this.ocean = new Ocean(100, 500, this.oceanConfig)

		this.boat_position = vec3(0, 0, 0)
		this.boat_velocity = vec3(0, 0, 0)

		this.boat_rotate_left = false
		this.boat_rotate_right = false
		this.boat_horizontal_angle = 0

		this.camera_rotate_left = false
		this.camera_rotate_right = false
		this.camera_horizontal_angle = 0

		this.show_advanced_controls = true

		this.quaternion = Quaternion.identity()
		this.last_quaternion = this.quaternion

		this.enable_post_processing = true

		this.camera_z_offset = 4.3
		this.camera_z_min_offset = 1.0
		this.camera_z_max_offset = 20

		this.mouse_camera_horizontal_angle = 0
		this.mouse_camera_vertical_angle = 0
		this.mouse_camera_horizontal_sensitivity = 0.005
		this.mouse_camera_vertical_sensitivity = 0.003

		this.is_zooming_in = false
		this.is_zooming_out = false

		this.splash_effect = new SplashEffect(0)

		this.is_big_boat = false
	}

	draw_boat(context, program_state, model_transform) {
		if (this.is_big_boat) {
			this.shapes.big_boat.draw(
				context,
				program_state,
				model_transform,
				this.materials.big_boat,
			)
		} else {
			this.shapes.boat.draw(
				context,
				program_state,
				model_transform
					.times(Mat4.translation(0, 0.95, 0))
					.times(Mat4.scale(0.7, -0.7, 0.7))
					.times(Mat4.rotation(Math.PI / 2, 0, 1, 0)),
				this.materials.boat,
			)
		}
	}

	display(context, program_state) {
		super.display(context, program_state)

		const t = program_state.animation_time / 1000
		const dt = program_state.animation_delta_time / 1000

		const boatWidth = 1
		const boatLength = 1
		const boatHeight = 1
		const heightLerpFactor = 0.05
		const quaternionInterpolation = 0.05
		const boatFallingAcceleration = 1

		if (this.boat_rotate_left) {
			this.boat_horizontal_angle += 0.015
		}
		if (this.boat_rotate_right) {
			this.boat_horizontal_angle -= 0.015
		}

		this.boat_position = this.boat_position.plus(
			// this.boat_velocity.times(dt)
			Mat4.rotation(this.boat_horizontal_angle, 0, 0, 1).times(
				this.boat_velocity.times(dt),
			),
		)

		const x = this.boat_position[0]
		const y = this.boat_position[1]
		// const z = this.boat_position[2]

		const wave_pos = this.get_gerstner_wave(x, y, t)[0]

		const nz = wave_pos[2]

		if (this.boat_position[2] < nz) {
			const threshold = 0.25
			const maximum_threhold = 1.4
			if (-this.boat_velocity[2] > threshold) {
				// splash!
				const strength = Math.min(
					1,
					(-this.boat_velocity[2] - threshold) / (maximum_threhold - threshold),
				)
				this.splash_effect.set_start_time(t)
				this.splash_effect.set_splash_position(x, y)
				this.splash_effect.set_splash_strength(strength)
			}

			this.boat_position[2] =
				(nz + boatHeight / 2) * heightLerpFactor +
				this.boat_position[2] * (1 - heightLerpFactor)
			this.boat_velocity[2] = 0
		} else {
			this.boat_velocity[2] -= boatFallingAcceleration * dt
		}

		this.boat_velocity[0] *= 0.95
		this.boat_velocity[1] *= 0.95

		if (this.camera_rotate_left) {
			this.camera_horizontal_angle += 0.02
			this.camera_horizontal_angle = Math.min(
				this.camera_horizontal_angle,
				Math.PI / 4,
			)
		} else if (this.camera_rotate_right) {
			this.camera_horizontal_angle -= 0.02
			this.camera_horizontal_angle = Math.max(
				this.camera_horizontal_angle,
				-Math.PI / 4,
			)
		}

		// camera should be rotated on top of the boat rotation
		if (this.is_zooming_in) {
			this.camera_z_offset *= 0.97
			this.camera_z_offset = Math.max(
				this.camera_z_offset,
				this.camera_z_min_offset,
			)
		}

		if (this.is_zooming_out) {
			this.camera_z_offset *= 1.03
			this.camera_z_offset = Math.min(
				this.camera_z_offset,
				this.camera_z_max_offset,
			)
		}

		program_state.set_camera(
			Mat4.inverse(
				Mat4.translation(
					this.boat_position[0],
					this.boat_position[1],
					this.boat_position[2],
				)
					.times(Mat4.rotation(-this.mouse_camera_horizontal_angle, 0, 0, 1))
					.times(Mat4.rotation(-this.mouse_camera_vertical_angle, 1, 0, 0))
					.times(Mat4.rotation(-this.boat_horizontal_angle, 0, 0, 1))
					.times(Mat4.rotation(1.1, 1, 0, 0)) // edit this to change camera angle
					.times(Mat4.translation(0, 0, this.camera_z_offset)),
			),
		)

		program_state.projection_transform = Mat4.perspective(
			Math.PI / 3,
			context.width / context.height,
			0.5,
			1000,
		)

		this.backgroundRenderer.draw(context, program_state)

		this.splash_effect.draw(context, program_state, nz)

		// first pass
		const model_transform = Mat4.identity()

		this.ocean.draw(
			context,
			program_state,
			model_transform,
			this.oceanConfig,
			t,
		)

		let new_quaternion = this.quaternion

		//if boat is below water, rotate it to match the waves
		if (this.boat_position[2] < nz + boatHeight / 2) {
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

		const rotation = this.quaternion.toMatrix()

		const boat_model_transform = Mat4.translation(
			this.boat_position[0],
			this.boat_position[1],
			this.boat_position[2] + 1,
		)
			.times(Mat4.rotation(this.boat_horizontal_angle, 0, 0, 1))
			.times(Mat4.rotation(Math.PI, 0, 0, 1))
			.times(rotation)
			.times(Mat4.scale(boatWidth, boatHeight, boatLength))

		this.draw_boat(context, program_state, boat_model_transform)

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

		if (this.is_splashing && !this.splash_effect.is_alive(t)) {
			this.splash_effect.set_start_time(t)
			this.splash_effect.set_splash_position(x, y)
			this.splash_effect.set_splash_strength(1)
			this.is_splashing = false
		}
	}

	add_camera_controls(canvas) {
		canvas.addEventListener('mousedown', (e) => {
			// console.log('mousedown')
			this.mouse_down = true
			this.last_mouse_x = e.clientX
			this.last_mouse_y = e.clientY
		})

		canvas.addEventListener('mouseup', (e) => {
			// console.log('mouseup')
			this.mouse_down = false
		})

		canvas.addEventListener('mousemove', (e) => {
			// console.log('mousemove')
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
