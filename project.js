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
import {TestCube} from './models/test_cube.js'
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

		this.oceanBoundary = 50
		this.oceanSubdivision = 500

		this.ocean = new Ocean(
			this.oceanBoundary,
			this.oceanSubdivision,
			this.oceanConfig,
		)

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
		this.camera_z_min_offset = 0
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
		this.splash_effect = new SplashEffect()

		// is the boat big
		this.is_big_boat = false

		this.boat_moving_force = 10
		this.boat_maximum_velocity = 5

		// fov
		this.fov = Math.PI / 3

		// test
		this.test_cube = new TestCube()

		// small boat bounding box: 15.5 x 6.5 x 21.5
		// big boat bounding box: 2.68 x 8.1 x 7.4
		this.small_boat_size = vec3(15.5, 6.5, 21.5)
		this.big_boat_size = vec3(2.68, 8.1, 7.4)

		this.small_boat_scale = 0.42
		this.big_boat_scale = 1.0

		this.camera_position = vec3(0, 0, 0)
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

		// program_state.set_camera(Mat4.inverse(Mat4.translation(0, 0, 100)))
		// look at 0,0,0 from 0,10,30
		// program_state.set_camera(
		// 	Mat4.look_at(vec3(0, 1, 3), vec3(0, 0, 0), vec3(0, 1, 0)),
		// )
		// }

		const boatScale = this.is_big_boat
			? this.big_boat_scale
			: this.small_boat_scale
		const boatSize = this.is_big_boat
			? this.big_boat_size
			: this.small_boat_size

		const boat = this.is_big_boat ? this.big_boat : this.boat

		const boundingBox = boatSize.times(boatScale)

		const boatWidth = boundingBox[0]
		const boatLength = boundingBox[2]
		const boatHeight = boundingBox[1]
		const heightLerpFactor = 0.05
		const quaternionInterpolation = 0.05
		const boatFallingAcceleration = 3
		const boatDraftPercentage = 0.75

		// rotate the boat if the user is pressing the keys
		if (this.boat_rotate_left) {
			this.boat_horizontal_angle += 0.015
		}
		if (this.boat_rotate_right) {
			this.boat_horizontal_angle -= 0.015
		}

		// clamp forward velocity
		this.boat_velocity[0] = clamp(
			this.boat_velocity[0],
			-this.boat_maximum_velocity,
			this.boat_maximum_velocity,
		)

		this.boat_position = this.boat_position.plus(
			Mat4.rotation(this.boat_horizontal_angle, 0, 1, 0).times(
				this.boat_velocity.times(dt),
			),
		)

		const x = this.boat_position[0]
		const z = this.boat_position[2]

		// calculate the new position of the boat at this instant
		const wave_pos = this.get_gerstner_wave(x, z, t)[0]
		// get the new y position
		const ny = wave_pos[1]

		// if the boat is below the water, move it up to the water level
		if (this.boat_position[1] < ny) {
			const threshold = 0.25
			const maximum_threshold = 1.4
			// if the boat is falling fast enough, make a splash when it hits the water
			if (-this.boat_velocity[1] > threshold) {
				const strength = remap(
					-this.boat_velocity[1],
					threshold,
					maximum_threshold,
					0,
					1,
				)
				this.splash_effect.splash(t, x, z, ny, strength)
			}

			// smoothly move the boat up to the water level
			this.boat_position[1] = smoothlerp(
				this.boat_position[1],
				ny + boatHeight * boatDraftPercentage,
				heightLerpFactor,
			)
			this.boat_velocity[1] = 0
		}
		// if the boat is above water, make it fall
		else {
			this.boat_velocity[1] -= boatFallingAcceleration * dt
		}

		// apply drag to the boat (velocity decays over time)
		// boat only has forward/backward velocity (can't go sideways)
		this.boat_velocity[0] *= 0.95

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

		// update the camera position
		this.camera_position[0] = smoothlerp(
			this.camera_position[0],
			this.boat_position[0],
			0.01,
		)
		this.camera_position[1] = smoothlerp(
			this.camera_position[1],
			this.boat_position[1],
			0.01,
		)
		this.camera_position[2] = smoothlerp(
			this.camera_position[2],
			this.boat_position[2],
			0.01,
		)

		const small_boat_captain_position = vec3(0, 0.5, 0)
		const big_boat_captain_position = vec3(0.5, 0.5, 0)

		const captain_position = this.is_big_boat
			? big_boat_captain_position
			: small_boat_captain_position

		const camera_target = this.boat_position.plus(captain_position)

		program_state.set_camera(
			Mat4.inverse(
				Mat4.identity()
					//follow boat
					.times(
						Mat4.translation(
							camera_target[0],
							camera_target[1],
							camera_target[2],
						), //look at where a human would be
					)
					// .times(Mat4.rotation(-this.mouse_camera_vertical_angle, 0, 0, 1)) // mouse camera rotation
					.times(Mat4.rotation(-this.mouse_camera_horizontal_angle, 0, 1, 0)) // mouse camera rotation
					.times(Mat4.rotation(this.boat_horizontal_angle, 0, 1, 0)) // align with boat's rotation
					.times(Mat4.rotation(-0.5, 0, 0, 1)) //look down a bit
					.times(Mat4.rotation(-Math.PI / 2, 0, 1, 0)) // forward direction change to x from z
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

		this.fov = smoothlerp(this.fov, fov, 0.07) // higher fov when moving faster

		program_state.projection_transform = Mat4.perspective(
			this.fov,
			context.width / context.height,
			0.01,
			1000,
		)

		// first pass
		this.backgroundRenderer.draw(context, program_state) // render the background
		this.splash_effect.draw(context, program_state) // render the splash effect (if any)

		const ocean_model_transform = Mat4.translation(
			this.boat_position[0],
			0,
			this.boat_position[2],
		).times(
			Mat4.translation(-this.oceanBoundary / 2, 0, -this.oceanBoundary / 2),
		)

		this.clamp_ocean_config()
		this.ocean.draw(
			context,
			program_state,
			ocean_model_transform,
			this.oceanConfig,
			t,
		) // render the ocean

		//test normals
		// for (let i = -5; i <= 5; i++) {
		// 	for (let j = -5; j <= 5; j++) {
		// 		const nx = x + (boatWidth / 2 / 5) * i
		// 		const nz = z + (boatLength / 2 / 5) * j
		// 		const output = this.get_gerstner_wave(nx, nz, t)
		// 		const pos = output[0]
		// 		const normal = output[1]
		// 		this.test_cube.draw_line(
		// 			context,
		// 			program_state,
		// 			pos[0],
		// 			pos[1],
		// 			pos[2],
		// 			normal[0],
		// 			normal[1],
		// 			normal[2],
		// 			0.1,
		// 		)
		// 	}
		// }

		let new_quaternion = this.quaternion //calculate the new rotation of the boat

		// if boat is below water, rotate it to match the waves
		if (this.boat_position[1] < ny + boatHeight * boatDraftPercentage) {
			// calculate the four quadrants of the boat and average the normals
			const x1 = x + boatWidth / 2
			const x2 = x - boatWidth / 2
			const z1 = z + boatLength / 2
			const z2 = z - boatLength / 2

			const wave_normal1 = this.get_gerstner_wave(x1, z1, t)[1]
			const wave_normal2 = this.get_gerstner_wave(x1, z2, t)[1]
			const wave_normal3 = this.get_gerstner_wave(x2, z1, t)[1]
			const wave_normal4 = this.get_gerstner_wave(x2, z2, t)[1]

			const wave_normal = wave_normal1
				.plus(wave_normal2)
				.plus(wave_normal3)
				.plus(wave_normal4)
				.times(0.25)

			const forward = vec3(1, 0, 0)
			const right = wave_normal.cross(forward).normalized()
			if (isNaN(wave_normal[0])) {
				console.error('normal is NaN')
			}
			const theta = Math.acos(forward.dot(wave_normal))

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

		const bigFlip = this.is_big_boat ? -1 : 1 // flip the boat if it's big
		const bigRotate = this.is_big_boat ? -Math.PI / 2 : 0 // rotate the boat if it's big
		const bigRaise = this.is_big_boat ? 1 : 0 // raise the boat if it's big

		const boat_model_transform = Mat4.translation(
			this.boat_position[0],
			this.boat_position[1] + bigRaise, // so that the bottom of the boat is at the water level
			this.boat_position[2],
		) // boat position
			.times(Mat4.rotation(this.boat_horizontal_angle, 0, 1, 0)) // boat horizontal angle
			.times(rotation) // boat quaternion rotation
			.times(Mat4.rotation(bigRotate, 1, 0, 0)) // rotate the boat 90 degrees by y axis so it faces the right way
			.times(Mat4.rotation(-Math.PI / 2, 0, 0, 1)) // rotate the boat 180 degrees by z axis so it faces the right way
			.times(Mat4.scale(boatScale, boatScale * bigFlip, boatScale)) // boat scale

		boat.draw(context, program_state, boat_model_transform) // render the boat

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
		if (this.is_splashing) {
			this.splash_effect.splash(t, x, z, ny)
			this.is_splashing = false
		}

		// every 10 seconds, clean up unused splash effect
		if (t % 10 < 0.05) {
			this.splash_effect.cleanup(t)
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
	get_gerstner_wave(x, z, t) {
		let amplitude = this.oceanConfig.amplitude
		let waveMut = this.oceanConfig.waveMut
		let seed = this.oceanConfig.seed

		let nx = x
		let nz = z
		let ny = 0

		let vx = vec3(1, 0, 0)
		let vz = vec3(0, 0, 1)

		const g = 9.81
		const ITERATIONS = 40

		for (let i = 0; i < ITERATIONS; i++) {
			const kx = Math.sin(seed)
			const kz = Math.cos(seed)
			const omega = Math.sqrt(g * waveMut)
			const theta = kx * waveMut * nx + kz * waveMut * nz - omega * t - seed

			nx -= kx * amplitude * Math.sin(theta)
			nz -= kz * amplitude * Math.sin(theta)
			ny += amplitude * Math.cos(theta)

			const dv = vec3(
				kx * Math.cos(theta),
				Math.sin(theta),
				kz * Math.cos(theta),
			).times(amplitude)

			vx = vx.minus(dv.times(kx))
			vz = vz.minus(dv.times(kz))

			amplitude *= this.oceanConfig.amplitudeMultiplier
			waveMut *= this.oceanConfig.waveMultiplier
			seed += this.oceanConfig.seedOffset
		}

		return [vec3(nx, ny, nz), vx.cross(vz).normalized()]
	}
}
